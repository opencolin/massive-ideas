# Prototype

This implementation sketch assumes a Node or Python service with a Massive MCP client exposing `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type Market = {
  country: string;
  city?: string;
  expected_currency?: string;
  language?: string;
};

type RateTable = {
  base_currency: string;
  rates_as_of: string;
  rates: Record<string, number>;
};

type Target = {
  name: string;
  vendor: string;
  domain: string;
  known_urls: string[];
  search_queries: string[];
  markets: Market[];
  devices: Array<"desktop" | "mobile">;
  comparison_unit: "unit" | "seat_month" | "seat_year" | "night" | "license" | "subscription_month";
  minimum_gap_percent: number;
};

type PriceObservation = {
  target_name: string;
  vendor: string;
  market: Market;
  device: "desktop" | "mobile";
  source_type: "serp" | "page";
  source_url: string;
  final_url?: string;
  fetched_at: string;
  amount?: number;
  currency?: string;
  unit?: string;
  normalized_amount?: number;
  base_currency?: string;
  includes_tax?: boolean;
  fees?: string[];
  discount?: string;
  availability?: "available" | "unavailable" | "unknown" | "quote_only";
  eligibility_caveats: string[];
  bundle_terms: string[];
  raw_text: string;
  confidence: "high" | "medium" | "low";
};

type ArbitrageOpportunity = {
  target_name: string;
  best_observation: PriceObservation;
  reference_observation: PriceObservation;
  gap_percent: number;
  gap_amount_base: number;
  severity: "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
  caveats: string[];
  evidence_urls: string[];
  summary: string;
};
```

## Pipeline

```ts
async function runArbitrageScan(targets: Target[], rateTable: RateTable) {
  const status = await massive.account_status();
  const fetchEstimate = targets.reduce(
    (sum, target) => sum + target.markets.length * target.devices.length * Math.max(1, target.known_urls.length),
    0
  );

  if (!status.ok || status.remaining_credits < fetchEstimate * 2) {
    throw new Error("Insufficient Massive MCP credits for international pricing scan");
  }

  const allObservations: PriceObservation[] = [];

  for (const target of targets) {
    const urls = await discoverCandidateUrls(target);
    for (const market of target.markets) {
      const serpObservations = await captureSearchOffers(target, market, rateTable);
      allObservations.push(...serpObservations);

      for (const device of target.devices) {
        for (const url of urls) {
          const observation = await capturePriceObservation(target, url, market, device, rateTable);
          allObservations.push(observation);
        }
      }
    }
  }

  return rankOpportunities(compareMarkets(allObservations));
}
```

## URL Discovery

```ts
async function discoverCandidateUrls(target: Target): Promise<string[]> {
  const discovered = new Set(target.known_urls);

  for (const query of target.search_queries) {
    const serp = await massive.web_search({
      query,
      parse_google_serp: true,
      country: "us",
      device: "desktop",
      max_results: 10
    });

    for (const result of serp.results) {
      if (isLikelyTargetUrl(result.url, target.domain)) discovered.add(result.url);
    }
  }

  return [...discovered].slice(0, 8);
}
```

Rank discovered URLs highest when they are on the vendor domain and include path or title terms like `pricing`, `plans`, `shop`, `buy`, `subscribe`, `checkout`, `store`, localized country paths, or product-specific slugs.

## SERP Offer Capture

```ts
async function captureSearchOffers(target: Target, market: Market, rateTable: RateTable) {
  const observations: PriceObservation[] = [];

  for (const query of target.search_queries) {
    const serp = await massive.web_search({
      query,
      parse_google_serp: true,
      country: market.country,
      city: market.city,
      device: "desktop",
      max_results: 10
    });

    const extracted = await extractPricesFromSerp(target, market, serp, rateTable);
    observations.push(...extracted);
  }

  return observations;
}
```

SERP observations are supporting evidence unless the fetched page confirms the same price. They are useful for stale offer detection, coupon discovery, and localized landing-page discovery.

## Page Capture

