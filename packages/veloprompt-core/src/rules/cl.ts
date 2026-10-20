import { clRut, normalize } from "../checksums.js";
import { B, E, rx } from "../text.js";
import type { Rule } from "../types.js";

export const clRules: Rule[] = [
  {
    id: "cl.rut",
    type: "RUT",
    country: "CL",
    // 12.345.678-5, 12345678-5, 1.234.567-K
    pattern: rx(`${B}(?:\\d{1,2}\\.\\d{3}\\.\\d{3}|\\d{7,8})-[\\dkK]${E}`),
    confidence: 0.9,
    priority: 80,
    validate: (v) => clRut(normalize(v)),
    context: /\b(rut|run|rol unico)\b/,
  },
];
