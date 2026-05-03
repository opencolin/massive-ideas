# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type TerritoryResearchBrief = {
  concept: FranchiseConcept;
  candidate_territories: CandidateTerritory[];
  territory_rules: TerritoryRules;
  competitors?: Competitor[];
  research_queries: string[];
  substitute_categories?: string[];
  result_depth?: number;
};

type FranchiseConcept = {
  brand_name: string;
  category: string;
  domain?: string;
  customer_profile?: string;
  site_criteria?: string[];
  known_locations?: KnownLocation[];
};

type CandidateTerritory = {
  label: string;
  country: string;
  state?: string;
  cities: string[];
  zip_codes?: string[];
  counties?: string[];
  dma?: string;
};

type TerritoryRules = {
  protected_radius_miles?: number;
  minimum_population?: number;
  avoid_existing_brand_radius_miles?: number;
  exclusive_zip_policy?: "no_overlap" | "soft_overlap" | "unknown";
};

type Competitor = {
  name: string;
  domain?: string;
  aliases?: string[];
  category?: "direct" | "substitute" | "directory" | "unknown";
};

type KnownLocation = {
  label: string;
  city: string;
  state?: string;
  country: string;
  address?: string;
  zip_code?: string;
};

type EvidenceSurface =
  | "organic"
  | "local_pack"
  | "maps"
  | "ads"
  | "ai_overview"
  | "paa"
  | "directory"
  | "brand_locator"
  | "broker_listing"
  | "government"
  | "economic_development";

type ResearchIntent =
  | "demand"
  | "direct_competition"
  | "substitute_competition"
  | "brand_footprint"
  | "site_fit"
  | "market_proxy"
  | "regulatory";

type PlannedResearchQuery = {
  query: string;
  intent: ResearchIntent;
  territory: CandidateTerritory;
  city: string;
  country: string;
  device: "desktop" | "mobile";
  max_results: number;
};

type TerritoryObservation = {
  observation_id: string;
  territory_label: string;
  query: string;
  intent: ResearchIntent;
  country: string;
  state?: string;
  city: string;
  zip_code?: string;
  device: "desktop" | "mobile";
  surface: EvidenceSurface;
  rank?: number | null;
  title?: string;
  snippet?: string;
  url?: string;
  domain?: string;
  matched_competitor?: string;
  matched_brand_location?: string;
  location_hint?: string;
  evidence_url?: string;
  observed_at: string;
  confidence: "high" | "medium" | "low";
};

type TerritoryScorecard = {
  label: string;
  territory_score: number;
  demand_score: number;
  competition_score: number;
  brand_fit_score: number;
  protected_territory_score: number;
  evidence_score: number;
  recommended_action: "priority_diligence" | "watchlist" | "deprioritize" | "human_review";
  key_findings: string[];
  competitors: {
    name: string;
    observed_locations: number;
    top_surface: EvidenceSurface;
    evidence_observation_ids: string[];
  }[];
  risks: {
    type: "competitive_saturation" | "territory_overlap" | "weak_demand" | "poor_fit" | "ambiguous_evidence";
    severity: "high" | "medium" | "low";
    note: string;
    evidence_observation_ids: string[];
  }[];
};

