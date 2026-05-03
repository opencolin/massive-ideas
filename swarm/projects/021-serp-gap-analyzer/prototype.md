# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
serp_gap_brief.json
   |
   v
validate_and_estimate_run
   |
   v
expand_keyword_cluster
   |
   v
collect_serp_and_ai_surfaces
   |
   v
fetch_and_extract_ranking_pages
   |
   v
normalize_competitive_coverage
   |
   v
score_and_prioritize_gaps
   |
   v
render_report_exports
```

## File Layout

```text
serp-gap-analyzer/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    brief.ts
    planner.ts
    collectSerp.ts
    collectAnswers.ts
    fetchPages.ts
    extractTopics.ts
    normalize.ts
    score.ts
    report.ts
    types.ts
  examples/
    crm-brief.json
    crm-report.json
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type Device = "desktop" | "mobile";
export type Priority = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";

export type GapType =
  | "missing_serp_presence"
  | "weak_rank"
  | "topic_gap"
  | "intent_mismatch"
  | "source_gap"
  | "ai_answer_gap"
  | "localization_gap"
  | "snippet_gap";

export interface SerpGapBrief {
  target: {
    brand: string;
    domain: string;
  };
  geo: {
    country?: string;
    city?: string;
    device: Device;
  };
  keywordCluster: Array<{
    keyword: string;
    intent: "commercial" | "comparison" | "pricing" | "use_case" | "informational" | "local";
    priority: Priority;
  }>;
  competitors: Array<{ name: string; domain: string }>;
  requiredTopics: string[];
  exclusions: string[];
  maxSerpResultsPerKeyword: number;
  maxFetches: number;
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
  resultType: "organic" | "paid" | "local_pack" | "people_also_ask" | "other";
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  matchedEntity?: "target" | "competitor" | "neutral";
}

export interface PageObservation {
  id: string;
  url: string;
  domain: string;
  fetchedAt: string;
  status: number;
  title?: string;
  contentHash: string;
  extractedTopics: string[];
  extractedEntities: string[];
  intentSignals: string[];
  sourceType: "target_page" | "competitor_page" | "third_party_page" | "review_page" | "docs_page" | "other";
}

export interface AiAnswerObservation {
  id: string;
  prompt: string;
  collectedAt: string;
  answer: string;
  targetMentioned: boolean;
  competitorsMentioned: string[];
  citedSources: Array<{ url: string; domain: string; title?: string }>;
}

export interface GapCard {
  gapType: GapType;
  keyword?: string;
  severity: Priority;
  confidence: Confidence;
  whyItMatters: string;
  recommendedAction: string;
  evidence: Array<{
    observationId: string;
    sourceType: "google_serp" | "fetched_page" | "ai_answer";
    sourceUrl: string;
    observedFact: string;
  }>;
}

export interface SerpGapReport {
  target: SerpGapBrief["target"];
  generatedAt: string;
  geo: SerpGapBrief["geo"];
  clusterScore: number;
  summary: string;
  gaps: GapCard[];
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

Generate query variants without exploding cost:

```ts
export function planQueries(brief: SerpGapBrief): Array<{ keyword: string; query: string }> {
  return brief.keywordCluster.flatMap((item) => {
    const base = [{ keyword: item.keyword, query: item.keyword }];

    if (item.intent === "comparison") {
      return [
        ...base,
        { keyword: item.keyword, query: `${item.keyword} alternatives` },
        { keyword: item.keyword, query: `${item.keyword} comparison` }
      ];
    }

    if (item.intent === "pricing") {
      return [
        ...base,
        { keyword: item.keyword, query: `${brief.target.brand} pricing vs competitors` }
      ];
    }

    return base;
  });
}
```

For the MVP, collect up to 10 parsed results per query, fetch the top 60 deduplicated URLs, and always include any visible target-domain or competitor-domain URLs even if they rank below neutral articles.

## Collection Flow

```ts
export async function runSerpGapAnalysis(
  client: MassiveClient,
  brief: SerpGapBrief,
  now: Date
): Promise<SerpGapReport> {
  const status = await client.accountStatus();
  if (!status.ok) throw new Error("Massive account is not ready");

  const queries = planQueries(brief);
  const serpObservations = await collectSerpObservations(client, brief, queries);
  const urlsToFetch = selectFetchUrls(brief, serpObservations);
  const pageObservations = await fetchAndExtractPages(client, brief, urlsToFetch);
  const aiAnswerObservations = await collectAiAnswerObservations(client, brief);
  const gaps = await scoreGapCards(client, brief, serpObservations, pageObservations, aiAnswerObservations);

  return renderReport(brief, now, serpObservations, pageObservations, aiAnswerObservations, gaps);
}
```

## Gap Detection Rules

Start with deterministic rules, then use `ai_chat_completion` for summarization and recommendation wording:

- Missing presence: no target-domain result appears in the top N parsed organic results for a priority keyword.
- Weak rank: target domain appears below both the rank threshold and at least two competitor domains.
- Topic gap: required topics appear in at least two higher-ranking fetched pages but not in the best target page.
- Intent mismatch: the dominant top-10 result type is comparison, pricing, or local, but the target page is generic or informational.
- Source gap: third-party ranking pages mention competitors but omit the target brand.
- AI answer gap: chatbot answer omits the target or cites competitor/neutral sources more strongly.
- Localization gap: rank or relevance differs materially across configured locale/device comparisons.
- Snippet gap: titles and snippets for winning pages share buyer language absent from target snippets.

## Reporting

JSON is the canonical output. Markdown should be human-readable and concise:

```text
# SERP Gap Report: ExampleCRM

## Summary
Cluster score: 54/100

## Highest Priority Gaps
1. Missing comparison SERP presence for "best CRM for small business"
2. Agency workflow topic gap across competitor landing pages
3. AI answers cite review pages but not ExampleCRM

## Recommended Pages
- Comparison landing page for small-business CRM buyers
- Agency sales pipeline use-case page
- Third-party review and listicle outreach target list
```

CSV exports:

- `keyword-gaps.csv`: keyword, intent, priority, target_best_rank, competitor_best_rank, gap_type, severity, recommended_action.
- `ranking-urls.csv`: query, rank, domain, url, title, snippet, matched_entity, fetched, extracted_topics.

## Cost Controls

- Deduplicate URLs by canonical domain and normalized path.
- Fetch top-ranking pages first, then competitor pages, then target pages.
- Stop fetching after `maxFetches`, but keep unfetched SERP observations.
- Batch AI extraction by page excerpts rather than full raw page text.
- Record skipped URLs with reasons so the report explains evidence limits.

## Implementation Notes

- Use URL parsing for domain matching, including common subdomain normalization.
- Store raw observations separately from AI-authored summaries.
- Require every gap card to reference at least one observation ID.
- Keep exclusion matching before scoring so unrelated keyword meanings do not distort the report.
- Make scoring deterministic enough to regression test before adding advanced ranking models.
