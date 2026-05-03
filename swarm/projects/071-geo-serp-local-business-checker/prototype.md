# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type GeoSerpBrief = {
  target: TargetBusiness;
  keywords: KeywordTarget[];
  geo_targets: GeoTarget[];
  competitors?: Competitor[];
  rank_depth?: number;
  result_types?: ResultSurface[];
  exclusions?: string[];
};

type TargetBusiness = {
  business_name: string;
  domain: string;
  aliases?: string[];
  locations?: {
    label: string;
    city: string;
    country: string;
    address_hint?: string;
  }[];
};

type KeywordTarget = {
  query: string;
  intent: "urgent_local" | "service_local" | "comparison_local" | "brand" | "informational";
  priority: "high" | "medium" | "low";
};

type GeoTarget = {
  country: string;
  city: string;
  device: "desktop" | "mobile";
  language?: string;
};

type Competitor = {
  name: string;
  domain?: string;
  aliases?: string[];
};

type ResultSurface = "organic" | "local_pack" | "maps" | "ads" | "ai_overview" | "paa" | "directory";

type PlannedQuery = {
  query: string;
  original_query: string;
  keyword: KeywordTarget;
  geo: GeoTarget;
  max_results: number;
};

type SerpObservation = {
  observation_id: string;
  query: string;
  original_query: string;
  intent: KeywordTarget["intent"];
  priority: KeywordTarget["priority"];
  country: string;
  city: string;
  device: "desktop" | "mobile";
  surface: ResultSurface;
  rank?: number;
  title?: string;
  snippet?: string;
  url?: string;
  domain?: string;
  business_name?: string;
  serp_features: string[];
  matched_target_by?: "domain" | "alias" | "gbp_name" | "branch_name" | "directory_mention" | "redirect" | "ambiguous" | "none";
  matched_competitor?: string;
  evidence_url?: string;
  observed_at: string;
  confidence: "high" | "medium" | "low";
};

type GeoResultSummary = {
  country: string;
  city: string;
  device: "desktop" | "mobile";
  visibility_score: number;
  owned_organic_presence_rate: number;
  local_pack_presence_rate: number;
  average_owned_organic_rank?: number;
  top_serp_competitors: {
    name: string;
    domain?: string;
    appearances: number;
    wins_against_target: number;
    best_surface: ResultSurface;
  }[];
  keyword_results: {
    query: string;
    target_organic_rank?: number | null;
    target_local_pack_rank?: number | null;
    best_competitor_rank?: number | null;
    serp_features: string[];
    evidence_observation_ids: string[];
    confidence: "high" | "medium" | "low";
  }[];
  recommended_actions: string[];
};

