/**
 * Generadores de números de prueba SINTÉTICOS. Cada uno calcula su dígito de control con una
 * implementación propia (independiente de src/) a partir de dígitos pseudoaleatorios con semilla,
 * de modo que nunca usamos documentos de personas reales.
 */

let seed = 20261020;
export function reseed(s: number): void {
  seed = s;
}
function rand(): number {
  // mulberry32
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const randInt = (min: number, max: number): number => min + Math.floor(rand() * (max - min + 1));
export const randDigits = (n: number): string => Array.from({ length: n }, () => randInt(0, 9)).join("");
const pick = <T>(xs: readonly T[]): T => xs[randInt(0, xs.length - 1)]!;
const pad = (n: number, len: number): string => String(n).padStart(len, "0");
const sumWeighted = (s: string, w: number[]): number =>
  w.reduce((acc, wi, i) => acc + Number(s[i]) * wi, 0);

/** Cambia el último carácter (el de control) por otro distinto del mismo tipo. */
export function breakLast(value: string, alphabet = "0123456789"): string {
  const last = value[value.length - 1]!.toUpperCase();
  const others = alphabet.split("").filter((c) => c !== last);
  return value.slice(0, -1) + pick(others);
}

// ---------------------------------------------------------------- Ecuador

function ecMod10(nine: string): number {
  let s = 0;
  for (let i = 0; i < 9; i++) {
    const p = Number(nine[i]) * (i % 2 === 0 ? 2 : 1);
    s += p >= 10 ? p - 9 : p;
  }
  return s % 10 === 0 ? 0 : 10 - (s % 10);
}

export function ecCedula(): string {
  const nine = pad(randInt(1, 24), 2) + randInt(0, 5) + randDigits(6);
  return nine + ecMod10(nine);
}

export function ecRucNatural(): string {
  return ecCedula() + "001";
}

function mod11Ec(s: string, w: number[]): number | null {
  const r = sumWeighted(s, w) % 11;
  if (r === 0) return 0;
  return r === 1 ? null : 11 - r;
}

export function ecRucPrivada(): string {
  for (;;) {
    const nine = pad(randInt(1, 24), 2) + "9" + randDigits(6);
    const dv = mod11Ec(nine, [4, 3, 2, 7, 6, 5, 4, 3, 2]);
    if (dv !== null) return nine + dv + "001";
  }
}

export function ecRucPublica(): string {
  for (;;) {
    const eight = pad(randInt(1, 24), 2) + "6" + randDigits(5);
    const dv = mod11Ec(eight, [3, 2, 7, 6, 5, 4, 3, 2]);
    if (dv !== null) return eight + dv + "0001";
  }
}

// ---------------------------------------------------------------- España

const LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

export function esDni(): string {
  const n = randInt(10000000, 99999999);
  return `${n}${LETTERS[n % 23]}`;
}

export function esNie(): string {
  const prefix = randInt(0, 2);
  const seven = randDigits(7);
  return "XYZ"[prefix]! + seven + LETTERS[Number(`${prefix}${seven}`) % 23];
}

export function esCif(first = pick(["A", "B", "P", "Q"])): string {
  const seven = randDigits(7);
  let s = 0;
  for (let i = 0; i < 7; i++) {
    const d = Number(seven[i]);
    if (i % 2 === 1) s += d;
    else s += Math.floor((d * 2) / 10) + ((d * 2) % 10);
  }
  const c = (10 - (s % 10)) % 10;
  return first + seven + ("PQSKNW".includes(first) ? "JABCDEFGHI"[c] : String(c));
}

function mod97(numeric: string): number {
  let r = 0;
  for (const ch of numeric) r = (r * 10 + Number(ch)) % 97;
  return r;
}

/** IBAN con BBAN numérico: check = 98 - mod97(bban + código del país + "00"). */
export function iban(country: string, bbanLength: number): string {
  const bban = randDigits(bbanLength);
  const cc = [...country].map((c) => String(c.charCodeAt(0) - 55)).join("");
  const check = 98 - mod97(bban + cc + "00");
  return country + pad(check, 2) + bban;
}

export const groupBy4 = (s: string): string => s.replace(/(.{4})(?=.)/g, "$1 ");

// ---------------------------------------------------------------- México

const CURP_DICT = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
const CONS = "BCDFGHJKLMNPQRSTVWXYZ";

export function mxCurp(): string {
  const base =
    pick([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]) +
    pick([..."AEIOU"]) +
    pick([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]) +
    pick([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]) +
    pad(randInt(50, 99), 2) +
    pad(randInt(1, 12), 2) +
    pad(randInt(1, 28), 2) +
    pick(["H", "M"]) +
    pick(["DF", "JC", "NL", "PL", "YN"]) +
    pick([...CONS]) +
    pick([...CONS]) +
    pick([...CONS]) +
    String(randInt(0, 9));
  let s = 0;
  for (let i = 0; i < 17; i++) s += CURP_DICT.indexOf(base[i]!) * (18 - i);
  return base + ((10 - (s % 10)) % 10);
}

const RFC_DICT = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ";

export function mxRfc(kind: "fisica" | "moral"): string {
  for (;;) {
    const letters = Array.from({ length: kind === "fisica" ? 4 : 3 }, () =>
      pick([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]),
    ).join("");
    const base =
      letters +
      pad(randInt(50, 99), 2) +
      pad(randInt(1, 12), 2) +
      pad(randInt(1, 28), 2) +
      pick([..."ABCDEFGHJKLMNPQRSTUVWXYZ123456789"]) +
      pick([..."ABCDEFGHJKLMNPQRSTUVWXYZ123456789"]);
    const padded = (kind === "moral" ? " " : "") + base;
    let s = 0;
    for (let i = 0; i < 12; i++) s += RFC_DICT.indexOf(padded[i]!) * (13 - i);
    const r = 11 - (s % 11);
    const dv = r === 11 ? "0" : r === 10 ? "A" : String(r);
    return base + dv;
  }
}

export function mxClabe(): string {
  const body = pad(randInt(2, 199), 3) + randDigits(14);
  const w = [3, 7, 1];
  let s = 0;
  for (let i = 0; i < 17; i++) s += (Number(body[i]) * w[i % 3]!) % 10;
  return body + ((10 - (s % 10)) % 10);
}

// ---------------------------------------------------------------- Chile

export function clRut(bodyLength = 8): { plain: string; dotted: string } {
  const body = String(randInt(bodyLength === 8 ? 10000000 : 1000000, bodyLength === 8 ? 25999999 : 9999999));
  let s = 0;
  let m = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    s += Number(body[i]) * m;
    m = m === 7 ? 2 : m + 1;
  }
  const r = 11 - (s % 11);
  const dv = r === 11 ? "0" : r === 10 ? "K" : String(r);
  const dotted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return { plain: `${body}-${dv}`, dotted: `${dotted}-${dv}` };
}

