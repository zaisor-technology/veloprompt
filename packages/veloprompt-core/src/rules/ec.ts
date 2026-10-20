import { ecCedula, ecRuc, normalize } from "../checksums.js";
import { B, E, rx } from "../text.js";
import type { Rule } from "../types.js";

export const ecRules: Rule[] = [
  {
    id: "ec.ruc",
    type: "RUC",
    country: "EC",
    pattern: rx(`${B}\\d{13}${E}`),
    confidence: 0.92,
    priority: 80,
    validate: (v) => ecRuc(normalize(v)),
    context: /\bruc\b/,
    numeric: true,
  },
  {
    id: "ec.cedula",
    type: "CEDULA",
    country: "EC",
    pattern: rx(`${B}\\d{9}-?\\d${E}`),
    confidence: 0.9,
    priority: 75,
    validate: (v) => ecCedula(normalize(v)),
    context: /\b(cedula|c\.?\s?i\.?|ci|identidad|identificacion)\b/,
    numeric: true,
  },
];
