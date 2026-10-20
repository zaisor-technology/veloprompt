import { describe, expect, it } from "vitest";
import { detect } from "../src/index.js";
import { card, ecCedula, peRuc, randDigits } from "./generators.js";

describe("números parecidos que NO son datos personales", () => {
  it("fechas y horas", () => {
    expect(detect("Nos vemos el 20/10/2026 a las 10:30, o el 2026-10-21T09:00:00Z.")).toEqual([]);
    expect(detect("Versión 20261020 publicada el 21.10.2026")).toEqual([]);
  });

  it("importes, aunque el número pase un dígito de control", () => {
    const c = ecCedula();
    const r = peRuc();
    expect(detect(`El total fue $${c} y luego ${r} USD`)).toEqual([]);
    expect(detect(`Facturamos ${c},50 € este año`)).toEqual([]);
    expect(detect(`Precio: ${card("4")} pesos`)).toEqual([]);
  });

  it("números de pedido, factura y seguimiento", () => {
    const c = ecCedula();
    expect(detect(`Pedido nº ${c} enviado`)).toEqual([]);
    expect(detect(`Factura ${peRuc()} pendiente`)).toEqual([]);
    expect(detect(`Seguimiento ${card("4")}`)).toEqual([]);
  });

  it("números al azar no se marcan si no pasan validación", () => {
    let hits = 0;
    for (let i = 0; i < 500; i++) hits += detect(`Referencia interna ${randDigits(10)}`).length;
    expect(hits).toBe(0);
  });

  it("identificadores técnicos comunes", () => {
    expect(detect("commit e675fba, uuid 550e8400-e29b-41d4-a716-446655440000, puerto 8080")).toEqual([]);
  });
});
