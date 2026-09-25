/**
 * TOTP code generation.
 *
 * `otplib` is loaded lazily so the framework imports cleanly when it is not
 * installed. Tests that need OTP should skip when no secret is configured.
 * Mirrors `framework/auth/otp.py` in the pytest atlas.
 */

export type OtpAlgorithm = "SHA1" | "SHA256" | "SHA512";

type Otplib = typeof import("otplib");

let otplibPromise: Promise<Otplib | null> | undefined;

function loadOtplib(): Promise<Otplib | null> {
  otplibPromise ??= import("otplib").catch(() => null);
  return otplibPromise;
}

export async function isOtpAvailable(): Promise<boolean> {
  return (await loadOtplib()) !== null;
}

/** Seconds to wait so the next TOTP attempt falls in a new time step. */
export function secondsUntilNextWindow(periodSeconds = 30, nowMs = Date.now()): number {
  const elapsed = (nowMs / 1000) % periodSeconds;
  return periodSeconds - elapsed + 1;
}

/** Return the current TOTP code for the given base32 secret. */
export async function generateTotp(
  secret: string,
  algorithm: OtpAlgorithm = "SHA1",
): Promise<string> {
  const otplib = await loadOtplib();
  if (otplib === null) {
    throw new Error("otplib is not installed. Install with: npm install otplib");
  }

  const { authenticator } = otplib;
  const previous = { ...authenticator.options };
  authenticator.options = {
    ...previous,
    algorithm: algorithm.toLowerCase() as unknown as (typeof authenticator)["options"]["algorithm"],
  };
  try {
    return authenticator.generate(secret);
  } finally {
    authenticator.options = previous;
  }
}
