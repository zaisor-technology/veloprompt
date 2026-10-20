import { createSiteAdapter } from "./site-adapter";

/**
 * perplexity.ai. Editor Lexical (`#ask-input`, contenteditable); se mantiene el textarea antiguo
 * como alternativa. Selectores revisados en octubre de 2026. Conversación: /search/<slug>.
 */
export const perplexityAdapter = createSiteAdapter({
  id: "perplexity",
  name: "Perplexity",
  editorSelectors: [
    "#ask-input[contenteditable='true']",
    "div[data-lexical-editor='true'][contenteditable='true']",
    "textarea#ask-input",
  ],
  sendButtonSelectors: [
    "button[data-testid='submit-button']",
    "button[aria-label='Submit']",
    "button[aria-label='Enviar']",
  ],
  responseSelectors: ["[id^='markdown-content-']", "div.prose"],
  conversationKey: (loc) => {
    const m = /\/search\/([\w.-]+)/.exec(loc.pathname);
    return m ? `search:${m[1]}` : `new:${loc.pathname}`;
  },
});
