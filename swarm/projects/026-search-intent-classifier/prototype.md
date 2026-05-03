# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
keyword_intent_brief.json + keywords.csv
   |
   v
validate_and_estimate_batch
   |
   v
normalize_and_cluster_keywords
   |
   v
select_serp_sample
   |
   v
collect_serp_evidence
   |
   v
fetch_unclear_ranking_pages
   |
   v
classify_intent_rows
   |
   v
calibrate_confidence_and_actions
   |
   v
render_exports
```

## File Layout

```text
search-intent-classifier/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    brief.ts
    keywordImport.ts
    normalize.ts
    cluster.ts
    sample.ts
    collectSerp.ts
    fetchPages.ts
    classify.ts
    confidence.ts
    report.ts
    types.ts
  examples/
    crm-brief.json
    crm-keywords.csv
    crm-intent-report.json
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type Device = "desktop" | "mobile";
export type Intent =
  | "informational"
  | "commercial"
  | "comparison"
  | "pricing"
  | "transactional"
  | "local"
  | "navigational"
  | "support"
  | "ambiguous"
  | "irrelevant";

export type Confidence = "low" | "medium" | "high";

export interface IntentBrief {
  project: {
    name: string;
    domain?: string;
    market?: string;
  };
  geo: {
    country?: string;
    city?: string;
    device: Device;
  };
  allowedIntents: Intent[];
  exclusions: string[];
  sampleSerpForEveryNKeywords: number;
  maxSerpResultsPerQuery: number;
  maxFetches: number;
}

export interface KeywordInputRow {
  keyword: string;
  volume?: number;
  cpc?: number;
  currentRank?: number;
  seedCategory?: string;
}

export interface KeywordCluster {
  id: string;
  canonicalKeyword: string;
  keywords: KeywordInputRow[];
  representativeKeyword: string;
  needsSerp: boolean;
  reasonForSampling: "high_value" | "ambiguous" | "representative" | "always_fetch";
}

export interface SerpObservation {
  id: string;
  keyword: string;
  query: string;
  country?: string;
  city?: string;
  device: Device;
  collectedAt: string;
  rank: number;
  resultType: "organic" | "paid" | "local_pack" | "video" | "people_also_ask" | "shopping" | "other";
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface PageObservation {
  id: string;
  url: string;
  domain: string;
  fetchedAt: string;
  status: number;
  title?: string;
  pageType?: string;
  extractedIntentSignals: string[];
  contentHash: string;
}

export interface IntentRow {
  keyword: string;
  volume?: number;
  primaryIntent: Intent;
  secondaryIntents: Intent[];
  recommendedPageType: string;
  funnelStage: "awareness" | "consideration" | "decision" | "retention" | "not_applicable";
  confidence: Confidence;
  confidenceReason: string;
  serpSampled: boolean;
  serpResultMix: Record<string, number>;
  evidence: Array<{
    observationId: string;
    sourceType: "keyword_text" | "google_serp" | "fetched_page" | "ai_classification";
    sourceUrl?: string;
    observedFact: string;
  }>;
  recommendedAction: string;
}

export interface IntentReport {
  project: IntentBrief["project"];
  generatedAt: string;
  geo: IntentBrief["geo"];
  keywordCount: number;
  intentDistribution: Record<Intent, number>;
  rows: IntentRow[];
  serpObservations: SerpObservation[];
  pageObservations: PageObservation[];
}
```

## Massive MCP Adapter

```ts
export interface MassiveClient {
  accountStatus(): Promise<{ ok: boolean; remaining?: number }>;
  webSearch(input: {
    query: string;
    country?: string;
    city?: string;
    device?: Device;
    parseSerp: true;
  }): Promise<Array<{
    rank: number;
    title: string;
    url: string;
    snippet?: string;
    resultType?: string;
  }>>;
  webFetch(input: {
    url: string;
    renderJs: boolean;
    country?: string;
    city?: string;
    device?: Device;
    captcha?: "auto" | "fail";
  }): Promise<{
    url: string;
    status: number;
    title?: string;
    markdown: string;
  }>;
  aiChatCompletion(input: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    responseFormat?: "json";
  }): Promise<{ content: string }>;
}
```

## Sampling Strategy

The classifier should not run a full SERP crawl for every keyword by default. It should spend evidence budget where it changes labels.

```ts
export function shouldSampleSerp(row: KeywordInputRow, index: number, brief: IntentBrief): boolean {
  const keyword = row.keyword.toLowerCase();
  const ambiguous = keyword.split(/\s+/).length <= 2;
  const highValue = (row.volume ?? 0) >= 1000 || (row.cpc ?? 0) >= 10;
  const explicitLocal = /\bnear me|in [a-z ]+$/.test(keyword);
  const explicitBrandOrSupport = /\blogin|docs|support|pricing|alternatives|vs\b/.test(keyword);

  return (
    highValue ||
    ambiguous ||
    explicitLocal ||
    explicitBrandOrSupport ||
    index % brief.sampleSerpForEveryNKeywords === 0
  );
}
```

For the MVP, classify every keyword with lexical and AI signals, run parsed SERPs for sampled representatives, and propagate cluster-level evidence only to near-duplicate variants. Low-confidence and high-volume rows should be queued for manual review.

## Classification Prompt Contract

`ai_chat_completion` should return JSON only:

```json
{
  "primary_intent": "comparison",
  "secondary_intents": ["commercial"],
  "recommended_page_type": "best-of comparison page",
  "funnel_stage": "consideration",
  "confidence": "high",
  "confidence_reason": "Keyword modifier and SERP result mix both indicate ranked vendor evaluation.",
  "serp_result_mix": {
    "listicles": 5,
    "vendor_pages": 3,
    "review_sites": 2
  },
  "recommended_action": "Map to a comparison cluster and review ranking listicles for criteria."
}
```

The system prompt must require the model to separate keyword wording, Google SERP evidence, fetched-page evidence, and inferred judgment. Any label based only on model intuition should be `medium` or `low` confidence.

## Export Rules

CSV columns:

- `keyword`
- `volume`
- `primary_intent`
- `secondary_intents`
- `recommended_page_type`
- `funnel_stage`
- `confidence`
- `confidence_reason`
- `serp_sampled`
- `recommended_action`
- `evidence_urls`

Markdown summary:

- Batch totals and intent distribution
- High-value commercial and comparison clusters
- Pricing and transactional opportunities
- Navigational, support, irrelevant, and excluded rows
- Low-confidence review queue
- Evidence coverage and skipped collection notes

## Implementation Notes

- Normalize domains before comparing SERP results.
- Keep country, city, and device on every observation.
- Store raw SERP and fetch observations separately from final labels.
- Use deterministic lexical rules for obvious modifiers before asking the model.
- Preserve model output and validation errors for auditability.
- Never treat search volume as evidence of intent.
- Never mark AI-only classification as high confidence for ambiguous keywords.
