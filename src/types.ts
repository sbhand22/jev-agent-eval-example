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

export type EvaluationSignals = {
  groundedProbability: number;
  toolUse: "appropriate" | "wasteful" | "incorrect";
  toolUseConfidence: number;
  usefulnessScore: number;
  usefulnessConfidence: number;
};

export type Verdict = {
  decision: "pass" | "review" | "fail";
  reasons: string[];
};
