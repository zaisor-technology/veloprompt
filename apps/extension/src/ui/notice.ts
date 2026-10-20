import type { Finding } from "veloprompt-core";
import { findingName } from "../lib/labels";
import { buildPreview } from "../lib/preview";

export type NoticeMode = "paste" | "send";
export type NoticeChoice =
  | { kind: "all" }
  | { kind: "some"; findings: Finding[] }
  | { kind: "none" }
  | { kind: "cancel" };

const HOST_ID = "veloprompt-notice";

const CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
.card {
  --bg: #ffffff; --fg: #1d1b26; --muted: #625f72; --line: #e4e1ee; --accent: #5b3df5; --accent-fg: #ffffff;
  --mark: #fff1b8; --mark-fg: #3d2e00; --soft: #f5f3ff;
  position: fixed; z-index: 2147483646; font: 14px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--fg); background: var(--bg); border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 12px 40px rgba(20, 10, 60, .18), 0 2px 6px rgba(20, 10, 60, .08);
  padding: 14px 16px 12px; max-height: 60vh; overflow: auto; animation: in .14s ease-out;
}
@media (prefers-color-scheme: dark) {
  .card { --bg: #1e1c26; --fg: #f1effa; --muted: #a9a5bb; --line: #34313f; --accent: #8b74ff; --accent-fg: #120a33;
    --mark: #5c4a00; --mark-fg: #fff3c4; --soft: #2a2638; }
}
@keyframes in { from { opacity: 0; transform: translateY(6px); } }
header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
header svg { flex: none; color: var(--accent); }
h2 { font-size: 14px; font-weight: 650; margin: 0; }
.preview { background: var(--soft); border-radius: 10px; padding: 8px 10px; white-space: pre-wrap;
  word-break: break-word; max-height: 140px; overflow: auto; font-size: 13px; color: var(--muted); }
mark { background: var(--mark); color: var(--mark-fg); border-radius: 4px; padding: 0 3px; }
mark small { font-size: 10.5px; font-weight: 600; opacity: .8; margin-left: 4px; text-transform: uppercase; letter-spacing: .02em; }
.actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; align-items: center; }
button { font: inherit; font-weight: 600; border-radius: 9px; padding: 7px 14px; cursor: pointer;
  border: 1px solid var(--line); background: transparent; color: var(--fg); }
