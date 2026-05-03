# Prototype

This prototype sketches a Node or Python MVP around Massive MCP tools: `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`. The core design choice is comparability: the app should not simply average public prices. It should explain which comparable listings are actually similar enough to inform the price.

## Data Model

```ts
type ListingVerifierBrief = {
  listing: {
    url?: string;
    pasted_text?: string;
    vin?: string;
    asking_price_usd?: number;
    zip_or_city?: string;
  };
  buyer_context?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
    search_radius_miles?: number;
    budget_usd?: number;
    must_have_features?: string[];
    avoid?: string[];
  };
  research_policy?: {
    max_comps?: number;
    freshness_days?: number;
    include_dealer_pages?: boolean;
    include_marketplaces?: boolean;
    include_public_history_snippets?: boolean;
    exclude_private_person_lookup?: true;
  };
  output?: {
    include_source_log?: boolean;
    include_comp_table?: boolean;
    include_questions_for_seller?: boolean;
  };
};

type VehicleFacts = {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  body_style?: string;
  drivetrain?: string;
  engine_or_powertrain?: string;
  mileage?: number;
  asking_price_usd?: number;
  location?: string;
  seller_type?: "dealer" | "marketplace" | "private_listing" | "unknown";
  title_claim?: string;
  accident_claim?: string;
  option_claims?: string[];
  fee_claims?: string[];
  listing_status?: "active_public_listing" | "stale_or_removed" | "unknown";
};

type SourceRecord = {
  source_id: string;
  url: string;
  title?: string;
  source_type:
    | "listing"
    | "dealer_page"
    | "marketplace"
    | "manufacturer"
    | "public_history_snippet"
    | "pricing_reference"
    | "search_result"
    | "unknown";
  query?: string;
  rank?: number;
  fetched_at: string;
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
  fetch_status: "ok" | "blocked" | "captcha_resolved" | "captcha_unresolved" | "empty" | "error";
  rendered_js: boolean;
  text: string;
};

type ComparableListing = {
  vehicle: VehicleFacts;
  source_url: string;
  price_usd?: number;
  mileage?: number;
  distance_miles?: number;
  days_old_estimate?: number;
  match_quality: "high" | "medium" | "low" | "exclude";
  adjustment_factors: string[];
  exclusion_reason?: string;
};

type ClaimCheck = {
  claim: string;
  status:
    | "supported_by_listing"
    | "supported_by_multiple_public_sources"
    | "contradicted"
    | "needs_confirmation"
    | "not_found_in_public_sources";
  evidence_source_ids: string[];
  notes: string;
};

type ListingVerifierReport = {
  run_id: string;
  generated_at: string;
  listing_summary: VehicleFacts;
  verdict: {
    market_position:
      | "well_below_market"
      | "slightly_below_market"
      | "fair_market"
      | "slightly_high"
      | "well_above_market"
      | "insufficient_public_data";
    confidence: "high" | "medium" | "low";
    estimated_fair_range_usd?: [number, number];
    explanation: string;
  };
  claim_checks: ClaimCheck[];
  market_comps: ComparableListing[];
  buyer_questions?: string[];
  source_log?: SourceRecord[];
};
```

## Pipeline

```ts
async function verifyUsedCarListing(brief: ListingVerifierBrief): Promise<ListingVerifierReport> {
  validatePublicResearchBrief(brief);

  const normalized = applyDefaults(brief);
  const estimatedCredits = estimateCredits(normalized);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for used-car listing verification");
  }

  const listingSources = await fetchListingSources(normalized);
  const listingFacts = await extractListingFacts(normalized, listingSources);
  const searchPlan = await createComparableSearchPlan(normalized, listingFacts);
  const compSources = await discoverAndFetchComps(normalized, searchPlan);
  const comps = await normalizeComparableListings(listingFacts, compSources);
  const claimChecks = await checkPublicListingClaims(listingFacts, [...listingSources, ...compSources]);

  return synthesizeVerifierReport(normalized, listingFacts, claimChecks, comps, [
    ...listingSources,
    ...compSources
  ]);
}
```

## Listing Capture

```ts
async function fetchListingSources(brief: ListingVerifierBrief): Promise<SourceRecord[]> {
  const sources: SourceRecord[] = [];

  if (brief.listing.url) {
    const fetched = await massive.web_fetch({
      url: brief.listing.url,
      render_js: true,
      captcha: "handle",
      country: brief.buyer_context?.country,
      city: brief.buyer_context?.city,
      device: brief.buyer_context?.device || "desktop"
    });

    sources.push(toSourceRecord(fetched, "listing", { rendered_js: true }));
  }

  if (brief.listing.pasted_text) {
    sources.push(fromPastedListingText(brief.listing.pasted_text));
  }

  return sources;
}
```

