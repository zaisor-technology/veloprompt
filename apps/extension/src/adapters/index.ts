import { chatgptAdapter } from "./chatgpt";
import { claudeAdapter } from "./claude";
import type { SiteAdapter } from "./types";

export type { SiteAdapter } from "./types";
export { chatgptAdapter, claudeAdapter };

/** Elige el adaptador por dominio. En la compilación de tests, también por la ruta de la página de prueba. */
export function pickAdapter(loc: Pick<Location, "hostname" | "pathname">, e2e = false): SiteAdapter | null {
  if (loc.hostname === "chatgpt.com" || loc.hostname.endsWith(".chatgpt.com")) return chatgptAdapter;
  if (loc.hostname === "claude.ai") return claudeAdapter;
  if (e2e && loc.hostname === "127.0.0.1") {
    if (loc.pathname.startsWith("/chatgpt") || loc.pathname.startsWith("/c/")) return chatgptAdapter;
    if (loc.pathname.startsWith("/claude") || loc.pathname.startsWith("/chat/")) return claudeAdapter;
  }
  return null;
}
