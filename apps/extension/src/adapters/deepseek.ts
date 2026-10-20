import { createSiteAdapter } from "./site-adapter";

/**
 * El botón de enviar de DeepSeek es un `div[role=button]` sin etiqueta ni identificador estable
 * (sus clases son hashes). Es el último botón de la caja que contiene el textarea, después de
 * los interruptores "DeepThink" y "Buscar" y del clip de adjuntar.
 */
function findSendButton(editor: HTMLElement | null): HTMLElement | null {
  let el: HTMLElement | null = editor?.parentElement ?? null;
  for (let depth = 0; el && depth < 6; depth++, el = el.parentElement) {
    const buttons = el.querySelectorAll<HTMLElement>("[role='button'], button");
    if (buttons.length >= 2) return buttons[buttons.length - 1] ?? null;
  }
  return null;
}

/**
 * chat.deepseek.com. Editor: textarea#chat-input. Selectores revisados en octubre de 2026.
 * Conversación: /a/chat/s/<id>.
 */
export const deepseekAdapter = createSiteAdapter({
  id: "deepseek",
  name: "DeepSeek",
  editorSelectors: ["textarea#chat-input", "textarea[placeholder*='DeepSeek']"],
  sendButtonSelectors: [],
  findSendButton,
  responseSelectors: [".ds-markdown"],
  conversationKey: (loc) => {
    const m = /\/chat\/s\/([\w-]+)/.exec(loc.pathname);
    return m ? `s:${m[1]}` : `new:${loc.pathname}`;
  },
});
