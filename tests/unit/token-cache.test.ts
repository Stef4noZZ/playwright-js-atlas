import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { secondsUntilNextWindow } from "../../framework/auth/otp.ts";
import { TokenCache } from "../../framework/auth/token-cache.ts";

describe("secondsUntilNextWindow", () => {
  it("waits a full period at a step boundary", () => {
    assert.equal(secondsUntilNextWindow(30, 30_000), 31);
  });

  it("waits only the remainder near the end of a step", () => {
    assert.equal(secondsUntilNextWindow(30, 59_000), 2);
  });
});

describe("TokenCache", () => {
  it("does not reuse a token that expires inside the skew", async () => {
    const cache = new TokenCache(900);
    await cache.getOrFetch(async () => ({ accessToken: "access", issuedAt: 0, expiresIn: 10 }));
    assert.equal(cache.isValid(), false);
  });

  it("reuses a token that is still inside expires_in", async () => {
    const cache = new TokenCache(900);
    const first = await cache.getOrFetch(async () => ({
      accessToken: "access",
      issuedAt: 0,
      expiresIn: 300,
    }));
    const second = await cache.getOrFetch(async () => ({
      accessToken: "other",
      issuedAt: 0,
      expiresIn: 300,
    }));
    assert.equal(second.accessToken, first.accessToken);
    assert.equal(cache.isValid(), true);
  });
});
