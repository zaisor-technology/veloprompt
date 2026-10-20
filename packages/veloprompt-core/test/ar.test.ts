import { describe, expect, it } from "vitest";
import { arCbu, arCuit } from "./generators.js";
import { N, none, only } from "./helpers.js";

const AR = { countries: ["AR"] } as const;

describe("Argentina · CUIT/CUIL", () => {
  it("detecta CUIT/CUIL compactos y con guiones", () => {
    for (let i = 0; i < N; i++) {
      const c = arCuit(i % 3 === 0 ? "20" : i % 3 === 1 ? "27" : "30");
      const dashed = `${c.slice(0, 2)}-${c.slice(2, 10)}-${c[10]}`;
      expect(only(`CUIT ${c}`, AR)).toMatchObject({ type: "CUIT", country: "AR", value: c });
      expect(only(`CUIL ${dashed}`, AR).value).toBe(dashed);
    }
  });

  it("rechaza verificador erróneo", () => {
    for (let i = 0; i < N; i++) {
      const c = arCuit();
      expect(none(`CUIT ${c.slice(0, 10)}${(Number(c[10]) + 1) % 10}`, AR)).toEqual([]);
    }
  });
});

describe("Argentina · CBU", () => {
  it("detecta CBU con ambos verificadores", () => {
    for (let i = 0; i < N; i++) {
      const c = arCbu();
      expect(only(`CBU ${c}`, AR)).toMatchObject({ type: "CBU", value: c });
    }
  });

  it("rechaza si falla cualquiera de los dos bloques", () => {
    for (let i = 0; i < N; i++) {
      const c = arCbu();
      const bad1 = c.slice(0, 7) + ((Number(c[7]) + 1) % 10) + c.slice(8);
      const bad2 = c.slice(0, 21) + ((Number(c[21]) + 1) % 10);
      expect(none(`CBU ${bad1}`, AR)).toEqual([]);
      expect(none(`CBU ${bad2}`, AR)).toEqual([]);
    }
  });
});

describe("Argentina · DNI (sin validador)", () => {
  it("solo con contexto", () => {
    expect(only("DNI 30.123.456", AR)).toMatchObject({ type: "DNI", country: "AR", value: "30.123.456" });
    expect(only("D.N.I. 7123456", AR).value).toBe("7123456");
    expect(none("Somos 30.123.456 habitantes", AR)).toEqual([]);
  });
});
