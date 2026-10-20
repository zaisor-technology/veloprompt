import { arCbu, arCuit, normalize } from "../checksums.js";
import { B, E, rx } from "../text.js";
import type { Rule } from "../types.js";

export const arRules: Rule[] = [
  {
    id: "ar.cuit",
    type: "CUIT",
    country: "AR",
    // 20-12345678-6 o 20123456786
    pattern: rx(`${B}(?:20|23|24|27|30|33|34)[\\s-]?\\d{8}[\\s-]?\\d${E}`),
    confidence: 0.9,
    priority: 74,
    validate: (v) => arCuit(normalize(v)),
    context: /\b(cuit|cuil|afip|arca)\b/,
    numeric: true,
  },
  {
    id: "ar.cbu",
    type: "CBU",
    country: "AR",
    pattern: rx(`${B}\\d{8}[\\s-]?\\d{14}${E}`),
    confidence: 0.93,
    priority: 83,
    validate: (v) => arCbu(normalize(v)),
    context: /\b(cbu|cvu|cuenta|transferencia)\b/,
    numeric: true,
  },
  {
    id: "ar.dni",
    type: "DNI",
    country: "AR",
    // 12.345.678 o 12345678; solo con "DNI" cerca.
    pattern: rx(`${B}(?:\\d{1,2}\\.\\d{3}\\.\\d{3}|\\d{7,8})${E}`),
    confidence: 0.7,
    priority: 39,
    context: /\b(dni|d\.n\.i|documento)\b/,
    requireContext: "always",
    numeric: true,
  },
];
