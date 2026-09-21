# Jev agent-eval example

A small, runnable example of **decision-first agent evaluation** with
[Jev](https://typesafe.ai/) and the
[TypeSafe JavaScript SDK](https://docs.typesafe.ai/sdk/javascript).

Instead of asking a generative model for a long critique and parsing the prose,
this evaluator asks three bounded questions in one request:

1. **Noul:** Is the answer grounded in the supplied evidence?
2. **Choice:** Was the tool use appropriate, wasteful, or incorrect?
3. **Score:** How useful is the final answer on a three-level rubric?

Code keeps control of the workflow. It runs exact checks first, turns Jev's
typed answers into a `pass`, `review`, or `fail` verdict, and sends uncertain
cases to review.

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
policy in code ---------- uncertainty ------> review
      |
      +--------------------------------------> pass / fail
```

The example is deliberately a **frozen-trace evaluator**. It does not run an
agent or call a weather service, so changes in the agent cannot add noise while
you test the evaluator.

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

Put your key in `.env`:

```dotenv
TYPESAFE_API_KEY=your_key_here
```

Then evaluate the passing fixture:

```bash
npm run eval
```

Or evaluate the deliberately unsupported answer:

```bash
npm run eval -- fixtures/unsupported-weather-run.json
```

The output contains the concrete model version, reusable semantic signals, and
the policy verdict:

```json
{
  "model": "jev-1.13.0",
  "signals": {
    "groundedProbability": 0.82,
    "toolUse": "appropriate",
    "toolUseConfidence": 1,
    "usefulnessScore": 2,
    "usefulnessConfidence": 1
  },
  "verdict": {
    "decision": "pass",
    "reasons": ["all checks cleared"]
  }
}
```

Exact numbers vary by input and model version. The values above show the output
shape; they are not promised results.

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
src/evaluate.ts    One TypeSafe call and typed signal extraction
src/policy.ts      Deterministic checks and routing thresholds
src/cli.ts         JSON fixture runner
fixtures/          Frozen passing and failing examples
test/              Offline tests for the policy
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

The policy tests use fixed signals, so they do not need a key or network access:

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
