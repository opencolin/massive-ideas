# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type MarketEntrantBrief = {
  market: MarketDefinition;
  known_players?: KnownPlayer[];
  lookback_days: number;
  geo?: GeoTarget;
  cadence: "daily" | "weekly" | "monthly" | "manual";
  min_confidence?: "low" | "medium" | "high";
  alert_thresholds?: AlertThresholds;
  source_preferences?: SourceType[];
};

type MarketDefinition = {
  name: string;
  category_keywords: string[];
  jobs_to_be_done?: string[];
  buyer_keywords?: string[];
  vertical_keywords?: string[];
  exclude_terms?: string[];
};

type KnownPlayer = {
  name: string;
  domain: string;
  role: "incumbent" | "adjacent_incumbent" | "known_startup" | "reseller" | "agency";
  aliases?: string[];
};

type GeoTarget = {
  country: string;
  city?: string;
  device?: "desktop" | "mobile";
  language?: string;
};

type AlertThresholds = {
  new_company_score?: number;
  incumbent_expansion_score?: number;
  regional_entry_score?: number;
  marketplace_entry_score?: number;
};

type SourceType =
  | "web_search"
  | "google_serp"
  | "product_page"
  | "company_site"
  | "docs"
  | "marketplace"
  | "funding"
  | "launch_coverage"
  | "review_site"
  | "directory"
  | "community";

type SourceObservation = {
  observation_id: string;
  candidate_name?: string;
  candidate_domain?: string;
  source_type: SourceType;
  url: string;
  title?: string;
  final_url?: string;
  serp_rank?: number;
  observed_at: string;
  published_at?: string;
  geo: GeoTarget;
  fetch_status: "ok" | "blocked" | "partial" | "failed";
  visible_text_hash?: string;
  excerpt: string;
  warnings: string[];
};

type EntrantCandidate = {
  candidate_id: string;
  company: string;
  domain?: string;
  aliases: string[];
  entrant_type: EntrantType;
  entry_score: number;
  confidence: "high" | "medium" | "low";
  first_seen_at: string;
  market_fit: string;
  novelty: "new" | "expanded" | "regional" | "repositioned" | "uncertain";
  evidence: EvidenceExcerpt[];
  suppressed: boolean;
  suppression_reason?: string;
  recommended_follow_up: string;
  warnings: string[];
};

type EvidenceExcerpt = {
  source_type: SourceType;
  url: string;
  title?: string;
  observed_at: string;
  published_at?: string;
  excerpt: string;
};

type EntrantType =
  | "new_company"
  | "new_product_line"
  | "incumbent_expansion"
  | "regional_entry"
  | "vertical_entry"
  | "marketplace_entry"
  | "open_source_or_developer_entry"
  | "funded_entrant"
  | "stealth_or_waitlist_signal"
  | "reseller_or_agency_noise"
  | "content_only_noise"
  | "stale_or_duplicate_signal";

