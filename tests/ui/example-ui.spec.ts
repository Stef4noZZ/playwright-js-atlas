import { expect, test } from "@framework/fixtures";

/**
 * UI tier — runs in a browser against `baseUrl`. Mirrors
 * `tests/ui/test_example_ui.py` in the pytest atlas.
 */
test.describe("Sample UI", () => {
  test(
    "home page displays the Get started link",
    { tag: ["@ui", "@smoke"] },
    async ({ homePage }) => {
      await homePage.open();
      await expect(homePage.getStartedLink).toBeVisible();
    },
  );

  test(
    "clicking Get started navigates to the docs",
    { tag: ["@ui"] },
    async ({ homePage, page }) => {
      await homePage.open();
      await homePage.clickGetStarted();
      await expect(page).toHaveURL(/\/docs/);
    },
  );
});
