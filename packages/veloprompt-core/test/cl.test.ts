import { describe, expect, it } from "vitest";
import { breakLast, clRut } from "./generators.js";
import { N, none, only } from "./helpers.js";

const CL = { countries: ["CL"] } as const;

describe("Chile · RUT/RUN", () => {
  it("detecta 12.345.678-5 y 12345678-5", () => {
    expect(only("RUT 12.345.678-5", CL)).toMatchObject({ type: "RUT", country: "CL", value: "12.345.678-5" });
    expect(only("RUN 12345678-5", CL).value).toBe("12345678-5");
  });

  it("detecta RUT generados de 7 y 8 dígitos, incluidos los terminados en K", () => {
    let sawK = false;
    for (let i = 0; i < N * 3; i++) {
      const r = clRut(i % 2 === 0 ? 8 : 7);
      expect(only(`rut ${r.dotted}`, CL).value).toBe(r.dotted);
      expect(only(`rut ${r.plain}`, CL).value).toBe(r.plain);
      expect(only(`rut ${r.plain.toLowerCase()}`, CL).value).toBe(r.plain.toLowerCase());
      if (r.plain.endsWith("K")) sawK = true;
    }
    expect(sawK).toBe(true);
  });

  it("rechaza dígito verificador erróneo", () => {
    expect(none("RUT 12.345.678-6", CL)).toEqual([]);
    for (let i = 0; i < N; i++) expect(none(`rut ${breakLast(clRut().plain, "0123456789K")}`, CL)).toEqual([]);
  });
});
