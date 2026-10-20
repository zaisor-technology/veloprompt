/** Ni letra ni dígito justo antes. */
export const B = "(?<![\\p{L}\\p{N}])";
/** Ni letra ni dígito justo después. */
export const E = "(?![\\p{L}\\p{N}])";

/** Crea una expresión global con soporte Unicode (y `d` si hay grupo `v`). */
export function rx(source: string, extraFlags = ""): RegExp {
  const flags = "gu" + (source.includes("(?<v>") ? "d" : "") + extraFlags;
  return new RegExp(source, flags);
}

const ACCENTS: Record<string, string> = {
  á: "a", à: "a", ä: "a", â: "a",
  é: "e", è: "e", ë: "e", ê: "e",
  í: "i", ì: "i", ï: "i", î: "i",
  ó: "o", ò: "o", ö: "o", ô: "o",
  ú: "u", ù: "u", ü: "u", û: "u",
  ñ: "n", ç: "c",
};

/** Minúsculas y sin tildes, conservando la longitud. */
export function fold(s: string): string {
  return s.toLowerCase().replace(/[áàäâéèëêíìïîóòöôúùüûñç]/g, (c) => ACCENTS[c] ?? c);
}

const BEFORE = 40;
const AFTER = 25;

/** Busca palabras de contexto cerca de [start, end), sin mirar el propio valor. */
export function hasContext(text: string, start: number, end: number, context: RegExp): boolean {
  const window =
    fold(text.slice(Math.max(0, start - BEFORE), start)) + " | " + fold(text.slice(end, end + AFTER));
  context.lastIndex = 0;
  return context.test(window);
}

const NEGATIVE_BEFORE =
  /\b(pedido|orden|order|factura|ticket|referencia|ref|tracking|seguimiento|envio|importe|total|precio|monto|saldo|codigo postal|cp|zip|lote|serie|invoice|expediente)\b[^\n]{0,20}$/;
const CURRENCY_BEFORE = /(?:[$€£]|\b(?:usd|eur|mxn|ars|clp|cop|pen))\s?$/;
const CURRENCY_AFTER = /^\s?(?:[$€£]|(?:usd|eur|euros?|dolares|pesos|soles|mxn|ars|clp|cop|pen)(?![a-z]))/;
const DECIMAL_AFTER = /^[.,]\d/;

/** Un número que parece importe, decimal o número de pedido/factura. */
export function looksLikeNonPersonalNumber(text: string, start: number, end: number): boolean {
  const before = fold(text.slice(Math.max(0, start - 30), start));
  const after = fold(text.slice(end, end + 10));
  return (
    CURRENCY_BEFORE.test(before) ||
    CURRENCY_AFTER.test(after) ||
    DECIMAL_AFTER.test(after) ||
    NEGATIVE_BEFORE.test(before)
  );
}
