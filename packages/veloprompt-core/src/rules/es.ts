import { esCif, esDni, esNie, isValidIban, normalize } from "../checksums.js";
import { B, E, rx } from "../text.js";
import type { Rule } from "../types.js";

export const esRules: Rule[] = [
  {
    id: "es.dni",
    type: "NIF",
    country: "ES",
    pattern: rx(`${B}\\d{2}\\.?\\d{3}\\.?\\d{3}[\\s-]?[A-Za-z]${E}`),
    confidence: 0.93,
    priority: 85,
    validate: (v) => esDni(normalize(v)),
    context: /\b(dni|nif|documento)\b/,
  },
  {
    id: "es.nie",
    type: "NIE",
    country: "ES",
    pattern: rx(`${B}[XYZxyz][\\s-]?\\d{7}[\\s-]?[A-Za-z]${E}`),
    confidence: 0.93,
    priority: 85,
    validate: (v) => esNie(normalize(v)),
    context: /\b(nie|extranjero|documento)\b/,
  },
  {
    id: "es.cif",
    type: "CIF",
    country: "ES",
    pattern: rx(`${B}[ABCDEFGHJKLMNPQRSUVW]-?\\d{7}[0-9A-J]${E}`),
    confidence: 0.88,
    priority: 84,
    validate: (v) => esCif(normalize(v)),
    context: /\b(cif|nif|empresa|sociedad)\b/,
  },
  {
    id: "es.iban",
    type: "IBAN",
    country: "ES",
    pattern: rx(`${B}ES\\d{2}(?:[ -]?\\d{4}){5}${E}`, "i"),
    confidence: 0.97,
    priority: 95,
    validate: (v) => isValidIban(normalize(v)),
    context: /\b(iban|cuenta|transferencia)\b/,
  },
];
