import type { Finding } from "veloprompt-core";

export type PreviewPart = { text: string; finding?: Finding; index?: number };

/**
 * Fragmentos a mostrar en el aviso: cada dato resaltado con algo de contexto alrededor.
 * Los tramos largos sin datos se recortan con "…".
 */
export function buildPreview(text: string, findings: readonly Finding[], radius = 40): PreviewPart[] {
  const parts: PreviewPart[] = [];
  let cursor = 0;
  findings.forEach((f, index) => {
    const gap = text.slice(cursor, f.start);
    const isFirst = index === 0;
    if (gap.length > radius * 2) {
      if (!isFirst) parts.push({ text: gap.slice(0, radius) });
      parts.push({ text: isFirst ? "…" : " … " });
      parts.push({ text: gap.slice(-radius) });
    } else if (isFirst && gap.length > radius) {
      parts.push({ text: "…" + gap.slice(-radius) });
    } else if (gap) {
      parts.push({ text: gap });
    }
    parts.push({ text: f.value, finding: f, index });
    cursor = f.end;
  });
  const tail = text.slice(cursor);
  if (tail) parts.push({ text: tail.length > radius ? tail.slice(0, radius) + "…" : tail });
  return parts;
}
