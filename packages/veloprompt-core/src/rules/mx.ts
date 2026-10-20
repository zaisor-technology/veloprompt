import { mxClabe, mxCurp, mxRfc, normalize } from "../checksums.js";
import { B, E, rx } from "../text.js";
import type { Rule } from "../types.js";

export const mxRules: Rule[] = [
  {
    id: "mx.curp",
    type: "CURP",
    country: "MX",
    pattern: rx(`${B}[A-Z][AEIOUX][A-Z]{2}\\d{6}[HMX][A-Z]{5}[A-Z0-9]\\d${E}`),
    confidence: 0.95,
    priority: 90,
    validate: (v) => mxCurp(v),
    context: /\bcurp\b/,
  },
  {
    id: "mx.rfc",
    type: "RFC",
    country: "MX",
    pattern: rx(`${B}[A-ZÑ&]{3,4}-?\\d{6}-?[A-Z0-9]{2}[0-9A]${E}`),
    confidence: 0.9,
    priority: 85,
    validate: (v) => mxRfc(normalize(v)),
    context: /\brfc\b/,
  },
  {
    id: "mx.clabe",
    type: "CLABE",
    country: "MX",
    pattern: rx(`${B}\\d{3}[\\s-]?\\d{3}[\\s-]?\\d{11}[\\s-]?\\d${E}`),
    confidence: 0.92,
    priority: 82,
    validate: (v) => mxClabe(normalize(v)),
    context: /\b(clabe|cuenta|transferencia|spei)\b/,
    numeric: true,
  },
];
