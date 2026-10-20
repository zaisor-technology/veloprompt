import { expect, test, type Page } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const VP: any;

const SITES = [
  { name: "chatgpt", adapter: "chatgptAdapter", url: "/chatgpt.html", editor: "#prompt-textarea", send: "#composer-submit-button", conv: "c:conv-prueba-1" },
  { name: "claude", adapter: "claudeAdapter", url: "/claude.html", editor: "[data-testid='chat-input'] .ProseMirror", send: "button[aria-label='Send message']", conv: "chat:conv-prueba-2" },
  { name: "gemini (Quill)", adapter: "geminiAdapter", url: "/gemini.html", editor: "rich-textarea .ql-editor", send: "button.send-button", conv: "app:conv-gemini-1" },
  { name: "copilot (textarea)", adapter: "copilotAdapter", url: "/copilot.html", editor: "textarea#userInput", send: "[data-testid='submit-button']", conv: "chats:conv-copilot-1" },
  { name: "perplexity (Lexical)", adapter: "perplexityAdapter", url: "/perplexity.html", editor: "#ask-input", send: "button[aria-label='Submit']", conv: "search:conv-perplexity-1" },
  { name: "deepseek (textarea)", adapter: "deepseekAdapter", url: "/deepseek.html", editor: "textarea#chat-input", send: "._send", conv: "s:conv-deepseek-1" },
] as const;

const sent = (page: Page) => page.evaluate(() => (window as any).__sent as string[]);

for (const site of SITES) {
  test.describe(`adaptador ${site.name}`, () => {
    const call = (page: Page, method: string, ...args: unknown[]) =>
      page.evaluate(([a, m, rest]) => VP[a as string][m as string](...(rest as unknown[])), [site.adapter, method, args] as const);

    test.beforeEach(async ({ page }) => {
      await page.goto(site.url);
      await page.addScriptTag({ url: "/harness.js" });
    });

    test("getEditor encuentra el editor de la página", async ({ page }) => {
      expect(await page.evaluate(([a, sel]) => VP[a].getEditor() === document.querySelector(sel), [site.adapter, site.editor] as const)).toBe(true);
    });

    test("getText lee párrafos separados por salto de línea", async ({ page }) => {
      await page.locator(site.editor).click();
      await page.keyboard.type("Hola");
      await page.keyboard.press("Shift+Enter");
      await page.keyboard.type("segunda línea");
      expect(await call(page, "getText")).toBe("Hola\nsegunda línea");
    });

    test("setText actualiza el estado interno del editor, no solo el DOM", async ({ page }) => {
      await page.locator(site.editor).click();
      await page.keyboard.type("texto original con 12345678Z");
      await call(page, "setText", "texto tapado con [NIF_1]");
      await page.locator(site.send).click();
      expect(await sent(page)).toEqual(["texto tapado con [NIF_1]"]);
    });

    test("setText con varias líneas usa un paste sintético", async ({ page }) => {
      await page.locator(site.editor).click();
      await call(page, "setText", "línea 1\nlínea 2");
      expect(await call(page, "getText")).toBe("línea 1\nlínea 2");
      await page.locator(site.send).click();
      expect(await sent(page)).toEqual(["línea 1\nlínea 2"]);
    });

    test("replaceRanges sustituye tramos en varios párrafos y el editor envía las etiquetas", async ({ page }) => {
      await page.locator(site.editor).click();
      await page.keyboard.type("DNI 12345678Z y");
      await page.keyboard.press("Shift+Enter");
      await page.keyboard.type("correo ana@example.com fin");
      const text: string = await call(page, "getText");
      const a = text.indexOf("12345678Z");
      const b = text.indexOf("ana@example.com");
      const ok = await call(page, "replaceRanges", [
        { start: a, end: a + 9, text: "[NIF_1]" },
        { start: b, end: b + 15, text: "[EMAIL_1]" },
      ]);
      expect(ok).toBe(true);
      await page.locator(site.send).click();
      expect(await sent(page)).toEqual(["DNI [NIF_1] y\ncorreo [EMAIL_1] fin"]);
    });

    test("onSend avisa en captura con Enter y con clic, y puede bloquear el envío", async ({ page }) => {
      await page.evaluate((a) => {
        (window as any).__calls = [];
        VP[a].onSend((e: Event) => {
          (window as any).__calls.push(e.type);
          e.preventDefault();
          e.stopImmediatePropagation();
        });
      }, site.adapter);
      await page.locator(site.editor).click();
      await page.keyboard.type("hola");
      await page.keyboard.press("Shift+Enter"); // no es un envío
      await page.keyboard.press("Enter");
      await page.locator(site.send).click();
      expect(await page.evaluate(() => (window as any).__calls)).toEqual(["keydown", "click"]);
      expect(await sent(page)).toEqual([]);
    });

    test("submit envía como el botón", async ({ page }) => {
      await page.locator(site.editor).click();
      await page.keyboard.type("mensaje");
      await call(page, "submit");
      expect(await sent(page)).toEqual(["mensaje"]);
    });

    test("getResponseContainers devuelve solo respuestas de la IA", async ({ page }) => {
      await page.locator(site.editor).click();
      await page.keyboard.type("pregunta");
      await page.keyboard.press("Enter");
      expect(await call(page, "getResponseContainers")).toHaveLength(0);
      await page.evaluate(() => (window as any).__reply("Respuesta uno"));
      await page.evaluate(() => (window as any).__reply("Respuesta dos"));
      const texts = await page.evaluate((a) => VP[a].getResponseContainers().map((el: HTMLElement) => el.innerText.trim()), site.adapter);
      expect(texts).toEqual(["Respuesta uno", "Respuesta dos"]);
    });

    test("conversationKey pasa de chat nuevo a conversación al enviar", async ({ page }) => {
      expect(await call(page, "conversationKey")).toMatch(/^new:/);
      await page.locator(site.editor).click();
      await page.keyboard.type("hola");
      await page.keyboard.press("Enter");
      expect(await call(page, "conversationKey")).toBe(site.conv);
    });

    test("restoreIn cambia etiquetas conocidas por el valor, con tooltip", async ({ page }) => {
      await page.evaluate(() => (window as any).__reply("Tu DNI [NIF_1] y [EMAIL_9] (desconocida)."));
      const result = await page.evaluate((a) => {
        const [c] = VP[a].getResponseContainers();
        const n = VP.restoreIn(c, { "[NIF_1]": "12345678Z" });
        const span = c.querySelector(".vp-restored");
        return { n, text: c.innerText.trim(), title: span?.title, label: span?.dataset.vpLabel };
      }, site.adapter);
      expect(result).toEqual({
        n: 1,
        text: "Tu DNI 12345678Z y [EMAIL_9] (desconocida).",
        title: "Dato restaurado por VeloPrompt (la IA nunca lo vio)",
        label: "[NIF_1]",
      });
    });
  });
}

