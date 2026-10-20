import { RULES } from "./rules/index.js";
import { hasContext, looksLikeNonPersonalNumber } from "./text.js";
import type { DataType, DetectOptions, Finding, Rule } from "./types.js";

interface Candidate extends Finding {
  priority: number;
  withContext: boolean;
}

const CUSTOM_PRIORITY = 1000;

function selectRules(options: DetectOptions): Rule[] {
  const countries = options.countries ? new Set<string>(options.countries) : null;
  const types = options.types ? new Set<string>(options.types) : null;
  return RULES.filter(
    (r) => (r.country === "GLOBAL" || !countries || countries.has(r.country)) && (!types || types.has(r.type)),
  );
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function customTermsPattern(terms: readonly string[]): RegExp | null {
  const clean = [...new Set(terms.map((t) => t.trim()).filter((t) => t.length > 0))];
  if (clean.length === 0) return null;
  clean.sort((a, b) => b.length - a.length);
  const alternation = clean.map(escapeRegExp).join("|");
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alternation})(?![\\p{L}\\p{N}_])`, "giu");
}

function runRule(text: string, rule: Rule, out: Candidate[]): void {
  const re = rule.pattern;
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    let value = m[0];
    let start = m.index;
    const group = m.indices?.groups?.v;
    if (group && m.groups?.v !== undefined) {
      value = m.groups.v;
      start = group[0];
    }

    if (rule.validate) {
      const result = rule.validate(value);
      if (result === false || result === null) continue;
      if (typeof result === "string") value = result;
    }
    const end = start + value.length;

    const withContext = rule.context ? hasContext(text, start, end, rule.context) : false;
    if (!withContext) {
      if (rule.requireContext === "always") continue;
      if (rule.requireContext === "unless-formatted" && !/[\s.-]/.test(value)) continue;
      if (rule.numeric && looksLikeNonPersonalNumber(text, start, end)) continue;
    }

    out.push({
      type: rule.type,
      country: rule.countryOf ? rule.countryOf(value) : rule.country,
      value,
      start,
      end,
      confidence: Math.round(Math.min(0.99, rule.confidence + (withContext ? 0.05 : 0)) * 100) / 100,
      rule: rule.id,
      priority: rule.priority,
      withContext,
    });
  }
}

/**
 * Entre hallazgos solapados gana: el que tiene palabra de contexto, después el de mayor
 * prioridad, después el más largo y, por último, el que empieza antes.
 */
function resolveOverlaps(candidates: Candidate[]): Finding[] {
  candidates.sort(
    (a, b) =>
      Number(b.withContext) - Number(a.withContext) ||
      b.priority - a.priority ||
      b.end - b.start - (a.end - a.start) ||
      a.start - b.start,
  );
  const accepted: Candidate[] = [];
  const rivals = new Map<Candidate, Set<DataType>>();
  for (const c of candidates) {
    const winner = accepted.find((a) => c.end > a.start && c.start < a.end);
    if (!winner) {
      accepted.push(c);
    } else if (c.type !== winner.type && c.start === winner.start && c.end === winner.end && c.confidence === winner.confidence) {
      const set = rivals.get(winner) ?? new Set<DataType>();
      set.add(c.type);
      rivals.set(winner, set);
    }
  }
  accepted.sort((a, b) => a.start - b.start);
  return accepted.map(({ priority: _p, withContext: _w, ...finding }, i) => {
    const alt = rivals.get(accepted[i]!);
    return alt ? { ...finding, ambiguous: true, alternatives: [...alt] } : finding;
  });
}

/** Detecta datos sensibles en `text`. No modifica el texto ni hace llamadas de red. */
export function detect(text: string, options: DetectOptions = {}): Finding[] {
  if (text.length === 0) return [];
  const candidates: Candidate[] = [];

  for (const rule of selectRules(options)) runRule(text, rule, candidates);

  const custom = options.customTerms ? customTermsPattern(options.customTerms) : null;
  if (custom && (!options.types || options.types.includes("PRIVADO"))) {
    for (const m of text.matchAll(custom)) {
      candidates.push({
        type: "PRIVADO",
        country: "GLOBAL",
        value: m[0],
        start: m.index,
        end: m.index + m[0].length,
        confidence: 1,
        rule: "custom",
        priority: CUSTOM_PRIORITY,
        withContext: true,
      });
    }
  }

  const min = options.minConfidence ?? 0;
  return resolveOverlaps(candidates).filter((f) => f.confidence >= min);
}
