import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseAgentRun } from "../src/parse.js";

const validRun = {
  request: "Do I need an umbrella?",
  finalAnswer: "Yes, take one.",
  evidence: ["Rain is likely."],
  toolCalls: [
    {
      name: "weather",
      input: {
        location: "Boston",
        options: { units: "metric", hourly: true },
      },
    },
  ],
};

describe("agent-run parsing", () => {
  it("returns a normalized AgentRun for valid JSON-shaped input", () => {
    assert.deepEqual(parseAgentRun(validRun), validRun);
  });

  it("rejects a missing or incorrectly typed field", () => {
    assert.throws(
      () => parseAgentRun({ ...validRun, evidence: "Rain is likely." }),
      /`evidence` must be an array of strings/,
    );
  });

  it("rejects tool inputs that are not JSON objects", () => {
    assert.throws(
      () =>
        parseAgentRun({
          ...validRun,
          toolCalls: [{ name: "weather", input: ["Boston"] }],
        }),
      /`toolCalls\[0\]\.input` must be a JSON object/,
    );
  });
});
