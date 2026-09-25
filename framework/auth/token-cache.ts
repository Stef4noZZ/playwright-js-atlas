/**
 * In-process token cache with a configurable TTL.
 *
 * Avoids re-authenticating once per test. Swap for a shared store if you need
 * to share tokens across Playwright workers. Mirrors
 * `framework/auth/token_cache.py` in the pytest atlas.
 */

const EXPIRY_SKEW_MS = 30_000;

export interface Token {
  accessToken: string;
  refreshToken?: string;
  issuedAt: number;
  expiresIn?: number;
}

export class TokenCache {
  private readonly ttlMs: number;
  private token: Token | null = null;

  constructor(ttlSeconds = 15 * 60) {
    this.ttlMs = ttlSeconds * 1000;
  }

  isValid(): boolean {
    if (this.token === null || this.token.issuedAt <= 0) {
      return false;
    }
    const lifetimeMs =
      this.token.expiresIn !== undefined ? this.token.expiresIn * 1000 : this.ttlMs;
    return Date.now() - this.token.issuedAt < Math.max(lifetimeMs - EXPIRY_SKEW_MS, 0);
  }

  async getOrFetch(fetcher: () => Promise<Token>): Promise<Token> {
    if (this.isValid() && this.token !== null) {
      return this.token;
    }
    const fetched = await fetcher();
    this.token = {
      accessToken: fetched.accessToken,
      refreshToken: fetched.refreshToken,
      issuedAt: Date.now(),
      expiresIn: fetched.expiresIn,
    };
    return this.token;
  }

  clear(): void {
    this.token = null;
  }
}
