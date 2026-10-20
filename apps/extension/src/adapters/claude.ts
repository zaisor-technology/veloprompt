import { createProseMirrorAdapter } from "./prosemirror";

/**
 * claude.ai. Selectores revisados en octubre de 2026; si la web cambia, se ajustan aquí.
 * Conversación: /chat/<uuid>. Chat nuevo: /new.
 */
export const claudeAdapter = createProseMirrorAdapter({
  id: "claude",
  name: "Claude",
  editorSelectors: [
    "[data-testid='chat-input'] div.ProseMirror[contenteditable='true']",
    "div.ProseMirror[contenteditable='true']",
  ],
  sendButtonSelectors: [
    "button[aria-label='Send message']",
    "button[aria-label='Enviar mensaje']",
    "button[data-testid='send-button']",
  ],
  responseSelectors: [".font-claude-response", ".font-claude-message", "[data-testid='assistant-message']"],
  conversationKey: (loc) => {
    const m = /\/chat\/([\w-]+)/.exec(loc.pathname);
    return m ? `chat:${m[1]}` : `new:${loc.pathname}`;
  },
});
