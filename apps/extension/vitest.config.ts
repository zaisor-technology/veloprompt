import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "veloprompt-core": resolve(import.meta.dirname, "../../packages/veloprompt-core/src/index.ts") },
  },
  test: { include: ["tests/unit/**/*.test.ts"] },
});
