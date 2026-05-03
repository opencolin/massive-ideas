# Prototype

This prototype sketches a CLI or small web app that wraps Massive MCP tools: `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`. The MVP should feel like a listing quality report, not a private-person investigation: extract public listing facts, collect public corroboration, score risk signals, and produce a renter-safe checklist.

## Data Model

```ts
type ListingRiskBrief = {
  listing: {
    url?: string;
    pasted_text?: string;
    claimed_city?: string;
    claimed_country?: string;
  };
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  risk_policy?: {
    sensitivity?: "low" | "medium" | "high";
    market_rent_radius_miles?: number;
    max_comparable_listings?: number;
    include_review_sites?: boolean;
    include_official_property_sites?: boolean;
    include_marketplace_duplicates?: boolean;
  };
  output?: {
    include_source_log?: boolean;
    include_search_log?: boolean;
    include_renter_checklist?: boolean;
  };
};

type ExtractedListing = {
  source_url?: string;
  title?: string;
  claimed_address?: string;
  building_name?: string;
  neighborhood?: string;
  city?: string;
  rent?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  availability?: string;
  fees_disclosed: string[];
  amenities: string[];
  contact_method?: "platform" | "phone" | "email" | "external_form" | "unknown";
  payment_requests: string[];
  pressure_language: string[];
  missing_fields: string[];
  extracted_claims: string[];
};

type SourceRecord = {
  source_id: string;
  source_type:
    | "submitted_listing"
    | "official_property_site"
    | "marketplace_duplicate"
    | "comparable_listing"
    | "review_site"
    | "public_record"
    | "search_result"
    | "unknown";
  query?: string;
  rank?: number;
  url: string;
  title?: string;
  snippet?: string;
  fetched_at: string;
  geo?: ListingRiskBrief["geo"];
  text?: string;
  fetch_status: "ok" | "blocked" | "captcha_unresolved" | "empty" | "error";
};

type ListingSignal = {
  signal: string;
  category:
    | "completeness"
    | "consistency"
    | "source_corroboration"
    | "price_context"
    | "duplicate_detection"
    | "contact_payment"
    | "page_quality"
    | "review_context";
  severity: "info" | "low" | "medium" | "high";
  explanation: string;
  evidence_source_ids: string[];
  confidence: "high" | "medium" | "low";
};

type ListingRiskReport = {
  run_id: string;
  generated_at: string;
  listing_url?: string;
  summary: string;
  scores: {
    listing_quality: number;
    scam_risk: number;
    confidence: "high" | "medium" | "low";
    needs_human_review: boolean;
  };
  extracted_listing: ExtractedListing;
  risk_signals: ListingSignal[];
  positive_signals: ListingSignal[];
  market_context?: {
    comparable_count: number;
    median_public_comparable_rent?: number;
    rent_position: "below_range" | "within_range" | "above_range" | "insufficient_data";
    caveat: string;
  };
  renter_checklist?: string[];
  search_log?: QueryPlanItem[];
  source_log?: SourceRecord[];
};

type QueryPlanItem = {
  intent:
    | "address_check"
    | "building_official"
    | "quoted_text_duplicate"
    | "marketplace_duplicate"
    | "comparable_rent"
    | "review_context"
    | "fee_policy"
    | "availability_check";
  query: string;
};
```

## Pipeline

```ts
async function scoreApartmentListing(brief: ListingRiskBrief): Promise<ListingRiskReport> {
  validateBrief(brief);

  const normalized = applyDefaults(brief);
  const status = await massive.account_status();
  assertBudgetAvailable(status, normalized);

  const submittedSource = await loadSubmittedListing(normalized);
  const extracted = await extractListingFacts(submittedSource, normalized);
  const queryPlan = await createListingQueryPlan(extracted, normalized);
  const publicSources = await collectPublicEvidence(queryPlan, normalized);
  const signals = await classifyListingSignals(extracted, publicSources, normalized);
  const marketContext = await buildMarketContext(extracted, publicSources);

  return synthesizeListingRiskReport({
    brief: normalized,
    extracted,
    sources: [submittedSource, ...publicSources],
    queryPlan,
    signals,
    marketContext
  });
}
```

## Listing Load And Extraction

```ts
async function loadSubmittedListing(brief: ListingRiskBrief): Promise<SourceRecord> {
  if (brief.listing.url) {
    const fetched = await massive.web_fetch({
      url: brief.listing.url,
      render_js: true,
      captcha: "handle",
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop"
    });

    return toSourceRecord("submitted_listing", fetched, brief);
  }

  return {
    source_id: "submitted_text",
    source_type: "submitted_listing",
    url: "user-submitted-text",
    fetched_at: new Date().toISOString(),
    fetch_status: "ok",
    text: brief.listing.pasted_text || ""
  };
}

async function extractListingFacts(source: SourceRecord, brief: ListingRiskBrief): Promise<ExtractedListing> {
  return massive.ai_chat_completion({
    task: "extract_public_apartment_listing_facts",
    input: {
      listing_text: source.text,
      listing_url: source.url,
      claimed_city: brief.listing.claimed_city,
      instruction:
        "Extract only facts visible in the public listing. Do not identify or profile private people. Mark missing fields explicitly."
    },
    output_schema: "ExtractedListing"
  });
}
```

