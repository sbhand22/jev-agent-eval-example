import { TypeSafeClient } from "@typesafe-ai/sdk";

import { applyPolicy } from "./policy.js";
import { evaluationQuestions } from "./questions.js";
import type { AgentRun, EvaluationSignals, Verdict } from "./types.js";

export type Evaluation = {
  model: string;
  signals: EvaluationSignals;
  verdict: Verdict;
};

export async function evaluateRun(run: AgentRun): Promise<Evaluation> {
  const apiKey = process.env.TYPESAFE_API_KEY ?? process.env.JEV_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Set TYPESAFE_API_KEY (preferred) or JEV_API_KEY before running the evaluator.",
    );
  }

  const client = new TypeSafeClient({ apiKey });
  const response = await client.systemOne({
    state: run,
    questions: evaluationQuestions,
  });

  const signals: EvaluationSignals = {
    groundedProbability: response.answers.grounded.noul,
    toolUse: response.answers.toolUse.choice,
    toolUseConfidence: response.answers.toolUse.confidence,
    usefulnessScore: response.answers.usefulness.score,
    usefulnessConfidence: response.answers.usefulness.confidence,
  };

  return {
    model: response.model,
    signals,
    verdict: applyPolicy(run, signals),
  };
}
