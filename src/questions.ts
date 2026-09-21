import { choice, noul, score } from "@typesafe-ai/sdk";

export const evaluationQuestions = {
  grounded: noul(
    "Is every substantive claim in `finalAnswer` supported by `evidence`?",
    {
      true: "The evidence supports all substantive claims in the final answer.",
      false:
        "At least one substantive claim is contradicted by, absent from, or stronger than the evidence.",
    },
  ),
  toolUse: choice("How appropriate were the `toolCalls` for the `request`?", {
    appropriate: "The tools were necessary and used with suitable inputs.",
    wasteful: "The result is valid, but one or more tool calls were unnecessary.",
    incorrect: "A wrong tool or input damaged the result.",
  }),
  usefulness: score("How useful is `finalAnswer` for the `request`?", [
    "It does not answer the request.",
    "It is partly useful but incomplete or indirect.",
    "It completely and directly answers the request.",
  ]),
};
