import * as editor from "./editor";
import type { SiteAdapter } from "./types";

export interface SiteConfig {
  id: SiteAdapter["id"];
  name: string;
  /** Primero el más específico. Puede ser contenteditable o textarea. */
  editorSelectors: string[];
  sendButtonSelectors: string[];
  /** Para webs cuyo botón de enviar no tiene un selector estable (p. ej. DeepSeek). */
  findSendButton?: (editor: HTMLElement | null) => HTMLElement | null;
  /** Solo actúa en parte del sitio (p. ej. el chat de Microsoft 365, no Word ni Excel). */
  isActive?: (location: Location) => boolean;
  /** Ver SiteAdapter.restoreAnywhere. */
  restoreAnywhere?: boolean;
  responseSelectors: string[];
  conversationKey: (location: Location) => string;
}

function first<T extends Element>(selectors: string[], root: ParentNode = document): T | null {
  for (const s of selectors) {
    const el = root.querySelector<T>(s);
    if (el) return el;
  }
  return null;
}

/** Misma mecánica para todos los sitios; cambian los selectores. */
export function createSiteAdapter(config: SiteConfig): SiteAdapter {
  const active = (): boolean => config.isActive?.(location) ?? true;
  const getEditor = (): HTMLElement | null => (active() ? first<HTMLElement>(config.editorSelectors) : null);
  const sendSelector = config.sendButtonSelectors.join(",");
  const getSendButton = (): HTMLElement | null =>
    (sendSelector ? first<HTMLElement>(config.sendButtonSelectors) : null) ?? config.findSendButton?.(getEditor()) ?? null;
  const isSendTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    if (sendSelector && target.closest(sendSelector)) return true;
    const custom = config.findSendButton?.(getEditor());
    return !!custom && custom.contains(target);
  };

  return {
    id: config.id,
    name: config.name,
    getEditor,
    getText: () => {
      const el = getEditor();
      return el ? editor.mapText(el).text : "";
    },
    setText: (text) => {
      const el = getEditor();
      if (el) editor.setText(el, text);
    },
    replaceRanges: (replacements) => {
      const el = getEditor();
      return el ? editor.replaceRanges(el, replacements) : false;
    },
    onSend: (cb) => {
      const onKey = (e: KeyboardEvent): void => {
        if (e.key !== "Enter" || e.shiftKey || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
        const el = getEditor();
        if (el && e.target instanceof Node && el.contains(e.target)) cb(e);
      };
      const onClick = (e: MouseEvent): void => {
        if (isSendTarget(e.target)) cb(e);
      };
      window.addEventListener("keydown", onKey, true);
      window.addEventListener("click", onClick, true);
      return () => {
        window.removeEventListener("keydown", onKey, true);
        window.removeEventListener("click", onClick, true);
      };
    },
    submit: () => {
      const button = getSendButton();
      const disabled = button instanceof HTMLButtonElement ? button.disabled : button?.getAttribute("aria-disabled") === "true";
      if (button && !disabled) {
        button.click();
        return;
      }
      const el = getEditor();
      el?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
    },
    getResponseContainers: () => {
      if (!active()) return [];
      const input = getEditor();
      const found = new Set<HTMLElement>();
      for (const s of config.responseSelectors) {
        for (const el of document.querySelectorAll<HTMLElement>(s)) {
          if (input && (el.contains(input) || input.contains(el))) continue;
          // Si un selector anidado ya está cubierto por un contenedor exterior, nos quedamos con el exterior.
          if ([...found].some((f) => f.contains(el))) continue;
          for (const f of [...found]) if (el.contains(f)) found.delete(f);
          found.add(el);
        }
      }
      return [...found];
    },
    conversationKey: () => config.conversationKey(location),
    get restoreAnywhere() {
      return (config.restoreAnywhere ?? false) && active();
    },
  };
}
