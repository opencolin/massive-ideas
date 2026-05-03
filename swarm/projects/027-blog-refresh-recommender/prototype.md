# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
refresh_brief.json
   |
   v
validate_and_estimate_run
   |
   v
normalize_inventory
   |
   v
plan_keyword_queries
   |
   v
collect_current_serps
   |
   v
fetch_target_and_competing_pages
   |
   v
extract_topics_and_freshness_signals
   |
   v
compare_against_current_serp
   |
   v
score_refresh_queue
   |
   v
render_report_exports
```

## File Layout

```text
blog-refresh-recommender/
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
    extractPageSignals.ts
    compareCoverage.ts
    score.ts
    report.ts
    types.ts
  examples/
    crm-refresh-brief.json
    crm-refresh-report.json
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type Device = "desktop" | "mobile";
export type Priority = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";

export type RefreshType =
  | "no_action"
  | "metadata_refresh"
  | "section_addition"
  | "major_refresh"
  | "merge_or_redirect"
  | "split_into_new_post"
  | "source_outreach";

export interface RefreshBrief {
  site: {
    name: string;
    domain: string;
  };
  geo: {
    country?: string;
    city?: string;
    device: Device;
  };
  pages: Array<{
    url: string;
    primaryKeyword: string;
    secondaryKeywords: string[];
    businessPriority: Priority;
    lastUpdated?: string;
    knownRank?: number;
    trafficLast30Days?: number;
    conversionsLast30Days?: number;
  }>;
  competitors: Array<{ name: string; domain: string }>;
  requiredTopics: string[];
  exclusions: string[];
  maxSerpResultsPerKeyword: number;
  maxFetches: number;
}

export interface SerpObservation {
  id: string;
  pageUrl: string;
  keyword: string;
  query: string;
  country?: string;
  city?: string;
  device: Device;
  collectedAt: string;
  rank: number;
  resultType: "organic" | "paid" | "featured_snippet" | "people_also_ask" | "video" | "other";
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  matchedEntity: "target" | "competitor" | "neutral";
}

export interface PageObservation {
  id: string;
  requestedUrl: string;
  finalUrl: string;
  domain: string;
  fetchedAt: string;
  status: number;
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  contentHash: string;
  publishedDate?: string;
  modifiedDate?: string;
  extractedTopics: string[];
  extractedEntities: string[];
  modules: string[];
  freshnessSignals: string[];
  sourceType: "target_post" | "competitor_post" | "third_party_page" | "source_page" | "other";
}

export interface AiAnswerObservation {
  id: string;
  pageUrl: string;
  prompt: string;
  collectedAt: string;
  answer: string;
  targetMentioned: boolean;
  citedSources: Array<{ url: string; domain: string; title?: string }>;
}

export interface RefreshRecommendation {
  url: string;
  primaryKeyword: string;
  refreshScore: number;
  urgency: Priority;
  recommendedUpdateType: RefreshType;
  confidence: Confidence;
  whyNow: string;
  serpChangeSignals: string[];
  contentGaps: string[];
  recommendedActions: string[];
  evidence: Array<{
    observationId: string;
    sourceType: "google_serp" | "fetched_page" | "ai_answer";
    sourceUrl: string;
    observedFact: string;
  }>;
}

export interface RefreshReport {
  site: RefreshBrief["site"];
  generatedAt: string;
  geo: RefreshBrief["geo"];
  summary: string;
  refreshQueue: RefreshRecommendation[];
  serpObservations: SerpObservation[];
  pageObservations: PageObservation[];
  aiAnswerObservations: AiAnswerObservation[];
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
    finalUrl?: string;
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

## Query Planner

Generate query variants that reveal SERP change without exploding cost:

```ts
export function planQueries(brief: RefreshBrief): Array<{ pageUrl: string; keyword: string; query: string }> {
  return brief.pages.flatMap((page) => {
    const keywords = [page.primaryKeyword, ...page.secondaryKeywords];

    return keywords.flatMap((keyword) => [
      { pageUrl: page.url, keyword, query: keyword },
      { pageUrl: page.url, keyword, query: `${keyword} examples` },
      { pageUrl: page.url, keyword, query: `${keyword} template` }
    ]);
  });
}
```

Planner rules:

- Always include the exact primary keyword.
- Add examples, template, checklist, comparison, and best-practice modifiers only when they match the supplied keyword intent.
- Drop variants that match user exclusions.
- Deduplicate case-insensitive queries across pages but preserve URL attribution.
- Stop planning when estimated search and fetch count would exceed the brief budget.

## Collection Strategy

1. Preflight credits with `account_status`.
2. Fetch every target blog URL first to confirm canonical URLs and current content.
3. Search each planned query with Google SERP parsing and the configured country, city, and device.
4. Select pages to fetch:
   - Target URL if present in the SERP
   - Top competitor pages
   - Newly ranking neutral or third-party pages
   - Pages with snippets that indicate templates, examples, freshness, pricing, or FAQ intent
5. Fetch selected pages with JS rendering and captcha handling.
6. Ask `ai_chat_completion` for structured extraction only after raw observations are stored.

## Comparison Logic

For each target URL:

- Determine best current rank for every tracked keyword.
- Compare target title and snippet against higher-ranking titles and snippets.
- Compare target topics against repeated topics across the top relevant results.
- Detect dominant result type: definition guide, how-to guide, template page, comparison list, tool page, video, forum, or newsy update.
- Detect freshness pressure from visible dates, modified dates, recent examples, current screenshots, or year-specific language.
- Check whether chatbot answers cite the target, competitors, or third-party pages for the same buyer question.
- Emit only recommendation candidates with at least one source-backed observed fact.

## Scoring Sketch

```ts
export function scoreRecommendation(input: {
  rankDeltaSignal: number;
  intentDriftSignal: number;
  topicGapSignal: number;
  freshnessSignal: number;
  snippetMismatchSignal: number;
  aiCitationSignal: number;
  businessPriority: Priority;
  evidenceQuality: number;
}): number {
  const priorityBonus = input.businessPriority === "high" ? 5 : input.businessPriority === "medium" ? 3 : 1;

  return Math.min(
    100,
    Math.round(
      input.rankDeltaSignal * 20 +
        input.intentDriftSignal * 20 +
        input.topicGapSignal * 15 +
        input.freshnessSignal * 15 +
        input.snippetMismatchSignal * 10 +
        input.aiCitationSignal * 10 +
        priorityBonus +
        input.evidenceQuality * 5
    )
  );
}
```

Apply caps after base scoring for thin evidence, ambiguous intent, unfetched target content, or AI-only claims.

## Report Rendering

Produce three exports:

- JSON: complete observations, scores, recommendations, and evidence IDs.
- Markdown: executive summary, prioritized queue, per-URL recommendations, and evidence excerpts.
- CSV: one row per URL with score, urgency, recommended update type, why-now summary, top gaps, and evidence URLs.

Every rendered recommendation must include:

- URL and primary keyword
- Refresh score and urgency
- Recommended update type
- Specific content edits
- Evidence URLs
- Confidence level

## Implementation Notes

- Store raw observations before LLM summarization.
- Use deterministic domain normalization before matching target and competitor pages.
- Keep query, country, city, device, and collected timestamp on every SERP observation.
- Use content hashes to avoid reprocessing duplicate fetched pages.
- Do not use the model to infer ranks when parsed SERP ranks are available.
- Keep AI-answer observations separate from Google SERP observations in storage and reporting.
