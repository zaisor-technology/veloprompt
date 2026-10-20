import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "wxt";

import { MATCHES } from "./src/lib/sites";

/**
 * Compilación para los tests (VP_E2E=1): añade las páginas de prueba locales y una clave fija
 * para que el ID de la extensión sea conocido. Nunca se usa en la compilación normal.
 */
const E2E = process.env.VP_E2E === "1";
const E2E_ORIGIN = "http://127.0.0.1:4173/*";

export default defineConfig({
  srcDir: "src",
  outDir: "dist",
  manifest: {
    name: "VeloPrompt",
    description: "Ponle un velo a tus datos antes de enviarlos a la IA. Todo en local, sin servidor.",
    homepage_url: "https://zaisor.io/veloprompt",
    permissions: ["storage"],
    host_permissions: MATCHES,
    action: { default_title: "VeloPrompt" },
  },
  // Usa el código fuente del motor del workspace (también para tsc, vía .wxt/tsconfig.json).
  alias: { "veloprompt-core": resolve(import.meta.dirname, "../../packages/veloprompt-core/src/index.ts") },
  vite: () => ({
    // Sin el polyfill de modulepreload: el bundle no contiene ningún fetch().
    build: { modulePreload: { polyfill: false } },
    define: { "import.meta.env.VP_E2E": JSON.stringify(E2E) },
  }),
  hooks: {
    "build:manifestGenerated": (_wxt, manifest) => {
      if (!E2E) return;
      manifest.key = readFileSync(resolve(import.meta.dirname, "tests/e2e-extension-key.txt"), "utf8").trim();
      manifest.host_permissions = [...(manifest.host_permissions ?? []), E2E_ORIGIN];
      for (const cs of manifest.content_scripts ?? []) cs.matches = [...(cs.matches ?? []), E2E_ORIGIN];
    },
  },
});
