import { browser } from "wxt/browser";
import "../../ui/panel.css";
import "./popup.css";
import { countriesSection, h, sitesSection, statsSection, teamLink } from "../../ui/controls";
import type { Settings, SiteId } from "../../lib/settings";
import { siteForHost } from "../../lib/sites";
import { loadSettings, loadStats, saveSettings, watchStats } from "../../lib/storage";
import type { WeeklyStats } from "../../lib/stats";

const app = document.getElementById("app")!;

async function currentSite(): Promise<SiteId | null> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const host = tab?.url ? new URL(tab.url).hostname : "";
    return siteForHost(host)?.id ?? null;
  } catch {
    return null;
  }
}

let settings: Settings;
let stats: WeeklyStats;
let site: SiteId | null;

function render(): void {
  const update = (s: Settings): void => {
    settings = s;
    void saveSettings(s);
    render();
  };
  const header = h(
    "header",
    { className: "brand" },
    h("img", { src: "/icon/48.png", alt: "" }),
    h("div", {}, h("h1", {}, "VeloPrompt"), h("p", { className: "tagline" }, "Ponle un velo a tus datos antes de enviarlos a la IA")),
  );
  const more = h("button", { type: "button" }, "Tipos y términos propios…");
  more.addEventListener("click", () => void browser.runtime.openOptionsPage());
  app.replaceChildren(
    header,
    statsSection(stats),
    sitesSection(settings, update, site),
    countriesSection(settings, update),
    h("section", { className: "footer" }, more, teamLink()),
  );
}

async function main(): Promise<void> {
  [settings, stats, site] = await Promise.all([loadSettings(), loadStats(), currentSite()]);
  render();
  watchStats((s) => {
    stats = s;
    render();
  });
}

void main();
