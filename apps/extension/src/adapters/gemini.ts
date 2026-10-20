import { createSiteAdapter } from "./site-adapter";

/**
 * gemini.google.com. Editor Quill (`rich-textarea .ql-editor`). Selectores revisados en octubre
 * de 2026; si la web cambia, se ajustan aquí. Conversación: /app/<id>. Chat nuevo: /app.
 */
export const geminiAdapter = createSiteAdapter({
  id: "gemini",
  name: "Gemini",
  editorSelectors: ["rich-textarea .ql-editor[contenteditable='true']", ".ql-editor[contenteditable='true']"],
  sendButtonSelectors: [
    "button.send-button",
    "button[aria-label='Send message']",
    "button[aria-label='Enviar mensaje']",
  ],
  responseSelectors: ["model-response message-content", "message-content .markdown", ".model-response-text"],
  conversationKey: (loc) => {
    const m = /\/app\/([\w-]+)/.exec(loc.pathname);
    return m ? `app:${m[1]}` : `new:${loc.pathname}`;
  },
});
