import { browser } from "wxt/browser";

// Al instalar (no al actualizar), abre la página de bienvenida. No hace ninguna petición de red.
export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === "install") void browser.tabs.create({ url: browser.runtime.getURL("/bienvenida.html") });
  });
});
