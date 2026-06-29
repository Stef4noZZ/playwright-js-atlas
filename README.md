# playwright-js-atlas

A reusable TypeScript QA archetype for UI and API testing. Built on **Playwright Test**. Clone it, point it at your target system, write tests.

This is the TypeScript/JavaScript sibling of [playwright-pytest-atlas](../playwright-pytest-atlas) — same architecture (Page Object Model, API client layer, opt-in auth, env-driven config, three test tiers), expressed idiomatically for Node.

---

## Table of contents

- [What you get](#what-you-get)
- [Prerequisites](#prerequisites)
- [Setup from scratch](#setup-from-scratch)
- [Running tests](#running-tests)
- [Project layout](#project-layout)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Adding tests](#adding-tests)
- [Tags](#tags)
- [Reporting](#reporting)
- [Code quality](#code-quality)
- [Continuous integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)
- [Adopting this archetype](#adopting-this-archetype)
- [License](#license)

---

## What you get

- **Page Object Model** with a `BasePage` foundation, `LoginPage` placeholder, and component composition
- **API client layer** on top of Playwright's `APIRequestContext`
- **OAuth2 / OIDC auth** via a cached `AuthClient` with TOTP retry across windows
- **Type-safe configuration** via [Zod](https://zod.dev) and `.env` files (`QA_` prefix)
- **Custom fixtures** (`framework/fixtures.ts`) — the analogue of pytest's `conftest.py`
- **One-time UI login** via a `setup` project that persists storage state
- **Three test tiers** as Playwright projects: `ui`, `api`, `e2e`
- **HTML report** with screenshot, video, and trace artifacts on failure
- **Test data factories** via [Faker](https://fakerjs.dev), with Zod schemas for shape validation
- **GitHub Actions** matrix across Chromium / Firefox / WebKit plus a lint + type-check job
- **ESLint** (flat config) + **Prettier** + **strict `tsc`**
- Tags: `@smoke`, `@ui`, `@api`, `@e2e`

---

## Prerequisites

- **Node.js 20.19+** (`node --version`) — see [.nvmrc](.nvmrc) for the pinned version
- **Git**

---

## Setup from scratch

```bash
# 1. Clone (or use this repo as a template)
git clone https://github.com/Stef4noZZ/playwright-js-atlas.git
cd playwright-js-atlas

# 2. Install dependencies
npm install

# 3. Install the Playwright browsers
npx playwright install chromium        # lightest option
# or, for all three browsers + OS deps:
npx playwright install --with-deps

# 4. Configure the environment
cp .env.example .env
# Edit .env — defaults already point to public demo targets so the smoke
# suite runs out of the box. Replace QA_BASE_URL / QA_API_BASE_URL for
# your real system under test.

# 5. Run the smoke suite to validate everything works
npm run test:smoke
# Expected: green against playwright.dev (UI) and jsonplaceholder.typicode.com (API)
```

After the initial setup, every future session is just:

```bash
npm run test:smoke
```

---

## Running tests

| Goal                       | Command                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| Smoke suite                | `npm run test:smoke` (`playwright test --grep @smoke`)               |
| Full suite                 | `npm test`                                                           |
| UI tests only              | `npm run test:ui` (`--project=ui`)                                   |
| API tests only             | `npm run test:api` (`--project=api`)                                 |
| End-to-end only            | `npm run test:e2e` (`--project=e2e`)                                 |
| Tag expression             | `npx playwright test --grep "@smoke"` &nbsp; `--grep-invert "@slow"` |
| Single file                | `npx playwright test tests/ui/example-ui.spec.ts`                    |
| Single test (by title)     | `npx playwright test -g "Get started"`                               |
| Switch browser one-off     | `QA_BROWSER=firefox npm run test:ui`                                 |
| Debug / step through       | `npx playwright test --debug`                                        |
| Watch the browser (headed) | `npm run test:headed`                                                |

> Browsers and tiers are wired as Playwright **projects**. `ui` and `e2e` depend on a `setup` project that performs the one-time login (or writes an empty state when no credentials are set), so running a single tier still authenticates correctly.

---

## Project layout

```
.
├── framework/                Reusable building blocks (the archetype core)
│   ├── fixtures.ts           Custom test/expect — the conftest.py analogue
│   ├── pages/                Page Object Model
│   │   ├── base-page.ts      BasePage foundation
│   │   ├── example-page.ts   Sample page object (PlaywrightHomePage)
│   │   └── login-page.ts     Keycloak-style login placeholder
│   ├── components/           UI fragments scoped to a Locator
│   │   └── base-component.ts
│   ├── api/                  HTTP clients on top of APIRequestContext
│   │   ├── base-client.ts    BaseAPIClient with verb shortcuts + ok-helper
│   │   ├── example-client.ts Sample client (JsonPlaceholderClient)
│   │   └── auth-client.ts    OAuth2 / OIDC token client with OTP retry
│   ├── auth/                 Auth helpers
│   │   ├── otp.ts            TOTP generation (lazy-loads otplib)
│   │   └── token-cache.ts    In-process token cache with TTL
│   ├── data/                 Test data
│   │   ├── models.ts         Zod schemas + inferred types
│   │   └── factories.ts      Faker-driven builders
│   └── utils/                Cross-cutting helpers
│       ├── logger.ts         Structured JSON logger
│       └── assertions.ts     SoftAssert helper
├── config/
│   └── settings.ts           Zod-validated, env-driven config (QA_ prefix)
├── tests/
│   ├── auth.setup.ts         One-time login → storage state (setup project)
│   ├── ui/                   UI tests
│   ├── api/                  API tests
│   └── e2e/                  Flows combining UI + API
├── reports/                  HTML report, videos, traces (gitignored)
├── .github/workflows/
│   └── tests.yml             Chromium/Firefox/WebKit matrix + lint job
├── .env.example              Configuration template (copy to .env)
├── eslint.config.js          ESLint flat config
├── .prettierrc.json          Prettier config
├── playwright.config.ts      Projects, reporters, settings-driven `use`
├── tsconfig.json             Strict TS + path aliases (@framework, @config)
├── Makefile                  Common commands (wrap npm scripts)
└── package.json
```

> **Fixture rule.** Cross-cutting fixtures (page objects, API clients used by e2e) live in [framework/fixtures.ts](framework/fixtures.ts) so every tier can compose them. Import `test`/`expect` from there, not from `@playwright/test`.

---

## Configuration

All runtime settings are env-driven with the `QA_` prefix, validated by Zod in [config/settings.ts](config/settings.ts). See [.env.example](.env.example) for the full schema. Set real env vars in CI; never commit secrets.

| Variable                   | Default                                | Purpose                              |
| -------------------------- | -------------------------------------- | ------------------------------------ |
| `QA_ENVIRONMENT`           | `local`                                | `local` / `dev` / `staging` / `prod` |
| `QA_BASE_URL`              | `https://playwright.dev`               | Base URL for UI tests                |
| `QA_API_BASE_URL`          | `https://jsonplaceholder.typicode.com` | Base URL for API tests               |
| `QA_BROWSER`               | `chromium`                             | `chromium`, `firefox`, or `webkit`   |
| `QA_HEADLESS`              | `true`                                 | `false` to show the browser          |
| `QA_SLOW_MO_MS`            | `0`                                    | Add latency between actions          |
| `QA_DEFAULT_TIMEOUT_MS`    | `30000`                                | Per-action timeout                   |
| `QA_NAVIGATION_TIMEOUT_MS` | `30000`                                | Page navigation timeout              |
| `QA_RECORD_VIDEO`          | `false`                                | Record videos for every test         |
| `QA_RECORD_TRACE`          | `retain-on-failure`                    | `off` / `on` / `retain-on-failure`   |
| `QA_CAPTURE_SCREENSHOT`    | `only-on-failure`                      | `off` / `on` / `only-on-failure`     |

Auth-related variables (all optional) are documented in [.env.example](.env.example) and below.

---

## Authentication

Auth is **opt-in**. Leave `QA_USERNAME` / `QA_PASSWORD` blank and tests run anonymously. Set them and the auth fixtures and storage-state setup activate automatically.

### UI auth — one-time login via storage state

[tests/auth.setup.ts](tests/auth.setup.ts) runs as a `setup` project that the `ui` and `e2e` projects depend on. It logs in once through [LoginPage](framework/pages/login-page.ts), persists cookies + localStorage to `reports/.auth/state.json`, and every subsequent context loads that state. With no credentials configured it writes an empty state so contexts start anonymously.

Defaults match a Keycloak-style two-step form. Override the label/name fields (`usernameLabel`, `passwordLabel`, `submitButtonName`) or methods on a project-specific subclass.

### UI auth — per-test fresh login

Depend on the `uiLogin` fixture when you need to exercise the login flow itself:

```ts
test("dashboard after fresh login", async ({ uiLogin, page }) => {
  await page.goto("/dashboard");
  // ...
});
```

### API auth — cached OAuth2 / OIDC token

Set `QA_AUTH_TOKEN_URL` and depend on `authHeaders` (a `{ Authorization: "Bearer ..." }` object) or `apiToken` (a `Token`):

```ts
test("admin endpoint", async ({ apiRequestContext, authHeaders }) => {
  const response = await apiRequestContext.get("/admin/users", { headers: authHeaders });
  expect(response.ok()).toBeTruthy();
});
```

The token is cached for 15 minutes in [TokenCache](framework/auth/token-cache.ts). [AuthClient](framework/api/auth-client.ts) handles OTP retries across TOTP windows when `QA_OTP_SECRET` is set (requires the optional `otplib` dependency, installed by default).

### Custom auth flows

For SAML, PAT exchange, or anything non-standard: subclass `AuthClient`, override `buildPayload` / `fetchToken`, then swap the `authClient` fixture in your own fixtures module.

---

## Adding tests

### A new page object

```ts
// framework/pages/dashboard-page.ts
import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "@framework/pages/base-page";

export class DashboardPage extends BasePage {
  override urlPath = "/dashboard";

  get greeting(): Locator {
    return this.page.getByRole("heading", { name: "Welcome" });
  }

  override async waitForLoaded(): Promise<void> {
    await expect(this.greeting).toBeVisible();
  }
}
```

Expose it via a fixture in [framework/fixtures.ts](framework/fixtures.ts):

```ts
dashboardPage: async ({ page, settings }, use) => {
  await use(new DashboardPage(page, settings.baseUrl));
},
```

### A new API client

```ts
// framework/api/users-client.ts
import { BaseAPIClient } from "@framework/api/base-client";
import type { User } from "@framework/data/models";

export class UsersClient extends BaseAPIClient {
  async create(user: User): Promise<User> {
    const response = await BaseAPIClient.expectOk(await this.post("/users", { data: user }));
    return (await response.json()) as User;
  }
}
```

### A new test

```ts
// tests/ui/dashboard.spec.ts
import { expect, test } from "@framework/fixtures";

test("dashboard greets the user", { tag: ["@ui", "@smoke"] }, async ({ dashboardPage }) => {
  await dashboardPage.open();
  await expect(dashboardPage.greeting).toBeVisible();
});
```

---

## Tags

Tag tests via the test-options object and select with `--grep`:

```ts
test("something", { tag: ["@ui", "@smoke"] }, async () => {
  /* ... */
});
```

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@ui"
npx playwright test --grep-invert "@slow"
```

Tiers (`@ui` / `@api` / `@e2e`) also map to Playwright projects, so `--project=ui` selects the UI tier directly.

---

## Reporting

The HTML report is written to `reports/html` on every run:

```bash
npm run report   # opens the last HTML report
```

On failure, screenshots and a Playwright trace are retained under `reports/playwright/`. Open a trace with:

```bash
npx playwright show-trace reports/playwright/<test>/trace.zip
```

> Want Allure (as in the pytest atlas)? Add `allure-playwright` and register it as a reporter in [playwright.config.ts](playwright.config.ts).

---

## Code quality

ESLint (flat config), Prettier, and strict `tsc` are pre-wired.

```bash
npm run lint           # ESLint
npm run format         # Prettier write
npm run format:check   # Prettier check (CI)
npm run typecheck      # tsc --noEmit
npm run check          # all three
```

---

## Continuous integration

[.github/workflows/tests.yml](.github/workflows/tests.yml) runs on every push and pull request:

- **`test` job**: matrix across Chromium / Firefox / WebKit. Runs the `@smoke` suite by default, with one automatic retry on flake.
- **`lint` job**: ESLint + Prettier check + `tsc`.

Reports are uploaded as build artifacts (`reports-chromium`, etc.) with 14-day retention. Trigger an ad-hoc run with a custom tag expression via the **Actions** tab → **tests** → **Run workflow**.

---

## Troubleshooting

### `Cannot find module '@framework/...'`

Path aliases come from [tsconfig.json](tsconfig.json) (`@framework/*`, `@config/*`). Playwright reads them automatically. If your editor complains, restart the TS server.

### `--headed` opens nothing visible

The smoke test is fast — add `QA_SLOW_MO_MS=1000` so each action is delayed, or use `npx playwright test --debug`. On macOS the browser often opens behind the terminal.

### Tests skip with "auth ... not configured"

That's the auth fixtures behaving correctly — they refuse to run when credentials/endpoints are blank. Configure auth in `.env`, or don't depend on `apiToken` / `authHeaders` / `uiLogin` in tests that should run anonymously.

### `otplib` not installed

It's an optional dependency, normally installed by `npm install`. If you ran with `--no-optional`, reinstall it: `npm install otplib`.

---

## Adopting this archetype

1. Click **Use this template** on GitHub, or clone and re-init git.
2. Update `name`, `description`, and `keywords` in [package.json](package.json).
3. Point [.env.example](.env.example) at your real target URLs.
4. Delete the samples (`framework/pages/example-page.ts`, `framework/api/example-client.ts`, and the `tests/**/example-*.spec.ts` files) and the fixtures referencing them in [framework/fixtures.ts](framework/fixtures.ts).
5. Customise [framework/pages/login-page.ts](framework/pages/login-page.ts) for your real login flow.
6. Keep `framework/` generic. Project-specific page objects and clients live alongside it (they reuse `BasePage` / `BaseAPIClient`).

---

## License

MIT. See [LICENSE](LICENSE).

---

> Dependency modernization and review assisted by Claude (Anthropic Opus 4.8).
