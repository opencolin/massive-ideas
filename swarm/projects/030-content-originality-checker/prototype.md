# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
originality_brief.json
   |
   v
validate_and_estimate_run
   |
   v
collect_competitive_serps
   |
   v
fetch_target_and_ranking_pages
   |
   v
extract_content_signals
   |
   v
compare_target_to_competitive_set
   |
   v
score_originality_and_risk
   |
   v
render_report_exports
```

## File Layout

```text
content-originality-checker/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    brief.ts
    planner.ts
    collectSerp.ts
    fetchPages.ts
    extractSignals.ts
    compareContent.ts
    score.ts
    report.ts
    types.ts
  examples/
    agency-crm-brief.json
    agency-crm-report.json
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type Device = "desktop" | "mobile";
export type Priority = "low" | "medium" | "high";
export type Severity = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";

export type FindingType =
  | "structure_overlap"
  | "topic_overlap"
  | "claim_overlap"
  | "example_overlap"
  | "wording_similarity"
  | "missing_original_asset"
  | "intent_gap"
  | "source_gap";

export interface OriginalityBrief {
  target: {
    brand: string;
    domain: string;
    url?: string;
    draftText?: string;
  };
  geo: {
    country?: string;
    city?: string;
    device: Device;
  };
  keywordCluster: Array<{
    keyword: string;
    intent: "commercial" | "comparison" | "informational" | "how_to" | "local";
    priority: Priority;
  }>;
  competitors: Array<{ name: string; domain: string }>;
  excludedDomains: string[];
  protectedOriginalAssets: string[];
  maxSerpResultsPerKeyword: number;
  maxFetches: number;
}

export interface SerpSource {
  id: string;
  query: string;
  keyword: string;
  rank: number;
  resultType: "organic" | "paid" | "people_also_ask" | "other";
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  country?: string;
  city?: string;
  device: Device;
  collectedAt: string;
}

export interface ContentSignal {
  id: string;
  url?: string;
  domain?: string;
  sourceRole: "target" | "ranking_page" | "competitor" | "neutral" | "ai_answer";
  title?: string;
  headings: string[];
  topics: string[];
  claims: string[];
  examples: string[];
  statistics: string[];
  entities: string[];
  distinctiveAssets: string[];
  contentHash: string;
}

export interface OverlapFinding {
  findingType: FindingType;
  severity: Severity;
  targetSection?: string;
  whyItMatters: string;
  recommendedAction: string;
  evidence: Array<{
    sourceType: "google_serp" | "fetched_page" | "ai_answer";
    sourceUrl: string;
    observedFact: string;
  }>;
}

export interface OriginalityReport {
  target: OriginalityBrief["target"];
  generatedAt: string;
  geo: OriginalityBrief["geo"];
  originalityScore: number;
  riskLevel: RiskLevel;
  summary: string;
  competitiveSet: SerpSource[];
  targetSignals: ContentSignal;
  competitiveSignals: ContentSignal[];
  overlapFindings: OverlapFinding[];
  originalityAssets: Array<{
    assetType: "first_party_data" | "customer_example" | "screenshot" | "methodology" | "expert_quote" | "other";
    targetSection?: string;
    strength: Severity;
    recommendation: string;
  }>;
  rewritePriorities: Array<{
    priority: number;
    section: string;
    rewriteGoal: string;
  }>;
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

## Collection Plan

```ts
export function planQueries(brief: OriginalityBrief): Array<{ keyword: string; query: string }> {
  return brief.keywordCluster.flatMap((item) => {
    const queries = [{ keyword: item.keyword, query: item.keyword }];

    if (item.intent === "comparison") {
      queries.push(
        { keyword: item.keyword, query: `${item.keyword} best` },
        { keyword: item.keyword, query: `${item.keyword} alternatives` }
      );
    }

    if (item.intent === "how_to") {
      queries.push({ keyword: item.keyword, query: `how to ${item.keyword}` });
    }

    return queries;
  });
}
```

Fetch selection rules:

- Always fetch the target URL when provided.
- Exclude target and configured excluded domains from the competitive baseline.
- Fetch top organic results first, then known competitor pages, then cited sources from AI answers when budget remains.
- Deduplicate URLs after canonicalization and redirect resolution.
- Keep page fetch failures as reportable evidence-quality events.

## Signal Extraction

Use `ai_chat_completion` with structured JSON output for each fetched page:

- Extract the visible outline and heading hierarchy.
- Extract normalized topics and entities.
- Extract claims, statistics, and evidence types.
- Extract concrete examples, screenshots, templates, workflows, and named customers.
- Identify first-party assets and source-worthy material.
- Label likely search intent and buyer journey stage.
- Produce short section summaries for later overlap comparison.

The comparator should combine deterministic and model-based signals:

- Exact and fuzzy heading overlap.
- Topic Jaccard similarity across target and ranking pages.
- Repeated claim clusters.
- Shared examples and generic scenarios.
- Paragraph-level embedding or shingle similarity when available.
- Model-reviewed originality findings with citations back to source URLs.

## Scoring Rules

```ts
export function riskFromScore(score: number): RiskLevel {
  if (score >= 75) return "low";
  if (score >= 50) return "medium";
  return "high";
}
```

Initial score calculation:

- Start at 100.
- Subtract up to 20 for structure overlap.
- Subtract up to 20 for topic overlap without added specificity.
- Subtract up to 15 for claim and example overlap.
- Subtract up to 15 for wording similarity.
- Subtract up to 15 for weak or missing first-party proof.
- Subtract up to 10 for intent mismatch.
- Subtract up to 5 for incomplete evidence collection.

## Report Rendering

The CLI should write:

- `originality-report.json`: complete structured report and raw observations.
- `originality-report.md`: editor-friendly summary, risk bands, section findings, and rewrite priorities.
- `overlap-findings.csv`: one row per finding with severity, section, recommendation, and evidence URL.
- `competitive-sources.csv`: query, rank, URL, domain, title, fetch status, and extracted topics.

## Guardrails

- Do not claim plagiarism from topical overlap alone.
- Do not evaluate private or gated content unless the user supplied it directly.
- Keep source URLs for every competitive claim.
- Label low-evidence reports when SERP collection, fetches, or extraction fail.
- Separate editorial differentiation from legal originality risk.
- Avoid recommending novelty that conflicts with the dominant search intent.
