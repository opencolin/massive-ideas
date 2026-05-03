# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type ProductMomentumBrief = {
  watchlist: PublicCompanyTarget[];
  lookback_days: number;
  geo?: GeoTarget;
  cadence: "daily" | "weekly" | "monthly" | "manual";
  signal_weights?: SignalWeights;
  exclude_terms?: string[];
  min_confidence?: "low" | "medium" | "high";
};

type PublicCompanyTarget = {
  company: string;
  ticker: string;
  domain: string;
  categories: string[];
  known_product_urls?: string[];
  competitor_names?: string[];
};

type GeoTarget = {
  country: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type SignalWeights = {
  new_product_launch?: number;
  major_feature_release?: number;
  developer_or_api_release?: number;
  integration_or_partner_release?: number;
  pricing_or_packaging_change?: number;
  search_visibility_gain?: number;
};

type SourceObservation = {
  observation_id: string;
  company: string;
  ticker: string;
  source_type:
    | "web_search"
    | "web_fetch"
    | "google_serp"
    | "company_site"
    | "docs"
    | "newsroom"
    | "marketplace";
  url: string;
  title?: string;
  final_url?: string;
  observed_at: string;
  published_at?: string;
  geo: GeoTarget;
  fetch_status: "ok" | "blocked" | "partial" | "failed";
  visible_text_hash?: string;
  excerpt: string;
  warnings: string[];
};

type ProductSignal = {
  signal_id: string;
  company: string;
  ticker: string;
  signal_type: SignalType;
  product_name?: string;
  title: string;
  description: string;
  observed_at: string;
  published_at?: string;
  novelty: "new" | "expanded" | "renamed" | "repeated" | "uncertain";
  confidence: "high" | "medium" | "low";
  score_impact: number;
  evidence: EvidenceExcerpt[];
  warnings: string[];
};

type EvidenceExcerpt = {
  source_type: SourceObservation["source_type"];
  url: string;
  title?: string;
  observed_at: string;
  excerpt: string;
};

type SignalType =
  | "new_product_launch"
  | "major_feature_release"
  | "developer_or_api_release"
  | "integration_or_partner_release"
  | "pricing_or_packaging_change"
  | "product_page_refresh"
  | "docs_or_changelog_activity"
  | "marketplace_or_app_listing_change"
  | "search_visibility_gain"
  | "customer_story_with_new_product"
  | "regional_product_expansion"
  | "cosmetic_or_corporate_noise";

type CompanyMomentum = {
  company: string;
  ticker: string;
  momentum_score: number;
  previous_score?: number;
  trend: "accelerating" | "steady" | "decelerating" | "insufficient_history";
  confidence: "high" | "medium" | "low";
  top_drivers: string[];
  signals: ProductSignal[];
  recommended_follow_up: string;
};

type ProductMomentumReport = {
  run_id: string;
  summary: string;
  rankings: CompanyMomentum[];
  warnings: string[];
};
```

## Pipeline

```ts
async function trackProductMomentum(
  brief: ProductMomentumBrief
): Promise<ProductMomentumReport> {
  validateBrief(brief);

  const estimatedCredits = estimateCredits(brief.watchlist, brief.lookback_days);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for product momentum run");
  }

  const previousReports = await loadPreviousMomentumReports(brief);
  const observations = await collectCompanyObservations(brief);
  const signals = await classifyProductSignals(brief, observations);
  const rankings = scoreCompanyMomentum(brief, signals, previousReports);
  const report = await synthesizeMomentumReport(brief, rankings);

  await saveObservations(observations);
  await saveSignals(signals);
  await saveReport(report);
  return report;
}
```

## Collection

Use `web_search` to discover fresh sources, then `web_fetch` to verify and extract the rendered page evidence.

```ts
async function collectCompanyObservations(
  brief: ProductMomentumBrief
): Promise<SourceObservation[]> {
  const observations: SourceObservation[] = [];

  for (const target of brief.watchlist) {
    const queries = buildProductMomentumQueries(target, brief.lookback_days);

    for (const query of queries) {
      const serp = await massive.web_search({
        query,
        parse_google_serp: true,
        country: brief.geo?.country || "us",
        city: brief.geo?.city,
        device: brief.geo?.device || "desktop",
        time_range_days: brief.lookback_days
      });

      for (const result of serp.results.slice(0, 10)) {
        if (isExcludedResult(result, brief.exclude_terms)) continue;

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

        observations.push(normalizeObservation(target, result, fetched, brief.geo));
      }
    }

    for (const url of target.known_product_urls || []) {
      observations.push(await fetchKnownProductUrl(target, url, brief.geo));
    }
  }

  return dedupeObservations(observations);
}
```

## Query Strategy

Build source-diverse queries rather than relying on company newsroom pages alone:

```ts
function buildProductMomentumQueries(
  target: PublicCompanyTarget,
  lookbackDays: number
): string[] {
  const categoryTerms = target.categories.join(" OR ");

  return [
    `site:${target.domain} (${categoryTerms}) launch OR announces OR introduces`,
    `site:${target.domain} (${categoryTerms}) docs OR api OR sdk OR changelog`,
    `site:${target.domain} pricing OR plans OR packaging "${target.company}"`,
    `"${target.company}" "${target.ticker}" product launch`,
    `"${target.company}" integration partner new product`,
    `"${target.company}" marketplace app extension release`
  ];
}
```

## Classification

Use `ai_chat_completion` only after source collection. The model should classify product evidence, not invent product activity.

```ts
async function classifyProductSignals(
  brief: ProductMomentumBrief,
  observations: SourceObservation[]
): Promise<ProductSignal[]> {
  const grouped = groupObservationsByCompanyAndProduct(observations);
  const signals: ProductSignal[] = [];

  for (const group of grouped) {
    const response = await massive.ai_chat_completion({
      model: "reasoning-light",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Classify public product momentum signals only from provided sources. Do not infer revenue impact, private roadmap, or management intent."
        },
        {
          role: "user",
          content: JSON.stringify({
            lookback_days: brief.lookback_days,
            exclude_terms: brief.exclude_terms,
            observations: group.observations
          })
        }
      ],
      response_format: "json"
    });

    signals.push(...parseSignals(response));
  }

  return suppressNoiseAndDuplicates(signals);
}
```

## Reporting

The Markdown report should lead with the ranked table, then source-backed sections per company:

- Momentum rank, score, trend, and confidence
- Top drivers in plain language
- New or changed product signals with dates and source URLs
- Evidence excerpts and fetch metadata
- Warnings for stale pages, weak dating, personalization, blocked fetches, or single-source claims
- Follow-up questions for human review

The JSON and CSV exports must reconcile on company, ticker, signal type, score impact, confidence, and source URL.
