import { normalize, peRuc } from "../checksums.js";
import { B, E, rx } from "../text.js";
import type { Rule } from "../types.js";

export const peRules: Rule[] = [
  {
    id: "pe.ruc",
    type: "RUC",
    country: "PE",
    pattern: rx(`${B}(?:10|15|16|17|20)\\d{9}${E}`),
    confidence: 0.88,
    priority: 72,
    validate: (v) => peRuc(normalize(v)),
    context: /\b(ruc|sunat)\b/,
    numeric: true,
  },
  {
    id: "pe.dni",
    type: "DNI",
    country: "PE",
    // Sin dígito de control en el propio número: solo con "DNI" cerca.
    pattern: rx(`${B}\\d{8}${E}`),
    confidence: 0.7,
    priority: 40,
    context: /\b(dni|d\.n\.i|documento nacional|documento de identidad)\b/,
    requireContext: "always",
    numeric: true,
  },
];
