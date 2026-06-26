import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";

import { BasePage } from "@framework/pages/base-page";

/**
 * Sample page object against https://playwright.dev. Replace with your own.
 * Mirrors `PlaywrightHomePage` in the pytest atlas.
 */
export class PlaywrightHomePage extends BasePage {
  override urlPath = "/";

  get getStartedLink(): Locator {
    return this.page.getByRole("link", { name: "Get started" });
  }

  get searchButton(): Locator {
    return this.page.getByRole("button", { name: "Search" });
  }

  async clickGetStarted(): Promise<void> {
    await this.getStartedLink.click();
  }

  override async waitForLoaded(): Promise<void> {
    await expect(this.getStartedLink).toBeVisible();
  }
}
