import type { SiteId } from "../lib/settings";

export interface SiteAdapter {
  id: SiteId;
  name: string;
  /** Editor de entrada (contenteditable) o null si aún no está en la página. */
  getEditor(): HTMLElement | null;
  /** Texto plano del editor, con un salto de línea entre párrafos. */
  getText(): string;
  /** Sustituye todo el texto del editor actualizando su estado interno. */
  setText(text: string): void;
  /** Sustituye tramos del texto devuelto por getText() sin perder el formato del resto. */
  replaceRanges(replacements: { start: number; end: number; text: string }[]): boolean;
  /**
   * Escucha los intentos de envío (Enter sin Shift en el editor y clic en el botón de enviar),
   * en fase de captura, antes que la propia web. Devuelve la función para dejar de escuchar.
   */
  onSend(cb: (event: Event) => void): () => void;
  /** Envía el mensaje como si el usuario pulsara el botón. */
  submit(): void;
  /** Contenedores de las respuestas de la IA (nunca el editor ni los mensajes del usuario). */
  getResponseContainers(): HTMLElement[];
  /** Identifica la conversación actual; empieza por "new" si aún no tiene identificador. */
  conversationKey(): string;
}
