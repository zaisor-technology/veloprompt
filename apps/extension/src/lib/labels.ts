import type { DataType, Finding } from "veloprompt-core";

const NAMES: Record<DataType, string> = {
  CEDULA: "Cédula",
  RUC: "RUC",
  NIF: "DNI/NIF",
  NIE: "NIE",
  CIF: "CIF",
  IBAN: "IBAN",
  CURP: "CURP",
  RFC: "RFC",
  CLABE: "CLABE",
  RUT: "RUT",
  NIT: "NIT",
  DNI: "DNI",
  CUIT: "CUIT/CUIL",
  CBU: "CBU",
  EMAIL: "Email",
  TELEFONO: "Teléfono",
  TARJETA: "Tarjeta",
  CLAVE_API: "Clave de API",
  CONTRASENA: "Contraseña",
  PRIVADO: "Término propio",
};

export const typeName = (t: DataType): string => NAMES[t];

/** Nombre a mostrar en el aviso: si dos reglas empatan, no adivinamos el tipo. */
export function findingName(f: Finding): string {
  if (f.ambiguous) return "Dato personal";
  return f.country === "GLOBAL" ? NAMES[f.type] : `${NAMES[f.type]} (${f.country})`;
}
