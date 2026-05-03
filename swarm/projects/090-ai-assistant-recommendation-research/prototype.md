# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type RecommendationBrief = {
  category: string;
  buyer_persona: string;
  use_case: string;
  constraints?: BuyerConstraints;
  prompt_variants: string[];
  watched_entities?: WatchedEntity[];
  assistant_runs: AssistantRun[];
  baseline_search_depth?: number;
};

type BuyerConstraints = {
  budget?: string;
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
  must_have?: string[];
  avoid?: string[];
};

type WatchedEntity = {
  name: string;
  domain?: string;
  aliases?: string[];
};

type AssistantRun = {
  name: string;
  temperature?: number;
  require_sources?: boolean;
  system_prompt?: string;
};

type BaselineSearchResult = {
  query: string;
  rank: number;
  title: string;
  snippet?: string;
  url: string;
  domain?: string;
  result_type: "organic" | "ad" | "paa" | "local" | "unknown";
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
  observed_at: string;
};

type AssistantAnswer = {
  run_id: string;
  assistant_run: string;
  prompt: string;
  raw_answer: string;
  model?: string;
  temperature?: number;
  generated_at: string;
  cited_urls: string[];
};

type RecommendationEntity = {
  run_id: string;
  prompt: string;
  assistant_run: string;
  name: string;
  domain?: string;
  aliases?: string[];
  rank?: number;
  mention_type: "recommended" | "alternative" | "mentioned" | "caveat" | "not_recommended";
  rationale: string[];
  buyer_fit?: string;
  caveats: string[];
  matched_watched_entity?: string;
  match_confidence: "high" | "medium" | "low";
  source_support: SourceSupport[];
};

type SourceSupport = {
  url: string;
  source_type: "official_site" | "pricing" | "docs" | "review" | "comparison" | "search_result" | "unknown";
  fetched_at?: string;
  supported_claims: string[];
  unsupported_claims: string[];
  confidence: "high" | "medium" | "low";
};

type EntitySummary = {
  name: string;
  domain?: string;
  recommendation_rate: number;
  average_rank?: number;
  assistant_mentions: number;
  baseline_serp_rank?: number;
  common_rationale: string[];
  unsupported_claims: string[];
  source_coverage: "high" | "medium" | "low";
};

type RecommendationReport = {
  category: string;
  generated_at: string;
  summary: string;
  recommendation_visibility_score: number;
  entities: EntitySummary[];
  assistant_comparisons: AssistantComparison[];
  positioning_actions: PositioningAction[];
};

type AssistantComparison = {
  assistant_run: string;
  prompt: string;
  top_recommendations: string[];
  omitted_watched_entities: string[];
  sources: SourceSupport[];
  confidence: "high" | "medium" | "low";
};

type PositioningAction = {
  entity: string;
  issue: string;
  recommended_action: string;
};
```

## Pipeline

```ts
async function runRecommendationResearch(brief: RecommendationBrief): Promise<RecommendationReport> {
  const plan = buildRunPlan(brief);
  const estimatedCredits = estimateCredits(plan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for AI recommendation research");
  }

  const baselineResults = await collectBaselineSearchEvidence(brief);
  const fetchedEvidence = await fetchEvidencePages(brief, baselineResults);
  const assistantAnswers = await collectAssistantAnswers(brief, baselineResults, fetchedEvidence);
  const parsedRecommendations = await parseRecommendations(brief, assistantAnswers, fetchedEvidence);
  const sourceChecked = await judgeSourceSupport(parsedRecommendations, fetchedEvidence);

  return synthesizeRecommendationReport(brief, baselineResults, sourceChecked);
}
```

## Prompt Planning

Build deterministic assistant tasks so differences are attributable to prompt, persona, and evidence context:

```ts
function buildRunPlan(brief: RecommendationBrief) {
  return brief.assistant_runs.flatMap(assistantRun =>
    brief.prompt_variants.map(prompt => ({
      run_id: createRunId(assistantRun.name, prompt),
      assistant_run: assistantRun,
      prompt: renderBuyerPrompt(brief, prompt, assistantRun)
    }))
  );
}

