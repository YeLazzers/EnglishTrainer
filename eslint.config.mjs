import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config(
	{
		ignores: [
			"prisma/**",
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
			"*.config.mjs",
		],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			perfectionist,
		},
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			// Import sorting (perfectionist)
			"perfectionist/sort-imports": [
				"error",
				{
					type: "natural",
					groups: [
						"builtin", // Node.js built-in modules (import fs from "fs")
						"external", // External packages (import React from "react")
						"internal", // Path aliases (@domain/*, @adapters/*, @sm/*, @commands/*, @handlers/*, @llm/*, @prisma-types)
						"parent", // Parent directory imports (import x from "../x" or "../../x")
						"sibling", // Local/sibling imports (import x from "./x")
						"index", // Index imports (import x from ".")
					],
					internalPattern: [
						"@domain",
						"@domain/.*",
						"@adapters",
						"@adapters/.*",
						"@prisma-types",
						"@sm",
						"@sm/.*",
						"@commands",
						"@commands/.*",
						"@handlers",
						"@handlers/.*",
						"@llm",
						"@llm/.*",
					],
					newlinesBetween: 1,
				},
			],

			// TypeScript rules - only use rules that exist in this version
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-misused-promises": "error",
			"@typescript-eslint/no-non-null-assertion": "warn",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/await-thenable": "error",
			"@typescript-eslint/promise-function-async": "warn",

			// General code quality
			"no-console": "off",
			"no-var": "error",
			"prefer-const": "warn",
			"prefer-arrow-callback": "warn",
			"no-nested-ternary": "warn",

			// Style consistency
			quotes: ["error", "double", { avoidEscape: true }],
			semi: ["error", "always"],

			// Error handling
			"no-throw-literal": "error",

			// Best practices
			eqeqeq: ["error", "always"],
			"no-eval": "error",
			"no-implied-eval": "error",
			"no-new-func": "error",
		},
	},
	prettier
);
