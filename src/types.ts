export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type AgentRun = {
  request: string;
  finalAnswer: string;
  evidence: string[];
  toolCalls: Array<{
    name: string;
    input: Record<string, JsonValue>;
  }>;
};

export type ToolUse = "appropriate" | "wasteful" | "incorrect";
export type UsefulnessLevel = "0" | "1" | "2";

export type EvaluationSignals = {
  groundedProbability: number;
  toolUse: ToolUse;
  toolUseConfidence: number;
  usefulnessScore: number;
  usefulnessConfidence: number;
};

export type JevEvaluationSignals = EvaluationSignals & {
  toolUseProbabilities: Record<ToolUse, number>;
  usefulnessProbabilities: Record<UsefulnessLevel, number>;
  usefulnessLegend: Record<UsefulnessLevel, string>;
};

export type EvaluationUsage = {
  input_tokens: number;
  output_tokens: number;
};

export type Verdict = {
  decision: "pass" | "review" | "fail";
  reasons: string[];
};
