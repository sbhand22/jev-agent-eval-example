import { TypeSafeClient, type SystemOneResult } from "@typesafe-ai/sdk";

import { applyPolicy, validateRun } from "./policy.js";
import { evaluationQuestions } from "./questions.js";
import type {
  AgentRun,
  EvaluationUsage,
  JevEvaluationSignals,
  Verdict,
} from "./types.js";

export type DeterministicFailure = {
  source: "deterministic";
  verdict: Verdict & { decision: "fail" };
};

export type JevEvaluation = {
  source: "jev";
  model: string;
  usage: EvaluationUsage;
  signals: JevEvaluationSignals;
  verdict: Verdict;
};

export type Evaluation = DeterministicFailure | JevEvaluation;

type EvaluationResponse = SystemOneResult<typeof evaluationQuestions>;

export type EvaluationClient = {
  systemOne(request: {
    state: AgentRun;
    questions: typeof evaluationQuestions;
  }): PromiseLike<EvaluationResponse>;
};

export type EvaluateRunOptions = {
  apiKey?: string;
  client?: EvaluationClient;
};

export async function evaluateRun(
  run: AgentRun,
  options: EvaluateRunOptions = {},
): Promise<Evaluation> {
  const exactFailures = validateRun(run);
  if (exactFailures.length > 0) {
    return {
      source: "deterministic",
      verdict: { decision: "fail", reasons: exactFailures },
    };
  }

  let response: EvaluationResponse;
  if (options.client) {
    response = await options.client.systemOne({
      state: run,
      questions: evaluationQuestions,
    });
  } else {
    const apiKey =
      options.apiKey ??
      process.env.TYPESAFE_API_KEY ??
      process.env.JEV_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Set TYPESAFE_API_KEY (preferred) or JEV_API_KEY before running the evaluator.",
      );
    }

    const client = new TypeSafeClient({ apiKey });
    response = await client.systemOne({
      state: run,
      questions: evaluationQuestions,
    });
  }

  const signals: JevEvaluationSignals = {
    groundedProbability: response.answers.grounded.noul,
    toolUse: response.answers.toolUse.choice,
    toolUseConfidence: response.answers.toolUse.confidence,
    toolUseProbabilities: { ...response.answers.toolUse.probabilities },
    usefulnessScore: response.answers.usefulness.score,
    usefulnessConfidence: response.answers.usefulness.confidence,
    usefulnessProbabilities: {
      ...response.answers.usefulness.probabilities,
    },
    usefulnessLegend: { ...response.answers.usefulness.legend },
  };

  return {
    source: "jev",
    model: response.model,
    usage: { ...response.usage },
    signals,
    verdict: applyPolicy(run, signals),
  };
}
