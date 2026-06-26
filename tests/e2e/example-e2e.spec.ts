import { expect, test } from "@framework/fixtures";

/**
 * End-to-end tier — composes the UI and API layers in one test. Mirrors
 * `tests/e2e/test_example_e2e.py` in the pytest atlas.
 *
 * Real end-to-end flows typically: seed state via API, exercise the UI, then
 * verify side-effects via API.
 */
test(
  "UI and API layers compose in one test",
  { tag: ["@e2e"] },
  async ({ homePage, jsonPlaceholder }) => {
    const users = await jsonPlaceholder.listUsers();
    expect(users.length).toBeGreaterThan(0);

    await homePage.open();
    await expect(homePage.getStartedLink).toBeVisible();
  },
);
