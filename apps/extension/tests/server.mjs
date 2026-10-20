// Servidor estático mínimo para las páginas de prueba (solo 127.0.0.1).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const ROOT = join(import.meta.dirname, "pages");
const HARNESS = join(import.meta.dirname, ".harness");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
const PORT = 4173;
// Las rutas de conversación sirven la misma página, como una SPA.
const ROUTES = [
  ["/c/", "chatgpt.html"],
  ["/chat/", "claude.html"],
  ["/app/", "gemini.html"],
  ["/chats/", "copilot.html"],
  ["/search/", "perplexity.html"],
  ["/a/chat/s/", "deepseek.html"],
];

createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://x").pathname;
  const route = ROUTES.find(([prefix]) => path.startsWith(prefix));
  const file = route ? route[1] : path.slice(1) || "chatgpt.html";
  const base = file.startsWith("harness") ? HARNESS : ROOT;
  try {
    const body = await readFile(join(base, file.replace(/\.\./g, "")));
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("No encontrado");
  }
}).listen(PORT, "127.0.0.1", () => console.log(`Páginas de prueba en http://127.0.0.1:${PORT}`));
