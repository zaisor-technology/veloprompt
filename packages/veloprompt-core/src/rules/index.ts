import type { Rule } from "../types.js";
import { arRules } from "./ar.js";
import { clRules } from "./cl.js";
import { coRules } from "./co.js";
import { commonRules } from "./common.js";
import { ecRules } from "./ec.js";
import { esRules } from "./es.js";
import { mxRules } from "./mx.js";
import { peRules } from "./pe.js";

export const RULES: readonly Rule[] = [
  ...commonRules,
  ...ecRules,
  ...esRules,
  ...mxRules,
  ...clRules,
  ...coRules,
  ...peRules,
  ...arRules,
];
