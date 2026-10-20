/*
 * Imitación mínima de ProseMirror para los tests. Lo importante: el editor tiene un ESTADO
 * INTERNO (state.paragraphs) que solo se actualiza con eventos (input, paste, teclado), y el
 * envío usa ese estado, no el DOM. Si alguien cambiara innerText directamente, el estado no se
 * enteraría y se enviarían los datos reales: justo lo que los tests deben detectar.
 * También vuelve a dibujar los párrafos tras cada cambio (nodos de texto nuevos), como ProseMirror.
 */
(function () {
  function textOf(p) {
    return Array.from(p.childNodes)
      .map((n) => (n.nodeType === 3 ? n.data : n.tagName === "BR" ? "" : n.textContent))
      .join("");
  }

  function createEditor(root, { onSubmit }) {
    const state = { paragraphs: [""] };
    root.contentEditable = "true";
    root.classList.add("ProseMirror");
    root.setAttribute("role", "textbox");
    root.setAttribute("translate", "no");

    function offsetOf(node, offset) {
      // Desplazamiento en el texto "\n"-unido del modelo.
      const ps = Array.from(root.children);
      let acc = 0;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (p === node) {
          let o = 0;
          for (let j = 0; j < offset; j++) o += textOf({ childNodes: [p.childNodes[j]] }).length;
          return acc + o;
        }
        if (p.contains(node)) {
          let o = 0;
          const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            if (walker.currentNode === node) return acc + o + offset;
            o += walker.currentNode.data.length;
          }
        }
        acc += textOf(p).length + 1;
      }
      return root === node && offset > 0 ? fullText().length : 0;
    }

    const fullText = () => state.paragraphs.join("\n");

    function selectionOffsets() {
      const sel = window.getSelection();
      if (!sel.rangeCount || !root.contains(sel.anchorNode)) {
        const end = fullText().length;
        return [end, end];
      }
      const r = sel.getRangeAt(0);
      return [offsetOf(r.startContainer, r.startOffset), offsetOf(r.endContainer, r.endOffset)];
    }

    function setCaret(offset) {
      let acc = 0;
      for (const p of root.children) {
        const len = textOf(p).length;
        if (offset <= acc + len) {
          const range = document.createRange();
          const t = p.firstChild && p.firstChild.nodeType === 3 ? p.firstChild : null;
          if (t) range.setStart(t, offset - acc);
          else range.setStart(p, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        }
        acc += len + 1;
      }
    }

    function render(caret) {
      root.replaceChildren(
        ...state.paragraphs.map((t) => {
          const p = document.createElement("p");
          if (t) p.append(document.createTextNode(t));
          else {
            const br = document.createElement("br");
            br.className = "ProseMirror-trailingBreak";
            p.append(br);
          }
          return p;
        }),
      );
      if (caret !== undefined && document.activeElement === root) setCaret(caret);
    }

    function replace(start, end, text) {
      const all = fullText();
      const next = all.slice(0, start) + text + all.slice(end);
      state.paragraphs = next.split("\n");
      render(start + text.length);
    }

    // Cambios hechos por el navegador (escribir, execCommand insertText): se leen del DOM.
    root.addEventListener("input", () => {
      const [caret] = selectionOffsets();
      const ps = Array.from(root.childNodes).map((n) => (n.nodeType === 3 ? n.data : textOf(n)));
      state.paragraphs = ps.length ? ps : [""];
      render(caret);
    });

    root.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData && e.clipboardData.getData("text/plain")) || "";
      const [s, en] = selectionOffsets();
      replace(s, en, text);
    });

    root.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (e.shiftKey) {
        const [s, en] = selectionOffsets();
        replace(s, en, "\n");
      } else onSubmit();
    });

    render();
    return {
      getText: fullText,
      clear() {
        state.paragraphs = [""];
        render(0);
      },
    };
  }

  /** Simula una respuesta en streaming: el texto llega en trozos, también a mitad de etiqueta. */
  function streamInto(el, text, chunk = 7, delay = 15) {
    return new Promise((resolve) => {
      let i = 0;
      const node = document.createTextNode("");
      el.append(node);
      const tick = () => {
        node.data = text.slice(0, (i += chunk));
        if (i < text.length) setTimeout(tick, delay);
        else resolve();
      };
      tick();
    });
  }

  window.FakeProseMirror = { createEditor, streamInto };
})();
