import type { Locator, Page } from "@playwright/test";

import { getLogger, type Logger } from "@framework/utils/logger";

/**
 * Foundation for reusable UI fragments that appear on multiple pages.
 *
 * Compose components inside page objects rather than duplicating selectors. A
 * component is scoped to a root Locator and exposes only what tests need.
 * Mirrors `framework/components/base_component.py` in the pytest atlas.
 */
export class BaseComponent {
  protected readonly page: Page;
  protected readonly root: Locator;
  protected readonly log: Logger;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.root = root;
    this.log = getLogger(this.constructor.name);
  }

  isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }

  locate(selector: string): Locator {
    return this.root.locator(selector);
  }
}
