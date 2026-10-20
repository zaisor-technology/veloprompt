import type { Page } from "@playwright/test";
import { EXTENSION_ID, expect, notice, paste, setStorage, test } from "./fixtures";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Cédula ecuatoriana SINTÉTICA: módulo 10 calculado aquí (no es de ninguna persona real). */
function cedula(nine: string): string {
  let s = 0;
  for (let i = 0; i < 9; i++) {
    const p = Number(nine[i]) * (i % 2 === 0 ? 2 : 1);
    s += p > 9 ? p - 9 : p;
  }
  return nine + ((10 - (s % 10)) % 10);
}
const CEDULA = cedula("171003406");
const NIF = "12345678Z"; // ejemplo oficial de la letra módulo 23

const CHATGPT = { url: "/chatgpt.html", editor: "#prompt-textarea", send: "#composer-submit-button", response: "[data-message-author-role='assistant']" };
const CLAUDE = { url: "/claude.html", editor: "[data-testid='chat-input'] .ProseMirror", send: "button[aria-label='Send message']", response: ".font-claude-response" };

const sent = (page: Page) => page.evaluate(() => (window as any).__sent as string[]);
const editorText = (page: Page, sel: string) => page.locator(sel).evaluate((el) => (el as HTMLElement).innerText.trim());
const reply = (page: Page, text: string) => page.evaluate((t) => (window as any).__reply(t), text);

async function open(page: Page, site: typeof CHATGPT): Promise<void> {
  await page.goto(site.url);
  // El content script se inyecta en document_idle: esperamos a que marque la página.
  await expect(page.locator("#veloprompt-style")).toHaveCount(1);
}

