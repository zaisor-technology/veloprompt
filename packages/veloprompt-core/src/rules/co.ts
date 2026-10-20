import { coNit, normalize } from "../checksums.js";
import { B, E, rx } from "../text.js";
import type { Rule } from "../types.js";

export const coRules: Rule[] = [
  {
    id: "co.nit",
    type: "NIT",
    country: "CO",
    // 900.123.456-7 o 900123456-7
    pattern: rx(`${B}\\d{3}\\.?\\d{3}\\.?\\d{3}\\s?-\\s?\\d${E}`),
    confidence: 0.88,
    priority: 78,
    validate: (v) => coNit(normalize(v)),
    context: /\bnit\b/,
  },
  {
    id: "co.cedula",
    type: "CEDULA",
    country: "CO",
    // Sin dígito de control: solo cuenta con "C.C.", "cédula"... cerca.
    pattern: rx(`${B}(?:\\d{1,3}(?:\\.\\d{3}){1,3}|\\d{6,10})${E}`),
    confidence: 0.7,
    priority: 40,
    context: /(?:\bc\.\s?c\.?|\bcc\b|\bcedula\b|\bciudadania\b)/,
    requireContext: "always",
    numeric: true,
  },
];