type MarketEntrantReport = {
  run_id: string;
  market: string;
  summary: string;
  entrants: EntrantCandidate[];
  suppressed_candidates: EntrantCandidate[];
  warnings: string[];
};
```

## Pipeline

```ts
async function monitorMarketEntrants(
  brief: MarketEntrantBrief
): Promise<MarketEntrantReport> {
  validateBrief(brief);

  const estimatedCredits = estimateCredits(brief);
  const status = await massive.account_status();
  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for market entrant run");
  }

  const previousRuns = await loadPreviousEntrantReports(brief);
  const observations = await collectEntrantObservations(brief);
  const groupedCandidates = groupObservationsByCompany(observations, brief.known_players || []);
  const classified = await classifyEntrantCandidates(brief, groupedCandidates, previousRuns);
  const scored = scoreEntrants(brief, classified);
  const report = await synthesizeEntrantReport(brief, scored);

  await saveObservations(observations);
  await saveCandidates(scored);
  await saveReport(report);
  return report;
}
```

## Collection

Use `web_search` to discover candidate sources, then `web_fetch` to verify rendered evidence and avoid ranking from snippets alone.

```ts
async function collectEntrantObservations(
  brief: MarketEntrantBrief
): Promise<SourceObservation[]> {
  const observations: SourceObservation[] = [];
  const queries = buildEntrantQueries(brief);

  for (const query of queries) {
    const serp = await massive.web_search({
      query,
      parse_google_serp: true,
      country: brief.geo?.country || "us",
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      language: brief.geo?.language || "en",
      time_range_days: brief.lookback_days
    });

    for (const result of serp.results.slice(0, 12)) {
      if (isKnownNoise(result, brief.market.exclude_terms)) continue;

      const fetched = await massive.web_fetch({
        url: result.url,
        render_js: true,
        captcha: "solve",
        country: brief.geo?.country || "us",
        city: brief.geo?.city,
        device: brief.geo?.device || "desktop",
        wait_for_network_idle: true,
        extract_visible_text: true
      });

      observations.push(normalizeObservation(result, fetched, brief.geo));
    }
  }

  return dedupeObservations(observations);
}
```

## Query Strategy

Build a source-diverse query set so the monitor catches both obvious launches and quieter entry signals.

```ts
function buildEntrantQueries(brief: MarketEntrantBrief): string[] {
  const market = brief.market.name;
  const categoryTerms = brief.market.category_keywords.map(q => `"${q}"`).join(" OR ");
  const jobs = (brief.market.jobs_to_be_done || []).map(q => `"${q}"`).join(" OR ");
  const verticals = (brief.market.vertical_keywords || []).map(q => `"${q}"`).join(" OR ");

  return [
    `(${categoryTerms}) launch OR launches OR introduces OR "now available"`,
    `(${categoryTerms}) startup OR "new company" OR "new entrant"`,
    `"${market}" "Product Hunt" OR "launch" OR "waitlist"`,
    `"${market}" "Shopify app" OR marketplace OR integration`,
    `(${categoryTerms}) funding OR seed OR "Series A"`,
    `(${categoryTerms}) docs OR api OR changelog OR github`,
    `(${categoryTerms}) "for ${brief.geo?.country || "US"}" OR "available in"`,
    jobs ? `(${jobs}) software startup launch` : `"${market}" software startup launch`,
    verticals ? `(${categoryTerms}) (${verticals}) "new"` : `"${market}" "new product"`
  ].filter(Boolean);
}
```

## Classification Prompt

Use `ai_chat_completion` only after source collection. The model should classify from evidence, not invent market claims.

```text
You are classifying potential entrants into a market.

Market:
{{market_definition}}

Known players:
{{known_players}}

Evidence group:
{{source_observations}}

Return JSON with:
- company and domain
- entrant_type
- novelty
- market_fit
- confidence
- evidence_summary
- suppression_reason, if this is an agency, reseller, directory-only item, stale page, duplicate, or content-only signal
- warnings

Rules:
- Do not infer revenue, adoption, private roadmap, or customer migration.
- Treat snippets as discovery only; require fetched page evidence for medium or high confidence.
- Mark incumbent product expansion separately from new-company entry.
- Preserve geo-specific claims as regional unless global evidence exists.
- Include source URLs and excerpts for every retained claim.
```

## Scoring Sketch

```ts
function scoreEntrant(candidate: EntrantCandidate, brief: MarketEntrantBrief): EntrantCandidate {
  let score = 0;

  score += productMarketFitPoints(candidate, brief);       // 0-25
  score += noveltyPoints(candidate);                       // 0-20
  score += sourceQualityPoints(candidate.evidence);         // 0-15
  score += corroborationPoints(candidate.evidence);         // 0-15
  score += specificityPoints(candidate, brief);             // 0-10
  score += tractionProxyPoints(candidate.evidence);         // 0-10
  score += identityConfidencePoints(candidate);             // 0-5

  score = applyCaps(score, candidate);
  return { ...candidate, entry_score: Math.max(0, Math.min(100, score)) };
}
```

## Output Files

- `entrant-report.json`: full report with evidence and warnings.
- `entrant-report.md`: readable weekly digest.
- `entrant-candidates.csv`: flattened candidate rows for spreadsheet review.
- `observations.jsonl`: raw normalized source observations.
- `snapshots/`: fetched text, metadata, and content hashes for auditability.
