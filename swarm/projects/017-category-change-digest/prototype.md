# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
watch.json + previous_snapshot.json
   |
   v
plan_weekly_probes
   |
   v
collect_serp_and_answer_surfaces
   |
   v
fetch_candidate_sources
   |
   v
diff_against_previous_snapshot
   |
   v
extract_and_score_change_cards
   |
   v
render_digest_exports
```

## File Layout

```text
category-change-digest/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    watch.ts
    probes.ts
    collect.ts
    snapshot.ts
    diff.ts
    extract.ts
    score.ts
    report.ts
    types.ts
  examples/
    watch.ai-support.json
    previous-snapshot.json
  snapshots/
    .gitkeep
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type Device = "desktop" | "mobile";

export type ChangeType =
  | "product_launch"
  | "pricing_packaging"
  | "positioning"
  | "visibility_shift"
  | "funding_or_ma"
  | "partnership"
  | "regulation"
  | "hiring_or_org"
  | "incident_or_risk";

export type SourceType =
  | "serp_result"
  | "ai_answer_source"
  | "company_blog"
  | "changelog"
  | "pricing_page"
  | "docs_page"
  | "review_site"
  | "news_article"
  | "regulatory_page"
  | "other_public_page";

export interface CategoryWatch {
  category: string;
  alternateNames: string[];
  geo: {
    country?: string;
    city?: string;
    device: Device;
  };
  watchWindowDays: number;
  seedCompanies: Array<{ name: string; domain?: string }>;
  queryIntents: string[];
  trackedPages: string[];
  exclusions: string[];
  maxSearchResultsPerQuery: number;
  maxFetchesPerRun: number;
}

export interface Observation {
  id: string;
  observedAt: string;
  surface: "google_serp" | "fetched_page" | "ai_answer";
  sourceType: SourceType;
  queryOrPrompt?: string;
  rank?: number;
  title?: string;
  url: string;
  snippet?: string;
  contentHash?: string;
  extractedText?: string;
  entities: string[];
}

export interface ChangeCard {
  title: string;
  company?: string;
  changeType: ChangeType;
  observedAt: string;
  whyItMatters: string;
  impactScore: number;
  confidence: "low" | "medium" | "high";
  evidence: Array<{
    observationId: string;
    sourceUrl: string;
    sourceType: SourceType;
    observedChange: string;
  }>;
  recommendedFollowUp?: string;
}

