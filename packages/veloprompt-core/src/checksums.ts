/**
 * Algoritmos de dígito o letra de control. Todos reciben el valor ya normalizado
 * (sin espacios, puntos ni guiones y en mayúsculas) y devuelven `true` si es válido.
 */

const digits = (s: string): number[] => Array.from(s, (c) => c.charCodeAt(0) - 48);

const isDigits = (s: string, len?: number): boolean =>
  /^\d+$/.test(s) && (len === undefined || s.length === len);

/** Quita espacios, puntos y guiones y pasa a mayúsculas. */
export function normalize(value: string): string {
  return value.replace(/[\s.\-]/g, "").toUpperCase();
}

// ---------------------------------------------------------------- comunes

export function luhn(value: string): boolean {
  if (!isDigits(value)) return false;
  let sum = 0;
  let double = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let d = value.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Resto módulo 97 de un IBAN (letras A=10 … Z=35), procesado por trozos. */
export function ibanMod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const n = code >= 65 && code <= 90 ? code - 55 : code - 48;
    if (n < 0 || n > 35) return -1;
    rem = n > 9 ? (rem * 100 + n) % 97 : (rem * 10 + n) % 97;
  }
  return rem;
}

export function isValidIban(iban: string): boolean {
  return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban) && ibanMod97(iban) === 1;
}

// ---------------------------------------------------------------- Ecuador

function ecProvinceOk(v: string): boolean {
  const p = Number(v.slice(0, 2));
  return (p >= 1 && p <= 24) || p === 30;
}

/** Cédula ecuatoriana: 10 dígitos, provincia 01-24 o 30, tercer dígito < 6, módulo 10. */
export function ecCedula(v: string): boolean {
  if (!isDigits(v, 10) || !ecProvinceOk(v)) return false;
  const d = digits(v);
  if (d[2]! >= 6) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let p = d[i]! * (i % 2 === 0 ? 2 : 1);
    if (p > 9) p -= 9;
    sum += p;
  }
  return (10 - (sum % 10)) % 10 === d[9];
}

function mod11Check(d: number[], weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) sum += d[i]! * weights[i]!;
  const r = 11 - (sum % 11);
  return r === 11 ? 0 : r; // 10 = inválido para quien llama
}

/** RUC ecuatoriano: persona natural (cédula + establecimiento), sociedad privada o pública. */
export function ecRuc(v: string): boolean {
  if (!isDigits(v, 13) || !ecProvinceOk(v)) return false;
  const d = digits(v);
  const third = d[2]!;
  if (third < 6) return ecCedula(v.slice(0, 10)) && v.slice(10) !== "000";
  if (third === 9) {
    return mod11Check(d, [4, 3, 2, 7, 6, 5, 4, 3, 2]) === d[9] && v.slice(10) !== "000";
  }
  if (third === 6) {
    return mod11Check(d, [3, 2, 7, 6, 5, 4, 3, 2]) === d[8] && v.slice(9) !== "0000";
  }
  return false;
}

// ---------------------------------------------------------------- España

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

export function esDni(v: string): boolean {
  if (!/^\d{8}[A-Z]$/.test(v)) return false;
  return DNI_LETTERS[Number(v.slice(0, 8)) % 23] === v[8];
}

export function esNie(v: string): boolean {
  if (!/^[XYZ]\d{7}[A-Z]$/.test(v)) return false;
  const n = Number(String("XYZ".indexOf(v[0]!)) + v.slice(1, 8));
  return DNI_LETTERS[n % 23] === v[8];
}

export function esCif(v: string): boolean {
  if (!/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(v)) return false;
  const d = digits(v.slice(1, 8));
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 1) {
      sum += d[i]!;
    } else {
      const x = d[i]! * 2;
      sum += Math.floor(x / 10) + (x % 10);
    }
  }
  const control = (10 - (sum % 10)) % 10;
  const letter = "JABCDEFGHI"[control]!;
  const first = v[0]!;
  const last = v[8]!;
  if ("KPQRSNW".includes(first)) return last === letter;
  if ("ABEH".includes(first)) return last === String(control);
  return last === letter || last === String(control);
}

