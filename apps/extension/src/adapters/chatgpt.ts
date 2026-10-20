import { createSiteAdapter } from "./site-adapter";

/**
 * chatgpt.com. Selectores revisados en octubre de 2026; si la web cambia, se ajustan aquí.
 * Conversación: /c/<id> (también dentro de un GPT: /g/<gpt>/c/<id>). Chat nuevo: "/".
 */
export const chatgptAdapter = createSiteAdapter({
  id: "chatgpt",
  name: "ChatGPT",
  editorSelectors: ["#prompt-textarea[contenteditable='true']", "div.ProseMirror[contenteditable='true']"],
  sendButtonSelectors: ["#composer-submit-button", "button[data-testid='send-button']"],
  responseSelectors: ["[data-message-author-role='assistant']"],
  conversationKey: (loc) => {
    const m = /\/c\/([\w-]+)/.exec(loc.pathname);
    return m ? `c:${m[1]}` : `new:${loc.pathname}`;
  },
});
