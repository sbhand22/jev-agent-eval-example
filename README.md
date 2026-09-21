# Jev agent-eval example

A small, runnable example of **decision-first agent evaluation** with
[Jev](https://typesafe.ai/) and the
[TypeSafe JavaScript SDK](https://docs.typesafe.ai/sdk/javascript).

This repository demonstrates the evaluation architecture. It does **not**
reproduce LangChain's benchmark, run an agent, or call a weather service. It
evaluates saved agent traces so you can study the evaluator without adding
variation from the agent being evaluated.

Instead of asking a generative model for a long critique and parsing the prose,
this evaluator asks three bounded questions in one request:

1. **Noul:** Is the answer grounded in the supplied evidence?
2. **Choice:** Was the tool use appropriate, wasteful, or incorrect?
3. **Score:** How useful is the final answer on a three-level rubric?

Code keeps control of the workflow. It runs exact checks before reading an API
key or calling Jev, turns Jev's typed answers into a `pass`, `review`, or `fail`
verdict, and marks uncertain cases for review.

## How it works

```text
frozen agent run
      |
      v
deterministic checks ---- missing data ----> fail
      |
      v
one Jev request: grounding + tool use + usefulness
      |
      v
policy in code ---------- uncertainty ------> review handoff
      |
      +--------------------------------------> pass / fail
```

The example is deliberately a **frozen-trace evaluator**. A `review` verdict is
the handoff boundary; this sample does not implement a human-review queue or a
reasoning-model escalation. Connect that verdict to the review workflow used by
your application.

## Requirements

- Node.js 20 or newer
- A TypeSafe API key from the [TypeSafe console](https://console.typesafe.ai/)

Keep API keys server-side and never commit `.env`.

## Run it

```bash
git clone https://github.com/sbhand22/jev-agent-eval-example.git
cd jev-agent-eval-example
npm install
cp .env.example .env
```

Put your key in `.env` using the official variable name:

```dotenv
TYPESAFE_API_KEY=your_key_here
```

For compatibility with existing Jev examples, this repository also accepts:

```dotenv
JEV_API_KEY=your_key_here
```

Set one of these variables, not both. `TYPESAFE_API_KEY` takes precedence.

Then evaluate the passing fixture:

```bash
npm run eval
```

Or evaluate the deliberately unsupported answer:

```bash
npm run eval -- fixtures/unsupported-weather-run.json
```

The third fixture is intentionally grounded but incomplete, so it is designed
to exercise the `review` path:

```bash
npm run eval -- fixtures/ambiguous-weather-run.json
```

Jev outputs are probabilistic and model versions change, so the ambiguous
fixture is review-oriented rather than a promise of one exact live result.

The output contains the concrete model version, API token usage, reusable
semantic signals, their distributions, and the policy verdict:

```json
{
  "source": "jev",
  "model": "jev-1.13.0",
  "usage": {
    "input_tokens": 618,
    "output_tokens": 76
  },
  "signals": {
    "groundedProbability": 0.83,
    "toolUse": "appropriate",
    "toolUseConfidence": 1,
    "toolUseProbabilities": {
      "wasteful": 0,
      "appropriate": 1,
      "incorrect": 0
    },
    "usefulnessScore": 2,
    "usefulnessConfidence": 1,
    "usefulnessProbabilities": {
      "0": 0,
      "1": 0,
      "2": 1
    },
    "usefulnessLegend": {
      "0": "It does not answer the request.",
      "1": "It is partly useful but incomplete or indirect.",
      "2": "It completely and directly answers the request."
    }
  },
  "verdict": {
    "decision": "pass",
    "reasons": ["all checks cleared"]
  }
}
```

Exact numbers vary by input and model version. The values above show the output
shape; they are not promised results.

If an exact check fails, the function returns before any client or network work.
That result deliberately has no model, usage, or semantic signals:

```json
{
  "source": "deterministic",
  "verdict": {
    "decision": "fail",
    "reasons": ["no evidence was supplied"]
  }
}
```

## Use your own agent trace

Create a JSON file with this shape:

```json
{
  "request": "What the user asked",
  "finalAnswer": "What the agent answered",
  "evidence": ["Evidence the answer should rely on"],
  "toolCalls": [
    {
      "name": "tool_name",
      "input": { "argument": "value" }
    }
  ]
}
```

Run it with:

```bash
npm run eval -- path/to/your-run.json
```

## Project structure

```text
src/questions.ts   Three atomic Jev questions
src/evaluate.ts    Pre-checks, one TypeSafe call, and signal extraction
src/policy.ts      Deterministic checks and routing thresholds
src/parse.ts       Runtime validation for JSON trace input
src/cli.ts         Validated JSON fixture runner
fixtures/          Frozen passing, review-oriented, and failing examples
test/              Offline tests for parsing, ordering, mapping, and policy
```

## Customize it

- Edit `src/questions.ts` to match the dimensions that matter for your agent.
- Edit `src/policy.ts` to choose the consequences of each signal.
- Add frozen traces from production, including clear passes, failures, and
  ambiguous edge cases.
- Collect independent human labels and calibrate thresholds on held-out data.
- Pin and log model versions when evaluator stability matters.

The included thresholds are teaching defaults, not universal safety limits.
Confidence describes how concentrated a Choice or Score distribution is; it
does not prove the judgment is correct. A Noul already represents the
probability of “yes” and has no separate confidence field.

## Verify without spending API calls

The tests use fixed inputs and an in-memory fake client, so they do not need a
key or network access. They verify parsing, deterministic short-circuiting,
Jev-result mapping, and policy behavior:

```bash
npm run check
```

## References

- [TypeSafe System One](https://docs.typesafe.ai/concepts/system-one)
- [TypeSafe JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)
- [LangChain: Jev as a judge](https://www.langchain.com/blog/jev-agent-evals-langsmith)
- [LangChain benchmark repository](https://github.com/danielgshea/jev-as-a-judge)

## License

MIT
