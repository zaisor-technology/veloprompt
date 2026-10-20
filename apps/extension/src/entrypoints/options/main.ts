import "../../ui/panel.css";
import "./options.css";
import { countriesSection, h, sitesSection, statsSection, teamLink, typesSection } from "../../ui/controls";
import { parseTerms, type Settings } from "../../lib/settings";
import { loadSettings, loadStats, resetStats, saveSettings, watchStats } from "../../lib/storage";
import type { WeeklyStats } from "../../lib/stats";

const app = document.getElementById("app")!;
let settings: Settings;
let stats: WeeklyStats;

function termsSection(): HTMLElement {
  const area = h("textarea", { id: "terms", value: settings.customTerms.join("\n"), spellcheck: false });
  area.setAttribute("aria-describedby", "terms-help");
  area.placeholder = "Proyecto Fénix\nAcme Corp\nMaría López";
  const saved = h("span", { className: "saved", hidden: true }, "Guardado");
  const save = h("button", { type: "button", className: "primary" }, "Guardar términos");
  save.addEventListener("click", async () => {
    settings = { ...settings, customTerms: parseTerms(area.value) };
    await saveSettings(settings);
    area.value = settings.customTerms.join("\n");
    saved.hidden = false;
    setTimeout(() => (saved.hidden = true), 1500);
  });
  return h(
    "section",
    {},
    h("h2", {}, "Términos propios"),
    h(
      "p",
      { className: "muted", id: "terms-help" },
      "Uno por línea. Se tapan siempre como [PRIVADO_n]: nombres de clientes, proyectos, personas… Se guardan solo en este navegador.",
    ),
    area,
    h("div", { className: "row" }, h("div", {}, save, saved)),
  );
}

function render(): void {
  const update = (s: Settings): void => {
    settings = s;
    void saveSettings(s);
    render();
  };
  const reset = h("button", { type: "button" }, "Poner el contador a cero");
  reset.addEventListener("click", () => void resetStats());
  const stat = statsSection(stats);
  stat.append(reset);
  app.replaceChildren(
    h(
      "header",
      { className: "brand" },
      h("img", { src: "/icon/48.png", alt: "" }),
      h("div", {}, h("h1", {}, "Ajustes de VeloPrompt"), h("p", { className: "tagline" }, "Todo se guarda solo en este navegador.")),
    ),
    sitesSection(settings, update),
    countriesSection(settings, update),
    typesSection(settings, update),
    termsSection(),
    stat,
    h("section", {}, teamLink()),
  );
}

async function main(): Promise<void> {
  [settings, stats] = await Promise.all([loadSettings(), loadStats()]);
  render();
  watchStats((s) => {
    stats = s;
    render();
  });
}

void main();
