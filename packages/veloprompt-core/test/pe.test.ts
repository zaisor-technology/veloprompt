import { describe, expect, it } from "vitest";
import { peRuc } from "./generators.js";
import { N, none, only } from "./helpers.js";

const PE = { countries: ["PE"] } as const;

describe("Perú · RUC", () => {
  it("detecta RUC de persona (10) y empresa (20)", () => {
    for (let i = 0; i < N; i++) {
      const a = peRuc("10");
      const b = peRuc("20");
      expect(only(`RUC ${a}`, PE)).toMatchObject({ type: "RUC", country: "PE", value: a });
      expect(only(`RUC ${b}`, PE).value).toBe(b);
    }
  });

  it("rechaza dígito verificador erróneo", () => {
    for (let i = 0; i < N; i++) {
      const r = peRuc();
      const bad = r.slice(0, 10) + ((Number(r[10]) + 1) % 10);
      expect(none(`RUC ${bad}`, PE)).toEqual([]);
    }
  });
});

describe("Perú · DNI (sin validador)", () => {
  it("solo se detecta con 'DNI' cerca", () => {
    expect(only("Mi DNI es 45678912", PE)).toMatchObject({ type: "DNI", country: "PE", value: "45678912" });
    expect(only("documento de identidad: 07654321", PE).value).toBe("07654321");
  });

  it("sin contexto, un número de 8 dígitos no es un dato", () => {
    expect(none("Llegaron 45678912 visitas", PE)).toEqual([]);
    expect(none("fecha 20261020", PE)).toEqual([]);
  });
});