type TerritoryResearchReport = {
  concept: FranchiseConcept;
  summary: string;
  ranked_territories: TerritoryScorecard[];
  observations: TerritoryObservation[];
};
```

## Pipeline

```ts
async function runTerritoryResearch(
  brief: TerritoryResearchBrief
): Promise<TerritoryResearchReport> {
  validateBrief(brief);

  const plannedQueries = buildResearchPlan(brief);
  const estimatedCredits = estimateCredits(plannedQueries, brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for territory research");
  }

  const serpObservations = await collectLocalResearch(brief, plannedQueries);
  const fetchedEvidence = await fetchHighValueSources(brief, serpObservations);
  const classified = await classifyMarketEvidence(brief, serpObservations, fetchedEvidence);
  const scored = scoreTerritories(brief, classified);

  return summarizeTerritoriesWithSources(brief, scored, classified);
}
```

## Query Planning

Build demand, competitor, and footprint searches for every candidate city. Use mobile for local-pack sensitivity and desktop for broader organic research.

```ts
function buildResearchPlan(brief: TerritoryResearchBrief): PlannedResearchQuery[] {
  const maxResults = brief.result_depth ?? 20;
  const devices: Array<"desktop" | "mobile"> = ["desktop", "mobile"];
  const plans: PlannedResearchQuery[] = [];

  for (const territory of brief.candidate_territories) {
    for (const city of territory.cities) {
      for (const device of devices) {
        for (const baseQuery of brief.research_queries) {
          plans.push({
            query: `${baseQuery} ${city}`,
            intent: "demand",
            territory,
            city,
            country: territory.country,
            device,
            max_results: maxResults
          });
        }

        for (const competitor of brief.competitors ?? []) {
          plans.push({
            query: `${competitor.name} locations ${city}`,
            intent: "direct_competition",
            territory,
            city,
            country: territory.country,
            device,
            max_results: Math.min(maxResults, 10)
          });
        }

        plans.push({
          query: `${brief.concept.brand_name} locations ${city}`,
          intent: "brand_footprint",
          territory,
          city,
          country: territory.country,
          device,
          max_results: Math.min(maxResults, 10)
        });
      }
    }
  }

  return plans;
}
```

Optional query expansion can ask AI for category-specific local searches:

```ts
async function expandResearchQueries(brief: TerritoryResearchBrief) {
  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Generate local franchise territory research queries. Return JSON only and separate demand, competitor, site-fit, and risk queries."
      },
      {
        role: "user",
        content: JSON.stringify({
          concept: brief.concept,
          candidate_territories: brief.candidate_territories,
          competitors: brief.competitors,
          substitute_categories: brief.substitute_categories
        })
      }
    ]
  });
}
```

## Collection

```ts
async function collectLocalResearch(
  brief: TerritoryResearchBrief,
  plannedQueries: PlannedResearchQuery[]
): Promise<TerritoryObservation[]> {
  const observations: TerritoryObservation[] = [];

  for (const plan of plannedQueries) {
    const response = await massive.web_search({
      query: plan.query,
      parse_google_serp: true,
      country: plan.country,
      city: plan.city,
      device: plan.device,
      max_results: plan.max_results
    });

    observations.push(...normalizeTerritorySerp(response, brief, plan));
  }

  return observations;
}
```

Fetch high-value pages after SERP collection:

- Brand locator and competitor locator pages.
- Directory pages with multiple local competitors.
- Local broker, chamber, and economic development pages.
- Pages that appear in AI answers or PAA snippets and support material claims.
- JS-heavy pages that require rendered fetches to expose location lists.

## Matching And Classification

Use deterministic matching first:

- Exact domain match for the brand or competitor.
- Alias match for competitor names and known DBAs.
- Local pack business-name match with address or city hint.
- Brand locator pages that list nearby locations.
- Directory pages labeled as third-party, never owned presence.

Use `ai_chat_completion` for ambiguous evidence:

```ts
async function classifyAmbiguousObservation(brief, observation, fetchedPage) {
  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Classify franchise territory evidence. Be conservative, cite observation IDs, and mark ambiguous matches for human review."
      },
      {
        role: "user",
        content: JSON.stringify({ concept: brief.concept, observation, fetchedPage })
      }
    ]
  });
}
```

## Scoring Logic

```ts
function scoreTerritory(territory, observations): TerritoryScorecard {
  const demandScore = scoreDemandSignals(observations);
  const competitionScore = scoreCompetitiveWhitespace(observations);
  const brandFitScore = scoreConceptFit(territory, observations);
  const protectedTerritoryScore = scoreProtectedTerritoryFeasibility(territory, observations);
  const evidenceScore = scoreEvidenceQuality(observations);

  let territoryScore = Math.round(
    demandScore * 0.25 +
      competitionScore * 0.2 +
      brandFitScore * 0.15 +
      protectedTerritoryScore * 0.15 +
      evidenceScore * 0.1 +
      scoreRecommendationClarity(observations) * 0.15
  );

  territoryScore = applyCaps(territoryScore, territory, observations);

  return buildScorecard(territory, {
    territoryScore,
    demandScore,
    competitionScore,
    brandFitScore,
    protectedTerritoryScore,
    evidenceScore
  });
}
```

## Exports

The MVP should write:

- `territory-report.json`: complete scorecards and observations.
- `territory-observations.csv`: one row per source-backed observation.
- `territory-brief.md`: executive summary, ranked territory table, risks, and evidence citations.

Every recommendation in the Markdown export should cite observation IDs so a reviewer can trace the claim back to SERP or fetched-page evidence.
