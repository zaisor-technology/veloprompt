// Benchmark simple: node bench/run.mjs (tras pnpm build). Usa el paquete compilado en dist/.
import { detect, redact } from "../dist/index.js";
import { buildCorpus } from "./corpus.mjs";

function measure(label, fn, runs = 50) {
  for (let i = 0; i < 5; i++) fn(); // calentamiento
  const times = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const pct = (p) => times[Math.min(times.length - 1, Math.floor(p * times.length))].toFixed(2);
  console.log(`${label.padEnd(28)} mediana ${pct(0.5)} ms · p95 ${pct(0.95)} ms`);
  return Number(pct(0.5));
}

const small = buildCorpus(2_000);
const large = buildCorpus(50_000);

measure("detect 2.000 caracteres", () => detect(small));
const median = measure("detect 50.000 caracteres", () => detect(large));
measure("redact 50.000 caracteres", () => redact(large));
console.log(`Hallazgos en 50k: ${detect(large).length}`);

if (median >= 50) {
  console.error(`✗ detect(50k) = ${median} ms, objetivo < 50 ms`);
  process.exitCode = 1;
} else {
  console.log("✓ objetivo < 50 ms cumplido");
}