// ---------------------------------------------------------------- Colombia

export function coNit(): { plain: string; dotted: string } {
  const body = String(randInt(800000000, 999999999));
  const w = [3, 7, 13, 17, 19, 23, 29, 37, 41];
  let s = 0;
  for (let i = 0; i < 9; i++) s += Number(body[8 - i]) * w[i]!;
  const r = s % 11;
  const dv = r > 1 ? 11 - r : r;
  return {
    plain: `${body}-${dv}`,
    dotted: `${body.slice(0, 3)}.${body.slice(3, 6)}.${body.slice(6)}-${dv}`,
  };
}

// ---------------------------------------------------------------- Perú / Argentina

const W = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function peRuc(prefix: "10" | "20" = "20"): string {
  const ten = prefix + randDigits(8);
  const r = 11 - (sumWeighted(ten, W) % 11);
  return ten + (r === 10 ? 0 : r === 11 ? 1 : r);
}

export function arCuit(prefix: "20" | "27" | "30" = "20"): string {
  for (;;) {
    const ten = prefix + randDigits(8);
    const r = 11 - (sumWeighted(ten, W) % 11);
    if (r === 10) continue;
    return ten + (r === 11 ? 0 : r);
  }
}

export function arCbu(): string {
  const b1 = pad(randInt(1, 400), 3) + randDigits(4);
  const dv1 = (10 - (sumWeighted(b1, [7, 1, 3, 9, 7, 1, 3]) % 10)) % 10;
  const b2 = randDigits(13);
  const dv2 = (10 - (sumWeighted(b2, [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]) % 10)) % 10;
  return b1 + dv1 + b2 + dv2;
}

// ---------------------------------------------------------------- tarjetas

export function card(prefix: string, length = 16): string {
  const body = prefix + randDigits(length - prefix.length - 1);
  let s = 0;
  for (let i = 0; i < body.length; i++) {
    let d = Number(body[body.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    s += d;
  }
  return body + ((10 - (s % 10)) % 10);
}