function renderBuyerPrompt(
  brief: RecommendationBrief,
  prompt: string,
  assistantRun: AssistantRun
): string {
  return [
    `Buyer persona: ${brief.buyer_persona}`,
    `Category: ${brief.category}`,
    `Use case: ${brief.use_case}`,
    `Budget: ${brief.constraints?.budget || "not specified"}`,
    `Must have: ${(brief.constraints?.must_have || []).join(", ") || "not specified"}`,
    `Avoid: ${(brief.constraints?.avoid || []).join(", ") || "not specified"}`,
    `Task: ${prompt}`,
    assistantRun.require_sources
      ? "Return ranked recommendations with source URLs for each important claim."
      : "Return ranked recommendations with concise rationale."
  ].join("\n");
}
```

## Baseline Evidence Collection

```ts
async function collectBaselineSearchEvidence(brief: RecommendationBrief): Promise<BaselineSearchResult[]> {
  const queries = buildBaselineQueries(brief);
  const results: BaselineSearchResult[] = [];

  for (const query of queries) {
    const response = await massive.web_search({
      query,
      parse_google_serp: true,
      country: brief.constraints?.country,
      city: brief.constraints?.city,
      device: brief.constraints?.device || "desktop",
      max_results: brief.baseline_search_depth || 20
    });

    results.push(...normalizeSearchResults(response, query, brief));
  }

  return results;
}

function buildBaselineQueries(brief: RecommendationBrief): string[] {
  return [
    `best ${brief.category}`,
    `${brief.category} alternatives`,
    `${brief.category} reviews`,
    `${brief.category} pricing`,
    ...brief.prompt_variants
  ];
}
```

## Evidence Fetching

Fetch only high-value pages before assistant synthesis and claim checking:

```ts
async function fetchEvidencePages(
  brief: RecommendationBrief,
  searchResults: BaselineSearchResult[]
) {
  const urls = selectEvidenceUrls(brief, searchResults);
  const pages = [];

  for (const url of urls) {
    pages.push(await massive.web_fetch({
      url,
      render_js: true,
      country: brief.constraints?.country,
      city: brief.constraints?.city,
      device: brief.constraints?.device || "desktop"
    }));
  }

  return pages;
}
```

## Assistant Runs

```ts
async function collectAssistantAnswers(
  brief: RecommendationBrief,
  baselineResults: BaselineSearchResult[],
  fetchedEvidence: unknown[]
): Promise<AssistantAnswer[]> {
  const plan = buildRunPlan(brief);
  const compactEvidence = summarizeEvidenceForPrompt(baselineResults, fetchedEvidence);
  const answers: AssistantAnswer[] = [];

  for (const task of plan) {
    const response = await massive.ai_chat_completion({
      system: task.assistant_run.system_prompt || defaultResearchSystemPrompt(),
      user: `${task.prompt}\n\nEvidence context:\n${compactEvidence}`,
      temperature: task.assistant_run.temperature ?? 0.2,
      response_format: "json"
    });

    answers.push(normalizeAssistantAnswer(task, response));
  }

  return answers;
}
```

## Recommendation Parsing

Use a second structured AI pass to avoid brittle parsing of prose answers:

```ts
async function parseRecommendations(
  brief: RecommendationBrief,
  answers: AssistantAnswer[],
  fetchedEvidence: unknown[]
): Promise<RecommendationEntity[]> {
  const parsed: RecommendationEntity[] = [];

  for (const answer of answers) {
    const response = await massive.ai_chat_completion({
      system: "Extract product recommendations as strict JSON. Preserve ranks, caveats, claims, and source URLs.",
      user: JSON.stringify({ brief, answer, fetchedEvidence }),
      temperature: 0,
      response_format: "json"
    });

    parsed.push(...normalizeRecommendationEntities(answer, response, brief));
  }

  return parsed;
}
```

## Source Support Judging

For every recommendation claim:

1. Match cited URLs to fetched pages or baseline SERP entries.
2. Classify source type and authority.
3. Mark each rationale as supported, unsupported, outdated, or not checkable.
4. Flag cited pages that mention the product but do not support the specific recommendation.
5. Preserve low-confidence matches for review rather than counting them as supported.

## Report Synthesis

`synthesizeRecommendationReport` should:

- Compute recommendation rate and average rank per normalized entity.
- Compare assistant rankings with baseline SERP visibility.
- Identify watched products omitted from relevant answers.
- Summarize repeated rationales and unsupported claims.
- Produce positioning actions grounded in observed source gaps.
- Include raw answer IDs and evidence IDs in JSON for auditability.

## Storage

Use append-only JSONL files for reproducibility:

- `baseline-search.jsonl`
- `fetched-pages.jsonl`
- `assistant-answers.jsonl`
- `recommendations.jsonl`
- `source-support.jsonl`
- `report.json`

## CLI Shape

```bash
ai-rec-research run \
  --brief recommendation-brief.json \
  --workspace ./runs/2026-05-02-sales-notetakers \
  --out report.json \
  --csv entities.csv \
  --markdown report.md
```

Useful flags:

- `--skip-fetch` for fast prompt-only experiments.
- `--require-sources` to reject unsourced assistant answers.
- `--watched-only` to focus scoring on known products.
- `--max-assistant-runs` to cap credit usage during testing.
- `--replay` to regenerate reports from stored JSONL without new Massive MCP calls.
