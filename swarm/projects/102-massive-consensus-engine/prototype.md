# Prototype

This prototype generalizes the existing Python consensus toolkit into a reusable Massive MCP idea.

## Data Model

```ts
type ConsensusRequest = {
  prompt: string;
  models: MassiveModel[];
  fastest_n?: number;
  require_sources?: boolean;
  output_schema?: Record<string, string>;
};

type ModelAnswer = {
  model: MassiveModel;
  status: "complete" | "timeout" | "failed";
  answer: string;
  sources: Source[];
  latency_ms: number;
  raw_response_path?: string;
};

type ConsensusResult = {
  prompt: string;
  answers: ModelAnswer[];
  source_domains: DomainOverlap[];
  claims: ClaimConsensus[];
  structured_fields?: FieldVote[];
  confidence: "high" | "medium" | "low";
  needs_human_review: boolean;
};
```

## Pipeline

1. Validate prompt and model list.
2. Check `account_status`.
3. Call `ai_chat_completion` for each model in parallel.
4. Normalize completion text.
5. Extract and normalize source domains.
6. Compare source overlap.
7. Use a synthesis prompt to extract claims from each answer.
8. Group claims by semantic similarity.
9. Score agreement and highlight disagreement.
10. Render aligned answers and consensus report.

## Lead-Enrichment Mode

For each company:

1. Ask every model for strict JSON.
2. Parse JSON leniently.
3. Vote per field.
4. Flag any field with no majority.
5. Export CSV with confidence and disagreement notes.

## CLI Shape

```bash
massive-ideas run \
  --idea 102 \
  --mode live \
  --input consensus-input.json \
  --out runs/consensus/browserbase.json
```

Dedicated follow-on:

```bash
massive-consensus ask "What does Browserbase do?"
massive-consensus enrich companies.csv --schema lead-schema.json
massive-consensus compare --via-mcp /path/to/dist/index.js "..."
```

## Scoring

- High confidence: three or more models agree and at least two independent source domains support the answer.
- Medium confidence: two models agree or one strongly sourced answer exists.
- Low confidence: answers conflict, sources are missing, or all sources point to weak aggregators.

## Implementation Notes

The source repo is pure-stdlib Python. The shared starter kit can implement the concept in Node for consistency, but the Python repo remains a strong reference for process orchestration, MCP stdio probing, and field-level lead-enrichment voting.
