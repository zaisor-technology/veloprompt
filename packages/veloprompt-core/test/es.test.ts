import { describe, expect, it } from "vitest";
import { breakLast, esCif, esDni, esNie, groupBy4, iban } from "./generators.js";
import { N, none, only } from "./helpers.js";

const ES = { countries: ["ES"] } as const;
const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

describe("España · DNI/NIF", () => {
  it("detecta el ejemplo oficial 12345678Z y DNIs generados", () => {
    expect(only("DNI 12345678Z", ES)).toMatchObject({ type: "NIF", country: "ES", value: "12345678Z" });
    for (let i = 0; i < N; i++) {
      const d = esDni();
      expect(only(`con NIF ${d} firmo`, ES).value).toBe(d);
    }
  });

  it("acepta formatos con puntos, guion y minúscula", () => {
    expect(only("12.345.678-Z", ES).value).toBe("12.345.678-Z");
    expect(only("12345678z", ES).value).toBe("12345678z");
  });

  it("rechaza letra de control errónea", () => {
    for (let i = 0; i < N; i++) expect(none(`NIF ${breakLast(esDni(), DNI_LETTERS)}`, ES)).toEqual([]);
  });
});

describe("España · NIE", () => {
  it("detecta NIE válidos con X, Y y Z", () => {
    for (let i = 0; i < N; i++) {
      const n = esNie();
      expect(only(`NIE ${n}`, ES)).toMatchObject({ type: "NIE", value: n });
    }
    expect(only("X-1234567-L", ES).value).toBe("X-1234567-L");
  });

  it("rechaza letra errónea", () => {
    for (let i = 0; i < N; i++) expect(none(`NIE ${breakLast(esNie(), DNI_LETTERS)}`, ES)).toEqual([]);
  });
});

describe("España · CIF", () => {
  it("detecta CIF con control numérico (A, B) y con letra (P, Q)", () => {
    for (let i = 0; i < N; i++) {
      for (const first of ["A", "B", "P", "Q"]) {
        const c = esCif(first);
        expect(only(`CIF ${c}`, ES)).toMatchObject({ type: "CIF", value: c });
      }
    }
  });

  it("rechaza control erróneo", () => {
    for (let i = 0; i < N; i++) {
      expect(none(`CIF ${breakLast(esCif("B"))}`, ES)).toEqual([]);
      expect(none(`CIF ${breakLast(esCif("Q"), "ABCDEFGHIJ")}`, ES)).toEqual([]);
    }
  });
});

describe("España · IBAN", () => {
  it("detecta el IBAN de ejemplo y generados, compactos o en grupos de 4", () => {
    expect(only("ES91 2100 0418 4502 0005 1332", ES)).toMatchObject({ type: "IBAN", country: "ES" });
    for (let i = 0; i < N; i++) {
      const v = iban("ES", 20);
      expect(only(`IBAN: ${v}`, ES).value).toBe(v);
      expect(only(`IBAN: ${groupBy4(v)}`, ES).value).toBe(groupBy4(v));
    }
  });

  it("rechaza IBAN con dígitos de control erróneos", () => {
    for (let i = 0; i < N; i++) {
      const v = iban("ES", 20);
      const bad = v.slice(0, 2) + String((Number(v.slice(2, 4)) + 1) % 100).padStart(2, "0") + v.slice(4);
      expect(none(`IBAN ${bad}`, ES)).toEqual([]);
    }
  });
});
