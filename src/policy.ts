import type { AgentRun, EvaluationSignals, Verdict } from "./types.js";

const LIMITS = {
  groundedPass: 0.8,
  groundedFail: 0.35,
  usefulnessPass: 1.5,
  usefulnessFail: 0.75,
  semanticConfidence: 0.7,
  confidentToolFailure: 0.8,
} as const;

export function validateRun(run: AgentRun): string[] {
  const failures: string[] = [];

  if (run.request.trim().length === 0) failures.push("request is empty");
  if (run.finalAnswer.trim().length === 0) failures.push("final answer is empty");
  if (run.evidence.length === 0) failures.push("no evidence was supplied");

  return failures;
}

export function applyPolicy(
  run: AgentRun,
  signals: EvaluationSignals,
): Verdict {
  const exactFailures = validateRun(run);
  if (exactFailures.length > 0) {
    return { decision: "fail", reasons: exactFailures };
  }

  const hardFailures: string[] = [];
  if (signals.groundedProbability < LIMITS.groundedFail) {
    hardFailures.push("answer is probably not grounded");
  }
  if (signals.usefulnessScore < LIMITS.usefulnessFail) {
    hardFailures.push("answer is probably not useful");
  }
  if (
    signals.toolUse === "incorrect" &&
    signals.toolUseConfidence >= LIMITS.confidentToolFailure
  ) {
    hardFailures.push("tool use is confidently incorrect");
  }
  if (hardFailures.length > 0) {
    return { decision: "fail", reasons: hardFailures };
  }

  const reviewReasons: string[] = [];
  if (signals.groundedProbability < LIMITS.groundedPass) {
    reviewReasons.push("grounding is uncertain");
  }
  if (signals.toolUse !== "appropriate") {
    reviewReasons.push(`tool use was classified as ${signals.toolUse}`);
  }
  if (signals.toolUseConfidence < LIMITS.semanticConfidence) {
    reviewReasons.push("tool-use classification has low confidence");
  }
  if (signals.usefulnessScore < LIMITS.usefulnessPass) {
    reviewReasons.push("usefulness is below the pass threshold");
  }
  if (signals.usefulnessConfidence < LIMITS.semanticConfidence) {
    reviewReasons.push("usefulness score has low confidence");
  }

  return reviewReasons.length > 0
    ? { decision: "review", reasons: reviewReasons }
    : { decision: "pass", reasons: ["all checks cleared"] };
}
