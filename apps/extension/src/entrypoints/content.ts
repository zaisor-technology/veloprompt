import { applyRedaction, detect, type Finding } from "veloprompt-core";
import { pickAdapter } from "../adapters";
import { insertText, isInternalPaste, saveSelection } from "../adapters/editor";
import { ConversationSessions } from "../lib/sessions";
import { MATCHES } from "../lib/sites";
import { DEFAULT_SETTINGS, toDetectOptions, type Settings } from "../lib/settings";
import { loadSettings, recordAvoided, watchSettings } from "../lib/storage";
import { showNotice } from "../ui/notice";
import { startRestorer } from "../ui/restorer";

export default defineContentScript({
  matches: MATCHES,
  runAt: "document_idle",
  async main() {
    const adapter = pickAdapter(location, import.meta.env.VP_E2E);
    if (!adapter) return;

    let settings: Settings = DEFAULT_SETTINGS;
    settings = await loadSettings();
    watchSettings((s) => (settings = s));
    const enabled = (): boolean => settings.sites[adapter.id];

    // Sesión por pestaña y conversación. Solo en memoria: se pierde al cerrar la pestaña.
    const sessions = new ConversationSessions(() => adapter.conversationKey());

    let busy = false; // hay un aviso abierto
    let bypassSend = false; // reenvío tras tapar o "Enviar igual"

    const veil = (text: string, findings: Finding[]): string => {
      void recordAvoided(findings.map((f) => f.type));
      return applyRedaction(text, findings, sessions.current());
    };

    // ------------------------------------------------------------ pegar
    window.addEventListener(
      "paste",
      (e) => {
        if (!enabled() || isInternalPaste() || busy) return;
        const editor = adapter.getEditor();
        if (!editor || !(e.target instanceof Node) || !editor.contains(e.target)) return;
        const text = e.clipboardData?.getData("text/plain");
        if (!text) return;
        const findings = detect(text, toDetectOptions(settings));
        if (findings.length === 0) return;

        e.preventDefault();
        e.stopImmediatePropagation();
        const range = saveSelection(editor);
        busy = true;
        void showNotice({ mode: "paste", text, findings, anchor: editor }).then((choice) => {
          busy = false;
          if (choice.kind === "cancel") return;
          const chosen = choice.kind === "all" ? findings : choice.kind === "some" ? choice.findings : [];
          insertText(editor, chosen.length ? veil(text, chosen) : text, range);
        });
      },
      true,
    );

    // ------------------------------------------------------------ enviar
    adapter.onSend((e) => {
      if (!enabled() || bypassSend) return;
      if (busy) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      const text = adapter.getText();
      const findings = detect(text, toDetectOptions(settings));
      if (findings.length === 0) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      busy = true;
      void showNotice({ mode: "send", text, findings, anchor: adapter.getEditor() }).then(async (choice) => {
        busy = false;
        if (choice.kind === "cancel") {
          adapter.getEditor()?.focus();
          return;
        }
        const chosen = choice.kind === "all" ? findings : choice.kind === "some" ? choice.findings : [];
        if (chosen.length) {
          void recordAvoided(chosen.map((f) => f.type));
          const session = sessions.current();
          adapter.replaceRanges(chosen.map((f) => ({ start: f.start, end: f.end, text: session.labelFor(f.type, f.value) })));
          // Seguridad: si algún dato elegido sigue en el editor, no enviamos.
          const after = adapter.getText();
          if (chosen.some((f) => after.includes(f.value))) {
            adapter.getEditor()?.focus();
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 60)); // deja que el editor propague su estado
        bypassSend = true;
        try {
          adapter.submit();
        } finally {
          bypassSend = false;
        }
      });
    });

    // ------------------------------------------------------------ respuestas
    startRestorer(adapter, () => sessions.current().map, enabled);
  },
});
