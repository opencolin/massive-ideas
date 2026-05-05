# Prototype

This prototype turns the existing daily tracker into a reusable Massive MCP idea module.

## Data Model

```ts
type BrandVisibilityConfig = {
  category: string;
  prompts: string[];
  brands: BrandAlias[];
  models: Array<"chatgpt" | "gemini" | "perplexity" | "copilot">;
  schedule?: "daily" | "weekly";
};

type BrandAlias = {
  name: string;
  aliases: string[];
};

type VisibilityObservation = {
  run_id: string;
  date: string;
  prompt: string;
  model: string;
  completion: string;
  sources: Source[];
  brand_mentions: BrandMention[];
  raw_response_path?: string;
};

type BrandMention = {
  brand: string;
  matched_alias: string;
  first_index: number;
  rank: number;
};

type VisibilityReport = {
  date: string;
  category: string;
  observations: VisibilityObservation[];
  consensus: ConsensusRow[];
  movement: MovementRow[];
  share_of_voice: ShareOfVoiceRow[];
};
```

## Pipeline

1. Load config.
2. Call `account_status`.
3. Fan out `ai_chat_completion(prompt, model)` across all prompt/model pairs.
4. Strip assistant UI chrome and normalize text.
5. Find aliases in completion text by first index.
6. Convert first index to rank.
7. Save append-only JSONL observations.
8. Diff against the previous run.
9. Render Markdown and CSV reports.

## CLI Shape

```bash
massive-ideas run \
  --idea 101 \
  --mode live \
  --input visibility-config.json \
  --out runs/visibility/2026-05-05.json
```

Dedicated app follow-on:

```bash
brand-visibility track --config config.json
brand-visibility report --since 7d
brand-visibility reprocess --aliases config.json
```

## Extraction Rules

- Lowercase text and aliases for matching.
- Prefer word-boundary matches for short aliases.
- Drop duplicate aliases after the first match per brand.
- Rank brands by `first_index`.
- Store `unmentioned` brands explicitly to make absences visible.

## Report Sections

- Executive summary.
- Per-model ranking table.
- Cross-model consensus table.
- New and dropped brands.
- Largest rank movement.
- Source coverage by model.
- Raw-response links for audit.

## Implementation Notes

The source repo uses JavaScript, JSONL, Markdown reports, and CSV output. The shared starter kit can reuse that shape without adding dependencies. A later dashboard can read the JSONL and CSV files directly.
