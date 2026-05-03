# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type AvailabilityBrief = {
  account: Account;
  products: ProductTarget[];
  targets: RegionalTarget[];
  checks?: CheckOptions;
  expectations?: AvailabilityExpectations;
  competitors?: CompetitorProduct[];
};

type Account = {
  name: string;
  domains: string[];
};

type ProductTarget = {
  label: string;
  sku?: string;
  gtin?: string;
  canonical_url?: string;
  marketplace_ids?: Record<string, string>;
  search_terms: string[];
  accepted_variants?: string[];
  excluded_variants?: string[];
};

type RegionalTarget = {
  country: string;
  city: string;
  postal_code?: string;
  language?: string;
  device: "desktop" | "mobile";
  expected_currency?: string;
};

type CheckOptions = {
  fetch_canonical_urls?: boolean;
  search_for_regional_pages?: boolean;
  verify_add_to_cart_boundary?: boolean;
  watch_competitor_substitutes?: boolean;
};

type AvailabilityExpectations = {
  must_be_available?: string[];
  allowed_unavailable_regions?: string[];
  price_band?: { min?: number; max?: number };
  required_fulfillment_modes?: FulfillmentMode[];
  allowed_sellers?: string[];
};

type CompetitorProduct = {
  label: string;
  search_terms: string[];
  domains?: string[];
};

type FulfillmentMode = "ship" | "delivery" | "pickup" | "digital" | "marketplace";

type PageType = "serp" | "pdp" | "marketplace_offer" | "store_selector" | "cart_boundary" | "policy" | "competitor";

type AvailabilityState =
  | "in_stock"
  | "low_stock"
  | "preorder"
  | "backorder"
  | "out_of_stock"
  | "region_blocked"
  | "seller_unavailable"
  | "pickup_only"
  | "delivery_unavailable"
  | "login_required"
  | "age_gated"
  | "unknown";

type PlannedCheck = {
  product: ProductTarget;
  target: RegionalTarget;
  source: "canonical_url" | "search" | "marketplace_id" | "competitor_search";
  url?: string;
  query?: string;
};

type AvailabilityObservation = {
  observation_id: string;
  product_label: string;
  sku?: string;
  gtin?: string;
  matched_product?: string;
  match_type: "sku" | "gtin" | "exact_title" | "variant" | "semantic" | "competitor" | "none" | "ambiguous";
  country: string;
  city: string;
  postal_code?: string;
  language?: string;
  device: "desktop" | "mobile";
  page_type: PageType;
  url?: string;
  query?: string;
  availability_state: AvailabilityState;
  observed_price?: number;
  observed_currency?: string;
  seller?: string;
  fulfillment_modes: FulfillmentMode[];
  delivery_promise?: string;
  pickup_location?: string;
  restriction_reason?: string;
  rendered_text_excerpt?: string;
  observed_at: string;
  confidence: "high" | "medium" | "low";
};

type MarketReport = {
  country: string;
  city: string;
  postal_code?: string;
  language?: string;
  device: "desktop" | "mobile";
  availability_score: number;
  status: "available" | "limited" | "restricted" | "unavailable" | "unknown";
  products: ProductAvailability[];
  alerts: AvailabilityAlert[];
};

type ProductAvailability = {
  sku?: string;
  matched_product: string;
  availability_state: AvailabilityState;
  observed_price?: number;
  observed_currency?: string;
  seller?: string;
  fulfillment_modes: FulfillmentMode[];
  restriction_reason?: string;
  evidence_ids: string[];
  confidence: "high" | "medium" | "low";
};

type AvailabilityAlert = {
  type:
    | "expected_available_missing"
    | "unexpected_available"
    | "stale_serp_listing"
    | "wrong_currency"
    | "unauthorized_seller"
    | "variant_mismatch"
    | "competitor_substitute_visible"
    | "collection_blocked";
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  evidence_ids: string[];
};