// ---------------------------------------------------------------- México

const CURP_DICT = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

function validDate(yymmdd: string): boolean {
  const m = Number(yymmdd.slice(2, 4));
  const day = Number(yymmdd.slice(4, 6));
  return m >= 1 && m <= 12 && day >= 1 && day <= 31;
}

export function mxCurp(v: string): boolean {
  if (!/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/.test(v)) return false;
  if (!validDate(v.slice(4, 10))) return false;
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += CURP_DICT.indexOf(v[i]!) * (18 - i);
  return (10 - (sum % 10)) % 10 === Number(v[17]);
}

const RFC_DICT = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ";

export function mxRfc(v: string): boolean {
  if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2}[0-9A]$/.test(v)) return false;
  const datePart = v.slice(v.length - 9, v.length - 3);
  if (!validDate(datePart)) return false;
  const base = (v.length === 12 ? " " + v : v).slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += RFC_DICT.indexOf(base[i]!) * (13 - i);
  const r = 11 - (sum % 11);
  const expected = r === 11 ? "0" : r === 10 ? "A" : String(r);
  return v[v.length - 1] === expected;
}

export function mxClabe(v: string): boolean {
  if (!isDigits(v, 18)) return false;
  const d = digits(v);
  const w = [3, 7, 1];
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += (d[i]! * w[i % 3]!) % 10;
  return (10 - (sum % 10)) % 10 === d[17];
}

// ---------------------------------------------------------------- Chile

export function clRutDv(body: string): string {
  let sum = 0;
  let m = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += (body.charCodeAt(i) - 48) * m;
    m = m === 7 ? 2 : m + 1;
  }
  const r = 11 - (sum % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
}

/** RUT/RUN: cuerpo de 7 u 8 dígitos y dígito verificador (0-9 o K). */
export function clRut(v: string): boolean {
  if (!/^\d{7,8}[0-9K]$/.test(v)) return false;
  return clRutDv(v.slice(0, -1)) === v[v.length - 1];
}

// ---------------------------------------------------------------- Colombia

const NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

export function coNit(v: string): boolean {
  if (!/^\d{6,15}$/.test(v)) return false;
  const body = v.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    sum += (body.charCodeAt(body.length - 1 - i) - 48) * NIT_WEIGHTS[i]!;
  }
  const r = sum % 11;
  const dv = r > 1 ? 11 - r : r;
  return dv === Number(v[v.length - 1]);
}

// ---------------------------------------------------------------- Perú

const W_5432765432 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function peRuc(v: string): boolean {
  if (!/^(10|15|16|17|20)\d{9}$/.test(v)) return false;
  const d = digits(v);
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += d[i]! * W_5432765432[i]!;
  const r = 11 - (sum % 11);
  const dv = r === 10 ? 0 : r === 11 ? 1 : r;
  return dv === d[10];
}

// ---------------------------------------------------------------- Argentina

export function arCuit(v: string): boolean {
  if (!/^(20|23|24|27|30|33|34)\d{9}$/.test(v)) return false;
  const d = digits(v);
  const dv = mod11Check(d, W_5432765432);
  return dv !== 10 && dv === d[10];
}

function weightedMod10(d: number[], weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) sum += d[i]! * weights[i]!;
  return (10 - (sum % 10)) % 10;
}

export function arCbu(v: string): boolean {
  if (!isDigits(v, 22)) return false;
  const d = digits(v);
  const block1 = weightedMod10(d.slice(0, 7), [7, 1, 3, 9, 7, 1, 3]);
  const block2 = weightedMod10(d.slice(8, 21), [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]);
  return block1 === d[7] && block2 === d[21];
}
