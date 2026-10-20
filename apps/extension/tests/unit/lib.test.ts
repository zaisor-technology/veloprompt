import { createSession, detect } from "veloprompt-core";
import { describe, expect, it } from "vitest";
import { findingName, typeName } from "../../src/lib/labels";
import { buildPreview } from "../../src/lib/preview";
import { ConversationSessions } from "../../src/lib/sessions";
import { DEFAULT_SETTINGS, parseTerms, sanitizeSettings, toDetectOptions } from "../../src/lib/settings";
import { MATCHES, siteForHost } from "../../src/lib/sites";
import { addToStats, currentWeek, isoWeek, total } from "../../src/lib/stats";

describe("semana ISO", () => {
  it.each([
    ["2026-10-19", "2026-W43"], // lunes
    ["2026-10-25", "2026-W43"], // domingo
    ["2026-10-26", "2026-W44"],
    ["2021-01-03", "2020-W53"], // el 3 de enero de 2021 aún es la semana 53 de 2020
    ["2024-12-30", "2025-W01"],
  ])("%s → %s", (date, week) => {
    const [y, m, d] = date.split("-").map(Number);
    expect(isoWeek(new Date(y!, m! - 1, d!))).toBe(week);
  });
});

describe("estadísticas semanales", () => {
  const now = new Date(2026, 9, 20);
  it("suma por tipo y reinicia al cambiar de semana", () => {
    let s = currentWeek(undefined, now);
    s = addToStats(s, ["CEDULA", "NIF", "CEDULA"]);
    expect(s.byType).toEqual({ CEDULA: 2, NIF: 1 });
    expect(total(s)).toBe(3);
    expect(currentWeek(s, now)).toBe(s);
    expect(currentWeek(s, new Date(2026, 9, 27))).toEqual({ week: "2026-W44", byType: {} });
  });

  it("ignora datos guardados corruptos", () => {
    expect(currentWeek({ week: "2026-W43", byType: null }, now)).toEqual({ week: "2026-W43", byType: {} });
    expect(currentWeek("basura", now).byType).toEqual({});
  });
});

describe("ajustes", () => {
  it("por defecto: los 7 sitios activos, los 7 países y todos los tipos", () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(Object.values(DEFAULT_SETTINGS.sites).every(Boolean)).toBe(true);
    expect(Object.keys(DEFAULT_SETTINGS.sites)).toHaveLength(7);
    expect(DEFAULT_SETTINGS.countries).toHaveLength(7);
  });

  it("ajustes guardados en la semana 2 (solo ChatGPT y Claude): los sitios nuevos quedan activos", () => {
    const s = sanitizeSettings({ sites: { chatgpt: false, claude: true } });
    expect(s.sites).toEqual({ chatgpt: false, claude: true, gemini: true, copilot: true, m365: true, perplexity: true, deepseek: true });
  });

  it("filtra valores desconocidos y conserva los válidos", () => {
    const s = sanitizeSettings({
      sites: { chatgpt: false, gemini: true },
      countries: ["EC", "XX", "ES"],
      types: ["EMAIL", "NOPE"],
      customTerms: ["  Acme ", "", "Acme", 3],
    });
    expect(s).toEqual({
      sites: { ...DEFAULT_SETTINGS.sites, chatgpt: false },
      countries: ["EC", "ES"],
      types: ["EMAIL"],
      customTerms: ["Acme"],
    });
  });

  it("parseTerms: una línea por término", () => {
    expect(parseTerms("Proyecto Fénix\n\n  Acme \nAcme\n")).toEqual(["Proyecto Fénix", "Acme"]);
  });

  it("toDetectOptions aplica países y términos al motor", () => {
    const opts = toDetectOptions(sanitizeSettings({ countries: ["CL"], customTerms: ["Acme"] }));
    expect(detect("Acme, DNI 12345678Z, RUT 12.345.678-5", opts).map((f) => f.type)).toEqual(["PRIVADO", "RUT"]);
  });
});

describe("vista previa del aviso", () => {
  it("resalta cada dato con contexto y recorta tramos largos", () => {
    const text = `${"a".repeat(100)} DNI 12345678Z ${"b".repeat(100)} correo x@y.co fin`;
    const parts = buildPreview(text, detect(text), 10);
    const rendered = parts.map((p) => (p.finding ? `<${p.text}>` : p.text)).join("");
    expect(rendered).toBe(`…aaaaa DNI <12345678Z> bbbbbbbbb … bb correo <x@y.co> fin`);
  });

  it("texto corto: sin recortes", () => {
    const parts = buildPreview("DNI 12345678Z.", detect("DNI 12345678Z."));
    expect(parts.map((p) => p.text)).toEqual(["DNI ", "12345678Z", "."]);
  });
});

describe("nombres en el aviso", () => {
  it("tipo y país, o 'Dato personal' si es dudoso", () => {
    const [nif] = detect("12345678Z");
    expect(findingName(nif!)).toBe("DNI/NIF (ES)");
    const [email] = detect("a@b.co");
    expect(findingName(email!)).toBe("Email");
    const [dudoso] = detect("cédula/DNI 30.123.456", { countries: ["CO", "AR"] });
    expect(findingName(dudoso!)).toBe("Dato personal");
    expect(typeName("CLAVE_API")).toBe("Clave de API");
  });
});

describe("sesiones por conversación", () => {
  it("chat nuevo → conversación: conserva la sesión; otra conversación: sesión propia", () => {
    let key = "new:/";
    const sessions = new ConversationSessions(() => key);
    const draft = sessions.current();
    draft.labelFor("NIF", "12345678Z");

    key = "c:abc";
    expect(sessions.current()).toBe(draft);
    expect(sessions.current().map).toEqual({ "[NIF_1]": "12345678Z" });

    key = "c:otra";
    const other = sessions.current();
    expect(other).not.toBe(draft);
    expect(other.map).toEqual({});

    key = "c:abc";
    expect(sessions.current()).toBe(draft);

    key = "new:/";
    expect(sessions.current()).not.toBe(draft); // un chat nuevo empieza de cero
  });

  it("las etiquetas son estables dentro de la sesión", () => {
    const s = createSession();
    expect(s.labelFor("CEDULA", "1710034065")).toBe("[CEDULA_1]");
    expect(s.labelFor("CEDULA", "1710034065")).toBe("[CEDULA_1]");
  });
});

describe("sitios y manifiesto", () => {
  it("solo HTTPS y solo los dominios de los chats, sin comodines", () => {
    expect(MATCHES).toEqual([
      "https://chatgpt.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
      "https://copilot.microsoft.com/*",
      "https://m365.cloud.microsoft/*",
      "https://www.microsoft365.com/*",
      "https://www.perplexity.ai/*",
      "https://perplexity.ai/*",
      "https://chat.deepseek.com/*",
    ]);
  });

  it("siteForHost no acepta subdominios ni dominios parecidos", () => {
    expect(siteForHost("gemini.google.com")?.id).toBe("gemini");
    expect(siteForHost("google.com")).toBeNull();
    expect(siteForHost("chatgpt.com.evil.example")).toBeNull();
  });
});