export interface WeeklySnapshot {
  watchId: string;
  category: string;
  periodStart: string;
  periodEnd: string;
  observations: Observation[];
  changeCards: ChangeCard[];
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
    parseSerp?: boolean;
  }): Promise<Array<{
    title: string;
    url: string;
    snippet?: string;
    rank?: number;
  }>>;
  webFetch(input: {
    url: string;
    renderJs?: boolean;
    country?: string;
    city?: string;
    device?: Device;
    captcha?: "auto" | "fail";
  }): Promise<{
    url: string;
    title?: string;
    markdown: string;
    status: number;
  }>;
  aiChatCompletion(input: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    responseFormat?: "json";
  }): Promise<{ content: string }>;
}
```

## Probe Planner

Generate a compact weekly probe set from the watch:

```ts
export function planWeeklyQueries(watch: CategoryWatch, afterDate: string): string[] {
  const categoryTerms = [watch.category, ...watch.alternateNames];
  const companyQueries = watch.seedCompanies.flatMap((company) => [
    `${company.name} launch changelog after:${afterDate}`,
    `${company.name} pricing plan packaging after:${afterDate}`,
    `${company.name} partnership integration funding after:${afterDate}`
  ]);

  const categoryQueries = categoryTerms.flatMap((term) =>
    watch.queryIntents.map((intent) => `${term} ${intent} after:${afterDate}`)
  );

  return dedupe([...categoryQueries, ...companyQueries]).slice(0, 40);
}
```

For MVP cost control, run up to 40 search queries, keep the top 10 parsed SERP results per query, and fetch at most 80 deduplicated URLs. Official company URLs, changelogs, pricing pages, docs, and regulatory sources should outrank generic syndicated news when selecting fetches.

## Collection Flow

```ts
export async function collectWeeklySnapshot(
  client: MassiveClient,
  watch: CategoryWatch,
  previous: WeeklySnapshot | undefined,
  now: Date
): Promise<WeeklySnapshot> {
  const status = await client.accountStatus();
  if (!status.ok) throw new Error("Massive account is not ready");

  const afterDate = toISODate(addDays(now, -watch.watchWindowDays));
  const queries = planWeeklyQueries(watch, afterDate);
  const serpObservations = await collectSerpObservations(client, watch, queries);

  const fetchTargets = selectFetchTargets(serpObservations, watch, previous);
  const fetchedObservations = await fetchSourceObservations(client, watch, fetchTargets);

  const aiAnswerObservations = await collectAiAnswerObservations(client, watch);

  const observations = [
    ...serpObservations,
    ...fetchedObservations,
    ...aiAnswerObservations
  ];

  const candidateDiffs = diffObservations(previous?.observations ?? [], observations);
  const changeCards = await extractChangeCards(client, watch, candidateDiffs, observations);

  return buildSnapshot(watch, now, observations, changeCards);
}
```

## Diff Strategy

Use deterministic diffs before asking AI to interpret meaning:

- SERP delta: same query and URL changed rank by at least 3 positions, entered top 10, or left top 10.
- Citation delta: same recurring AI prompt added, removed, or changed a cited source.
- Page delta: same URL changed title, meaningful heading text, pricing text, changelog entry, or release note content hash.
- Entity delta: new company or source domain appears across at least two surfaces.
- Recency delta: fetched page includes a date inside the watch window.

The AI extraction step should receive only candidate diffs, short source excerpts, and lineage metadata. It should not scan the full crawl corpus when deterministic filtering can reduce cost and noise.

## Extraction Prompt

System:

```text
You extract weekly category changes from public web evidence.
Return strict JSON only. Do not invent facts.
Every change card must cite source URLs and observation IDs.
Separate observed facts from interpretation.
Treat AI answers as leads unless their cited sources support the claim.
If the business meaning is unclear, lower confidence or return a gap instead of a change card.
```

User:

```text
Category: AI customer support automation
Geography: United States / San Francisco / desktop
Period: 2026-04-25 to 2026-05-02
Exclusions: consumer help desk tutorials, generic chatbot news

Candidate diffs:
[
  {
    "kind": "page_delta",
    "url": "https://examplevendor.com/changelog/ai-escalation-routing",
    "previous": null,
    "current": "New changelog entry dated 2026-05-01..."
  }
]

Observations:
[
  {
    "id": "obs_123",
    "surface": "fetched_page",
    "sourceType": "changelog",
    "url": "https://examplevendor.com/changelog/ai-escalation-routing",
    "excerpt": "AI escalation routing is now available..."
  }
]
```

Expected JSON:

```json
{
  "change_cards": [
    {
      "title": "ExampleVendor launches AI escalation routing",
      "company": "ExampleVendor",
      "change_type": "product_launch",
      "observed_at": "2026-05-01",
      "why_it_matters": "The launch expands ExampleVendor's automation story beyond ticket deflection.",
      "impact_score": 84,
      "confidence": "high",
      "evidence": [
        {
          "observation_id": "obs_123",
          "source_url": "https://examplevendor.com/changelog/ai-escalation-routing",
          "source_type": "changelog",
          "observed_change": "A public changelog entry announced AI escalation routing."
        }
      ],
      "recommended_follow_up": "Check pricing and packaging pages for automation seat changes."
    }
  ],
  "gaps": []
}
```

## Report Renderer

Markdown digest structure:

```text
# What Changed This Week: AI Customer Support Automation

Period: 2026-04-25 to 2026-05-02
Geo: US / San Francisco / desktop

## Executive Summary

## Top Changes

## Search Visibility Deltas

## AI Answer Deltas

## Source Notes

## Gaps And Uncertainties
```

CSV exports should include one row per change card with title, company, change type, impact score, confidence, observed date, evidence URLs, and recommended follow-up.

## Implementation Notes

- Store raw observations separately from AI-generated change cards.
- Hash normalized page sections instead of full HTML to avoid false positives from navigation and cookie banners.
- Keep query and prompt IDs stable across weekly runs so deltas are comparable.
- Use source-specific extractors for pricing pages, changelogs, docs, and SERP records before falling back to generic AI extraction.
- Include a dry-run mode that shows planned queries, expected fetches, and credit estimate.
