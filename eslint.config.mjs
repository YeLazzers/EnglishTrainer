import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/generated/**",
      "*.db",
      "redis-data/**",
      "llm_logs/**",
      "eslint.config.mjs",
      "prisma.config.ts",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs"
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // TypeScript rules - only use rules that exist in this version
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/promise-function-async": "warn",

      // General code quality
      "no-console": "off",
      "no-var": "error",
      "prefer-const": "warn",
      "prefer-arrow-callback": "warn",
      "no-nested-ternary": "warn",

      // Style consistency
      "quotes": ["error", "double", { avoidEscape: true }],
      "semi": ["error", "always"],

      // Error handling
      "no-throw-literal": "error",

      // Best practices
      "eqeqeq": ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error"
    }
  },
  prettier
);
