import { COUNTRIES, DATA_TYPES, type Country, type DataType } from "veloprompt-core";
import { typeName } from "../lib/labels";
import { SITES, type Settings, type SiteId } from "../lib/settings";
import { total, type WeeklyStats } from "../lib/stats";

export const COUNTRY_NAMES: Record<Country, string> = {
  EC: "Ecuador",
  ES: "España",
  MX: "México",
  CL: "Chile",
  CO: "Colombia",
  PE: "Perú",
  AR: "Argentina",
};

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { dataset?: Record<string, string> } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const { dataset, ...rest } = props;
  const node = Object.assign(document.createElement(tag), rest);
  if (dataset) Object.assign(node.dataset, dataset);
  node.append(...children);
  return node;
}

function toggle(checked: boolean, label: string, onChange: (v: boolean) => void): HTMLLabelElement {
  const input = h("input", { type: "checkbox", checked });
  input.setAttribute("aria-label", label);
  input.addEventListener("change", () => onChange(input.checked));
  return h("label", { className: "switch" }, input, h("span"));
}

export function sitesSection(settings: Settings, onChange: (s: Settings) => void, current?: SiteId | null): HTMLElement {
  const section = h("section", {}, h("h2", {}, "Activo en"));
  for (const site of SITES) {
    const on = settings.sites[site.id];
    const status = h("div", { className: `status${on ? " on" : ""}` }, on ? "Protegiendo" : "En pausa");
    const name = h("div", {}, h("strong", {}, site.name), current === site.id ? " · esta pestaña" : "", status);
    section.append(
      h(
        "div",
        { className: "row" },
        name,
        toggle(on, `${on ? "Pausar" : "Activar"} en ${site.name}`, (v) =>
          onChange({ ...settings, sites: { ...settings.sites, [site.id]: v } }),
        ),
      ),
    );
  }
  section.append(h("p", { className: "muted" }, "Gemini, Copilot, Perplexity y DeepSeek: próximamente."));
  return section;
}

function chips<T extends string>(all: readonly T[], selected: readonly T[], name: (v: T) => string, onChange: (v: T[]) => void): HTMLElement {
  const wrap = h("div", { className: "chips" });
  for (const v of all) {
    const input = h("input", { type: "checkbox", checked: selected.includes(v), value: v });
    input.addEventListener("change", () => {
      const next = all.filter((x) => (x === v ? input.checked : selected.includes(x)));
      onChange(next);
    });
    wrap.append(h("label", { className: "chip" }, input, h("span", {}, name(v))));
  }
  return wrap;
}

export function countriesSection(settings: Settings, onChange: (s: Settings) => void): HTMLElement {
  return h(
    "section",
    {},
    h("h2", {}, "Países"),
    chips(COUNTRIES, settings.countries, (c) => COUNTRY_NAMES[c], (countries) => onChange({ ...settings, countries })),
    h("p", { className: "muted" }, "Email, teléfonos internacionales, tarjetas, IBAN y claves se revisan siempre."),
  );
}

export function typesSection(settings: Settings, onChange: (s: Settings) => void): HTMLElement {
  return h(
    "section",
    {},
    h("h2", {}, "Tipos de dato"),
    chips(DATA_TYPES, settings.types, typeName, (types: DataType[]) => onChange({ ...settings, types })),
  );
}

export function statsSection(stats: WeeklyStats): HTMLElement {
  const n = total(stats);
  const section = h(
    "section",
    { id: "stats" },
    h(
      "div",
      { className: "counter" },
      h("strong", { dataset: { testid: "total" } }, String(n)),
      h("p", {}, `Esta semana VeloPrompt evitó ${n} ${n === 1 ? "dato sensible" : "datos sensibles"}`),
    ),
  );
  const entries = Object.entries(stats.byType).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  if (entries.length) {
    section.append(
      h("ul", { className: "breakdown" }, ...entries.map(([t, c]) => h("li", {}, h("span", {}, typeName(t as DataType)), h("span", {}, String(c))))),
    );
  }
  section.append(h("p", { className: "muted" }, "Contado solo en este navegador. No se envía a ningún sitio."));
  return section;
}

export function teamLink(): HTMLElement {
  return h(
    "a",
    { className: "team", href: "https://zaisor.io/veloprompt", target: "_blank", rel: "noopener" },
    h("strong", {}, "¿Lo quieres para todo tu equipo? "),
    "zaisor.io/veloprompt",
  );
}
