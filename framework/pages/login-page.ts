/**
 * UI login placeholder.
 *
 * Defaults match a Keycloak-style two-step login (username -> password ->
 * optional OTP). Override the label/name fields or methods for your real app.
 * Mirrors `framework/pages/login_page.py` in the pytest atlas.
 */

import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";

import { generateTotp, secondsUntilNextWindow, type OtpAlgorithm } from "@framework/auth/otp";
import { BasePage } from "@framework/pages/base-page";

export interface LoginOptions {
  username: string;
  password: string;
  otpSecret?: string;
  otpAlgorithm?: OtpAlgorithm;
  expectSuccessUrlContains?: string;
}

export class LoginPage extends BasePage {
  override urlPath = "/";

  usernameLabel = "Username or email";
  passwordLabel = "Password";
  otpLabel = "One-time code";
  submitButtonName = "Sign In";

  otpMaxAttempts = 3;
  otpRetrySleepMs = 2_000;
  otpVisibilityTimeoutMs = 3_000;

  get usernameInput(): Locator {
    return this.page.getByLabel(this.usernameLabel);
  }

  get passwordInput(): Locator {
    return this.page.getByLabel(this.passwordLabel, { exact: true });
  }

  get otpInput(): Locator {
    return this.page.getByLabel(this.otpLabel);
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: this.submitButtonName });
  }

  override async waitForLoaded(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
  }

  /** Run the full UI login flow with optional OTP handling. */
  async login(options: LoginOptions): Promise<void> {
    const { username, password, otpSecret, otpAlgorithm, expectSuccessUrlContains } = options;
    this.log.info("ui_login_start");

    await this.usernameInput.fill(username);
    await this.submitButton.click();

    await this.passwordInput.fill(password);
    await this.submitButton.click();

    if (otpSecret) {
      await this.handleOtp(otpSecret, otpAlgorithm ?? "SHA1");
    }

    if (expectSuccessUrlContains) {
      await this.page.waitForURL(`**${expectSuccessUrlContains}**`);
    }

    this.log.info("ui_login_complete");
  }

  /** Best-effort UI logout. Override per app. */
  async logout(avatarSelector = '[data-test="avatar"]', menuText = "Logout"): Promise<void> {
    try {
      await this.page.locator(avatarSelector).click();
      await this.page.getByText(menuText).click();
    } catch (error) {
      this.log.warn("ui_logout_failed", { error: String(error) });
    }
  }

  private async handleOtp(otpSecret: string, algorithm: OtpAlgorithm): Promise<void> {
    if (!(await this.isOtpRequired())) {
      return;
    }

    for (let attempt = 0; attempt < this.otpMaxAttempts; attempt++) {
      if (attempt > 0) {
        await this.page.waitForTimeout(secondsUntilNextWindow() * 1000);
      }

      const code = await generateTotp(otpSecret, algorithm);
      await this.otpInput.clear();
      await this.otpInput.fill(code);
      await this.submitButton.click();

      if (!(await this.isOtpRequired())) {
        return;
      }

      await this.page.waitForTimeout(this.otpRetrySleepMs);
    }

    throw new Error(`OTP authentication failed after ${this.otpMaxAttempts} attempts`);
  }

  private async isOtpRequired(): Promise<boolean> {
    try {
      return await this.otpInput.isVisible({ timeout: this.otpVisibilityTimeoutMs });
    } catch {
      return false;
    }
  }
}
