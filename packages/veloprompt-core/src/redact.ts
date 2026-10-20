import { detect } from "./detect.js";
import type { DataType, DetectOptions, Finding } from "./types.js";

/** Etiqueta → valor real, p. ej. `{ "[CEDULA_1]": "1712345678" }`. */
export type RedactionMap = Record<string, string>;

/** Clave de identidad: el mismo dato escrito con o sin separadores recibe la misma etiqueta. */
function identityKey(type: DataType, value: string): string {
  if (type === "CONTRASENA" || type === "CLAVE_API") return `${type}:${value}`;
  if (type === "EMAIL" || type === "PRIVADO") return `${type}:${value.toLowerCase()}`;
  return `${type}:${value.replace(/[\s.\-()]/g, "").toUpperCase()}`;
}

/**
 * Mantiene las etiquetas estables entre varias llamadas a `redact` (una conversación).
 * Todo vive en memoria; nada se persiste ni se envía.
 */
export class RedactionSession {
  private readonly labels = new Map<string, string>();
  private readonly counters = new Map<DataType, number>();
  private readonly entries: RedactionMap = {};

  labelFor(type: DataType, value: string): string {
    const key = identityKey(type, value);
    const existing = this.labels.get(key);
    if (existing) return existing;
    const n = (this.counters.get(type) ?? 0) + 1;
    this.counters.set(type, n);
    const label = `[${type}_${n}]`;
    this.labels.set(key, label);
    this.entries[label] = value;
    return label;
  }

  get map(): RedactionMap {
    return { ...this.entries };
  }
}

export function createSession(): RedactionSession {
  return new RedactionSession();
}

export interface RedactOptions extends DetectOptions {
  /** Sesión para conservar etiquetas entre llamadas. Si se omite, se crea una nueva. */
  session?: RedactionSession;
}

export interface RedactResult {
  text: string;
  /** Todas las etiquetas de la sesión con su valor real. */
  map: RedactionMap;
  findings: Finding[];
}

/** Sustituye cada dato sensible por una etiqueta estable (`[NIF_1]`, `[EMAIL_2]`...). */
export function redact(text: string, options: RedactOptions = {}): RedactResult {
  const session = options.session ?? new RedactionSession();
  const findings = detect(text, options);
  return { text: applyRedaction(text, findings, session), map: session.map, findings };
}

/**
 * Sustituye solo los hallazgos indicados (p. ej. los que el usuario marcó en una lista).
 * Deben venir de `detect(text)` sobre ese mismo texto y no solaparse.
 */
export function applyRedaction(text: string, findings: readonly Finding[], session: RedactionSession): string {
  let out = "";
  let cursor = 0;
  for (const f of [...findings].sort((a, b) => a.start - b.start)) {
    if (f.start < cursor) continue;
    out += text.slice(cursor, f.start) + session.labelFor(f.type, f.value);
    cursor = f.end;
  }
  return out + text.slice(cursor);
}

/** Vuelve a poner los valores reales en lugar de las etiquetas conocidas por `map`. */
export function restore(text: string, map: RedactionMap): string {
  return text.replace(/\[[A-Z_]+_\d+\]/g, (label) => map[label] ?? label);
}
