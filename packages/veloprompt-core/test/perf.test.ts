import { describe, expect, it } from "vitest";
import { detect } from "../src/index.js";
import { buildCorpus } from "../bench/corpus.mjs";

describe("rendimiento", () => {
  it("detect() sobre 50.000 caracteres tarda menos de 50 ms", () => {
    const text = buildCorpus(50_000);
    expect(text.length).toBeGreaterThanOrEqual(50_000);
    detect(text); // calentamiento del JIT
    const times: number[] = [];
    for (let i = 0; i < 7; i++) {
      const t0 = performance.now();
      detect(text);
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const median = times[3]!;
    console.info(`detect(50k): mediana ${median.toFixed(2)} ms`);
    expect(median).toBeLessThan(50);
  });
});
