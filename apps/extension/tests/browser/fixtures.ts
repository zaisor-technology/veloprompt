import { test as base, chromium, type BrowserContext, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const EXTENSION_PATH = resolve(import.meta.dirname, "../../dist/chrome-mv3-e2e");

/** ID de la extensión a partir de la clave pública fija de la compilación de tests. */
export const EXTENSION_ID = (() => {
  const der = Buffer.from(readFileSync(resolve(import.meta.dirname, "../e2e-extension-key.txt"), "utf8").trim(), "base64");
  const hex = createHash("sha256").update(der).digest("hex").slice(0, 32);
  return [...hex].map((h) => String.fromCharCode(97 + parseInt(h, 16))).join("");
})();

export const test = base.extend<{ context: BrowserContext; requests: string[] }>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "vp-e2e-")), {
      channel: "chromium",
      headless: true,
      viewport: { width: 1100, height: 760 },
      locale: "es-ES",
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
    await use(context);
    await context.close();
  },
  /** Todas las peticiones de red que hace cualquier página del contexto. */
  requests: async ({ context }, use) => {
    const urls: string[] = [];
    context.on("request", (r) => urls.push(r.url()));
    await use(urls);
  },
  page: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});

export const expect = test.expect;

/** Pega texto en el editor con un evento paste (lo que dispara el navegador al pulsar Ctrl+V). */
export async function paste(page: Page, selector: string, text: string): Promise<void> {
  await page.locator(selector).click();
  await page.evaluate(
    ({ selector, text }) => {
      const el = document.querySelector(selector)!;
      const data = new DataTransfer();
      data.setData("text/plain", text);
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    },
    { selector, text },
  );
}

/** Botón del aviso de VeloPrompt (vive en un shadow root abierto). */
export const notice = (page: Page) => page.locator("#veloprompt-notice [role=dialog]");

export async function setStorage(context: BrowserContext, values: Record<string, unknown>): Promise<void> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate((v) => (globalThis as any).chrome.storage.local.set(v), values);
  await page.close();
}
