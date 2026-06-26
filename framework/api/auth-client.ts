/**
 * API authentication for OAuth2 / OIDC password grant.
 *
 * Defaults match a Keycloak token endpoint
 * (`/auth/realms/{realm}/protocol/openid-connect/token`) but the URL is fully
 * configurable. Subclass for SAML, custom token exchanges, or PAT flows.
 * Mirrors `framework/api/auth_client.py` in the pytest atlas.
 */

import type { APIRequestContext } from "@playwright/test";

import { generateTotp, isOtpAvailable } from "@framework/auth/otp";
import { TokenCache, type Token } from "@framework/auth/token-cache";
import { getLogger, type Logger } from "@framework/utils/logger";

type FormPayload = Record<string, string | number | boolean>;

export class AuthClient {
  static readonly OTP_MAX_ATTEMPTS = 3;
  static readonly OTP_WINDOW_SLEEP_MS = 31_000;

  protected readonly request: APIRequestContext;
  protected readonly tokenUrl: string;
  protected readonly clientId: string;
  protected readonly grantType: string;
  protected readonly cache: TokenCache;
  protected readonly log: Logger;

  constructor(
    request: APIRequestContext,
    tokenUrl: string,
    clientId = "ocp",
    grantType = "password",
    cache?: TokenCache,
  ) {
    this.request = request;
    this.tokenUrl = tokenUrl;
    this.clientId = clientId;
    this.grantType = grantType;
    this.cache = cache ?? new TokenCache();
    this.log = getLogger(this.constructor.name);
  }

  /** Return a Token, using the cache when valid and OTP retries when required. */
  authenticate(username: string, password: string, otpSecret?: string): Promise<Token> {
    return this.cache.getOrFetch(() => this.fetchToken(username, password, otpSecret));
  }

  /** Best-effort logout. Pass the matching OIDC logout endpoint via `logoutUrl`. */
  async logout(token: Token, logoutUrl?: string): Promise<void> {
    if (!logoutUrl || !token.refreshToken) {
      this.cache.clear();
      return;
    }
    try {
      await this.request.post(logoutUrl, {
        form: { client_id: this.clientId, refresh_token: token.refreshToken },
      });
    } catch (error) {
      this.log.warn("api_logout_failed", { error: String(error) });
    } finally {
      this.cache.clear();
    }
  }

  protected async fetchToken(
    username: string,
    password: string,
    otpSecret?: string,
  ): Promise<Token> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < AuthClient.OTP_MAX_ATTEMPTS; attempt++) {
      if (attempt > 0 && otpSecret) {
        await sleep(AuthClient.OTP_WINDOW_SLEEP_MS);
      }

      const payload = await this.buildPayload(username, password, otpSecret);
      const response = await this.request.post(this.tokenUrl, { form: payload });

      if (response.ok()) {
        const body = (await response.json()) as {
          access_token: string;
          refresh_token?: string;
        };
        this.log.info("api_login_success", { username });
        return {
          accessToken: body.access_token,
          refreshToken: body.refresh_token,
          issuedAt: 0,
        };
      }

      const text = (await response.text()).slice(0, 300);
      lastError = new Error(
        `token endpoint returned ${response.status()} ${response.statusText()}: ${text}`,
      );

      if (!otpSecret) {
        break;
      }
    }

    throw lastError ?? new Error("authentication failed");
  }

  protected async buildPayload(
    username: string,
    password: string,
    otpSecret?: string,
  ): Promise<FormPayload> {
    const payload: FormPayload = {
      username,
      password,
      client_id: this.clientId,
      grant_type: this.grantType,
    };
    if (otpSecret) {
      if (!(await isOtpAvailable())) {
        throw new Error(
          "OTP secret provided but otplib is not installed. Install with: npm install otplib",
        );
      }
      payload.otp = await generateTotp(otpSecret);
    }
    return payload;
  }
}

/** Sleep without relying on a Page; used between TOTP windows. */
async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Re-export so consumers can type fixtures without reaching into token-cache.
export type { Token };
