/**
 * One-time UI login that persists auth state for reuse across UI/e2e tests —
 * the Playwright analogue of the pytest atlas's `storage_state_path` fixture.
 *
 * Runs as a `setup` project that UI and e2e projects depend on. When no
 * credentials are configured it writes an empty storage state so contexts
 * start anonymously and the suite still runs out of the box.
 */

import fs from "node:fs";
import path from "node:path";

import { test as setup } from "@playwright/test";

import { LoginPage } from "@framework/pages/login-page";
import { getSettings } from "@config/settings";

import { STORAGE_STATE } from "./storage-state";

setup("authenticate", async ({ page }) => {
  const settings = getSettings();
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  if (!settings.username || !settings.password) {
    fs.writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const login = new LoginPage(page, settings.baseUrl);
  await login.open();
  await login.login({
    username: settings.username,
    password: settings.password,
    otpSecret: settings.otpSecret,
    otpAlgorithm: settings.otpAlgorithm,
  });
  await page.context().storageState({ path: STORAGE_STATE });
});