test("deepseek: los interruptores DeepThink y Buscar no cuentan como enviar", async ({ page }) => {
  await page.goto("/deepseek.html");
  await page.addScriptTag({ url: "/harness.js" });
  await page.evaluate(() => {
    (window as any).__calls = 0;
    VP.deepseekAdapter.onSend(() => (window as any).__calls++);
  });
  await page.getByText("DeepThink (R1)").click();
  await page.getByText("Buscar").click();
  expect(await page.evaluate(() => (window as any).__calls)).toBe(0);
  await page.locator("._send").click();
  expect(await page.evaluate(() => (window as any).__calls)).toBe(1);
});

test("m365: solo actúa en el chat, no en el resto de Microsoft 365", async ({ page }) => {
  await page.goto("/m365/chat");
  await page.addScriptTag({ url: "/harness.js" });
  expect(await page.evaluate(() => VP.m365Adapter.getEditor()?.id)).toBe("editor");
  await page.evaluate(() => history.pushState({}, "", "/m365/word/documento"));
  expect(await page.evaluate(() => VP.m365Adapter.getEditor())).toBeNull();
  expect(await page.evaluate(() => VP.m365Adapter.restoreAnywhere)).toBe(false);
});

test("m365: encuentra el botón de enviar sin etiqueta (el último de la caja, no el +)", async ({ page }) => {
  await page.goto("/m365/chat");
  await page.addScriptTag({ url: "/harness.js" });
  await page.locator("#editor").click();
  await page.keyboard.type("hola");
  await page.evaluate(() => VP.m365Adapter.submit());
  expect(await page.evaluate(() => (window as any).__sent)).toEqual(["hola"]);
});

test("pickAdapter elige por dominio y solo usa rutas locales en modo test", async ({ page }) => {
  await page.goto("/chatgpt.html");
  await page.addScriptTag({ url: "/harness.js" });
  const ids = await page.evaluate(() => [
    VP.pickAdapter({ hostname: "chatgpt.com", pathname: "/" })?.id,
    VP.pickAdapter({ hostname: "claude.ai", pathname: "/new" })?.id,
    VP.pickAdapter({ hostname: "gemini.google.com", pathname: "/app" })?.id,
    VP.pickAdapter({ hostname: "copilot.microsoft.com", pathname: "/" })?.id,
    VP.pickAdapter({ hostname: "m365.cloud.microsoft", pathname: "/chat" })?.id,
    VP.pickAdapter({ hostname: "www.perplexity.ai", pathname: "/" })?.id,
    VP.pickAdapter({ hostname: "perplexity.ai", pathname: "/" })?.id,
    VP.pickAdapter({ hostname: "chat.deepseek.com", pathname: "/" })?.id,
    VP.pickAdapter({ hostname: "example.com", pathname: "/" })?.id ?? null,
    VP.pickAdapter({ hostname: "127.0.0.1", pathname: "/chatgpt.html" })?.id ?? null,
    VP.pickAdapter({ hostname: "127.0.0.1", pathname: "/claude.html" }, true)?.id,
  ]);
  expect(ids).toEqual(["chatgpt", "claude", "gemini", "copilot", "m365", "perplexity", "perplexity", "deepseek", null, null, "claude"]);
});
