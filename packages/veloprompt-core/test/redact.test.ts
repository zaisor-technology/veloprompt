import { describe, expect, it } from "vitest";
import { applyRedaction, createSession, detect, redact, restore } from "../src/index.js";
import { ecCedula, esDni } from "./generators.js";

describe("redact / restore", () => {
  it("sustituye por etiquetas estables y numeradas por tipo", () => {
    const a = esDni();
    const b = esDni();
    const { text, map } = redact(`${a} y ${b}; repito ${a}. Correo: ana@example.com`, { countries: ["ES"] });
    expect(text).toBe("[NIF_1] y [NIF_2]; repito [NIF_1]. Correo: [EMAIL_1]");
    expect(map).toEqual({ "[NIF_1]": a, "[NIF_2]": b, "[EMAIL_1]": "ana@example.com" });
  });

  it("el mismo dato con otro formato recibe la misma etiqueta", () => {
    const { text } = redact("12345678Z o 12.345.678-z", { countries: ["ES"] });
    expect(text).toBe("[NIF_1] o [NIF_1]");
  });

  it("restore devuelve el texto original", () => {
    const original = `Cédula ${ecCedula()}, correo luis@example.org, contraseña: x9!Lq`;
    const { text, map } = redact(original, { countries: ["EC"] });
    expect(text).not.toContain("luis@");
    expect(restore(text, map)).toBe(original);
  });

  it("restore deja intactas las etiquetas desconocidas", () => {
    expect(restore("Hola [NIF_9] y [EMAIL_1]", { "[EMAIL_1]": "a@b.co" })).toBe("Hola [NIF_9] y a@b.co");
  });

  it("una sesión conserva etiquetas entre mensajes de la misma conversación", () => {
    const session = createSession();
    const c = ecCedula();
    const first = redact(`Soy ${c}`, { session, countries: ["EC"] });
    const second = redact(`Mi correo es x@y.com y mi cédula ${c}`, { session, countries: ["EC"] });
    expect(first.text).toBe("Soy [CEDULA_1]");
    expect(second.text).toBe("Mi correo es [EMAIL_1] y mi cédula [CEDULA_1]");
    expect(second.map).toEqual({ "[CEDULA_1]": c, "[EMAIL_1]": "x@y.com" });
    expect(restore("La IA dice: [CEDULA_1] / [EMAIL_1]", session.map)).toBe(`La IA dice: ${c} / x@y.com`);
  });

  it("sin sesión, cada llamada empieza de cero", () => {
    expect(redact("a@b.co").text).toBe("[EMAIL_1]");
    expect(redact("c@d.co").text).toBe("[EMAIL_1]");
  });

  it("texto vacío o sin datos", () => {
    expect(redact("")).toEqual({ text: "", map: {}, findings: [] });
    expect(redact("hola mundo").text).toBe("hola mundo");
  });

  it("applyRedaction tapa solo los hallazgos elegidos", () => {
    const text = "DNI 12345678Z y correo a@b.co";
    const session = createSession();
    const chosen = detect(text).filter((f) => f.type === "EMAIL");
    expect(applyRedaction(text, chosen, session)).toBe("DNI 12345678Z y correo [EMAIL_1]");
    expect(session.map).toEqual({ "[EMAIL_1]": "a@b.co" });
  });
});
