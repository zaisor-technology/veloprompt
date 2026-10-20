import { describe, expect, it } from "vitest";
import { detect, redact, restore } from "../src/index.js";
import * as g from "./generators.js";

describe("texto largo mixto en español", () => {
  g.reseed(42);
  const cedula = g.ecCedula();
  const rucEc = g.ecRucPrivada();
  const dni = g.esDni();
  const nie = g.esNie();
  const ibanEs = g.groupBy4(g.iban("ES", 20));
  const curp = g.mxCurp();
  const rfc = g.mxRfc("moral");
  const clabe = g.mxClabe();
  const rut = g.clRut().dotted;
  const nit = g.coNit().dotted;
  const rucPe = g.peRuc("10");
  const cuit = g.arCuit("27");
  const cuitDashed = `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit[10]}`;
  const cbu = g.arCbu();
  const visa = g.groupBy4(g.card("4"));
  const key = "sk-ant-api03-" + "Q".repeat(32);

  const text = `Hola, te paso los datos del expediente para que me ayudes a redactar el contrato.

La clienta se llama Ana y su cédula ecuatoriana es ${cedula}. La empresa tiene RUC ${rucEc}.
En España trabaja con DNI ${dni} y su socio tiene NIE ${nie}; cobran en la cuenta ${ibanEs}.
Para México: CURP ${curp}, RFC de la sociedad ${rfc} y CLABE ${clabe}.
El proveedor chileno (RUT ${rut}) factura con el colombiano, NIT ${nit}.
En Perú el RUC es ${rucPe} y su DNI 45871236. En Argentina, CUIL ${cuitDashed} y CBU ${cbu}.
Contacto: ana.cliente@example.com, móvil +593 98 765 4321. Pagó con la tarjeta ${visa}.
Para la integración usa ${key} y la contraseña: Pr0yecto#Velo.

No son datos: el pedido nº 1712345678 llegó el 20/10/2026 por $1.250,00; la factura 20456789012
vence el 15-11-2026, el envío pesa 3.500 kg y la reunión es a las 10:30 en la sala 204.
Se presupuestaron 45.000.000 de pesos para 2027.`;

  const expected: [string, string][] = [
    ["CEDULA", cedula],
    ["RUC", rucEc],
    ["NIF", dni],
    ["NIE", nie],
    ["IBAN", ibanEs],
    ["CURP", curp],
    ["RFC", rfc],
    ["CLABE", clabe],
    ["RUT", rut],
    ["NIT", nit],
    ["RUC", rucPe],
    ["DNI", "45871236"],
    ["CUIT", cuitDashed],
    ["CBU", cbu],
    ["EMAIL", "ana.cliente@example.com"],
    ["TELEFONO", "+593 98 765 4321"],
    ["TARJETA", visa],
    ["CLAVE_API", key],
    ["CONTRASENA", "Pr0yecto#Velo."],
  ];

  it("encuentra todos los datos, en orden, y nada más", () => {
    const found = detect(text).map((f) => [f.type, f.value]);
    expect(found).toEqual(expected);
  });

  it("los offsets apuntan exactamente al valor", () => {
    for (const f of detect(text)) expect(text.slice(f.start, f.end)).toBe(f.value);
  });

  it("redact no deja ningún valor sensible y restore recupera el original", () => {
    const { text: veiled, map } = redact(text);
    for (const [, value] of expected) expect(veiled).not.toContain(value);
    expect(veiled).toContain("pedido nº 1712345678");
    expect(veiled).toContain("$1.250,00");
    expect(restore(veiled, map)).toBe(text);
  });
});

describe("opciones", () => {
  const dni = "12345678Z";
  const text = `DNI ${dni}, correo a@b.co, RUT 12.345.678-5`;

  it("countries limita las reglas de país pero mantiene las comunes", () => {
    expect(detect(text, { countries: ["CL"] }).map((f) => f.type)).toEqual(["EMAIL", "RUT"]);
  });

  it("types limita los tipos", () => {
    expect(detect(text, { types: ["NIF"] }).map((f) => f.value)).toEqual([dni]);
    expect(detect("Acme", { types: ["EMAIL"], customTerms: ["Acme"] })).toEqual([]);
  });

  it("minConfidence descarta hallazgos dudosos", () => {
    expect(detect("Mi DNI es 45678912", { countries: ["PE"], minConfidence: 0.9 })).toEqual([]);
  });

  it("customTerms tiene prioridad sobre cualquier regla solapada", () => {
    const [f] = detect("correo ana@example.com", { customTerms: ["ana@example.com"] });
    expect(f).toMatchObject({ type: "PRIVADO", value: "ana@example.com" });
  });
});
