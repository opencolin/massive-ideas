# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type TrendBrief = {
  category: VendorCategory;
  query_templates: string[];
  locations: LocationTarget[];
  watched_entities?: WatchedEntity[];
  rank_depth?: number;
  result_types?: ResultType[];
  cadence?: "daily" | "weekly" | "monthly" | "manual";
  alert_thresholds?: AlertThresholds;
};

type VendorCategory = {
  name: string;
  synonyms?: string[];
  excluded_meanings?: string[];
};

type LocationTarget = {
  country: string;
  city: string;
  device: "desktop" | "mobile";
};

type WatchedEntity = {
  name: string;
  domain?: string;
  aliases?: string[];
  entity_type?: "vendor" | "directory" | "marketplace" | "publisher" | "unknown";
};

type ResultType = "organic" | "local_pack" | "maps" | "ads";

type AlertThresholds = {
  rank_gain?: number;
  rank_loss?: number;
  new_top_10?: boolean;
  local_pack_change?: boolean;
};

type QueryRun = {
  query: string;
  template: string;
  category: VendorCategory;
  location: LocationTarget;
  max_results: number;
};

type SerpObservation = {
  snapshot_id: string;
  observed_at: string;
  query: string;
  template: string;
  country: string;
  city: string;
  device: "desktop" | "mobile";
  result_type: ResultType;
  rank: number;
  title?: string;
  snippet?: string;
  url?: string;
  domain?: string;
  entity_name?: string;
  entity_type: "vendor" | "directory" | "marketplace" | "publisher" | "ad" | "unknown";
  matched_watched_entity?: string;
  match_confidence: "high" | "medium" | "low";
  serp_features: string[];
  source_url?: string;
};

type Movement = {
  entity_name: string;
  domain?: string;
  entity_type: SerpObservation["entity_type"];
  query: string;
  country: string;
  city: string;
  device: "desktop" | "mobile";
  result_type: ResultType;
  previous_rank?: number;
  current_rank?: number;
  delta?: number;
  state: "gained" | "lost" | "unchanged" | "new_top_10" | "lost_top_10" | "new_local_pack" | "lost_local_pack";
  confidence: "high" | "medium" | "low";
};

type TrendReport = {
  category: string;
  snapshot_at: string;
  summary: string;
  market_trend_score: number;
  locations: LocationTrendSummary[];
  persistent_sources: PersistentSource[];
};

type LocationTrendSummary = {
  country: string;
  city: string;
  device: "desktop" | "mobile";
  visibility_leaders: VisibilityLeader[];
  query_trends: QueryTrend[];
  alerts: TrendAlert[];
};

type VisibilityLeader = {
  entity: string;
  domain?: string;
  entity_type: SerpObservation["entity_type"];
  share_of_top_10: number;
  best_rank: number;
  movement: string;
};

type QueryTrend = {
  query: string;
  serp_features: string[];
  new_top_10_entities: string[];
  lost_top_10_entities: string[];
  local_pack_changes: Movement[];
  evidence_url?: string;
  confidence: "high" | "medium" | "low";
};

type TrendAlert = {
  alert_type: "watched_vendor_gain" | "watched_vendor_loss" | "new_competitor" | "directory_takeover" | "local_pack_change" | "ambiguous_match";
  severity: "high" | "medium" | "low";
  entity?: string;
  query: string;
  reason: string;
  recommended_action: string;
};

