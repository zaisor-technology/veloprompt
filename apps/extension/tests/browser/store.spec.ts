import { chromium, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EXTENSION_ID, expect, notice, paste, test } from "./fixtures";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Imágenes de la Chrome Web Store (pnpm store:images): 5 capturas 1280×800, mosaico 440×280 y
// marquesina 1400×560. Datos SINTÉTICOS.

const OUT = resolve(import.meta.dirname, "../../../../store/imagenes");
const RAW = resolve(import.meta.dirname, "../../test-results/tienda");
const ICON = readFileSync(resolve(import.meta.dirname, "../../public/icon/128.png")).toString("base64");
const TEXT =
  "Redacta un correo para el banco. Soy Ana Torres, cédula 1710034065, NIF 12345678Z, " +
  "escríbeme a ana.torres@example.com o al +593 99 123 4567. Mi cuenta es ES91 2100 0418 4502 0005 1332.";

const png = (path: string): string => `data:image/png;base64,${readFileSync(path).toString("base64")}`;

const CSS = `
* { box-sizing: border-box; margin: 0; }
body { width: var(--w); height: var(--h); overflow: hidden; font-family: -apple-system, "SF Pro Display", "Segoe UI", system-ui, sans-serif;
  background: radial-gradient(1200px 600px at 10% -10%, #efeaff 0%, transparent 60%), radial-gradient(900px 500px at 110% 120%, #e6f0ff 0%, transparent 55%), #f8f7fc;
  color: #1d1b26; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 18px; color: #4527d9; }
.brand img { width: 30px; height: 30px; }
h1 { font-size: 40px; line-height: 1.12; letter-spacing: -.02em; font-weight: 750; }
p.sub { font-size: 19px; line-height: 1.45; color: #5d5a6e; }
.frame { border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 30px 60px -20px rgba(40,20,120,.35), 0 0 0 1px rgba(40,20,120,.08); }
.bar { height: 30px; background: #f1f0f5; display: flex; align-items: center; gap: 7px; padding: 0 12px; }
.bar i { width: 11px; height: 11px; border-radius: 50%; background: #d9d6e3; display: block; }
.frame img.shot { display: block; width: 100%; }
`;

