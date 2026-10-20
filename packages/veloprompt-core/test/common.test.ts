import { describe, expect, it } from "vitest";
import { detect } from "../src/index.js";
import { breakLast, card, groupBy4, iban } from "./generators.js";
import { N, none, only } from "./helpers.js";

describe("email", () => {
  it("detecta direcciones habituales", () => {
    for (const e of ["ana.perez@example.com", "j+tag@sub.dominio.com.ec", "X_Y-1@empresa.io"]) {
      expect(only(`escríbeme a ${e}, gracias`)).toMatchObject({ type: "EMAIL", country: "GLOBAL", value: e });
    }
  });

  it("no confunde menciones o textos con arroba", () => {
    expect(none("sígueme en @zaisor y usa 10@ por ciento")).toEqual([]);
  });
});

describe("teléfonos", () => {
  it("E.164 con país según prefijo", () => {
    expect(only("Llámame al +593 99 123 4567")).toMatchObject({ type: "TELEFONO", country: "EC" });
    expect(only("+34 612 345 678").country).toBe("ES");
    expect(only("+52 55 1234 5678").country).toBe("MX");
    expect(only("+56 9 1234 5678").country).toBe("CL");
    expect(only("+57 300 123 4567").country).toBe("CO");
    expect(only("+51 987 654 321").country).toBe("PE");
    expect(only("+54 9 11 1234-5678").country).toBe("AR");
    expect(only("+1 415 555 0100").country).toBe("GLOBAL");
  });

  it("formatos locales", () => {
    expect(only("mi cel 0991234567", { countries: ["EC"] })).toMatchObject({ type: "TELEFONO", country: "EC" });
    expect(only("escríbeme al 099 123 4567", { countries: ["EC"] }).country).toBe("EC");
    expect(only("móvil 612345678", { countries: ["ES"] }).value).toBe("612345678");
    expect(only("llama al 612 34 56 78", { countries: ["ES"] }).value).toBe("612 34 56 78");
    expect(only("teléfono 55 1234 5678", { countries: ["MX"] }).country).toBe("MX");
    expect(only("whatsapp 9 8765 4321", { countries: ["CL"] }).country).toBe("CL");
    expect(only("celular 300 123 4567", { countries: ["CO"] }).country).toBe("CO");
    expect(only("celular 987 654 321", { countries: ["PE"] }).country).toBe("PE");
    expect(only("tel 11 15 4567-8901", { countries: ["AR"] }).country).toBe("AR");
  });

  it("un número local sin formato ni contexto no se marca", () => {
    expect(none("hay 612345678 registros", { countries: ["ES"] })).toEqual([]);
    expect(none("total 5512345678", { countries: ["MX"] })).toEqual([]);
  });
});

describe("tarjetas (Luhn)", () => {
  it("detecta Visa, Mastercard y Amex con o sin separadores", () => {
    for (let i = 0; i < N; i++) {
      const visa = card("4");
      const mc = card("51");
      const amex = card("37", 15);
      expect(only(`tarjeta ${visa}`)).toMatchObject({ type: "TARJETA", value: visa });
      expect(only(`pago con ${groupBy4(mc)}`).value).toBe(groupBy4(mc));
      expect(only(`amex ${amex}`).value).toBe(amex);
    }
    expect(only("4111-1111-1111-1111").type).toBe("TARJETA");
  });

  it("rechaza Luhn erróneo y prefijos que no son de tarjeta", () => {
    for (let i = 0; i < N; i++) expect(none(`tarjeta ${breakLast(card("4"))}`)).toEqual([]);
    expect(none("código 1234567812345670")).toEqual([]);
  });
});

describe("IBAN genérico (mod 97)", () => {
  it("detecta IBAN de otros países y recorta texto en mayúsculas pegado", () => {
    for (let i = 0; i < N; i++) {
      const de = iban("DE", 18);
      const fr = iban("FR", 23);
      expect(only(`IBAN ${de}`)).toMatchObject({ type: "IBAN", country: "GLOBAL", value: de });
      expect(only(`cuenta ${groupBy4(fr)}`).value).toBe(groupBy4(fr));
    }
    const de = groupBy4(iban("DE", 18));
    expect(only(`IBAN ${de} OK`).value).toBe(de);
  });

  it("rechaza IBAN con control erróneo", () => {
    const de = iban("DE", 18);
    const bad = de.slice(0, 4) + breakLast(de.slice(4));
    expect(none(`IBAN ${bad}`)).toEqual([]);
  });
});

describe("claves de API", () => {
  const keys = [
    "sk-" + "a1B2c3D4e5F6g7H8i9J0k1L2m3N4",
    "sk-proj-" + "Zx9_Yw8-Vu7Ts6Rq5Po4Nm3Lk2",
    "sk-ant-api03-" + "AbCdEfGhIjKlMnOpQrStUvWxYz0123",
    "AKIA" + "ABCDEFGHIJKLMNOP",
    "ghp_" + "a".repeat(36),
    "github_pat_" + "11ABCDEFG0123456789_abcdefghijk",
    "xoxb-" + "123456789012-abcdefABCDEF",
  ];
  it.each(keys)("detecta %s", (k) => {
    expect(only(`usa la clave ${k} en el header`)).toMatchObject({ type: "CLAVE_API", value: k });
  });

  it("no marca palabras que empiezan igual", () => {
    expect(none("sk-short, AKIA123, ghp_corto, xoxo")).toEqual([]);
  });
});

describe("contraseñas", () => {
  it("tapa solo el valor tras 'contraseña:' o 'password='", () => {
    expect(only("usuario: ana, contraseña: S3cr3t!2024")).toMatchObject({
      type: "CONTRASENA",
      value: "S3cr3t!2024",
    });
    expect(only("PASSWORD=hunter2").value).toBe("hunter2");
    expect(only('password: "con espacios 1"').value).toBe('"con espacios 1"');
  });

  it("no marca la palabra sin valor", () => {
    expect(none("olvidé mi contraseña ayer")).toEqual([]);
  });
});

describe("términos propios (customTerms)", () => {
  it("se tapan siempre, sin distinguir mayúsculas y respetando palabras completas", () => {
    const found = detect("Proyecto Fénix con ACME y acme; fenixes no", { customTerms: ["proyecto fénix", "Acme"] });
    expect(found.map((f) => f.value)).toEqual(["Proyecto Fénix", "ACME", "acme"]);
    expect(found.every((f) => f.type === "PRIVADO" && f.confidence === 1)).toBe(true);
  });

  it("escapa caracteres especiales y ignora términos vacíos", () => {
    expect(only("el cliente C++ (beta) pagó", { customTerms: ["C++ (beta)", "  "] }).value).toBe("C++ (beta)");
  });
});
