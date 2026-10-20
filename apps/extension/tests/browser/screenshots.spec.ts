import { EXTENSION_ID, expect, notice, paste, test } from "./fixtures";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Genera las capturas de docs/capturas con datos SINTÉTICOS (pnpm screenshots).

const OUT = "docs/capturas";
const EDITOR = "#prompt-textarea";
const TEXT =
  "Redacta un correo para el banco. Soy Ana Torres, cédula 1710034065, NIF 12345678Z, " +
  "escríbeme a ana.torres@example.com o al +593 99 123 4567. Mi cuenta es ES91 2100 0418 4502 0005 1332.";

test("capturas del aviso, la respuesta restaurada, el popup y los ajustes", async ({ page, context }) => {
  await page.goto("/chatgpt.html");
  await expect(page.locator("#veloprompt-style")).toHaveCount(1);

  await paste(page, EDITOR, TEXT);
  await expect(notice(page)).toBeVisible();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/aviso-al-pegar.png` });

  await notice(page).getByRole("button", { name: "Elegir" }).click();
  await notice(page).getByRole("checkbox").nth(3).uncheck();
  await page.screenshot({ path: `${OUT}/aviso-elegir.png` });
  await notice(page).getByRole("button", { name: "Volver" }).click();
  await notice(page).getByRole("button", { name: "Tapar todo" }).click();
  await expect.poll(() => page.locator(EDITOR).innerText()).toContain("[CEDULA_1]");
  await page.screenshot({ path: `${OUT}/editor-tapado.png` });

  await page.keyboard.press("Enter");
  await page.evaluate(() =>
    (window as any).__reply(
      "Aquí tienes el borrador:\n\nEstimados señores: les escribe Ana Torres, con cédula [CEDULA_1] y NIF [NIF_1]. Pueden contactarme en [EMAIL_1] o en el [TELEFONO_1]. Les ruego confirmen la transferencia a la cuenta [IBAN_1].",
    ),
  );
  await expect(page.locator(".vp-restored")).toHaveCount(5);
  await page.locator(".vp-restored").first().hover();
  await page.screenshot({ path: `${OUT}/respuesta-restaurada.png` });

  const popup = await context.newPage();
  await popup.setViewportSize({ width: 360, height: 640 });
  await popup.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
  await expect(popup.getByText(/evitó 5 datos/)).toBeVisible();
  await popup.screenshot({ path: `${OUT}/popup.png`, fullPage: true });

  await popup.setViewportSize({ width: 820, height: 900 });
  await popup.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
  await popup.locator("#terms").fill("Proyecto Fénix\nAcme Corp");
  await popup.screenshot({ path: `${OUT}/ajustes.png`, fullPage: true });
});