type AvailabilityReport = {
  account: Account;
  summary: string;
  overall_availability_score: number;
  markets: MarketReport[];
  observations: AvailabilityObservation[];
};
```

## Pipeline

```ts
async function runAvailabilityCheck(brief: AvailabilityBrief): Promise<AvailabilityReport> {
  validateBrief(brief);

  const plannedChecks = buildPlannedChecks(brief);
  const estimatedCredits = estimateCredits(plannedChecks, brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for regional availability check");
  }

  const serpObservations = await collectDiscoveryEvidence(brief, plannedChecks);
  const pageObservations = await collectRenderedPageEvidence(brief, plannedChecks, serpObservations);
  const classified = await classifyProductAndAvailability(brief, [...serpObservations, ...pageObservations]);
  const scored = scoreMarkets(brief, classified);

  return summarizeAvailabilityWithSources(brief, scored, classified);
}
```

## Planning Checks

```ts
function buildPlannedChecks(brief: AvailabilityBrief): PlannedCheck[] {
  const checks: PlannedCheck[] = [];

  for (const product of brief.products) {
    for (const target of brief.targets) {
      if (brief.checks?.fetch_canonical_urls && product.canonical_url) {
        checks.push({ product, target, source: "canonical_url", url: product.canonical_url });
      }

      if (brief.checks?.search_for_regional_pages) {
        for (const term of product.search_terms) {
          checks.push({
            product,
            target,
            source: "search",
            query: `${term} ${target.city}`
          });
        }
      }

      for (const [marketplace, id] of Object.entries(product.marketplace_ids ?? {})) {
        checks.push({
          product,
          target,
          source: "marketplace_id",
          query: `${marketplace} ${id}`
        });
      }
    }
  }

  if (brief.checks?.watch_competitor_substitutes) {
    for (const competitor of brief.competitors ?? []) {
      for (const target of brief.targets) {
        for (const term of competitor.search_terms) {
          checks.push({
            product: { label: competitor.label, search_terms: competitor.search_terms },
            target,
            source: "competitor_search",
            query: `${term} ${target.city}`
          });
        }
      }
    }
  }

  return checks;
}
```

## Evidence Collection

Search discovery uses Google SERP parsing so the report can compare snippet claims to rendered product pages.

```ts
async function collectDiscoveryEvidence(
  brief: AvailabilityBrief,
  checks: PlannedCheck[]
): Promise<AvailabilityObservation[]> {
  const observations: AvailabilityObservation[] = [];

  for (const check of checks.filter(item => item.query)) {
    const response = await massive.web_search({
      query: check.query,
      parse_google_serp: true,
      country: check.target.country,
      city: check.target.city,
      device: check.target.device,
      language: check.target.language,
      max_results: 10
    });

    observations.push(...normalizeSerpAvailability(response, brief, check));
  }

  return observations;
}
```

Rendered page collection checks PDPs, marketplace offers, store selectors, and optional cart boundaries.

```ts
async function collectRenderedPageEvidence(
  brief: AvailabilityBrief,
  checks: PlannedCheck[],
  serpObservations: AvailabilityObservation[]
): Promise<AvailabilityObservation[]> {
  const candidateUrls = selectCandidateUrls(brief, checks, serpObservations);
  const observations: AvailabilityObservation[] = [];

  for (const candidate of candidateUrls) {
    const response = await massive.web_fetch({
      url: candidate.url,
      render_js: true,
      country: candidate.target.country,
      city: candidate.target.city,
      device: candidate.target.device,
      language: candidate.target.language,
      captcha_handling: true
    });

    observations.push(normalizeRenderedAvailability(response, brief, candidate));

    if (brief.checks?.verify_add_to_cart_boundary && canAttemptCartBoundary(response)) {
      observations.push(await checkCartBoundary(brief, candidate, response));
    }
  }

  return observations;
}
```

## Classification

Use deterministic extraction first:

- SKU, GTIN, marketplace ID, canonical URL, and domain match.
- Product title, variant attributes, size, color, pack count, model year, and seller.
- Currency symbols, structured data, availability schema, buy button text, inventory badges, delivery promises, and store-selector text.

Use `ai_chat_completion` only for ambiguity:

```ts
async function classifyAmbiguousObservation(brief: AvailabilityBrief, observation: AvailabilityObservation) {
  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Classify ecommerce product availability from evidence. Return JSON only. Preserve uncertainty and cite observation IDs."
      },
      {
        role: "user",
        content: JSON.stringify({
          product_targets: brief.products,
          expectations: brief.expectations,
          observation
        })
      }
    ]
  });
}
```

## Scoring And Alerts

```ts
function scoreMarkets(
  brief: AvailabilityBrief,
  observations: AvailabilityObservation[]
): MarketReport[] {
  const grouped = groupByMarket(observations);

  return Object.entries(grouped).map(([marketKey, marketObservations]) => {
    const products = summarizeProducts(brief, marketObservations);
    const alerts = buildAlerts(brief, marketObservations, products);
    const availability_score = applyCaps(scoreMarketBase(brief, marketObservations, products), alerts, products);

    return {
      ...parseMarketKey(marketKey),
      availability_score,
      status: deriveMarketStatus(products, alerts),
      products,
      alerts
    };
  });
}
```

Alert rules:

- Expected available region has no confirmed in-stock purchase path.
- SERP or shopping result claims in stock, but rendered PDP is unavailable, blocked, or mismatched.
- PDP shows a non-expected currency for the target country.
- Seller is not in the allowed seller list.
- The observed product is the wrong variant, size, color, pack, or model.
- Competitor substitute is visible when the target is absent or restricted.
- Captcha, login, or age gate prevents evidence collection.

## Exports

The CLI should write:

- Full JSON report with all observations and market summaries.
- CSV observation table for BI import.
- CSV alert table for operations workflows.
- Markdown executive summary with market heatmap, product table, alerts, evidence links, and recommendations.

## Implementation Notes

- Do not submit payment details or place orders.
- Stop cart-boundary checks at the first reversible state that proves purchase eligibility.
- Prefer structured data and rendered DOM extraction before AI interpretation.
- Preserve raw response IDs or source lineage so every final claim can be traced.
- Keep marketplace, owned storefront, reseller, and competitor evidence separate in the data model.
