# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type AlternativeDataRunConfig = {
  watchlist_name: string;
  companies: WatchedCompany[];
  signals: SignalConfig[];
  geo_targets: GeoTarget[];
  cadence: "daily" | "weekly" | "manual";
  lookback_days: number;
  materiality_floor: "low" | "medium" | "high";
  output_formats: ("markdown" | "json" | "csv")[];
};

type WatchedCompany = {
  name: string;
  domain: string;
  category?: string;
  ticker?: string;
  peer_group?: string;
  regions?: string[];
  known_urls?: SourceMap;
};

type SourceMap = {
  careers?: string[];
  pricing?: string[];
  docs?: string[];
  blog?: string[];
  changelog?: string[];
  status?: string[];
  trust?: string[];
  integrations?: string[];
  landing_pages?: string[];
};

type SignalConfig = {
  signal_type: SignalType;
  enabled: boolean;
  search_queries: string[];
  source_types: SourceType[];
  extraction_focus: string[];
  weight: number;
};

type SignalType =
  | "hiring_velocity"
  | "pricing_packaging"
  | "product_surface_area"
  | "market_expansion"
  | "gtm_positioning"
  | "operational_signal";

type SourceType =
  | "careers_page"
  | "job_post"
  | "pricing_page"
  | "product_page"
  | "docs_page"
  | "blog_or_changelog"
  | "status_page"
  | "trust_page"
  | "serp_result";

type GeoTarget = {
  country: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type PageSnapshot = {
  snapshot_id: string;
  company: string;
  domain: string;
  url: string;
  source_type: SourceType;
  geo: GeoTarget;
  fetched_at: string;
  fetch_status: "ok" | "blocked" | "partial" | "failed";
  content_hash: string;
  visible_text_hash: string;
  extracted_facts: ExtractedFacts;
  evidence: EvidenceItem[];
  warnings: string[];
};

type ExtractedFacts = {
  roles?: JobRoleFact[];
  prices?: PricingFact[];
  product_mentions?: ProductFact[];
  regions?: RegionFact[];
  positioning_claims?: PositioningFact[];
  operational_items?: OperationalFact[];
};

type JobRoleFact = {
  title: string;
  department?: string;
  location?: string;
  seniority?: string;
  remote_policy?: string;
  url?: string;
};

type PricingFact = {
  plan?: string;
  price_text?: string;
  amount?: number;
  currency?: string;
  billing_period?: string;
  feature_limits?: string[];
};

type ProductFact = {
  name: string;
  page_type: "integration" | "feature" | "docs" | "api" | "template" | "changelog";
  description?: string;
  date_text?: string;
};

type RegionFact = {
  region: string;
  page_or_role_count?: number;
  evidence_text: string;
};

type PositioningFact = {
  claim: string;
  audience?: string;
  competitor_or_alternative?: string;
};

type OperationalFact = {
  kind: "incident" | "security" | "compliance" | "support" | "trust";
  text: string;
  date_text?: string;
};

type EvidenceItem = {
  url: string;
  source_type: SourceType;
  fetched_at?: string;
  title?: string;
  excerpt: string;
  selector?: string;
  serp_rank?: number;
};

type AlternativeDataEvent = {
  event_id: string;
  company: string;
  domain: string;
  signal_type: SignalType;
  observed_at: string;
  observed_fact: string;
  interpretation: string;
  materiality: "high" | "medium" | "low";
  confidence: number;
  score: number;
  features: Record<string, string | number | boolean | string[]>;
  evidence: EvidenceItem[];
  diff?: SnapshotDiff;
  disqualifiers: string[];
};

type SnapshotDiff = {
  previous_snapshot_id?: string;
  current_snapshot_id: string;
  added: unknown[];
  removed: unknown[];
  changed: unknown[];
};

type AlternativeDataFeed = {
  run_id: string;
  watchlist_name: string;
  generated_at: string;
  summary: string;
  events: AlternativeDataEvent[];
  unchanged_companies: string[];
  warnings: string[];
};
```

## Pipeline

```ts
async function buildAlternativeDataFeed(
  config: AlternativeDataRunConfig
): Promise<AlternativeDataFeed> {
  validateConfig(config);

  const estimatedCredits = estimateCollectionCredits(config);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for alternative data feed run");
  }

  const sourcePlan = await buildSourcePlan(config);
  const previousSnapshots = await loadPreviousSnapshots(config.watchlist_name);
  const currentSnapshots = await collectSnapshots(sourcePlan, config.geo_targets);
  const diffs = diffSnapshots(previousSnapshots, currentSnapshots);
  const candidateEvents = await extractCandidateEvents(config, currentSnapshots, diffs);
  const scoredEvents = scoreEvents(candidateEvents, config);
  const feed = await synthesizeFeed(config, scoredEvents, currentSnapshots);

  await saveSnapshots(currentSnapshots);
  await saveFeed(feed);
  return feed;
}
```

## Source Discovery

Use `web_search` for unknown or changing public pages. Known pages from the watchlist should always be fetched, while search results discover new pages and validate whether pages are indexed.

```ts
async function discoverCompanySources(
  company: WatchedCompany,
  signal: SignalConfig,
  geo: GeoTarget
): Promise<EvidenceItem[]> {
  const queries = signal.search_queries.map((template) =>
    template
      .replace("{company}", company.name)
      .replace("{domain}", company.domain)
      .replace("{category}", company.category || "")
  );

  const results = [];
  for (const query of queries) {
    const serp = await massive.web_search({
      query,
      country: geo.country,
      city: geo.city,
      parse_google_serp: true,
      recency_days: 30
    });

    results.push(...serp.results.map(normalizeSerpResult));
  }

  return dedupeEvidenceByUrl(results);
}
```

Example query templates:

```yaml
hiring_velocity:
  - "site:{domain} careers engineering OR sales OR support"
  - "\"{company}\" \"job\" \"location\""
