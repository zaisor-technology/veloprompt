// Genera public/icon/{16,32,48,128}.png a partir de scripts/icon.svg con Chromium (Playwright).
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const svg = readFileSync(new URL("./icon.svg", import.meta.url), "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  await page.screenshot({ path: new URL(`../public/icon/${size}.png`, import.meta.url).pathname, omitBackground: true });
}
await browser.close();
console.log("Iconos generados");
