import { build } from "esbuild";
import { resolve } from "node:path";

/** Empaqueta los adaptadores en un IIFE (window.VP) para probarlos sin la extensión. */
export default async function globalSetup(): Promise<void> {
  await build({
    entryPoints: [resolve(import.meta.dirname, "harness-entry.ts")],
    outfile: resolve(import.meta.dirname, "../.harness/harness.js"),
    bundle: true,
    format: "iife",
    globalName: "VP",
    target: "es2022",
    logLevel: "warning",
  });
}