pricing_packaging:
  - "site:{domain} pricing plans"
  - "\"{company}\" pricing"
product_surface_area:
  - "site:{domain} integrations OR docs OR changelog"
  - "\"{company}\" \"API\" \"integration\""
market_expansion:
  - "site:{domain} \"United Kingdom\" OR \"Germany\" OR \"Australia\""
gtm_positioning:
  - "site:{domain} alternatives OR compare OR vs"
operational_signal:
  - "site:{domain} status OR trust OR security OR compliance"
```

## Fetching

Use `web_fetch` with JavaScript rendering because careers systems, pricing pages, docs, and integration marketplaces often hydrate content client-side.

```ts
async function fetchSource(
  company: WatchedCompany,
  url: string,
  sourceType: SourceType,
  geo: GeoTarget
): Promise<PageSnapshot> {
  const response = await massive.web_fetch({
    url,
    render_js: true,
    captcha: "solve",
    country: geo.country,
    city: geo.city,
    device: geo.device || "desktop",
    wait_for_network_idle: true,
    extract_visible_text: true,
    include_html: true
  });

  const cleanedText = stripBoilerplate(response.visible_text, [
    "cookie",
    "privacy",
    "newsletter",
    "copyright"
  ]);

  const extractedFacts = await extractFacts(company, sourceType, cleanedText, response.url);

  return {
    snapshot_id: makeSnapshotId(company.domain, url, geo),
    company: company.name,
    domain: company.domain,
    url: response.final_url || url,
    source_type: sourceType,
    geo,
    fetched_at: new Date().toISOString(),
    fetch_status: response.ok ? "ok" : "partial",
    content_hash: hash(response.html || cleanedText),
    visible_text_hash: hash(cleanedText),
    extracted_facts: extractedFacts,
    evidence: buildEvidenceItems(response, sourceType),
    warnings: response.warnings || []
  };
}
```

## Extraction Prompt

`ai_chat_completion` should produce strict JSON and refuse unsupported claims.

```text
You extract alternative data signals from public web evidence.

Return JSON only. Separate observed facts from interpretations.
Use only the provided source text. If a value is absent, return null.
Every event must include at least one evidence excerpt and source URL.
Do not infer investment advice, revenue impact, or private intent.

Classify the signal as one of:
hiring_velocity, pricing_packaging, product_surface_area,
market_expansion, gtm_positioning, operational_signal.

For each event return:
observed_fact, interpretation, materiality, confidence,
features, evidence, disqualifiers.
```

## Diffing

Diffs should operate on normalized facts, not raw HTML. Raw text hashes are still useful for detecting pages that changed and need re-extraction.

```ts
function diffSnapshots(
  previous: PageSnapshot[],
  current: PageSnapshot[]
): SnapshotDiff[] {
  const diffs = [];
  for (const snapshot of current) {
    const prior = findPriorSnapshot(previous, snapshot);
    diffs.push({
      previous_snapshot_id: prior?.snapshot_id,
      current_snapshot_id: snapshot.snapshot_id,
      added: factSetDifference(snapshot.extracted_facts, prior?.extracted_facts),
      removed: factSetDifference(prior?.extracted_facts, snapshot.extracted_facts),
      changed: factFieldChanges(prior?.extracted_facts, snapshot.extracted_facts)
    });
  }
  return diffs;
}
```

## Event Scoring

```ts
function scoreEvent(event: AlternativeDataEvent): number {
  return clamp(
    recencyScore(event.observed_at, 20) +
      sourceReliabilityScore(event.evidence, 20) +
      changeMagnitudeScore(event.features, 20) +
      categoryRelevanceScore(event, 15) +
      repeatConfirmationScore(event.evidence, 15) +
      actionabilityScore(event, 10),
    0,
    100
  );
}
```

High-confidence events usually have a first-party source, a clear field-level diff, and a direct evidence excerpt. Search-only or model-interpreted events should be capped until confirmed by fetched pages.

## Output

The MVP should write:

- `events.json`: full event objects with evidence and lineage
- `features.csv`: company-level feature table for downstream analysis
- `feed.md`: human-readable digest grouped by signal type
- `run-log.json`: URLs searched, fetched, skipped, blocked, and classified

## Example Feed Item

```md
## Northstar AI - Hiring Velocity - 84

Observed fact: Careers page lists 18 enterprise support roles across Austin and London, up from 7 roles in the prior weekly snapshot.

Interpretation: The company may be scaling enterprise post-sale capacity in two regions.

Evidence:
- https://northstar.example/careers - "Enterprise Support Engineer - Austin"
- https://northstar.example/careers - "Solutions Consultant - London"

Disqualifiers:
- roles may include evergreen postings
- no direct source confirms customer growth
```
