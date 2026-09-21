import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateRun,
  type EvaluationClient,
} from "../src/evaluate.js";
import type { AgentRun } from "../src/types.js";

const run: AgentRun = {
  request: "Do I need an umbrella?",
  finalAnswer: "Yes, take one.",
  evidence: ["Rain is likely."],
  toolCalls: [{ name: "weather", input: { location: "Boston" } }],
};

describe("run evaluation", () => {
  it("returns a deterministic failure before calling Jev", async () => {
    let calls = 0;
    const client: EvaluationClient = {
      systemOne() {
        calls += 1;
        throw new Error("the client must not be called");
      },
    };

    const result = await evaluateRun(
      { ...run, evidence: [] },
      { client },
    );

    assert.equal(calls, 0);
    assert.deepEqual(result, {
      source: "deterministic",
      verdict: {
        decision: "fail",
        reasons: ["no evidence was supplied"],
      },
    });
    assert.ok(!("signals" in result));
  });

  it("retains Jev distributions, rubric, and token usage", async () => {
    const client: EvaluationClient = {
      async systemOne() {
        return {
          model: "jev-test",
          usage: { input_tokens: 120, output_tokens: 9 },
          answers: {
            grounded: { type: "noul", noul: 0.96 },
            toolUse: {
              type: "choice",
              choice: "appropriate",
              confidence: 0.91,
              probabilities: {
                appropriate: 0.94,
                wasteful: 0.04,
                incorrect: 0.02,
              },
            },
            usefulness: {
              type: "score",
              score: 1.9,
              confidence: 0.88,
              probabilities: { "0": 0.01, "1": 0.08, "2": 0.91 },
              legend: {
                "0": "It does not answer the request.",
                "1": "It is partly useful but incomplete or indirect.",
                "2": "It completely and directly answers the request.",
              },
            },
          },
        };
      },
    };

    const result = await evaluateRun(run, { client });

    assert.equal(result.source, "jev");
    if (result.source !== "jev") assert.fail("expected a Jev evaluation");
    assert.deepEqual(result.usage, { input_tokens: 120, output_tokens: 9 });
    assert.deepEqual(result.signals.toolUseProbabilities, {
      appropriate: 0.94,
      wasteful: 0.04,
      incorrect: 0.02,
    });
    assert.deepEqual(result.signals.usefulnessProbabilities, {
      "0": 0.01,
      "1": 0.08,
      "2": 0.91,
    });
    assert.equal(result.verdict.decision, "pass");
  });
});