async function compose(page: Page, file: string, w: number, h: number, body: string): Promise<void> {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<style>:root{--w:${w}px;--h:${h}px}${CSS}</style>${body}`);
  await page.waitForLoadState("load");
  await page.screenshot({ path: `${OUT}/${file}` });
}

function slide(headline: string, sub: string, shots: string[], widths: number[] = [1040]): string {
  return `<div style="padding:44px 64px 0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;height:100%">
    <div class="brand"><img src="data:image/png;base64,${ICON}">VeloPrompt</div>
    <h1>${headline}</h1><p class="sub">${sub}</p>
    <div style="display:flex;gap:28px;align-items:flex-start;margin-top:14px">
      ${shots.map((s, i) => `<div class="frame" style="width:${widths[i] ?? 1040}px"><div class="bar"><i></i><i></i><i></i></div><img class="shot" src="${s}"></div>`).join("")}
    </div></div>`;
}

test("imágenes de la Chrome Web Store", async ({ page, context }) => {
  test.setTimeout(120_000);
  // Ventana baja: el aviso y la caja del mensaje llenan la captura.
  await page.setViewportSize({ width: 1000, height: 430 });
  await page.goto("/chatgpt.html");
  await expect(page.locator("#veloprompt-style")).toHaveCount(1);

  await paste(page, "#prompt-textarea", TEXT);
  await expect(notice(page)).toBeVisible();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${RAW}/1.png` });

  await notice(page).getByRole("button", { name: "Elegir" }).click();
  await notice(page).getByRole("checkbox").nth(3).uncheck();
  await page.screenshot({ path: `${RAW}/2.png` });
  await notice(page).getByRole("button", { name: "Volver" }).click();
  await notice(page).getByRole("button", { name: "Tapar todo" }).click();
  await expect.poll(() => page.locator("#prompt-textarea").innerText()).toContain("[CEDULA_1]");
  await page.keyboard.press("Enter");
  await page.locator("#prompt-textarea").click();
  await page.keyboard.type("Hazlo formal y breve, por favor.");
  await page.setViewportSize({ width: 1000, height: 330 });
  await page.screenshot({ path: `${RAW}/3.png` });
  await page.setViewportSize({ width: 1000, height: 430 });

  await page.evaluate(() => {
    const ed = document.querySelector<HTMLElement>("#prompt-textarea")!;
    ed.blur();
  });
  await page.evaluate(() =>
    (window as any).__reply(
      "Estimados señores: les escribe Ana Torres, con cédula [CEDULA_1] y NIF [NIF_1]. Pueden contactarme en [EMAIL_1] o en el [TELEFONO_1]. Les ruego confirmen la transferencia a la cuenta [IBAN_1]. Atentamente, Ana Torres.",
    ),
  );
  await expect(page.locator(".vp-restored")).toHaveCount(5);
  await page.screenshot({ path: `${RAW}/4.png` });

  const popup = await context.newPage();
  await popup.setViewportSize({ width: 360, height: 600 });
  await popup.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
  await expect(popup.getByText(/evitó 5 datos/)).toBeVisible();
  await popup.screenshot({ path: `${RAW}/popup.png` });
  await popup.setViewportSize({ width: 640, height: 600 });
  await popup.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
  await popup.locator("#terms").fill("Proyecto Fénix\nAcme Corp");
  // Desde "Tipos de dato" hasta el botón de guardar términos.
  // boundingBox es relativo a la ventana (ya desplazada); el recorte de fullPage, a la página.
  const scroll = await popup.evaluate(() => window.scrollY);
  const top = (await popup.getByRole("heading", { name: "Tipos de dato" }).boundingBox())!.y + scroll - 18;
  const save = (await popup.getByRole("button", { name: "Guardar términos" }).boundingBox())!;
  const height = save.y + scroll + save.height + 20 - top;
  await popup.screenshot({ path: `${RAW}/ajustes.png`, fullPage: true, clip: { x: 0, y: top, width: 640, height } });

  // Composición a 1×: tamaños exactos que pide la tienda.
  const browser = await chromium.launch();
  const c = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage();
  await compose(c, "1-detecta.png", 1280, 800, slide(
    "Detecta tus datos sensibles antes de que lleguen a la IA",
    "Cédulas, DNI, NIF, RUT, CURP, IBAN, tarjetas, emails, teléfonos, claves de API… de 7 países.",
    [png(`${RAW}/1.png`)], [1000]));
  await compose(c, "2-elige.png", 1280, 800, slide(
    "Tú decides qué tapar",
    "Tapa todo con un clic o elige dato a dato. También revisa lo que escribes a mano al pulsar Enter.",
    [png(`${RAW}/2.png`)], [1000]));
  await compose(c, "3-etiquetas.png", 1280, 800, slide(
    "La IA solo ve etiquetas",
    "[CEDULA_1], [NIF_1], [EMAIL_1]… en lugar de tus datos reales. El mismo dato, la misma etiqueta.",
    [png(`${RAW}/3.png`)], [1000]));
  await compose(c, "4-restaura.png", 1280, 800, slide(
    "Tus datos vuelven en la respuesta, solo en tu pantalla",
    "Subrayados y listos para copiar. La IA nunca los vio.",
    [png(`${RAW}/4.png`)], [1000]));
  await compose(c, "5-local.png", 1280, 800, slide(
    "100 % local. Sin servidor, sin cuentas, sin rastreo",
    "Funciona en los chats de IA más usados. Tú eliges países, tipos de dato y palabras propias.",
    [png(`${RAW}/popup.png`), png(`${RAW}/ajustes.png`)], [300, 540]));

  await compose(c, "mosaico-440x280.png", 440, 280, `
    <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;text-align:center;padding:0 28px;
      background:linear-gradient(135deg,#6d4dff,#4527d9);color:#fff">
      <img src="data:image/png;base64,${ICON}" style="width:72px;height:72px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.25))">
      <div style="font-size:30px;font-weight:750;letter-spacing:-.01em">VeloPrompt</div>
      <div style="font-size:15px;line-height:1.35;opacity:.92">Ponle un velo a tus datos antes de enviarlos a la IA</div>
    </div>`);
  await compose(c, "marquesina-1400x560.png", 1400, 560, `
    <div style="height:100%;display:flex;align-items:center;gap:56px;padding:0 72px;background:linear-gradient(135deg,#6d4dff,#4527d9);color:#fff">
      <div style="flex:1;display:flex;flex-direction:column;gap:18px">
        <div style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:750"><img src="data:image/png;base64,${ICON}" style="width:56px;height:56px">VeloPrompt</div>
        <div style="font-size:46px;line-height:1.1;font-weight:760;letter-spacing:-.02em">Ponle un velo a tus datos antes de enviarlos a la IA</div>
        <div style="font-size:20px;opacity:.9">Gratis y 100 % local. Sin servidor, sin cuentas.</div>
      </div>
      <div class="frame" style="width:640px;flex:none"><div class="bar"><i></i><i></i><i></i></div><img class="shot" src="${png(`${RAW}/1.png`)}"></div>
    </div>`);
  // Logo de la tienda de Edge (1:1, se recomienda 300×300).
  await compose(c, "logo-300x300.png", 300, 300, `
    <div style="height:100%;display:grid;place-items:center;background:transparent">
      <img src="data:image/png;base64,${ICON}" style="width:256px;height:256px">
    </div>`);
  await browser.close();
});
