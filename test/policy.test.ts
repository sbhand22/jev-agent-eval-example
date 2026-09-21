import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyPolicy } from "../src/policy.js";
import type { AgentRun, EvaluationSignals } from "../src/types.js";

const run: AgentRun = {
  request: "Do I need an umbrella?",
  finalAnswer: "Yes, take one.",
  evidence: ["Rain is likely."],
  toolCalls: [{ name: "weather", input: { location: "Boston" } }],
};

const passingSignals: EvaluationSignals = {
  groundedProbability: 0.96,
  toolUse: "appropriate",
  toolUseConfidence: 0.91,
  usefulnessScore: 1.9,
  usefulnessConfidence: 0.88,
};

describe("evaluation policy", () => {
  it("passes a strong, confident evaluation", () => {
    assert.equal(applyPolicy(run, passingSignals).decision, "pass");
  });

  it("routes uncertain semantic judgments to review", () => {
    const verdict = applyPolicy(run, {
      ...passingSignals,
      groundedProbability: 0.62,
    });

    assert.equal(verdict.decision, "review");
    assert.ok(verdict.reasons.includes("grounding is uncertain"));
  });

  it("fails a confidently ungrounded answer", () => {
    const verdict = applyPolicy(run, {
      ...passingSignals,
      groundedProbability: 0.12,
    });

    assert.equal(verdict.decision, "fail");
  });

  it("uses deterministic checks before semantic judgments", () => {
    const verdict = applyPolicy(
      { ...run, evidence: [] },
      passingSignals,
    );

    assert.deepEqual(verdict, {
      decision: "fail",
      reasons: ["no evidence was supplied"],
    });
  });
});
