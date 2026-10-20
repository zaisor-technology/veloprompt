import { siteForHost, type SiteId } from "../lib/sites";
import { chatgptAdapter } from "./chatgpt";
import { claudeAdapter } from "./claude";
import { copilotAdapter } from "./copilot";
import { deepseekAdapter } from "./deepseek";
import { geminiAdapter } from "./gemini";
import { m365Adapter } from "./m365";
import { perplexityAdapter } from "./perplexity";
import type { SiteAdapter } from "./types";

export type { SiteAdapter } from "./types";
export { chatgptAdapter, claudeAdapter, copilotAdapter, deepseekAdapter, geminiAdapter, m365Adapter, perplexityAdapter };

export const ADAPTERS: Record<SiteId, SiteAdapter> = {
  chatgpt: chatgptAdapter,
  claude: claudeAdapter,
  gemini: geminiAdapter,
  copilot: copilotAdapter,
  m365: m365Adapter,
  perplexity: perplexityAdapter,
  deepseek: deepseekAdapter,
};

/** Rutas de las páginas de prueba locales (solo en la compilación de tests). */
const TEST_ROUTES: [RegExp, SiteId][] = [
  [/^\/(chatgpt|c\/)/, "chatgpt"],
  [/^\/(claude|chat\/)/, "claude"],
  [/^\/(gemini|app\/)/, "gemini"],
  [/^\/(copilot|chats\/)/, "copilot"],
  [/^\/m365\//, "m365"],
  [/^\/(perplexity|search\/)/, "perplexity"],
  [/^\/(deepseek|a\/chat\/)/, "deepseek"],
];

/** Elige el adaptador por dominio. En la compilación de tests, también por la ruta de la página de prueba. */
export function pickAdapter(loc: Pick<Location, "hostname" | "pathname">, e2e = false): SiteAdapter | null {
  const site = siteForHost(loc.hostname);
  if (site) return ADAPTERS[site.id];
  if (e2e && loc.hostname === "127.0.0.1") {
    const route = TEST_ROUTES.find(([re]) => re.test(loc.pathname));
    if (route) return ADAPTERS[route[1]];
  }
  return null;
}