The extractor should preserve exact listing language for price, mileage, trim, title, accident, certification, warranty, and fee claims. It should also keep a missing-data list so the final report can say what public evidence was unavailable.

## Comparable Search Plan

```ts
async function createComparableSearchPlan(
  brief: ListingVerifierBrief,
  facts: VehicleFacts
): Promise<string[]> {
  const base = `${facts.year} ${facts.make} ${facts.model} ${facts.trim || ""}`.trim();
  const location = brief.buyer_context?.city || brief.listing.zip_or_city || "";

  const seedQueries = [
    `${base} used for sale ${location}`,
    `${base} ${facts.mileage || ""} miles used price ${location}`,
    `${base} dealer inventory ${location}`,
    `${base} marketplace used car ${location}`
  ];

  const expanded = await massive.ai_chat_completion({
    task: "expand_used_car_comparable_queries",
    input: {
      vehicle: facts,
      location,
      radius_miles: brief.buyer_context?.search_radius_miles || 150,
      instruction:
        "Create public-web queries for comparable active listings. Avoid private-person lookup and restricted records."
    },
    output_schema: "string[]"
  });

  return dedupeQueries([...seedQueries, ...expanded]);
}
```

## Comparable Collection

```ts
async function discoverAndFetchComps(
  brief: ListingVerifierBrief,
  queries: string[]
): Promise<SourceRecord[]> {
  const sources: SourceRecord[] = [];
  const maxComps = brief.research_policy?.max_comps || 18;

  for (const query of queries) {
    const serp = await massive.web_search({
      query,
      parse_google_serp: true,
      country: brief.buyer_context?.country,
      city: brief.buyer_context?.city,
      device: brief.buyer_context?.device || "desktop",
      max_results: 10
    });

    const candidates = rankMarketplaceAndDealerResults(serp.results, sources);

    for (const candidate of candidates.slice(0, 4)) {
      if (sources.length >= maxComps) break;

      const fetched = await massive.web_fetch({
        url: candidate.url,
        render_js: true,
        captcha: "handle",
        country: brief.buyer_context?.country,
        city: brief.buyer_context?.city,
        device: brief.buyer_context?.device || "desktop"
      });

      sources.push(toSourceRecord(fetched, classifySource(candidate), { query, rank: candidate.rank }));
    }
  }

  return dedupeByCanonicalVehicleAndUrl(sources);
}
```

## Price Explanation

The synthesis step should calculate a fair range from high and medium quality comps only. Excluded comps still appear in the source log, but not in the price range.

Adjustment factors:

- Same year, make, model, trim, body style, drivetrain, and powertrain.
- Mileage delta and likely warranty implications.
- Distance from buyer market and regional supply.
- Dealer versus private listing and listed dealer fees.
- Certified pre-owned, warranty, service records, or return policy claims.
- Title, accident, fleet, rental, lemon, buyback, or rebuilt language when publicly visible.
- Listing freshness, removed pages, duplicate listings, and suspiciously low outliers.

The final explanation should state why the price label was assigned, which comps carried the most weight, and which missing facts a buyer should confirm before relying on the result.

## CLI Shape

```bash
used-car-listing-verifier run \
  --listing-url "https://example-dealer.com/used/Toyota/2022-Toyota-Camry-XSE" \
  --city "Sacramento, CA" \
  --radius 150 \
  --budget 28000 \
  --out report.json \
  --report-md report.md
```

## Report Sections

- Listing summary: normalized vehicle facts and asking price.
- Public claim checks: supported, contradicted, or needs-confirmation claims.
- Market-price verdict: fair range, price label, confidence, and plain-English reasoning.
- Comparable table: price, mileage, distance, source, match quality, and adjustment notes.
- Risk flags: missing title evidence, inconsistent trim, stale listing, fee ambiguity, outlier price.
- Buyer questions: short questions to ask the seller or dealer.
- Source log: query, rank, URL, fetch time, render status, captcha status, and source type.

## Privacy Boundary

The prototype must reject prompts that ask it to identify a private seller, locate a home address, infer ownership, investigate an individual, or retrieve restricted history records. It can analyze the public listing content and public market context only.
