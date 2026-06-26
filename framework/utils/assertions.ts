/**
 * Soft-assertion helper for accumulating multiple checks within a single test.
 *
 * Mirrors `framework/utils/assertions.py` in the pytest atlas. Playwright ships
 * `expect.soft(...)` for locator/value assertions; this covers the plain
 * boolean/equality cases and raises a single aggregated error.
 */

export class SoftAssert {
  private readonly errors: string[] = [];

  check(condition: boolean, message: string): void {
    if (!condition) {
      this.errors.push(message);
    }
  }

  equals<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      this.errors.push(message ?? `expected ${String(expected)}, got ${String(actual)}`);
    }
  }

  notEquals<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      this.errors.push(message ?? `expected value other than ${String(expected)}`);
    }
  }

  isTruthy(value: unknown, message?: string): void {
    if (!value) {
      this.errors.push(message ?? `expected truthy value, got ${String(value)}`);
    }
  }

  assertAll(): void {
    if (this.errors.length > 0) {
      const joined = this.errors.join("\n  - ");
      throw new Error(`Soft assertion failures:\n  - ${joined}`);
    }
  }
}

/** Run a block of soft checks and raise a single aggregated error at the end. */
export async function softAssertions(
  body: (sa: SoftAssert) => void | Promise<void>,
): Promise<void> {
  const sa = new SoftAssert();
  await body(sa);
  sa.assertAll();
}
