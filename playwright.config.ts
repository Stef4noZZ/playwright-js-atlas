import { defineConfig } from "@playwright/test";

import { getSettings } from "./config/settings";
import { STORAGE_STATE } from "./tests/storage-state";

/**
 * Playwright configuration for the JS/TS atlas.
 *
 * Driven by the same `QA_`-prefixed env settings as the pytest atlas (see
 * `config/settings.ts` and `.env.example`). Mirrors the three-tier layout:
 * `tests/ui`, `tests/api`, `tests/e2e`. Run a tier in isolation
 * (`npm run test:api`) or everything at once (`npm test`).
 */
const settings = getSettings();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: "reports/playwright",
  timeout: 120_000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
    ...(process.env.CI ? [["github"] as const] : []),
  ],
  use: {
    baseURL: settings.baseUrl,
    actionTimeout: settings.defaultTimeoutMs,
    navigationTimeout: settings.navigationTimeoutMs,
    ignoreHTTPSErrors: true,
    trace: settings.recordTrace,
    screenshot: settings.captureScreenshot,
    video: settings.recordVideo ? "on" : "retain-on-failure",
    launchOptions: {
      headless: settings.headless,
      slowMo: settings.slowMoMs,
    },
  },
  projects: [
    {
      // One-time login → storage state. UI/e2e depend on this.
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "api",
      testDir: "./tests/api",
      // API tests need no browser — they use the request context only.
    },
    {
      name: "ui",
      testDir: "./tests/ui",
      dependencies: ["setup"],
      use: { browserName: settings.browser, storageState: STORAGE_STATE },
    },
    {
      name: "e2e",
      testDir: "./tests/e2e",
      dependencies: ["setup"],
      use: { browserName: settings.browser, storageState: STORAGE_STATE },
    },
  ],
});
