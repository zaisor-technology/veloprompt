import { isValidIban, luhn, normalize } from "../checksums.js";
import { B, E, rx } from "../text.js";
import type { Country, FindingCountry, Rule } from "../types.js";

// ---------------------------------------------------------------- IBAN genérico

/** Longitud oficial del IBAN por país (los más habituales). */
const IBAN_LENGTHS: Record<string, number> = {
  AD: 24, AT: 20, BE: 16, BG: 22, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18, EE: 20,
  ES: 24, FI: 18, FR: 27, GB: 22, GR: 27, HR: 21, HU: 28, IE: 22, IS: 26, IT: 27,
  LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MT: 31, NL: 18, NO: 15, PL: 28, PT: 25,
  RO: 24, SE: 24, SI: 19, SK: 24, SM: 27, BR: 29, DO: 28, CR: 22, GT: 28, SV: 28,
};

/** Acepta el IBAN, recortando grupos sobrantes por la derecha si la longitud del país lo indica. */
function validateIban(raw: string): string | null {
  const country = raw.slice(0, 2).toUpperCase();
  const expected = IBAN_LENGTHS[country];
  if (expected === undefined) return isValidIban(normalize(raw)) ? raw : null;
  let count = 0;
  for (let i = 0; i < raw.length; i++) {
    if (/[A-Za-z0-9]/.test(raw[i]!)) count++;
    if (count === expected) {
      const candidate = raw.slice(0, i + 1);
      return isValidIban(normalize(candidate)) ? candidate : null;
    }
  }
  return null;
}

// ---------------------------------------------------------------- teléfonos

const DIAL_CODES: [string, Country][] = [
  ["593", "EC"],
  ["34", "ES"],
  ["52", "MX"],
  ["56", "CL"],
  ["57", "CO"],
  ["51", "PE"],
  ["54", "AR"],
];

function phoneCountry(value: string): FindingCountry {
  const d = value.replace(/\D/g, "");
  for (const [code, country] of DIAL_CODES) if (d.startsWith(code)) return country;
  return "GLOBAL";
}

const PHONE_CONTEXT =
  /\b(telefono|tel|telf|tlf|tlfn|movil|celular|cel|whatsapp|whats|wsp|wa|llamar|llamame|llama|phone|fono|contacto|numero)\b/;

function localPhone(id: string, country: Country, source: string, requireContext: Rule["requireContext"]): Rule {
  return {
    id,
    type: "TELEFONO",
    country,
    pattern: rx(`${B}${source}${E}`),
    confidence: 0.75,
    priority: 50,
    context: PHONE_CONTEXT,
    ...(requireContext ? { requireContext } : {}),
    numeric: true,
  };
}

// ---------------------------------------------------------------- tarjetas

const CARD_PREFIX = /^(?:4|5[1-5]|2[2-7]|3[47]|3(?:0[0-5]|[68])|6(?:011|5|4[4-9]|22)|35)/;

function validateCard(raw: string): boolean {
  const d = raw.replace(/[\s-]/g, "");
  return d.length >= 13 && d.length <= 19 && CARD_PREFIX.test(d) && luhn(d);
}

// ---------------------------------------------------------------- reglas

export const commonRules: Rule[] = [
  {
    id: "common.email",
    type: "EMAIL",
    country: "GLOBAL",
    pattern: rx(`(?<![\\w.%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}${E}`),
    confidence: 0.98,
    priority: 100,
  },
  {
    id: "common.api-key",
    type: "CLAVE_API",
    country: "GLOBAL",
    pattern: rx(
      `(?<![\\w-])(?:sk-ant-[A-Za-z0-9_-]{20,}|sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,}|xox[abposr]-[A-Za-z0-9-]{10,})(?![\\w-])`,
    ),
    confidence: 0.97,
    priority: 110,
  },
  {
    id: "common.password",
    type: "CONTRASENA",
    country: "GLOBAL",
    pattern: rx(
      `(?:contrase[ñn]a|password|passwd|pwd|clave de acceso|clave secreta)\\s*[:=]\\s*(?<v>"[^"\\n]+"|'[^'\\n]+'|\\S+)`,
      "i",
    ),
    confidence: 0.9,
    priority: 105,
  },
  {
    id: "common.iban",
    type: "IBAN",
    country: "GLOBAL",
    pattern: rx(`${B}[A-Z]{2}\\d{2}(?:[ -]?[A-Z0-9]){11,30}${E}`),
    confidence: 0.95,
    priority: 90,
    validate: validateIban,
    context: /\b(iban|cuenta|transferencia)\b/,
    countryOf: (v) => {
      const c = v.slice(0, 2).toUpperCase();
      return c === "ES" ? "ES" : "GLOBAL";
    },
  },
  {
    id: "common.card",
    type: "TARJETA",
    country: "GLOBAL",
    pattern: rx(`${B}\\d(?:[ -]?\\d){12,18}${E}`),
    confidence: 0.9,
    priority: 70,
    validate: validateCard,
    context: /\b(tarjeta|visa|mastercard|amex|card|credito|debito)\b/,
    numeric: true,
  },
  {
    id: "common.phone-e164",
    type: "TELEFONO",
    country: "GLOBAL",
    pattern: rx(`(?<![\\w+])\\+\\d(?:[\\s.-]?\\(?\\d\\)?){7,14}${E}`),
    confidence: 0.85,
    priority: 60,
    context: PHONE_CONTEXT,
    countryOf: phoneCountry,
  },
  // Formatos locales. "unless-formatted": sin palabra de contexto solo cuenta si va con separadores.
  localPhone("ec.phone", "EC", `09[5-9](?:\\d{7}|[\\s-]\\d{3}[\\s-]\\d{4})`, undefined),
  localPhone("es.phone", "ES", `[6789]\\d{2}(?:[\\s.]?\\d{3}[\\s.]?\\d{3}|\\s\\d{2}\\s\\d{2}\\s\\d{2})`, "unless-formatted"),
  localPhone("mx.phone", "MX", `(?:\\(\\d{2,3}\\)\\s?|\\d{2,3}[\\s-]?)\\d{3,4}[\\s-]?\\d{4}`, "always"),
  localPhone("cl.phone", "CL", `9[\\s-]?\\d{4}[\\s-]?\\d{4}`, "unless-formatted"),
  localPhone("co.phone", "CO", `3\\d{2}[\\s-]?\\d{3}[\\s-]?\\d{4}`, "unless-formatted"),
  localPhone("pe.phone", "PE", `9\\d{2}[\\s-]?\\d{3}[\\s-]?\\d{3}`, "unless-formatted"),
  localPhone("ar.phone", "AR", `(?:11|[23]\\d{2,3})[\\s-]?(?:15[\\s-]?)?\\d{3,4}[\\s-]?\\d{4}`, "always"),
];
