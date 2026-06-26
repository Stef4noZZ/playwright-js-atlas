import type { Locator, Page } from "@playwright/test";

import { getLogger, type Logger } from "@framework/utils/logger";

/**
 * Foundation for Page Object Model classes.
 *
 * Subclasses set `urlPath`, expose locators as getters, and provide
 * intention-revealing action methods. Keep assertions out of page objects;
 * they belong in tests or in step-style facades. Mirrors
 * `framework/pages/base_page.py` in the pytest atlas.
 */
export class BasePage {
  protected readonly page: Page;
  protected readonly baseUrl: string;
  protected readonly log: Logger;

  /** Path appended to `baseUrl` to form this page's URL. Override per page. */
  urlPath = "";

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.log = getLogger(this.constructor.name);
  }

  get url(): string {
    return `${this.baseUrl}${this.urlPath}`;
  }

  async open(): Promise<void> {
    this.log.info("navigating", { url: this.url });
    await this.page.goto(this.url);
    await this.waitForLoaded();
  }

  /** Override in subclasses to assert that a key landmark is visible. */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  locate(selector: string): Locator {
    return this.page.locator(selector);
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForLoaded();
  }
}
