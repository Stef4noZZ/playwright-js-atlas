import { expect, test } from "@framework/fixtures";

/**
 * API tier — uses a dedicated request context bound to `apiBaseUrl`, no
 * browser. Mirrors `tests/api/test_example_api.py` in the pytest atlas.
 */
test.describe("Sample API", () => {
  test(
    "list users returns a non-empty collection",
    { tag: ["@api", "@smoke"] },
    async ({ jsonPlaceholder }) => {
      const users = await jsonPlaceholder.listUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    },
  );

  test(
    "get single user returns the expected shape",
    { tag: ["@api"] },
    async ({ jsonPlaceholder }) => {
      const user = await jsonPlaceholder.getUser(1);
      expect(user.id).toBe(1);
      for (const field of ["name", "email", "username"] as const) {
        expect(user[field], `missing field: ${field}`).toBeTruthy();
      }
    },
  );

  test("posts can be filtered by user", { tag: ["@api"] }, async ({ jsonPlaceholder }) => {
    const posts = await jsonPlaceholder.listPosts(1);
    expect(posts.length, "expected at least one post for user 1").toBeGreaterThan(0);
    expect(posts.every((post) => post.userId === 1)).toBe(true);
  });
});
