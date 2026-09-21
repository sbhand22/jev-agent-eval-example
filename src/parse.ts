import type { AgentRun, JsonValue } from "./types.js";

function invalid(message: string): never {
  throw new Error(`Invalid agent run: ${message}`);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isJsonValue(value: unknown, seen = new Set<object>()): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;

  seen.add(value);
  const valid = Array.isArray(value)
    ? value.every((entry) => isJsonValue(entry, seen))
    : isPlainRecord(value) &&
      Object.values(value).every((entry) => isJsonValue(entry, seen));
  seen.delete(value);

  return valid;
}

function isJsonObject(value: unknown): value is Record<string, JsonValue> {
  return (
    isPlainRecord(value) &&
    Object.values(value).every((entry) => isJsonValue(entry))
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function parseAgentRun(value: unknown): AgentRun {
  if (!isPlainRecord(value)) invalid("expected a JSON object");
  if (typeof value.request !== "string") invalid("`request` must be a string");
  if (typeof value.finalAnswer !== "string") {
    invalid("`finalAnswer` must be a string");
  }
  if (!isStringArray(value.evidence)) {
    invalid("`evidence` must be an array of strings");
  }
  if (!Array.isArray(value.toolCalls)) {
    invalid("`toolCalls` must be an array");
  }

  const toolCalls = value.toolCalls.map((toolCall, index) => {
    if (!isPlainRecord(toolCall)) {
      invalid(`\`toolCalls[${index}]\` must be an object`);
    }
    if (typeof toolCall.name !== "string") {
      invalid(`\`toolCalls[${index}].name\` must be a string`);
    }
    if (!isJsonObject(toolCall.input)) {
      invalid(`\`toolCalls[${index}].input\` must be a JSON object`);
    }

    return {
      name: toolCall.name,
      input: { ...toolCall.input },
    };
  });

  return {
    request: value.request,
    finalAnswer: value.finalAnswer,
    evidence: [...value.evidence],
    toolCalls,
  };
}
