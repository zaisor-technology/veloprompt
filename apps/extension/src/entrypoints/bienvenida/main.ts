import { browser } from "wxt/browser";
import { createSession, detect, applyRedaction } from "veloprompt-core";
import "../../ui/panel.css";
import "./bienvenida.css";
import { h } from "../../ui/controls";
import { findingName } from "../../lib/labels";
import { PRIVACY_URL, REPO_URL, REVIEWS_URL, WEB_URL } from "../../lib/links";
import { toDetectOptions } from "../../lib/settings";
import { SITES } from "../../lib/sites";
import { loadSettings } from "../../lib/storage";

const SAMPLE =
  "Hola, redacta una carta para el banco. Soy Ana Torres, cédula 1710034065, NIF 12345678Z, " +
  "correo ana.torres@example.com y mi cuenta es ES91 2100 0418 4502 0005 1332.";

const app = document.getElementById("app")!;
const link = (text: string, href: string) => h("a", { href, target: "_blank", rel: "noopener" }, text);

function step(n: number, title: string, text: string): HTMLElement {
  return h("div", { className: "step" }, h("b", {}, String(n)), h("h3", {}, title), h("p", {}, text));
}

async function main(): Promise<void> {
  const settings = await loadSettings();
  const options = toDetectOptions(settings);

  const area = h("textarea", { value: SAMPLE, spellcheck: false });
  area.setAttribute("aria-label", "Texto de prueba");
  const result = h("div", { className: "result", ariaLive: "polite" });
  const veiled = h("div", { className: "veiled" });

  const render = (): void => {
    const text = area.value;
    const findings = detect(text, options);
    result.replaceChildren();
    let cursor = 0;
    for (const f of findings) {
      result.append(text.slice(cursor, f.start), h("mark", {}, f.value, h("small", {}, findingName(f))));
      cursor = f.end;
    }
    result.append(text.slice(cursor));
    veiled.textContent = findings.length
      ? `Lo que vería la IA: ${applyRedaction(text, findings, createSession())}`
      : "No hay datos sensibles en este texto.";
  };
  area.addEventListener("input", render);
  render();

  const settingsButton = h("button", { type: "button" }, "Ajustes: países, tipos y términos propios");
  settingsButton.addEventListener("click", () => void browser.runtime.openOptionsPage());

  app.replaceChildren(
    h(
      "header",
      { className: "hero" },
      h("img", { src: "/icon/128.png", alt: "" }),
      h("div", {}, h("h1", {}, "VeloPrompt ya está protegiendo tus chats"), h("p", {}, "Ponle un velo a tus datos antes de enviarlos a la IA. Todo ocurre en tu navegador.")),
    ),
    h(
      "div",
      { className: "steps" },
      step(1, "Pega o escribe como siempre", "En tu chat de IA de siempre. No tienes que cambiar nada."),
      step(2, "Si hay datos sensibles, te avisa", "Pulsa «Tapar todo» y se cambian por etiquetas como [CEDULA_1]."),
      step(3, "Tú ves tus datos en la respuesta", "La IA trabaja con las etiquetas; en tu pantalla vuelven los datos reales."),
    ),
    h(
      "section",
      { className: "demo" },
      h("h2", {}, "Pruébalo aquí"),
      h("p", { className: "muted" }, "Cambia el texto como quieras. Nada sale de esta página."),
      area,
      result,
      veiled,
    ),
    h("h2", {}, "Ábrelo en tu chat de IA"),
    h("div", { className: "sites" }, ...SITES.map((s) => link(s.name, `https://${s.hosts[0]}/${s.id === "m365" ? "chat" : ""}`))),
    h(
      "p",
      { className: "tip" },
      "Consejo: fija VeloPrompt en la barra de Chrome. Pulsa el icono de la pieza de puzle, arriba a la derecha, y luego la chincheta junto a VeloPrompt.",
    ),
    h(
      "div",
      { className: "links" },
      settingsButton,
      link("¿Te es útil? Valórala en la Chrome Web Store", REVIEWS_URL),
      link("Código en GitHub", REPO_URL),
      link("Privacidad", PRIVACY_URL),
      link("zaisor.io/veloprompt", WEB_URL),
    ),
  );
}

void main();