test.describe("ChatGPT (página de prueba)", () => {
  test("pegar → tapar → enviar → restaurar la respuesta → copiar con datos reales", async ({ page, requests }) => {
    await open(page, CHATGPT);
    await paste(page, CHATGPT.editor, `Hola, soy Ana. Mi cédula es ${CEDULA} y el NIF de mi socio es ${NIF}.`);

    await expect(notice(page)).toBeVisible();
    await expect(notice(page).getByText("VeloPrompt ha encontrado 2 datos sensibles")).toBeVisible();
    await expect(notice(page).locator("mark")).toHaveCount(2);
    await expect(notice(page).locator("mark small")).toHaveText(["Cédula (EC)", "DNI/NIF (ES)"]);
    // "Tapar todo" es la opción por defecto: tiene el foco.
    await expect(notice(page).getByRole("button", { name: "Tapar todo" })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(notice(page)).toHaveCount(0);
    await expect.poll(() => editorText(page, CHATGPT.editor)).toBe("Hola, soy Ana. Mi cédula es [CEDULA_1] y el NIF de mi socio es [NIF_1].");

    await page.keyboard.press("Enter");
    expect(await sent(page)).toEqual(["Hola, soy Ana. Mi cédula es [CEDULA_1] y el NIF de mi socio es [NIF_1]."]);
    await expect(page).toHaveURL(/\/c\/conv-prueba-1$/);

    await reply(page, "Perfecto. He registrado la cédula [CEDULA_1] y el NIF [NIF_1]. La etiqueta [EMAIL_3] no es tuya.");
    const response = page.locator(CHATGPT.response);
    await expect(response.locator(".vp-restored")).toHaveCount(2);
    await expect(response).toContainText(`He registrado la cédula ${CEDULA} y el NIF ${NIF}. La etiqueta [EMAIL_3] no es tuya.`);
    await expect(response.locator(".vp-restored").first()).toHaveAttribute("title", "Dato restaurado por VeloPrompt (la IA nunca lo vio)");

    // El editor no se toca.
    expect(await editorText(page, CHATGPT.editor)).toBe("");

    await page.getByRole("button", { name: "Copiar con datos reales" }).click();
    await expect(page.getByRole("button", { name: "Copiado ✓" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(`la cédula ${CEDULA} y el NIF ${NIF}`);

    // Ninguna petición fuera de la página de prueba local.
    expect(requests.filter((u) => !u.startsWith("http://127.0.0.1:4173/") && !u.startsWith("chrome-extension://"))).toEqual([]);
  });

  test("datos escritos a mano: se revisan al pulsar Enter", async ({ page }) => {
    await open(page, CHATGPT);
    await page.locator(CHATGPT.editor).click();
    await page.keyboard.type(`Mi correo es ana@example.com y mi cédula ${CEDULA}`);
    await page.keyboard.press("Enter");

    await expect(notice(page).getByText("Tu mensaje contiene 2 datos sensibles")).toBeVisible();
    expect(await sent(page)).toEqual([]);
    await notice(page).getByRole("button", { name: "Tapar todo" }).click();

    await expect.poll(() => sent(page)).toEqual(["Mi correo es [EMAIL_1] y mi cédula [CEDULA_1]"]);
  });

  test("Elegir: solo se tapan los datos marcados", async ({ page }) => {
    await open(page, CHATGPT);
    await paste(page, CHATGPT.editor, `Cédula ${CEDULA}, NIF ${NIF}`);
    await notice(page).getByRole("button", { name: "Elegir" }).click();
    const boxes = notice(page).getByRole("checkbox");
    await expect(boxes).toHaveCount(2);
    await boxes.nth(1).uncheck();
    await notice(page).getByRole("button", { name: "Tapar seleccionados" }).click();
    await expect.poll(() => editorText(page, CHATGPT.editor)).toBe(`Cédula [CEDULA_1], NIF ${NIF}`);
  });

  test("Pegar igual y Enviar igual dejan los datos reales", async ({ page }) => {
    await open(page, CHATGPT);
    await paste(page, CHATGPT.editor, `NIF ${NIF}`);
    await notice(page).getByRole("button", { name: "Pegar igual" }).click();
    await expect.poll(() => editorText(page, CHATGPT.editor)).toBe(`NIF ${NIF}`);

    await page.locator(CHATGPT.send).click();
    await notice(page).getByRole("button", { name: "Enviar igual" }).click();
    await expect.poll(() => sent(page)).toEqual([`NIF ${NIF}`]);
  });

  test("Esc cancela: no se pega nada", async ({ page }) => {
    await open(page, CHATGPT);
    await paste(page, CHATGPT.editor, `NIF ${NIF}`);
    await expect(notice(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(notice(page)).toHaveCount(0);
    expect(await editorText(page, CHATGPT.editor)).toBe("");
  });

  test("la misma conversación conserva las etiquetas entre mensajes", async ({ page }) => {
    await open(page, CHATGPT);
    await paste(page, CHATGPT.editor, `Cédula ${CEDULA}`);
    await page.keyboard.press("Enter"); // Tapar todo
    await expect.poll(() => editorText(page, CHATGPT.editor)).toContain("[CEDULA_1]");
    await page.keyboard.press("Enter"); // enviar
    await expect(page).toHaveURL(/\/c\//);

    await paste(page, CHATGPT.editor, `Repito: ${CEDULA}. Otra: ${cedula("092345678")}`);
    await page.keyboard.press("Enter");
    await expect.poll(() => editorText(page, CHATGPT.editor)).toBe("Repito: [CEDULA_1]. Otra: [CEDULA_2]");
  });

  test("texto sin datos sensibles se pega sin aviso", async ({ page }) => {
    await open(page, CHATGPT);
    await paste(page, CHATGPT.editor, "Resume este texto: el pedido 4567891234 llegó el 20/10/2026.");
    await expect.poll(() => editorText(page, CHATGPT.editor)).toBe("Resume este texto: el pedido 4567891234 llegó el 20/10/2026.");
    await expect(notice(page)).toHaveCount(0);
  });

  test("dato dudoso: el aviso dice 'Dato personal'", async ({ page }) => {
    await open(page, CHATGPT);
    await paste(page, CHATGPT.editor, "cédula/DNI 30.123.456");
    await expect(notice(page).locator("mark small")).toHaveText("Dato personal");
  });

  test("términos propios y sitio en pausa, desde chrome.storage.local", async ({ page, context }) => {
    await setStorage(context, { settings: { customTerms: ["Proyecto Fénix"] } });
    await open(page, CHATGPT);
    await paste(page, CHATGPT.editor, "Informe del proyecto fénix");
    await expect(notice(page).locator("mark small")).toHaveText("Término propio");
    await page.keyboard.press("Enter");
    await expect.poll(() => editorText(page, CHATGPT.editor)).toBe("Informe del [PRIVADO_1]");

    await setStorage(context, { settings: { sites: { chatgpt: false, claude: true } } });
    await page.locator(CHATGPT.editor).click();
    await paste(page, CHATGPT.editor, ` y NIF ${NIF}`);
    await expect.poll(() => editorText(page, CHATGPT.editor)).toBe(`Informe del [PRIVADO_1] y NIF ${NIF}`);
    await expect(notice(page)).toHaveCount(0);
  });

  test("el popup cuenta los datos evitados esta semana, por tipo", async ({ page, context }) => {
    await open(page, CHATGPT);
    await paste(page, CHATGPT.editor, `Cédula ${CEDULA}, NIF ${NIF}, correo a@b.co`);
    await notice(page).getByRole("button", { name: "Tapar todo" }).click();
    await expect.poll(() => editorText(page, CHATGPT.editor)).toContain("[EMAIL_1]");

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
    await expect(popup.getByText("Esta semana VeloPrompt evitó 3 datos sensibles")).toBeVisible();
    await expect(popup.locator(".breakdown")).toContainText("Cédula");
    await expect(popup.locator(".breakdown")).toContainText("DNI/NIF");
    await expect(popup.getByRole("link", { name: /¿Lo quieres para todo tu equipo\?/ })).toHaveAttribute("href", "https://zaisor.io/veloprompt");
    await popup.close();
  });
});

test.describe("Claude (página de prueba)", () => {
  test("pegar con cédula y NIF, enviar con el botón y restaurar la respuesta", async ({ page }) => {
    await open(page, CLAUDE);
    await paste(page, CLAUDE.editor, `Mi cédula es ${CEDULA}\ny mi NIF ${NIF}`);
    await notice(page).getByRole("button", { name: "Tapar todo" }).click();
    await expect.poll(() => page.evaluate(() => (window as any).__sent.length)).toBe(0);
    await page.locator(CLAUDE.send).click();
    await expect.poll(() => sent(page)).toEqual(["Mi cédula es [CEDULA_1]\ny mi NIF [NIF_1]"]);
    await expect(page).toHaveURL(/\/chat\/conv-prueba-2$/);

    await reply(page, "Anotado: [CEDULA_1] y [NIF_1].");
    await expect(page.locator(CLAUDE.response)).toHaveText(`Anotado: ${CEDULA} y ${NIF}.`);
    await expect(page.locator(".vp-copy")).toHaveCount(1);
    // El mensaje del usuario (enviado con etiquetas) no se restaura: es lo que vio la IA.
    await expect(page.getByTestId("user-message")).toContainText("[CEDULA_1]");
  });

  test("Enter con datos escritos a mano", async ({ page }) => {
    await open(page, CLAUDE);
    await page.locator(CLAUDE.editor).click();
    await page.keyboard.type(`clave sk-ant-api03-${"Q".repeat(32)} y contraseña: Hunter2!`);
    await page.keyboard.press("Enter");
    await notice(page).getByRole("button", { name: "Tapar todo" }).click();
    await expect.poll(() => sent(page)).toEqual(["clave [CLAVE_API_1] y contraseña: [CONTRASENA_1]"]);
  });
});
