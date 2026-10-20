import { COUNTRIES, DATA_TYPES } from "veloprompt-core";
import type { Country, DataType, DetectOptions } from "veloprompt-core";

import { SITES, type SiteId } from "./sites";

export { SITES, type SiteId } from "./sites";

export interface Settings {
  sites: Record<SiteId, boolean>;
  countries: Country[];
  types: DataType[];
  customTerms: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  sites: Object.fromEntries(SITES.map((s) => [s.id, true])) as Record<SiteId, boolean>,
  countries: [...COUNTRIES],
  types: [...DATA_TYPES],
  customTerms: [],
};

/** Completa y limpia lo leído de storage (versiones antiguas, valores manipulados...). */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Settings>;
  const sites = { ...DEFAULT_SETTINGS.sites };
  for (const s of SITES) if (typeof r.sites?.[s.id] === "boolean") sites[s.id] = r.sites[s.id];
  const pickList = <T extends string>(value: unknown, allowed: readonly T[], fallback: T[]): T[] =>
    Array.isArray(value) ? allowed.filter((a) => value.includes(a)) : fallback;
  return {
    sites,
    countries: pickList(r.countries, COUNTRIES, [...COUNTRIES]),
    types: pickList(r.types, DATA_TYPES, [...DATA_TYPES]),
    customTerms: Array.isArray(r.customTerms)
      ? [...new Set(r.customTerms.filter((t): t is string => typeof t === "string").map((t) => t.trim()))].filter(
          (t) => t.length > 0,
        )
      : [],
  };
}

export function toDetectOptions(s: Settings): DetectOptions {
  return { countries: s.countries, types: s.types, customTerms: s.customTerms };
}

/** Una línea por término; se ignoran líneas vacías y duplicados. */
export function parseTerms(text: string): string[] {
  return sanitizeSettings({ customTerms: text.split("\n") }).customTerms;
}
