# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type DemandBrief = {
  category: string;
  buyer?: string;
  regions: RegionTarget[];
  intents: DemandIntent[];
  known_competitors?: string[];
  exclusions?: string[];
};

type RegionTarget = {
  country: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type DemandIntent =
  | "commercial"
  | "comparison"
  | "local"
  | "pricing"
  | "problem-aware"
  | "informational";

type QueryPlanItem = {
  query: string;
  intent: DemandIntent;
  region: RegionTarget;
  priority: "high" | "medium" | "low";
};

type SerpEvidence = {
  query: string;
  intent: DemandIntent;
  region_key: string;
  rank: number;
  title: string;
  snippet?: string;
  url: string;
  domain: string;
  result_type?: "organic" | "local_pack" | "ad" | "map" | "people_also_ask" | "unknown";
  fetched_at: string;
};

type FetchedPage = {
  url: string;
  domain: string;
  title?: string;
  text: string;
  local_terms: string[];
  competitor_names: string[];
  relevance: "high" | "medium" | "low" | "irrelevant";
};

type RegionDemand = {
  country: string;
  city?: string;
  device: "desktop" | "mobile";
  demand_score: number;
  commercial_intent_score: number;
  competition_score: number;
  content_gap_score: number;
  recommended_action: string;
  top_queries: {
    query: string;
    intent: DemandIntent;
    serp_strength: number;
    evidence_count: number;
  }[];
  visible_competitors: {
    name: string;
    domain?: string;
    serp_mentions: number;
    best_rank: number;
    source_urls: string[];
  }[];
  local_language: string[];
  evidence: {
    claim: string;
    source_url: string;
    source_type: "serp_result" | "fetched_page" | "ai_summary_source";
    query?: string;
    rank?: number;
  }[];
  confidence: "high" | "medium" | "low";
};

type RegionalDemandReport = {
  category: string;
  summary: string;
  regions: RegionDemand[];
  cross_region_insights: string[];
};
```

## Pipeline

```ts
async function analyzeRegionalDemand(brief: DemandBrief): Promise<RegionalDemandReport> {
  const queryPlan = await createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for regional demand run");
  }

  const serpEvidence = await collectLocalizedSerps(queryPlan);
  const pages = await fetchRegionalEvidencePages(serpEvidence);
  const classified = await classifyEvidence(brief, serpEvidence, pages);

  return synthesizeRegionalDemand(brief, queryPlan, classified);
}
```

## Query Planning

```ts
async function createQueryPlan(brief: DemandBrief): Promise<QueryPlanItem[]> {
  const baseQueries = brief.regions.flatMap(region => {
    const place = region.city ? ` ${region.city}` : "";
    const buyer = brief.buyer ? ` for ${brief.buyer}` : "";

    return [
      { query: `${brief.category}${place}`, intent: "commercial", region, priority: "high" },
      { query: `best ${brief.category}${place}${buyer}`, intent: "comparison", region, priority: "high" },
      { query: `${brief.category} near me`, intent: "local", region, priority: "high" },
      { query: `${brief.category} pricing${place}`, intent: "pricing", region, priority: "medium" },
      { query: `${brief.category} services${place}${buyer}`, intent: "commercial", region, priority: "medium" },
      { query: `how to choose ${brief.category}${place}`, intent: "problem-aware", region, priority: "low" }
    ] as QueryPlanItem[];
  });

  const competitorQueries = brief.regions.flatMap(region =>
    (brief.known_competitors || []).flatMap(company => [
      {
        query: `${company} alternatives ${brief.category}${region.city ? ` ${region.city}` : ""}`,
        intent: "comparison",
        region,
        priority: "medium"
      }
    ] as QueryPlanItem[])
  );

  return dedupeQueryPlan([...baseQueries, ...competitorQueries]);
}
```

Optional expansion via `ai_chat_completion`:

```ts
async function expandRegionalQueries(brief: DemandBrief) {
  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Generate localized buyer-intent search queries. Avoid job, definition, and unrelated meanings."
      },
      {
        role: "user",
        content: JSON.stringify({
          category: brief.category,
          buyer: brief.buyer,
          regions: brief.regions,
          intents: brief.intents,
          exclusions: brief.exclusions
        })
      }
    ]
  });
}
```

## Localized SERP Collection

```ts
async function collectLocalizedSerps(queryPlan: QueryPlanItem[]): Promise<SerpEvidence[]> {
  const evidence: SerpEvidence[] = [];

  for (const item of queryPlan) {
    const response = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: item.region.country,
      city: item.region.city,
      device: item.region.device || "desktop",
      max_results: item.priority === "high" ? 10 : 6
    });

    evidence.push(...normalizeGoogleSerp(response, item));
  }

  return evidence;
}
```

Keep these fields for audit and scoring:

- Query text and generated intent
- Country, city, and device target
- Result rank and result type
- Title, snippet, URL, and domain
- SERP feature flags such as local pack, ads, maps, and comparison modules
- Collection timestamp

## Fetching Evidence

```ts
async function fetchRegionalEvidencePages(serpEvidence: SerpEvidence[]) {
  const urls = chooseFetchCandidates(serpEvidence, {
    perRegion: 12,
    perDomain: 2,
    includeTopRanks: 5
  });

  const pages = [];
  for (const url of urls) {
    pages.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return pages.filter(page => page.ok && page.text && page.text.length > 300);
}
```

Prioritize:

- City-specific service and landing pages
- Local directories and marketplace pages
- Pricing and comparison pages
- Ranking competitor pages
- Publisher guides that show local terminology
- Pages cited by multiple queries or regions

## Evidence Classification

```ts
async function classifyEvidence(brief, serpEvidence, pages) {
  return massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Classify localized demand evidence.",
          "Separate true regional buyer intent from jobs, definitions, and unrelated category meanings.",
          "Preserve source URLs, query lineage, region targets, and rank."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          serpEvidence,
          fetchedPages: pages.map(page => ({
            url: page.url,
            title: page.title,
            text: page.text.slice(0, 5000)
          }))
        })
      }
    ]
  });
}
```

## Scoring Sketch

```ts
function scoreRegion(regionKey, evidence, pages): RegionDemand {
  const relevantResults = evidence.filter(item => item.relevance !== "irrelevant");
  const commercialResults = relevantResults.filter(item =>
    ["commercial", "comparison", "pricing", "local"].includes(item.intent)
  );
  const localPackBoost = relevantResults.some(item => item.result_type === "local_pack") ? 8 : 0;
  const strongPageCount = pages.filter(page => page.region_key === regionKey && page.relevance === "high").length;

  const demand_score = clamp(
    rankWeightedScore(relevantResults) +
      intentCoverageScore(commercialResults) +
      regionLanguageScore(pages) +
      localPackBoost,
    0,
    100
  );

  return {
    ...emptyRegionDemand(regionKey),
    demand_score,
    commercial_intent_score: commercialIntentScore(commercialResults),
    competition_score: competitorDensityScore(relevantResults),
    content_gap_score: contentGapScore(relevantResults, strongPageCount),
    confidence: confidenceFor(relevantResults, pages)
  };
}
```

## Synthesis Prompt

```ts
async function synthesizeRegionalDemand(brief, queryPlan, classified) {
  return massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "You are a regional demand analyst.",
          "Use only provided SERP and fetched-page evidence.",
          "Rank regions by visible localized demand and explain uncertainty.",
          "Do not claim search volume, revenue, or market size unless directly provided."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ brief, queryPlan, classified })
      }
    ]
  });
}
```

## CLI Shape

```bash
regional-demand analyze \
  --brief demand-brief.json \
  --out regional-demand.json \
  --csv regions.csv \
  --report-md regional-demand.md \
  --max-results 10 \
  --fetch-per-region 12
```

Implementation modules:

- `brief.ts`: load and validate user input.
- `queries.ts`: create and dedupe localized query plans.
- `serp.ts`: call `web_search` and normalize Google SERP results.
- `fetch.ts`: choose URLs and call `web_fetch` with JS rendering and captcha handling.
- `classify.ts`: classify relevance, intent, competitors, and local language.
- `score.ts`: calculate regional demand, competition, and gap scores.
- `report.ts`: write JSON, CSV, and Markdown outputs.

## Edge Cases

- Same city name in multiple countries or states.
- Category queries that trigger job listings instead of buyer intent.
- "Near me" queries behaving differently on desktop and mobile.
- National brands outranking local providers in every city.
- Local directories ranking with thin or stale pages.
- SERP localization that changes when city targeting is absent.
- Ambiguous service names where exclusions must be applied before scoring.