## Evidence Collection

```ts
async function createListingQueryPlan(
  listing: ExtractedListing,
  brief: ListingRiskBrief
): Promise<QueryPlanItem[]> {
  const quotedClaim = listing.extracted_claims.find(claim => claim.length > 40);

  const queries: QueryPlanItem[] = [];

  if (listing.claimed_address) {
    queries.push({
      intent: "address_check",
      query: `"${listing.claimed_address}" apartment rent`
    });
  }

  if (listing.building_name || listing.claimed_address) {
    queries.push({
      intent: "building_official",
      query: `${listing.building_name || listing.claimed_address} official apartments floorplans`
    });
  }

  if (quotedClaim) {
    queries.push({
      intent: "quoted_text_duplicate",
      query: `"${quotedClaim.slice(0, 120)}"`
    });
  }

  queries.push({
    intent: "comparable_rent",
    query: `${listing.bedrooms || ""} bedroom apartment rent ${listing.neighborhood || brief.geo?.city || ""}`
  });

  if (brief.risk_policy?.include_review_sites) {
    queries.push({
      intent: "review_context",
      query: `${listing.building_name || listing.claimed_address || brief.geo?.city} apartment reviews`
    });
  }

  return queries;
}

async function collectPublicEvidence(
  queryPlan: QueryPlanItem[],
  brief: ListingRiskBrief
): Promise<SourceRecord[]> {
  const sources: SourceRecord[] = [];

  for (const item of queryPlan) {
    const serp = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: 8
    });

    const candidates = rankEvidenceCandidates(item, serp, sources);

    for (const candidate of candidates.slice(0, fetchLimitForIntent(item.intent))) {
      const fetched = await massive.web_fetch({
        url: candidate.url,
        render_js: true,
        captcha: "handle",
        country: brief.geo?.country,
        city: brief.geo?.city,
        device: brief.geo?.device || "desktop"
      });

      sources.push(toEvidenceSourceRecord(item, candidate, fetched, brief.geo));
    }
  }

  return sources;
}
```

## Scoring

Use a 0-100 listing quality score and a 0-100 scam-risk score. Both are evidence-weighted and should include confidence.

Quality score components:

- 20 points: complete listing basics, including rent, bedrooms, fees, lease terms, availability, and tour process.
- 20 points: address, building, rent, and availability are consistent across public sources.
- 20 points: official or reputable public corroboration exists.
- 15 points: photos, amenities, and floorplan claims are plausible and source-backed.
- 15 points: price is explainable relative to public comparable listings.
- 10 points: page quality, source freshness, and fetch reliability.

Risk score components:

- 25 points: off-platform payment requests, pre-verification deposits, wire or crypto language.
- 20 points: rent materially below public comparable range without explanation.
- 15 points: duplicate text or photos across unrelated domains with conflicting facts.
- 15 points: address, building, or availability conflicts across public sources.
- 10 points: urgency or pressure language.
- 10 points: missing critical terms such as fees, lease length, or refund policy.
- 5 points: blocked, sparse, newly created, or low-quality source surfaces.

Automatic caps:

- Cap confidence at `low` when no submitted URL is fetchable and only pasted text is available.
- Cap confidence at `medium` when fewer than three independent public sources are fetched.
- Cap scam-risk below 60 when all risk signals are only missing-info signals and no active contradiction is found.
- Cap listing quality below 75 when fees or lease terms are missing.
- Mark `needs_human_review` when any high-severity risk signal appears or public evidence conflicts.

## Output Modes

Ship as a CLI first:

```bash
apartment-risk-scorer run \
  --listing-url https://example-rentals.com/listing/123 \
  --country us \
  --city Austin \
  --device desktop \
  --out report.json \
  --report-md report.md
```

Also support batch CSV:

```bash
apartment-risk-scorer batch \
  --input listings.csv \
  --country us \
  --city Austin \
  --out-dir ./reports
```

## Renter-Safe Report Rules

- Use labels such as "quality gap," "risk signal," "inconsistency," and "needs verification."
- Avoid declaring that a listing or person is fraudulent.
- Cite public URLs for every medium or high severity signal.
- Explain uncertainty in plain language.
- Include practical next steps that use official property pages, platform messaging, written terms, and verified tours.
- Do not expose or enrich private contact details beyond what the submitted public listing already shows.
