# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type RankBrief = {
  target: TargetBusiness;
  keywords: KeywordTarget[];
  locations: LocationTarget[];
  competitors?: Competitor[];
  rank_depth?: number;
  result_types?: ResultType[];
  exclusions?: string[];
};

type TargetBusiness = {
  business_name: string;
  domain: string;
  gbp_names?: string[];
};

type KeywordTarget = {
  query: string;
  intent: "local_service" | "service" | "comparison" | "brand" | "informational";
  priority: "high" | "medium" | "low";
};

type LocationTarget = {
  country: string;
  city: string;
  device: "desktop" | "mobile";
};

type Competitor = {
  name: string;
  domain?: string;
};

type ResultType = "organic" | "local_pack" | "maps" | "ads";

type QueryRun = {
  query: string;
  original_query: string;
  keyword: KeywordTarget;
  location: LocationTarget;
  max_results: number;
};

type RankObservation = {
  query: string;
  intent: KeywordTarget["intent"];
  location_key: string;
  country: string;
  city: string;
  device: "desktop" | "mobile";
  result_type: ResultType;
  rank: number;
  title?: string;
  snippet?: string;
  url?: string;
  domain?: string;
  business_name?: string;
  is_target: boolean;
  matched_target_by?: "domain" | "business_name" | "gbp_alias" | "url_redirect" | "none";
  matched_competitor?: string;
  serp_features: string[];
  fetched_at: string;
};

type LocationRankSummary = {
  country: string;
  city: string;
  device: "desktop" | "mobile";
  visibility_score: number;
  average_organic_rank?: number;
  local_pack_presence_rate: number;
  top_competitors: {
    name: string;
    domain?: string;
    best_rank: number;
    wins_against_target: number;
  }[];
  keyword_results: {
    query: string;
    intent: KeywordTarget["intent"];
    target_organic_rank?: number;
    target_local_pack_rank?: number;
    best_competitor_rank?: number;
    serp_features: string[];
    evidence_url?: string;
    confidence: "high" | "medium" | "low";
  }[];
  recommended_actions: string[];
};