button:hover { background: var(--soft); }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
button.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-fg); }
button.primary:hover { filter: brightness(1.08); }
button.link { border: none; color: var(--muted); font-weight: 500; padding: 7px 6px; margin-left: auto; }
.hint { font-size: 12px; color: var(--muted); margin-top: 8px; }
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; max-height: 200px; overflow: auto; }
li label { display: flex; gap: 10px; align-items: baseline; padding: 6px 8px; border-radius: 8px; cursor: pointer; }
li label:hover { background: var(--soft); }
li input { accent-color: var(--accent); }
.kind { font-weight: 600; min-width: 110px; }
.value { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; color: var(--muted); word-break: break-all; }
[hidden] { display: none !important; }
`;

const ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
<path d="M4 7c3-3 13-3 16 0v4c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M8 11c2.3 1.6 5.7 1.6 8 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

let closeCurrent: ((c: NoticeChoice) => void) | null = null;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function position(card: HTMLElement, anchor: HTMLElement | null): void {
  const width = 560;
  const rect = anchor?.getBoundingClientRect();
  if (!rect || rect.width === 0) {
    Object.assign(card.style, { right: "24px", bottom: "24px", width: `min(${width}px, calc(100vw - 48px))` });
    return;
  }
  const w = Math.min(width, Math.max(320, rect.width), window.innerWidth - 24);
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - w - 12);
  card.style.left = `${left}px`;
  card.style.width = `${w}px`;
  if (rect.top > 280) card.style.bottom = `${window.innerHeight - rect.top + 10}px`;
  else card.style.top = `${Math.min(rect.bottom + 10, window.innerHeight - 200)}px`;
}

/** Muestra el aviso junto al editor y resuelve con la elección del usuario. */
export function showNotice(opts: { mode: NoticeMode; text: string; findings: Finding[]; anchor: HTMLElement | null }): Promise<NoticeChoice> {
  closeCurrent?.({ kind: "cancel" });
  const { mode, text, findings, anchor } = opts;
  const previouslyFocused = document.activeElement as HTMLElement | null;

  const host = el("div", { id: HOST_ID });
  const root = host.attachShadow({ mode: "open" });
  const card = el("div", { className: "card" });
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "false");
  card.setAttribute("aria-labelledby", "vp-title");

  const n = findings.length;
  const title = el(
    "h2",
    { id: "vp-title" },
    mode === "paste"
      ? `VeloPrompt ha encontrado ${n} ${n === 1 ? "dato sensible" : "datos sensibles"} en lo que vas a pegar`
      : `Tu mensaje contiene ${n} ${n === 1 ? "dato sensible" : "datos sensibles"}`,
  );
  const header = el("header");
  header.innerHTML = ICON;
  header.append(title);

  const preview = el("div", { className: "preview" });
  for (const part of buildPreview(text, findings)) {
    if (part.finding) {
      const mark = el("mark", {}, part.text, el("small", {}, findingName(part.finding)));
      preview.append(mark);
    } else preview.append(part.text);
  }

  const veilAll = el("button", { className: "primary", type: "button" }, "Tapar todo");
  const choose = el("button", { type: "button" }, "Elegir");
  const ignore = el("button", { type: "button" }, mode === "paste" ? "Pegar igual" : "Enviar igual");
  const cancel = el("button", { className: "link", type: "button", title: "Esc" }, "Cancelar");
  const actions = el("div", { className: "actions" }, veilAll, choose, ignore, cancel);
  veilAll.dataset.vp = "all";
  choose.dataset.vp = "choose";
  ignore.dataset.vp = "ignore";
  cancel.dataset.vp = "cancel";

  const list = el("ul");
  const boxes = findings.map((f) => {
    const box = el("input", { type: "checkbox", checked: true });
    list.append(el("li", {}, el("label", {}, box, el("span", { className: "kind" }, findingName(f)), el("span", { className: "value" }, f.value))));
    return box;
  });
  const veilSome = el("button", { className: "primary", type: "button" }, "Tapar seleccionados");
  const back = el("button", { type: "button" }, "Volver");
  veilSome.dataset.vp = "some";
  const chooser = el("div", { hidden: true }, list, el("div", { className: "actions" }, veilSome, back));

  const hint = el("p", { className: "hint" }, "Las etiquetas se cambian por tus datos reales al mostrar la respuesta. Nada sale de tu navegador.");

  card.append(header, preview, actions, chooser, hint);
  root.append(el("style", {}, CSS), card);
  document.documentElement.append(host);
  position(card, anchor);

  return new Promise<NoticeChoice>((resolve) => {
    const finish = (choice: NoticeChoice): void => {
      closeCurrent = null;
      host.remove();
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onResize);
      if (choice.kind === "cancel") previouslyFocused?.focus?.();
      resolve(choice);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        finish({ kind: "cancel" });
      }
    };
    const onResize = (): void => position(card, anchor);
    closeCurrent = finish;
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onResize);

    veilAll.onclick = () => finish({ kind: "all" });
    ignore.onclick = () => finish({ kind: "none" });
    cancel.onclick = () => finish({ kind: "cancel" });
    choose.onclick = () => {
      actions.hidden = true;
      preview.hidden = true;
      chooser.hidden = false;
      boxes[0]?.focus();
    };
    back.onclick = () => {
      actions.hidden = false;
      preview.hidden = false;
      chooser.hidden = true;
      choose.focus();
    };
    veilSome.onclick = () => {
      const chosen = findings.filter((_, i) => boxes[i]!.checked);
      finish(chosen.length ? { kind: "some", findings: chosen } : { kind: "none" });
    };
    veilAll.focus({ preventScroll: true });
  });
}
