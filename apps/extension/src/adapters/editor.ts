/**
 * Utilidades para editores contenteditable (ProseMirror). Nunca cambiamos innerText directamente:
 * el editor no se enteraría y enviaría su estado interno, que seguiría con los datos reales.
 * Usamos document.execCommand("insertText") o un evento paste sintético, que ProseMirror procesa
 * como si fuera del usuario.
 */

const BLOCK = new Set(["P", "DIV", "LI", "PRE", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL"]);

export interface TextMap {
  text: string;
  nodes: { node: Text; start: number }[];
}

/** Texto plano del editor (un salto de línea entre bloques) y la posición de cada nodo de texto. */
export function mapText(root: HTMLElement): TextMap {
  let text = "";
  const nodes: TextMap["nodes"] = [];
  const walk = (el: Node): void => {
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        nodes.push({ node: child as Text, start: text.length });
        text += (child as Text).data;
      } else if (child instanceof HTMLElement) {
        if (child.tagName === "BR") {
          if (!child.classList.contains("ProseMirror-trailingBreak")) text += "\n";
        } else if (BLOCK.has(child.tagName)) {
          if (text.length > 0 && !text.endsWith("\n")) text += "\n";
          walk(child);
        } else {
          walk(child);
        }
      }
    }
  };
  walk(root);
  return { text: text.replace(/\n+$/, ""), nodes };
}

function pointAt(map: TextMap, offset: number, preferNext: boolean): { node: Text; offset: number } | null {
  let fallback: { node: Text; offset: number } | null = null;
  for (const { node, start } of map.nodes) {
    const end = start + node.data.length;
    if (offset >= start && offset <= end) {
      if (preferNext && offset === end && end > start) {
        fallback = { node, offset: offset - start };
        continue;
      }
      return { node, offset: offset - start };
    }
  }
  return fallback;
}

export function rangeFor(root: HTMLElement, start: number, end: number): Range | null {
  const map = mapText(root);
  const a = pointAt(map, start, true);
  const b = pointAt(map, end, false);
  if (!a || !b) return null;
  const range = document.createRange();
  range.setStart(a.node, a.offset);
  range.setEnd(b.node, b.offset);
  return range;
}

function select(range: Range): void {
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

let internalPaste = false;

/** `true` mientras despachamos nuestro propio paste sintético (para no interceptarlo). */
export const isInternalPaste = (): boolean => internalPaste;

/** Pega `text` en la selección actual del editor como lo haría el usuario. */
export function insertText(editor: HTMLElement, text: string, range?: Range | null): void {
  editor.focus();
  if (range) select(range);
  if (!text.includes("\n") && document.execCommand("insertText", false, text)) return;

  const data = new DataTransfer();
  data.setData("text/plain", text);
  const event = new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true });
  internalPaste = true;
  try {
    editor.dispatchEvent(event);
  } finally {
    internalPaste = false;
  }
  // Si nadie gestionó el paste (editor que no es ProseMirror), recurrimos a insertText.
  if (!event.defaultPrevented) document.execCommand("insertText", false, text);
}

/** Sustituye todo el contenido del editor. */
export function setText(editor: HTMLElement, text: string): void {
  const range = document.createRange();
  range.selectNodeContents(editor);
  insertText(editor, text, range);
}

/**
 * Sustituye tramos concretos [start, end) del texto del editor, de atrás hacia delante, con
 * insertText sobre cada tramo. Conserva el formato del resto del mensaje.
 */
export function replaceRanges(editor: HTMLElement, replacements: { start: number; end: number; text: string }[]): boolean {
  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  let ok = true;
  for (const r of sorted) {
    const range = rangeFor(editor, r.start, r.end); // se recalcula: el editor puede rehacer nodos
    if (!range) {
      ok = false;
      continue;
    }
    editor.focus();
    select(range);
    if (!document.execCommand("insertText", false, r.text)) ok = false;
  }
  return ok;
}

/** Copia de la selección actual si está dentro del editor. */
export function saveSelection(editor: HTMLElement): Range | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
}