type GeoSerpReport = {
  target: TargetBusiness;
  summary: string;
  overall_geo_visibility_score: number;
  geo_results: GeoResultSummary[];
  alerts: {
    type: "target_absent" | "local_pack_absent" | "competitor_above_target" | "mobile_underperformance" | "ambiguous_match";
    city: string;
    device: "desktop" | "mobile";
    query: string;
    surface: ResultSurface;
    message: string;
    evidence_observation_ids: string[];
  }[];
};
```

## Pipeline

```ts
async function runGeoSerpCheck(brief: GeoSerpBrief): Promise<GeoSerpReport> {
  validateBrief(brief);

  const plannedQueries = buildPlannedQueries(brief);
  const estimatedCredits = estimateCredits(plannedQueries, brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for geo SERP check");
  }

  const rawObservations = await collectSerps(brief, plannedQueries);
  const fetchedPages = await fetchEvidencePages(rawObservations, brief);
  const classified = await classifyAmbiguousMatches(brief, rawObservations, fetchedPages);
  const scored = scoreGeoVisibility(brief, classified);

  return summarizeWithSources(brief, scored);
}
```

## Query Planning

Build one query plan per keyword and geo target. Preserve the original keyword so rank tables can group city-modified and unmodified searches together.

```ts
function buildPlannedQueries(brief: GeoSerpBrief): PlannedQuery[] {
  const rankDepth = brief.rank_depth ?? 20;

  return brief.geo_targets.flatMap(geo =>
    brief.keywords.flatMap(keyword => {
      const queryVariants = new Set([keyword.query]);
      const normalizedQuery = keyword.query.toLowerCase();
      const normalizedCity = geo.city.toLowerCase();

      if (!normalizedQuery.includes(normalizedCity)) {
        queryVariants.add(`${keyword.query} ${geo.city}`);
      }

      return [...queryVariants].map(query => ({
        query,
        original_query: keyword.query,
        keyword,
        geo,
        max_results: keyword.priority === "high" ? rankDepth : Math.min(rankDepth, 10)
      }));
    })
  );
}
```

Optional AI expansion can add near-me, service-area, and branch-aware variants:

```ts
async function expandQueryVariants(brief: GeoSerpBrief) {
  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Generate local Google SERP check variants. Preserve commercial intent, avoid excluded meanings, and return JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          target: brief.target,
          keywords: brief.keywords,
          geo_targets: brief.geo_targets,
          exclusions: brief.exclusions
        })
      }
    ]
  });
}
```

## SERP Collection

```ts
async function collectSerps(
  brief: GeoSerpBrief,
  plannedQueries: PlannedQuery[]
): Promise<SerpObservation[]> {
  const observations: SerpObservation[] = [];

  for (const plan of plannedQueries) {
    const response = await massive.web_search({
      query: plan.query,
      parse_google_serp: true,
      country: plan.geo.country,
      city: plan.geo.city,
      device: plan.geo.device,
      language: plan.geo.language,
      max_results: plan.max_results
    });

    observations.push(...normalizeGoogleSerp(response, brief, plan));
  }

  return observations;
}
```

Normalization should preserve:

- Organic rank, URL, title, snippet, domain, and sitelink metadata when available.
- Local pack and maps entries with rank, business name, rating metadata, address hints, and linked site URL.
- Ads as paid visibility, never organic rank.
- AI overview, people also ask, reviews, images, and directories as separate surfaces.
- Query, city, country, device, evidence URL, collection timestamp, and raw result pointer.

## Matching

Use deterministic matching first:

```ts
function classifyDeterministicMatch(
  brief: GeoSerpBrief,
  observation: SerpObservation
): SerpObservation {
  const targetDomain = normalizeDomain(brief.target.domain);
  const observedDomain = observation.domain ? normalizeDomain(observation.domain) : undefined;
  const aliases = [brief.target.business_name, ...(brief.target.aliases ?? [])].map(normalizeName);

  if (observedDomain && observedDomain === targetDomain) {
    return { ...observation, matched_target_by: "domain", confidence: "high" };
  }

  if (observation.business_name && aliases.includes(normalizeName(observation.business_name))) {
    return { ...observation, matched_target_by: "alias", confidence: "high" };
  }

  for (const competitor of brief.competitors ?? []) {
    const competitorDomain = competitor.domain ? normalizeDomain(competitor.domain) : undefined;
    const competitorAliases = [competitor.name, ...(competitor.aliases ?? [])].map(normalizeName);

    if (competitorDomain && observedDomain === competitorDomain) {
      return { ...observation, matched_competitor: competitor.name, confidence: "high" };
    }

    if (observation.business_name && competitorAliases.includes(normalizeName(observation.business_name))) {
      return { ...observation, matched_competitor: competitor.name, confidence: "high" };
    }
  }

  return { ...observation, matched_target_by: "none" };
}
```

Then send ambiguous candidates to `ai_chat_completion` with only the relevant evidence:

- Target business name, aliases, domain, branch hints, and city.
- Candidate result title, snippet, URL, domain, business name, address hint, and fetched-page excerpt.
- Nearby competitors and exclusions.
- Required output: `target_match`, `competitor_match`, `match_reason`, `confidence`, and cited observation IDs.

## Page Verification

Fetch pages only when they can improve classification or recommendations:

- Target pages that rank for high-priority queries.
- Competitor pages above the target.
- Directory pages that mention the target or competitors.
- Local pack site URLs with ambiguous names.
- Pages whose snippets conflict with the intended local service.

Use `web_fetch` with JS rendering for pages that rely on client-rendered locations, reviews, or service-area content.

## Scoring

```ts
function scoreGeoPair(observations: SerpObservation[]): number {
  const ownedOrganic = scoreOwnedOrganic(observations);
  const localPack = scoreLocalPack(observations);
  const deviceConsistency = scoreDeviceConsistency(observations);
  const competitorPressure = scoreCompetitorPressure(observations);
  const relevance = scoreFetchedRelevance(observations);
  const evidence = scoreEvidenceCompleteness(observations);

  return applyCaps(Math.round(
    ownedOrganic * 0.25 +
    localPack * 0.25 +
    deviceConsistency * 0.15 +
    competitorPressure * 0.10 +
    relevance * 0.10 +
    scoreSerpCoverage(observations) * 0.10 +
    evidence * 0.05
  ), observations);
}
```

Important scoring rules:

- Ads can increase paid visibility context but cannot improve organic rank.
- Directory mentions are third-party visibility unless the target owns the page.
- Local pack presence rate only counts queries where a local pack was observed.
- Average organic rank excludes ads, local pack, maps, and AI overview mentions.
- Ambiguous matches reduce confidence and may cap the score.

## Exports

The MVP writes:

- `geo-serp-report.json`: complete report, observations, scores, and evidence lineage.
- `geo-serp-results.csv`: one row per query, geo target, result surface, and rank.
- `geo-serp-report.md`: human-readable summary with city-device tables and recommendations.

CSV columns:

```csv
observed_at,country,city,device,query,original_query,surface,rank,title,url,domain,business_name,match_type,matched_competitor,confidence,evidence_url
```

## CLI Shape

```bash
geo-serp-local-checker run \
  --brief geo-serp-brief.json \
  --out geo-serp-report.json \
  --csv geo-serp-results.csv \
  --report-md geo-serp-report.md \
  --max-concurrency 4
```

## Implementation Notes

- Keep the Massive MCP client behind a small adapter so tests can replay fixtures.
- Store raw parsed SERP payload pointers separately from normalized observations.
- Generate stable `observation_id` values from run ID, query, geo target, surface, and rank.
- Use concurrency limits per geo target to control credit burn and avoid noisy failures.
- Retry captcha or transient SERP failures with backoff, then mark the query as incomplete if it still fails.
- Require every AI-generated recommendation to cite observation IDs.