type PersistentSource = {
  domain: string;
  entity_type: SerpObservation["entity_type"];
  cities_visible: number;
  queries_visible: number;
  trend: "rising" | "falling" | "stable" | "new";
};
```

## Pipeline

```ts
async function runTrendSnapshot(brief: TrendBrief, history: SerpObservation[]): Promise<TrendReport> {
  const queryRuns = buildQueryRuns(brief);
  const estimatedCredits = estimateCredits(queryRuns, brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for vendor SERP trend snapshot");
  }

  const snapshotId = createSnapshotId();
  const rawObservations = await collectSerpSnapshot(brief, queryRuns, snapshotId);
  const pages = await fetchEvidencePages(rawObservations, brief);
  const classified = await classifyEntities(brief, rawObservations, pages);
  const movement = compareWithHistory(classified, history);

  return synthesizeTrendReport(brief, classified, movement, history);
}
```

## Query Planning

Expand templates with city and category variants while preserving the original template for trend grouping:

```ts
function buildQueryRuns(brief: TrendBrief): QueryRun[] {
  const rankDepth = brief.rank_depth || 20;
  const categories = [brief.category.name, ...(brief.category.synonyms || [])];

  return brief.locations.flatMap(location =>
    brief.query_templates.flatMap(template =>
      categories.map(categoryName => {
        const query = template
          .replaceAll("{category}", categoryName)
          .replaceAll("{city}", location.city);

        return {
          query,
          template,
          category: brief.category,
          location,
          max_results: rankDepth
        };
      })
    )
  );
}
```

## SERP Collection

```ts
async function collectSerpSnapshot(
  brief: TrendBrief,
  queryRuns: QueryRun[],
  snapshotId: string
): Promise<SerpObservation[]> {
  const observations: SerpObservation[] = [];
  const observedAt = new Date().toISOString();

  for (const run of queryRuns) {
    const response = await massive.web_search({
      query: run.query,
      parse_google_serp: true,
      country: run.location.country,
      city: run.location.city,
      device: run.location.device,
      max_results: run.max_results
    });

    observations.push(...normalizeGoogleSerp(response, brief, run, snapshotId, observedAt));
  }

  return observations;
}
```

Normalization should preserve:

- Organic results with rank, URL, title, snippet, and domain.
- Local pack and maps entries with rank, business name, linked site URL, and rating metadata when available.
- Ads as paid visibility, separated from organic rank.
- SERP features such as people also ask, review snippets, local pack, maps, and shopping modules.
- Source URL or request metadata for auditability.

## Entity Classification

Use deterministic matching first, then AI for ambiguous cases:

```ts
async function classifyEntities(
  brief: TrendBrief,
  observations: SerpObservation[],
  fetchedPages: FetchedPage[]
): Promise<SerpObservation[]> {
  const deterministic = observations.map(observation =>
    matchWatchedEntityByDomainOrAlias(observation, brief.watched_entities || [])
  );

  const ambiguous = deterministic.filter(item => item.match_confidence !== "high");

  if (ambiguous.length === 0) return deterministic;

  const aiLabels = await massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Classify local SERP results for a vendor-category trend tracker. Return vendor entity, entity type, category relevance, confidence, and source observation IDs. Do not invent unsupported vendors."
      },
      {
        role: "user",
        content: JSON.stringify({
          category: brief.category,
          watched_entities: brief.watched_entities,
          observations: ambiguous,
          fetched_pages: fetchedPages
        })
      }
    ]
  });

  return mergeAiLabels(deterministic, aiLabels);
}
```

## Evidence Fetching

Fetch only pages that help classification or alert explanation:

```ts
async function fetchEvidencePages(observations: SerpObservation[], brief: TrendBrief): Promise<FetchedPage[]> {
  const urls = selectEvidenceUrls(observations, {
    max_pages: 50,
    include_watched_entities: true,
    include_top_directories: true,
    include_ambiguous_results: true
  });

  const pages = [];

  for (const url of urls) {
    pages.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha_handling: true
    }));
  }

  return pages;
}
```

## Movement Comparison

Compare only equivalent query-location-device-result-type groups:

```ts
function compareWithHistory(current: SerpObservation[], history: SerpObservation[]): Movement[] {
  const previousByKey = latestPreviousObservationByKey(history);

  return current.map(observation => {
    const key = movementKey(observation);
    const previous = previousByKey.get(key);

    return {
      entity_name: observation.entity_name || observation.domain || "Unknown",
      domain: observation.domain,
      entity_type: observation.entity_type,
      query: observation.query,
      country: observation.country,
      city: observation.city,
      device: observation.device,
      result_type: observation.result_type,
      previous_rank: previous?.rank,
      current_rank: observation.rank,
      delta: previous ? previous.rank - observation.rank : undefined,
      state: classifyMovementState(previous, observation),
      confidence: observation.match_confidence
    };
  });
}
```

Important comparison rules:

- Organic rank movement compares only organic results.
- Local pack movement compares only local pack entries.
- Mobile and desktop never share history keys.
- A directory page mentioning a vendor is tracked as directory visibility unless the vendor owns the ranked page.
- New top-10 and lost top-10 alerts require a prior comparable snapshot.

## Report Generation

Use `ai_chat_completion` for concise narrative, but constrain it to computed facts:

```ts
async function writeTrendSummary(brief: TrendBrief, movements: Movement[], evidence: EvidenceFact[]) {
  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Write source-backed SERP trend summaries. Mention only supplied facts. Avoid traffic, revenue, or lead-volume claims."
      },
      {
        role: "user",
        content: JSON.stringify({
          category: brief.category.name,
          movements,
          evidence
        })
      }
    ]
  });
}
```

## Storage

Recommended snapshot layout:

```text
snapshots/
  2026-05-02T160000Z/
    brief.json
    observations.jsonl
    fetched-pages.jsonl
    report.json
    report.md
  latest.json
```

The JSONL observation file is the source of truth for future movement comparisons. Reports can be regenerated when scoring or alert logic changes.

## Exports

MVP exports:

- `report.json`: full trend report and alerts.
- `observations.csv`: one row per parsed SERP result.
- `movement.csv`: one row per entity movement comparison.
- `report.md`: readable summary for clients or internal teams.

Required CSV columns:

- `snapshot_id`
- `observed_at`
- `query`
- `country`
- `city`
- `device`
- `result_type`
- `rank`
- `entity_name`
- `entity_type`
- `domain`
- `url`
- `matched_watched_entity`
- `match_confidence`
- `source_url`
