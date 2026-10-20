import { createSession, type RedactionSession } from "veloprompt-core";

/** Clave de conversación. Las que empiezan por "new" son un chat nuevo aún sin identificador. */
export type ConversationKey = string;

/**
 * Una sesión de etiquetas por conversación, solo en memoria de la pestaña.
 * Cuando un chat nuevo recibe su identificador (tras el primer envío, la URL pasa de "/" a
 * "/c/<id>"), la sesión del chat nuevo se traslada a esa conversación para no perder etiquetas.
 */
export class ConversationSessions {
  private readonly sessions = new Map<ConversationKey, RedactionSession>();
  private lastKey: ConversationKey | null = null;

  constructor(private readonly keyOf: () => ConversationKey) {}

  current(): RedactionSession {
    const key = this.keyOf();
    const prev = this.lastKey;
    if (prev !== null && prev !== key && prev.startsWith("new") && !key.startsWith("new")) {
      const draft = this.sessions.get(prev);
      if (draft && !this.sessions.has(key)) this.sessions.set(key, draft);
      this.sessions.delete(prev);
    }
    this.lastKey = key;
    let session = this.sessions.get(key);
    if (!session) {
      session = createSession();
      this.sessions.set(key, session);
    }
    return session;
  }
}
