import * as editor from "./editor";
import type { SiteAdapter } from "./types";

export interface ProseMirrorSiteConfig {
  id: SiteAdapter["id"];
  name: string;
  editorSelectors: string[];
  sendButtonSelectors: string[];
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

/** ChatGPT y Claude usan ProseMirror: misma mecánica, distintos selectores. */
export function createProseMirrorAdapter(config: ProseMirrorSiteConfig): SiteAdapter {
  const getEditor = (): HTMLElement | null => first<HTMLElement>(config.editorSelectors);
  const sendSelector = config.sendButtonSelectors.join(",");
  const getSendButton = (): HTMLButtonElement | null => first<HTMLButtonElement>(config.sendButtonSelectors);

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
        const target = e.target instanceof Element ? e.target.closest(sendSelector) : null;
        if (target) cb(e);
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
      if (button && !button.disabled) {
        button.click();
        return;
      }
      const el = getEditor();
      el?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
    },
    getResponseContainers: () => {
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
  };
}
