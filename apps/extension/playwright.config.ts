import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./tests/browser/global-setup.ts",
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: {
    command: "node tests/server.mjs",
    url: "http://127.0.0.1:4173/chatgpt.html",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // Adaptadores aislados, sin extensión, sobre las páginas de prueba.
    { name: "adaptadores", testMatch: "adapters.spec.ts" },
    // Extensión real cargada en Chromium sobre las páginas de prueba.
    { name: "e2e", testMatch: "extension.spec.ts" },
    // Solo bajo demanda (pnpm screenshots): genera docs/capturas/*.png.
    { name: "capturas", testMatch: "screenshots.spec.ts" },
  ],
});
