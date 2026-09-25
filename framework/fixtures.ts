/**
 * Custom Playwright fixtures — the TS/JS analogue of the pytest atlas's
 * `tests/conftest.py`.
 *
 * Import `test` and `expect` from here (not from `@playwright/test`) in every
 * spec so the page objects, API clients, and auth fixtures are available.
 * Cross-cutting fixtures live here so UI, API, and e2e specs can all compose
 * them; put genuinely tier-specific fixtures in a local `*.fixtures.ts`.
 */

import { test as base, expect, request as playwrightRequest } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

import { AuthClient } from "@framework/api/auth-client";
import { JsonPlaceholderClient } from "@framework/api/example-client";
import type { Token } from "@framework/auth/token-cache";
import { LoginPage } from "@framework/pages/login-page";
import { PlaywrightHomePage } from "@framework/pages/example-page";
import { getSettings, type Settings } from "@config/settings";

interface WorkerFixtures {
  settings: Settings;
  apiRequestContext: APIRequestContext;
  authClient: AuthClient | null;
  apiToken: Token;
}

interface TestFixtures {
  homePage: PlaywrightHomePage;
  jsonPlaceholder: JsonPlaceholderClient;
  authHeaders: Record<string, string>;
  uiLogin: LoginPage;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // --- Settings ------------------------------------------------------------
  settings: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(getSettings());
    },
    { scope: "worker" },
  ],

  // --- API wiring ----------------------------------------------------------
  // A dedicated request context bound to `apiBaseUrl`, kept separate from the
  // browser's `baseURL` (which targets the UI). Mirrors `api_request_context`.
  apiRequestContext: [
    async ({ settings }, use) => {
      const context = await playwrightRequest.newContext({ baseURL: settings.apiBaseUrl });
      await use(context);
      await context.dispose();
    },
    { scope: "worker" },
  ],

  jsonPlaceholder: async ({ apiRequestContext, settings }, use) => {
    await use(new JsonPlaceholderClient(apiRequestContext, settings.apiBaseUrl));
  },

  // --- Sample page object --------------------------------------------------
  homePage: async ({ page, settings }, use) => {
    await use(new PlaywrightHomePage(page, settings.baseUrl));
  },

  // --- Authentication (all opt-in) ----------------------------------------
  // Return null when no token endpoint is configured so anonymous suites run
  // unchanged. Fixtures that *require* auth skip cleanly. Mirrors the auth
  // fixtures in the pytest conftest.
  authClient: [
    async ({ settings }, use) => {
      if (!settings.authTokenUrl) {
        await use(null);
        return;
      }
      const context = await playwrightRequest.newContext();
      const client = new AuthClient(
        context,
        settings.authTokenUrl,
        settings.authClientId,
        settings.authGrantType,
      );
      await use(client);
      await context.dispose();
    },
    { scope: "worker" },
  ],

  apiToken: [
    async ({ authClient, settings }, use) => {
      test.skip(
        authClient === null || !settings.username || !settings.password,
        "API auth not configured (set QA_AUTH_TOKEN_URL, QA_USERNAME, QA_PASSWORD)",
      );
      const token = await authClient!.authenticate(
        settings.username!,
        settings.password!,
        settings.otpSecret,
        settings.otpAlgorithm,
      );
      await use(token);
      await authClient!.logout(token, settings.authLogoutUrl);
    },
    { scope: "worker" },
  ],

  authHeaders: async ({ apiToken }, use) => {
    await use({ Authorization: `Bearer ${apiToken.accessToken}` });
  },

  // Per-test fresh UI login. Use this when you need to exercise the login flow
  // itself rather than the session-wide storage state. Mirrors `ui_login`.
  uiLogin: async ({ page, settings }, use) => {
    test.skip(
      !settings.username || !settings.password,
      "auth credentials not configured (set QA_USERNAME and QA_PASSWORD)",
    );
    const login = new LoginPage(page, settings.baseUrl);
    await login.open();
    await login.login({
      username: settings.username!,
      password: settings.password!,
      otpSecret: settings.otpSecret,
      otpAlgorithm: settings.otpAlgorithm,
    });
    await use(login);
    await login.logout();
  },
});

export { expect };
