import "dotenv/config";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { evaluateRun } from "./evaluate.js";
import { parseAgentRun } from "./parse.js";

const fixturePath = process.argv[2] ?? "fixtures/passing-weather-run.json";
const fixtureContents = await readFile(resolve(fixturePath), "utf8");

let parsed: unknown;
try {
  parsed = JSON.parse(fixtureContents);
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  throw new Error(`Invalid JSON in ${fixturePath}: ${detail}`, { cause: error });
}

const run = parseAgentRun(parsed);
const result = await evaluateRun(run);
console.log(JSON.stringify(result, null, 2));
