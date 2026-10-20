import { createSiteAdapter } from "./site-adapter";

/**
 * El botón de enviar es el último botón de la caja del mensaje (a la izquierda está el "+" de adjuntar).
 */
function findSendButton(editor: HTMLElement | null): HTMLElement | null {
  let el: HTMLElement | null = editor?.parentElement ?? null;
  for (let depth = 0; el && depth < 6; depth++, el = el.parentElement) {
    const buttons = el.querySelectorAll<HTMLElement>("button");
    if (buttons.length >= 2) return buttons[buttons.length - 1] ?? null;
  }
  return null;
}

/**
 * Microsoft 365 Copilot (m365.cloud.microsoft/chat). No conocemos su HTML con certeza: selectores
 * amplios para el editor (Lexical o textarea) y restauración en toda la página del chat.
 * Solo actúa en rutas de chat: nunca en Word, Excel, Outlook ni el resto de Microsoft 365.
 */
export const m365Adapter = createSiteAdapter({
  id: "m365",
  name: "Microsoft 365 Copilot",
  editorSelectors: [
    "#m365-chat-editor-target-element",
    "[data-lexical-editor='true'][contenteditable='true']",
    "[role='textbox'][contenteditable='true']",
    "div[contenteditable='true'][aria-label]",
    "main textarea",
    "textarea",
  ],
  sendButtonSelectors: [
    "button[aria-label='Enviar']",
    "button[aria-label='Send']",
    "button[aria-label='Enviar mensaje']",
    "button[aria-label='Send message']",
  ],
  findSendButton,
  responseSelectors: ["[data-testid='markdown-reply']", "[data-testid='copilot-message-reply-div']"],
  restoreAnywhere: true,
  isActive: (loc) => /(^|\/)chat(\/|$)/.test(loc.pathname),
  conversationKey: (loc) => {
    const m = /\/chat\/(?:conversation\/)?([\w-]{6,})/.exec(loc.pathname);
    return m ? `m365:${m[1]}` : `new:${loc.pathname}`;
  },
});
