import { detect } from "../src/index.js";
import type { DetectOptions, Finding } from "../src/index.js";

export const N = 200; // iteraciones por regla con números generados

export function only(text: string, options?: DetectOptions): Finding {
  const found = detect(text, options);
  if (found.length !== 1) {
    throw new Error(`Se esperaba 1 hallazgo en ${JSON.stringify(text)} y hubo ${JSON.stringify(found)}`);
  }
  return found[0]!;
}

export const none = (text: string, options?: DetectOptions): Finding[] => detect(text, options);
