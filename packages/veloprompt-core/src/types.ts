/** Países con reglas propias. `GLOBAL` agrupa las reglas comunes (email, tarjetas, claves de API...). */
export type Country = "EC" | "ES" | "MX" | "CL" | "CO" | "PE" | "AR";
export type FindingCountry = Country | "GLOBAL";

export const COUNTRIES: readonly Country[] = ["EC", "ES", "MX", "CL", "CO", "PE", "AR"];

/**
 * Tipo de dato detectado. El nombre del tipo es también la base de la etiqueta
 * que se usa al anonimizar: `CEDULA` → `[CEDULA_1]`.
 */
export type DataType =
  | "CEDULA"
  | "RUC"
  | "NIF"
  | "NIE"
  | "CIF"
  | "IBAN"
  | "CURP"
  | "RFC"
  | "CLABE"
  | "RUT"
  | "NIT"
  | "DNI"
  | "CUIT"
  | "CBU"
  | "EMAIL"
  | "TELEFONO"
  | "TARJETA"
  | "CLAVE_API"
  | "CONTRASENA"
  | "PRIVADO";

export const DATA_TYPES: readonly DataType[] = [
  "CEDULA",
  "RUC",
  "NIF",
  "NIE",
  "CIF",
  "IBAN",
  "CURP",
  "RFC",
  "CLABE",
  "RUT",
  "NIT",
  "DNI",
  "CUIT",
  "CBU",
  "EMAIL",
  "TELEFONO",
  "TARJETA",
  "CLAVE_API",
  "CONTRASENA",
  "PRIVADO",
];

export interface Finding {
  type: DataType;
  country: FindingCountry;
  /** Texto exacto tal y como aparece en la entrada. */
  value: string;
  /** Posición inicial (incluida) en la cadena original. */
  start: number;
  /** Posición final (excluida) en la cadena original. */
  end: number;
  /** Entre 0 y 1. Las reglas con dígito de control validado rondan 0,9. */
  confidence: number;
  /** Identificador de la regla que produjo el hallazgo (p. ej. `ec.cedula`). */
  rule: string;
  /**
   * `true` si otra regla de distinto tipo encajaba en el mismo tramo con la misma confianza
   * (p. ej. "cédula/DNI 30.123.456"). La interfaz puede mostrarlo como "Dato personal".
   */
  ambiguous?: boolean;
  /** Tipos alternativos cuando `ambiguous` es `true`. */
  alternatives?: DataType[];
}

export interface DetectOptions {
  /** Países activos. Por defecto, todos. Las reglas comunes se aplican siempre. */
  countries?: readonly Country[];
  /** Tipos activos. Por defecto, todos. */
  types?: readonly DataType[];
  /** Palabras o frases propias que se tapan siempre (sin distinguir mayúsculas). */
  customTerms?: readonly string[];
  /** Descarta hallazgos por debajo de esta confianza. Por defecto 0. */
  minConfidence?: number;
}

/** Cuándo exige una regla una palabra de contexto cerca del valor. */
export type ContextRequirement = "always" | "unless-formatted";

export interface Rule {
  id: string;
  type: DataType;
  country: FindingCountry;
  /**
   * Expresión con bandera `g`. Si tiene un grupo con nombre `v`, ese grupo es el valor
   * (y la expresión debe llevar también la bandera `d`).
   */
  pattern: RegExp;
  confidence: number;
  /** Desempata solapes: gana la mayor. */
  priority: number;
  /** Devuelve el valor aceptado (puede recortarlo por la derecha) o `null` si no es válido. */
  validate?: (value: string) => string | boolean | null;
  /** Palabras de contexto, evaluadas sobre texto en minúsculas y sin tildes. */
  context?: RegExp;
  requireContext?: ContextRequirement;
  /** Valor puramente numérico: se descarta si parece un importe o va tras "pedido", "factura"... */
  numeric?: boolean;
  /** País según el propio valor (prefijo telefónico, código IBAN...). */
  countryOf?: (value: string) => FindingCountry;
}
