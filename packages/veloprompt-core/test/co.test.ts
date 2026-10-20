import { describe, expect, it } from "vitest";
import { breakLast, coNit, randDigits } from "./generators.js";
import { N, none, only } from "./helpers.js";

const CO = { countries: ["CO"] } as const;

describe("Colombia · NIT", () => {
  it("detecta NIT con dígito de verificación, con y sin puntos", () => {
    for (let i = 0; i < N; i++) {
      const n = coNit();
      expect(only(`NIT ${n.dotted}`, CO)).toMatchObject({ type: "NIT", country: "CO", value: n.dotted });
      expect(only(`proveedor ${n.plain}`, CO).value).toBe(n.plain);
    }
  });

  it("rechaza dígito de verificación erróneo", () => {
    for (let i = 0; i < N; i++) expect(none(`NIT ${breakLast(coNit().plain)}`, CO)).toEqual([]);
  });
});

describe("Colombia · cédula de ciudadanía (sin validador)", () => {
  it("solo se detecta con contexto (C.C., cédula)", () => {
    const n = `1${randDigits(9)}`;
    expect(only(`C.C. ${n}`, CO)).toMatchObject({ type: "CEDULA", country: "CO", value: n });
    expect(only(`cédula de ciudadanía 52.123.456`, CO).value).toBe("52.123.456");
    expect(only(`identificado con cc ${n}`, CO).value).toBe(n);
  });

  it("sin contexto no se detecta", () => {
    expect(none(`El lote ${randDigits(10)} llegó`, CO)).toEqual([]);
    expect(none(`Son 52.123.456 visitas`, CO)).toEqual([]);
  });
});
