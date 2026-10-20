import { describe, expect, it } from "vitest";
import { breakLast, mxClabe, mxCurp, mxRfc } from "./generators.js";
import { N, none, only } from "./helpers.js";

const MX = { countries: ["MX"] } as const;

describe("México · CURP", () => {
  it("detecta CURP válidas", () => {
    for (let i = 0; i < N; i++) {
      const c = mxCurp();
      expect(only(`CURP ${c}`, MX)).toMatchObject({ type: "CURP", country: "MX", value: c });
    }
  });

  it("rechaza dígito verificador erróneo y fechas imposibles", () => {
    for (let i = 0; i < N; i++) expect(none(`CURP ${breakLast(mxCurp())}`, MX)).toEqual([]);
    const c = mxCurp();
    expect(none(`CURP ${c.slice(0, 6)}13${c.slice(8)}`, MX)).toEqual([]);
  });
});

describe("México · RFC", () => {
  it("detecta RFC de persona física (13) y moral (12)", () => {
    for (let i = 0; i < N; i++) {
      const f = mxRfc("fisica");
      const m = mxRfc("moral");
      expect(only(`RFC ${f}`, MX)).toMatchObject({ type: "RFC", value: f });
      expect(only(`RFC ${m}`, MX)).toMatchObject({ type: "RFC", value: m });
    }
  });

  it("rechaza homoclave con verificador erróneo", () => {
    for (let i = 0; i < N; i++) {
      expect(none(`RFC ${breakLast(mxRfc("fisica"), "0123456789A")}`, MX)).toEqual([]);
      expect(none(`RFC ${breakLast(mxRfc("moral"), "0123456789A")}`, MX)).toEqual([]);
    }
  });
});

describe("México · CLABE", () => {
  it("detecta CLABE válidas", () => {
    for (let i = 0; i < N; i++) {
      const c = mxClabe();
      expect(only(`CLABE ${c}`, MX)).toMatchObject({ type: "CLABE", value: c });
    }
  });

  it("rechaza dígito de control erróneo", () => {
    for (let i = 0; i < N; i++) expect(none(`cuenta ${breakLast(mxClabe())}`, MX)).toEqual([]);
  });
});
