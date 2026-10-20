import { createSiteAdapter } from "./site-adapter";

/**
 * copilot.microsoft.com. Editor: textarea controlado por React. Selectores revisados en octubre
 * de 2026; si la web cambia, se ajustan aquí. Conversación: /chats/<id>.
 */
export const copilotAdapter = createSiteAdapter({
  id: "copilot",
  name: "Copilot",
  editorSelectors: ["textarea#userInput", "textarea[data-testid='composer-input']"],
  sendButtonSelectors: [
    "button[data-testid='submit-button']",
    "button[aria-label='Submit message']",
    "button[aria-label='Enviar mensaje']",
  ],
  responseSelectors: ["[data-content='ai-message']"],
  conversationKey: (loc) => {
    const m = /\/chats\/([\w-]+)/.exec(loc.pathname);
    return m ? `chats:${m[1]}` : `new:${loc.pathname}`;
  },
});
