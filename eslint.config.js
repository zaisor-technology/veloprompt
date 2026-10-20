import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "**/.wxt/**", "**/.output/**", "**/test-results/**", "**/playwright-report/**", "**/tests/.harness/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", performance: "readonly", process: "readonly", URL: "readonly" },
    },
  },
  {
    // Páginas de prueba: scripts clásicos de navegador.
    files: ["apps/extension/tests/pages/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: { window: "readonly", document: "readonly", NodeFilter: "readonly", setTimeout: "readonly" },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
