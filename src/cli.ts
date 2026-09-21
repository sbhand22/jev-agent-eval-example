import "dotenv/config";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { evaluateRun } from "./evaluate.js";
import type { AgentRun } from "./types.js";

const fixturePath = process.argv[2] ?? "fixtures/passing-weather-run.json";
const run = JSON.parse(
  await readFile(resolve(fixturePath), "utf8"),
) as AgentRun;

const result = await evaluateRun(run);
console.log(JSON.stringify(result, null, 2));
