/**
 * Sitios soportados. Fuente única para el manifiesto (host_permissions y content_scripts),
 * el selector de adaptador y los ajustes. Sin dependencias: lo importa también wxt.config.ts.
 */
export type SiteId = "chatgpt" | "claude" | "gemini" | "copilot" | "m365" | "perplexity" | "deepseek";

export interface SiteInfo {
  id: SiteId;
  name: string;
  hosts: string[];
}

export const SITES: readonly SiteInfo[] = [
  { id: "chatgpt", name: "ChatGPT", hosts: ["chatgpt.com"] },
  { id: "claude", name: "Claude", hosts: ["claude.ai"] },
  { id: "gemini", name: "Gemini", hosts: ["gemini.google.com"] },
  { id: "copilot", name: "Copilot", hosts: ["copilot.microsoft.com"] },
  // Copilot de Microsoft 365 (cuentas de trabajo y personales). Solo actúa en el chat (/chat).
  { id: "m365", name: "Microsoft 365 Copilot", hosts: ["m365.cloud.microsoft", "www.microsoft365.com"] },
  { id: "perplexity", name: "Perplexity", hosts: ["www.perplexity.ai", "perplexity.ai"] },
  { id: "deepseek", name: "DeepSeek", hosts: ["chat.deepseek.com"] },
];

/** Patrones de coincidencia para el manifiesto: solo HTTPS y solo estos dominios. */
export const MATCHES: string[] = SITES.flatMap((s) => s.hosts.map((h) => `https://${h}/*`));

export function siteForHost(hostname: string): SiteInfo | null {
  return SITES.find((s) => s.hosts.includes(hostname)) ?? null;
}
