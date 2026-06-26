import "dotenv/config";

import { z } from "zod";

/**
 * Type-safe runtime configuration sourced from environment variables.
 *
 * The TS/JS analogue of the pytest atlas's `pydantic-settings`. Override via
 * real env vars or a `.env` file at the project root. Every variable carries
 * the `QA_` prefix to avoid collisions with framework defaults.
 */

const boolFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === "boolean" ? value : ["1", "true", "yes", "on"].includes(value.toLowerCase()),
  );

const SettingsSchema = z.object({
  environment: z.enum(["local", "dev", "staging", "prod"]).default("local"),

  baseUrl: z.string().url().default("https://playwright.dev"),
  apiBaseUrl: z.string().url().default("https://jsonplaceholder.typicode.com"),

  browser: z.enum(["chromium", "firefox", "webkit"]).default("chromium"),
  headless: boolFromEnv.default(true),
  slowMoMs: z.coerce.number().int().min(0).default(0),

  defaultTimeoutMs: z.coerce.number().int().min(0).default(30_000),
  navigationTimeoutMs: z.coerce.number().int().min(0).default(30_000),

  recordVideo: boolFromEnv.default(false),
  recordTrace: z.enum(["off", "on", "retain-on-failure"]).default("retain-on-failure"),
  captureScreenshot: z.enum(["off", "on", "only-on-failure"]).default("only-on-failure"),

  apiKey: z.string().optional(),

  // Authentication. Leave blank to run tests anonymously.
  username: z.string().optional(),
  password: z.string().optional(),
  otpSecret: z.string().optional(),

  // OAuth2 / OIDC. `authTokenUrl` is the full token endpoint, e.g.
  // https://{host}/auth/realms/{realm}/protocol/openid-connect/token
  authTokenUrl: z.string().optional(),
  authLogoutUrl: z.string().optional(),
  authClientId: z.string().default("ocp"),
  authGrantType: z.string().default("password"),

  artifactsDir: z.string().default("reports"),
});

export type Settings = z.infer<typeof SettingsSchema>;

/** Treat unset and empty-string env vars identically (both mean "use default"). */
function clean(value: string | undefined): string | undefined {
  return value === undefined || value === "" ? undefined : value;
}

function load(): Settings {
  const e = process.env;
  return SettingsSchema.parse({
    environment: clean(e.QA_ENVIRONMENT),
    baseUrl: clean(e.QA_BASE_URL),
    apiBaseUrl: clean(e.QA_API_BASE_URL),
    browser: clean(e.QA_BROWSER),
    headless: clean(e.QA_HEADLESS),
    slowMoMs: clean(e.QA_SLOW_MO_MS),
    defaultTimeoutMs: clean(e.QA_DEFAULT_TIMEOUT_MS),
    navigationTimeoutMs: clean(e.QA_NAVIGATION_TIMEOUT_MS),
    recordVideo: clean(e.QA_RECORD_VIDEO),
    recordTrace: clean(e.QA_RECORD_TRACE),
    captureScreenshot: clean(e.QA_CAPTURE_SCREENSHOT),
    apiKey: clean(e.QA_API_KEY),
    username: clean(e.QA_USERNAME),
    password: clean(e.QA_PASSWORD),
    otpSecret: clean(e.QA_OTP_SECRET),
    authTokenUrl: clean(e.QA_AUTH_TOKEN_URL),
    authLogoutUrl: clean(e.QA_AUTH_LOGOUT_URL),
    authClientId: clean(e.QA_AUTH_CLIENT_ID),
    authGrantType: clean(e.QA_AUTH_GRANT_TYPE),
    artifactsDir: clean(e.QA_ARTIFACTS_DIR),
  });
}

let cached: Settings | undefined;

/** Return the parsed, validated settings singleton. */
export function getSettings(): Settings {
  cached ??= load();
  return cached;
}
