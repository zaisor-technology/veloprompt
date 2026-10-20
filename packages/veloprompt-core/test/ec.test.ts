import { describe, expect, it } from "vitest";
import { breakLast, ecCedula, ecRucNatural, ecRucPrivada, ecRucPublica } from "./generators.js";
import { N, none, only } from "./helpers.js";

const EC = { countries: ["EC"] } as const;

describe("Ecuador · cédula", () => {
  it("detecta cédulas válidas (módulo 10)", () => {
    for (let i = 0; i < N; i++) {
      const c = ecCedula();
      const f = only(`Mi número es ${c}.`, EC);
      expect(f).toMatchObject({ type: "CEDULA", country: "EC", value: c });
      expect(f.confidence).toBeGreaterThanOrEqual(0.9);
    }
  });

  it("acepta el formato con guion antes del verificador", () => {
    const c = ecCedula();
    const dashed = `${c.slice(0, 9)}-${c[9]}`;
    expect(only(`cédula ${dashed}`, EC).value).toBe(dashed);
  });

  it("sube la confianza con la palabra 'cédula' cerca", () => {
    const c = ecCedula();
    expect(only(`cédula: ${c}`, EC).confidence).toBeGreaterThan(only(`va ${c}`, EC).confidence);
  });

  it("rechaza dígito verificador erróneo", () => {
    // Solo CEDULA: una cédula de Guayas "095..." con verificador erróneo sigue pareciendo un móvil.
    const opts = { ...EC, types: ["CEDULA"] } as const;
    for (let i = 0; i < N; i++) expect(none(`Mi número es ${breakLast(ecCedula())}`, opts)).toEqual([]);
  });

  it("rechaza provincias imposibles y tercer dígito ≥ 6 de cédula", () => {
    expect(none("2512345678 y 0012345678", EC)).toEqual([]);
    expect(none("1762345678", EC)).toEqual([]);
  });
});

describe("Ecuador · RUC", () => {
  it("detecta RUC de persona natural (cédula + 001)", () => {
    for (let i = 0; i < N; i++) {
      const r = ecRucNatural();
      expect(only(`RUC ${r}`, EC)).toMatchObject({ type: "RUC", country: "EC", value: r });
    }
  });

  it("detecta RUC de sociedad privada (módulo 11) y pública", () => {
    for (let i = 0; i < N; i++) {
      const priv = ecRucPrivada();
      const pub = ecRucPublica();
      expect(only(`empresa ${priv}`, EC).value).toBe(priv);
      expect(only(`entidad ${pub}`, EC).value).toBe(pub);
    }
  });

  it("rechaza RUC con dígito de control erróneo o establecimiento 000", () => {
    for (let i = 0; i < N; i++) {
      const priv = ecRucPrivada();
      const badPriv = priv.slice(0, 9) + ((Number(priv[9]) + 1) % 10) + priv.slice(10);
      expect(none(`empresa ${badPriv}`, EC)).toEqual([]);
      const pub = ecRucPublica();
      const badPub = pub.slice(0, 8) + ((Number(pub[8]) + 1) % 10) + pub.slice(9);
      expect(none(`entidad ${badPub}`, EC)).toEqual([]);
    }
    expect(none(`ruc ${ecCedula()}000`, EC)).toEqual([]);
  });
});