type LocalRankReport = {
  target: TargetBusiness;
  summary: string;
  overall_visibility_score: number;
  locations: LocationRankSummary[];
  rank_gaps: {
    gap_type: "organic_absent" | "local_pack_absent" | "competitor_above_target" | "mobile_underperformance" | "ambiguous_match";
    city: string;
    device: "desktop" | "mobile";
    query: string;
    recommended_action: string;
  }[];
};
```

## Pipeline

```ts
async function runLocalRankCheck(brief: RankBrief): Promise<LocalRankReport> {
  const queryRuns = buildQueryRuns(brief);
  const estimatedCredits = estimateCredits(queryRuns, brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for local rank check");
  }

  const serpObservations = await collectRankObservations(brief, queryRuns);
  const fetchedPages = await fetchRankingPages(serpObservations, brief);
  const classified = await classifyMatchesAndRelevance(brief, serpObservations, fetchedPages);

  return synthesizeLocalRankReport(brief, classified);
}
```

## Query Planning

Generate city-aware query runs without losing the original keyword:

```ts
function buildQueryRuns(brief: RankBrief): QueryRun[] {
  const rankDepth = brief.rank_depth || 20;

  return brief.locations.flatMap(location =>
    brief.keywords.flatMap(keyword => {
      const queries = new Set<string>([keyword.query]);

      if (!keyword.query.toLowerCase().includes(location.city.toLowerCase())) {
        queries.add(`${keyword.query} ${location.city}`);
      }

      if (keyword.intent === "local_service" || keyword.query.includes("near me")) {
        queries.add(keyword.query);
      }

      return [...queries].map(query => ({
        query,
        original_query: keyword.query,
        keyword,
        location,
        max_results: keyword.priority === "high" ? rankDepth : Math.min(rankDepth, 10)
      }));
    })
  );
}
```

Optional expansion via `ai_chat_completion`:

```ts
async function expandLocalQueries(brief: RankBrief) {
  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Generate local SEO rank-check queries. Preserve commercial and local intent. Avoid job, DIY, and unrelated meanings."
      },
      {
        role: "user",
        content: JSON.stringify({
          business: brief.target.business_name,
          keywords: brief.keywords,
          locations: brief.locations,
          exclusions: brief.exclusions
        })
      }
    ]
  });
}
```

## SERP Collection

```ts
async function collectRankObservations(
  brief: RankBrief,
  queryRuns: QueryRun[]
): Promise<RankObservation[]> {
  const observations: RankObservation[] = [];

  for (const run of queryRuns) {
    const response = await massive.web_search({
      query: run.query,
      parse_google_serp: true,
      country: run.location.country,
      city: run.location.city,
      device: run.location.device,
      max_results: run.max_results
    });

    observations.push(...normalizeSerpResults(response, brief, run));
  }

  return observations;
}
```

Normalization should preserve:

- Organic results with rank, URL, title, snippet, and domain.
- Local pack and maps entries with rank, business name, rating metadata when available, and linked site URL.
- Ads as presence signals, without mixing them into organic rank.
- SERP features such as local pack, maps, people also ask, images, reviews, and directories.
- Target and competitor match candidates before final classification.

## Match Classification

Use deterministic matching first:

```ts
function markTargetMatches(brief: RankBrief, observation: RankObservation): RankObservation {
  const targetDomain = normalizeDomain(brief.target.domain);
  const observedDomain = observation.domain ? normalizeDomain(observation.domain) : undefined;
  const names = [brief.target.business_name, ...(brief.target.gbp_names || [])].map(normalizeName);

  if (observedDomain && observedDomain === targetDomain) {
    return { ...observation, is_target: true, matched_target_by: "domain" };
  }

  if (observation.business_name && names.includes(normalizeName(observation.business_name))) {
    return { ...observation, is_target: true, matched_target_by: "gbp_alias" };
  }

  if (observation.title && names.some(name => normalizeName(observation.title || "").includes(name))) {
    return { ...observation, is_target: true, matched_target_by: "business_name" };
  }

  return { ...observation, is_target: false, matched_target_by: "none" };
}
```

Use `ai_chat_completion` only for ambiguous cases:

- Business names with abbreviations or location suffixes.
- Franchise, branch, or practitioner pages.
- Directory listings that mention both target and competitors.
- Local pack entries with no website URL.
- Review pages that rank for the target but are not owned by the target.

## Fetching Evidence

Fetch a bounded set of pages:

- Target pages that ranked.
- Competitor pages above the target.
- Top local directories when they contain local pack or organic competitors.
- Pages that may be ambiguous target matches.

```ts
async function fetchRankingPages(observations: RankObservation[], brief: RankBrief) {
  const urls = chooseFetchCandidates(observations, {
    targetDomain: brief.target.domain,
    perQuery: 5,
    perDomain: 2,
    maxFetches: 50
  });

  return Promise.all(urls.map(url =>
    massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto"
    })
  ));
}
```

## Scoring Sketch

For each city-device pair:

1. Score organic visibility by weighted rank position:
   - rank 1-3: strong
   - rank 4-10: visible
   - rank 11-20: weak
   - absent: zero for that query
2. Score local pack presence separately:
   - rank 1-3 receives most credit
   - absent local pack entry is a major gap for local-service intent
3. Apply priority weights:
   - high: 1.0
   - medium: 0.7
   - low: 0.4
4. Subtract competitor pressure when watched competitors rank above the target.
5. Apply caps for sparse evidence, directory-only matches, or ambiguous target matching.
6. Generate recommendations from the largest city-keyword gaps.

## Exports

The MVP should write:

- `local-rank-report.json`: full structured report and all evidence.
- `local-ranks.csv`: one row per query, city, device, result type, and target rank.
- `competitor-wins.csv`: competitor ranks above target by query and city.
- `local-rank-report.md`: human-readable summary with city tables and source links.

## Implementation Notes

- Keep raw observations immutable after collection; add normalized and classified fields in separate steps.
- Store location keys as `country:city:device` with normalized lowercase city slugs.
- Never merge desktop and mobile ranks.
- Preserve ads but exclude them from organic rank averages.
- Treat "near me" queries as city-targeted through Massive MCP location targeting rather than replacing the phrase.
- Keep all AI-generated summaries tied to source observation IDs.
