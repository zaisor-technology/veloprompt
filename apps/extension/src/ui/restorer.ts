import { restore, type RedactionMap } from "veloprompt-core";
import type { SiteAdapter } from "../adapters/types";

export const RESTORED_TITLE = "Dato restaurado por VeloPrompt (la IA nunca lo vio)";
const LABEL = /\[[A-Z_]+_\d+\]/g;
const STYLE_ID = "veloprompt-style";

const CSS = `
.vp-restored { text-decoration: underline dotted; text-decoration-color: #7c5cff; text-decoration-thickness: 1.5px;
  text-underline-offset: 3px; cursor: help; }
.vp-copy { all: unset; display: inline-flex; align-items: center; gap: 6px; margin: 6px 0 2px; padding: 4px 10px;
  font: 500 12.5px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #5b3df5;
  border: 1px solid rgba(91, 61, 245, .35); border-radius: 999px; cursor: pointer; }
.vp-copy:hover { background: rgba(91, 61, 245, .08); }
.vp-copy:focus-visible { outline: 2px solid #5b3df5; outline-offset: 2px; }
@media (prefers-color-scheme: dark) { .vp-copy { color: #a593ff; border-color: rgba(165, 147, 255, .4); } }
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head ?? document.documentElement).append(style);
}

/** Sustituye en pantalla las etiquetas conocidas por spans con el valor real. Devuelve cuántas cambió. */
export function restoreIn(container: HTMLElement, map: RedactionMap): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || parent.closest(".vp-restored, .vp-copy, textarea, [contenteditable='true']")) return NodeFilter.FILTER_REJECT;
      LABEL.lastIndex = 0;
      return LABEL.test((node as Text).data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const targets: Text[] = [];
  while (walker.nextNode()) targets.push(walker.currentNode as Text);

  let count = 0;
  for (const node of targets) {
    const data = node.data;
    const frag = document.createDocumentFragment();
    let cursor = 0;
    for (const m of data.matchAll(LABEL)) {
      const value = map[m[0]];
      if (value === undefined) continue;
      frag.append(data.slice(cursor, m.index));
      const span = document.createElement("span");
      span.className = "vp-restored";
      span.title = RESTORED_TITLE;
      span.dataset.vpLabel = m[0];
      span.textContent = value;
      frag.append(span);
      cursor = m.index + m[0].length;
      count++;
    }
    if (cursor === 0) continue;
    frag.append(data.slice(cursor));
    node.replaceWith(frag);
  }
  return count;
}

function ensureCopyButton(container: HTMLElement, getMap: () => RedactionMap): void {
  const next = container.nextElementSibling;
  if (next instanceof HTMLElement && next.classList.contains("vp-copy")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "vp-copy";
  button.textContent = "Copiar con datos reales";
  button.title = "Copia la respuesta con tus datos reales en lugar de las etiquetas";
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(restore(container.innerText, getMap()));
    button.textContent = "Copiado ✓";
    setTimeout(() => (button.textContent = "Copiar con datos reales"), 1500);
  });
  container.after(button);
}

/**
 * Observa la página y, cuando las respuestas dejan de cambiar (fin del streaming), restaura las
 * etiquetas. Esperar a que se calmen evita pelearse con el renderizado de la web mientras escribe.
 */
export function startRestorer(adapter: SiteAdapter, getMap: () => RedactionMap, isEnabled: () => boolean): () => void {
  ensureStyle();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let firstPending = 0;

  const run = (): void => {
    timer = undefined;
    firstPending = 0;
    if (!isEnabled()) return;
    const map = getMap();
    if (Object.keys(map).length === 0) return;
    for (const container of adapter.getResponseContainers()) {
      const restored = restoreIn(container, map);
      if (restored > 0 || container.querySelector(".vp-restored")) ensureCopyButton(container, getMap);
    }
  };

  const schedule = (): void => {
    const now = Date.now();
    if (!firstPending) firstPending = now;
    if (timer) clearTimeout(timer);
    // Espera 400 ms de calma, pero nunca más de 2 s desde el primer cambio.
    timer = setTimeout(run, now - firstPending > 2000 ? 0 : 400);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  schedule();
  return () => {
    observer.disconnect();
    if (timer) clearTimeout(timer);
  };
}