```ts
async function capturePriceObservation(
  target: Target,
  url: string,
  market: Market,
  device: "desktop" | "mobile",
  rateTable: RateTable
): Promise<PriceObservation> {
  const page = await massive.web_fetch({
    url,
    render_js: true,
    captcha: "auto",
    country: market.country,
    city: market.city,
    device,
    timeout_ms: 25000,
    extract_main_content: true
  });

  const extracted = await extractPriceFacts(target, market, device, page);
  const normalized = normalizePrice(extracted.amount, extracted.currency, rateTable);

  return {
    target_name: target.name,
    vendor: target.vendor,
    market,
    device,
    source_type: "page",
    source_url: url,
    final_url: page.final_url || url,
    fetched_at: new Date().toISOString(),
    ...extracted,
    normalized_amount: normalized?.amount,
    base_currency: normalized?.currency
  };
}
```

## Extraction Prompt

```ts
async function extractPriceFacts(target, market, device, page) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Extract international pricing facts from rendered page content.",
          "Use only supplied source text and metadata.",
          "Return normalized JSON.",
          "Preserve raw evidence text for each price.",
          "Do not assume taxes, fees, availability, or eligibility when they are not visible.",
          "Mark confidence low for personalized, login-only, image-only, or quote-only prices."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          target: target.name,
          vendor: target.vendor,
          market,
          device,
          final_url: page.final_url,
          title: page.title,
          rendered_text: page.text.slice(0, 18000),
          expected_schema: {
            amount: "number | null",
            currency: "string | null",
            unit: "string | null",
            includes_tax: "boolean | null",
            fees: "string[]",
            discount: "string | null",
            availability: "available | unavailable | unknown | quote_only",
            eligibility_caveats: "string[]",
            bundle_terms: "string[]",
            raw_text: "string",
            confidence: "high | medium | low"
          }
        })
      }
    ]
  });

  return validatePriceObservation(JSON.parse(response.content));
}
```

## Normalization

```ts
function normalizePrice(amount?: number, currency?: string, rateTable?: RateTable) {
  if (!amount || !currency || !rateTable) return undefined;

  const rate = rateTable.rates[currency.toUpperCase()];
  if (!rate) return undefined;

  return {
    amount: Number((amount * rate).toFixed(2)),
    currency: rateTable.base_currency
  };
}
```

The MVP should require an explicit rate table instead of fetching live exchange rates. That keeps pricing conclusions auditable and prevents silent changes in arbitrage rankings.

## Comparison Logic

```ts
function compareMarkets(observations: PriceObservation[]): ArbitrageOpportunity[] {
  const grouped = groupByComparableTarget(observations);
  const opportunities: ArbitrageOpportunity[] = [];

  for (const group of Object.values(grouped)) {
    const comparable = group.filter(isComparableObservation);
    for (const reference of comparable) {
      for (const candidate of comparable) {
        if (reference === candidate) continue;
        if (!reference.normalized_amount || !candidate.normalized_amount) continue;

        const gapPercent = ((reference.normalized_amount - candidate.normalized_amount) / reference.normalized_amount) * 100;
        if (gapPercent < minimumGapFor(group, reference.target_name)) continue;

        opportunities.push(buildOpportunity(candidate, reference, gapPercent));
      }
    }
  }

  return opportunities;
}
```

`isComparableObservation` should reject observations when units, bundles, billing periods, availability, or eligibility caveats make the price materially different.

## Ranking

Score each opportunity from 0-100:

- 30 points: FX-normalized gap exceeds the configured threshold.
- 20 points: both prices are extracted from rendered vendor pages, not only search snippets.
- 15 points: units, bundles, and billing periods match.
- 15 points: taxes and fees are visible or explicitly absent from both markets.
- 10 points: no local billing, shipping, account-region, or payment caveat is present.
- 10 points: observation confidence is high across both markets.

Automatic caps:

- Cap at 80 when any tax or fee treatment is unclear.
- Cap at 70 when one side is SERP-only evidence.
- Cap at 65 when bundle terms differ but may still be comparable.
- Cap at 55 when eligibility caveats may block practical purchase.
- Cap at 40 when either price is quote-only, unavailable, or personalized.

## Exports

The CLI should emit:

- `report.json`: full target, observation, opportunity, and evidence graph.
- `opportunities.csv`: one row per arbitrage signal with normalized price math.
- `brief.md`: human-readable summary grouped by target and market.
- `evidence/`: optional rendered text excerpts and fetch metadata for audit.
