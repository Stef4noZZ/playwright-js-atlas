import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/**
 * Flat ESLint config. `eslint-config-prettier` is last so it disables any
 * stylistic rules that would conflict with Prettier (formatting is Prettier's
 * job; ESLint handles correctness). The TS/JS analogue of Ruff in the pytest
 * atlas.
 */
export default tseslint.config(
  {
    ignores: ["reports/**", "node_modules/**", "playwright-report/**", "test-results/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  prettier,
);
