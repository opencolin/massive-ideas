# Prototype

This prototype sketches a TypeScript MVP that wraps Massive MCP tools: `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`. The key design choice is source diversity: the assistant should combine expert reviews, official specs, retailer facts, owner experience, and issue searches instead of trusting a single "best products" page.

## Data Model

```ts
type BuyingBrief = {
  shopping_brief: {
    category: string;
    buyer_goal: string;
    budget?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    location?: {
      country?: string;
      city?: string;
      device?: "desktop" | "mobile";
    };
    must_haves?: string[];
    nice_to_haves?: string[];
    dealbreakers?: string[];
    purchase_window_days?: number;
    accepts_used?: boolean;
    accepts_refurbished?: boolean;
  };
  research_policy?: {
    max_products?: number;
    max_sources_per_product?: number;
    include_forums?: boolean;
    include_retailers?: boolean;
    include_video_transcripts?: boolean;
    prefer_recent_reviews_days?: number;
  };
};

type SourceType =
  | "official_page"
  | "retailer"
  | "expert_review"
  | "forum"
  | "customer_review"
  | "news"
  | "manual_or_support"
  | "comparison_page"
  | "price_tracker"
  | "unknown";

type QueryPlanItem = {
  intent:
    | "candidate_discovery"
    | "expert_review"
    | "official_specs"
    | "retailer_price"
    | "owner_complaints"
    | "alternatives"
    | "model_variant"
    | "return_warranty"
    | "local_availability";
  query: string;
  preferred_source_types?: SourceType[];
};

type SourceRecord = {
  query: string;
  rank?: number;
  url: string;
  title?: string;
  snippet?: string;
  source_type: SourceType;
  fetched_at: string;
  geo?: BuyingBrief["shopping_brief"]["location"];
  text: string;
  fetch_status: "ok" | "blocked" | "captcha_unresolved" | "empty" | "error";
};

type ProductCandidate = {
  canonical_name: string;
  aliases: string[];
  brand?: string;
  model?: string;
  category: string;
  candidate_sources: string[];
};

type ExtractedProductFact = {
  product: string;
  fact_type:
    | "price"
    | "availability"
    | "spec"
    | "performance"
    | "reliability"
    | "owner_praise"
    | "owner_complaint"
    | "warranty"
    | "return_policy"
    | "variant_warning";
  claim: string;
  value?: string;
  source_url: string;
  source_type: SourceType;
  confidence: "high" | "medium" | "low";
};

type BuyingReport = {
  run_id: string;
  generated_at: string;
  category: string;
  summary: string;
  recommendation: {
    best_overall?: string;
    best_value?: string;
    premium_pick?: string;
    budget_pick?: string;
    avoid_or_verify: string[];
    buy_now_or_wait: string;
  };
  shortlist: {
    product: string;
    fit_score: number;
    estimated_price?: string;
    availability: "in_stock_public_sources" | "limited" | "backordered" | "discontinued" | "unclear";
    why_it_fits: string[];
    tradeoffs: string[];
    evidence: {
      url: string;
      source_type: SourceType;
      claim: string;
      fetched_at?: string;
    }[];
    verify_before_buying: string[];
  }[];
  comparison_matrix: Record<string, string | number>[];
  source_summary: {
    search_queries: number;
    fetched_pages: number;
    expert_reviews: number;
    retailer_pages: number;
    forum_threads: number;
    official_pages: number;
    conflicts_found: number;
  };
  query_log?: QueryPlanItem[];
  source_log?: SourceRecord[];
};
```

## Pipeline

```ts
async function researchPurchase(brief: BuyingBrief): Promise<BuyingReport> {
  validateBrief(brief);

  const normalized = applyDefaults(brief);
  const queryPlan = await createBuyingQueryPlan(normalized);
  const estimatedCredits = estimateCredits(queryPlan, normalized.research_policy?.max_sources_per_product || 8);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for buying research");
  }

  const discoverySources = await runSearchAndFetch(normalized, queryPlan);
  const candidates = await extractCandidates(normalized, discoverySources);
  const productSources = await expandProductEvidence(normalized, candidates);
  const facts = await extractProductFacts(normalized, [...discoverySources, ...productSources]);
  const scored = await scoreCandidates(normalized, candidates, facts);

  return synthesizeBuyingReport(normalized, queryPlan, [...discoverySources, ...productSources], facts, scored);
}
```

## Query Planning

```ts
async function createBuyingQueryPlan(brief: BuyingBrief): Promise<QueryPlanItem[]> {
  const { category, buyer_goal } = brief.shopping_brief;
  const budgetMax = brief.shopping_brief.budget?.max;

  const seedQueries: QueryPlanItem[] = [
    {
      intent: "candidate_discovery",
      query: `best ${category} for ${buyer_goal} ${budgetMax ? `under ${budgetMax}` : ""}`
    },
    {
      intent: "expert_review",
      query: `${category} review comparison ${new Date().getFullYear()}`
    },
    {
      intent: "owner_complaints",
      query: `${category} common problems owner complaints`
    },
    {
      intent: "alternatives",
      query: `${category} alternatives worth buying`
    }
  ];

  const generated = await massive.ai_chat_completion({
    task: "create_product_research_queries",
    input: {
      brief,
      instruction:
        "Generate shopping research queries for expert reviews, official specs, current retailer pricing, owner complaints, model variants, local availability, and return or warranty risks."
    },
    output_schema: "QueryPlanItem[]"
  });

  return dedupeQueries([...seedQueries, ...generated]);
}
```

## Search And Fetch

```ts
async function runSearchAndFetch(brief: BuyingBrief, queryPlan: QueryPlanItem[]): Promise<SourceRecord[]> {
  const sources: SourceRecord[] = [];
  const location = brief.shopping_brief.location;

  for (const item of queryPlan) {
    const serp = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: location?.country,
      city: location?.city,
      device: location?.device || "desktop",
      max_results: 10
    });

    const candidates = rankSerpResultsForShopping(item, serp, sources);

    for (const candidate of candidates.slice(0, 5)) {
      const fetched = await massive.web_fetch({
        url: candidate.url,
        render_js: true,
        country: location?.country,
        city: location?.city,
        device: location?.device || "desktop",
        captcha: "handle"
      });

      sources.push(toSourceRecord(item, candidate, fetched, location));
    }
  }

  return sources;
}
```

## Product Evidence Expansion

After candidate extraction, run product-specific queries so each shortlist item has comparable evidence.

```ts
async function expandProductEvidence(
  brief: BuyingBrief,
  candidates: ProductCandidate[]
): Promise<SourceRecord[]> {
  const capped = candidates.slice(0, brief.research_policy?.max_products || 12);
  const productQueries = capped.flatMap(product => [
    `${product.canonical_name} official specs`,
    `${product.canonical_name} current price in stock`,
    `${product.canonical_name} review long term`,
    `${product.canonical_name} problems complaints`,
    `${product.canonical_name} warranty return policy`
  ]);

  return runSearchAndFetch(brief, productQueries.map(query => ({ intent: inferIntent(query), query })));
}
```

## Scoring

Each candidate receives a 0-100 fit score:

- 30 points: matches must-haves, dealbreakers, budget, and buyer goal.
- 15 points: credible expert or lab review support.
- 15 points: owner sentiment is positive enough and complaints are acceptable.
- 15 points: current price and availability are visible in public sources.
- 10 points: official specs and model variant are clear.
- 10 points: return, warranty, and seller risks are acceptable.
- 5 points: source diversity is strong enough to reproduce the recommendation.

Automatic caps:

- Cap at 80 when no current price is found.
- Cap at 75 when only affiliate comparison pages support the product.
- Cap at 70 when availability is unclear.
- Cap at 65 when model names or generations conflict.
- Cap at 60 when owner complaints reveal unresolved reliability concerns.
- Cap at 50 when the product appears discontinued or backordered beyond the purchase window.

## Recommendation Synthesis

Use `ai_chat_completion` with the normalized brief, product facts, score table, and source log. The synthesis prompt should require:

- One plain-language recommendation.
- A ranked shortlist, not a giant catalog.
- Evidence attached to every meaningful claim.
- Explicit tradeoffs for each recommended product.
- "Verify before buying" checks for price, seller, return window, variant, and availability.
- A distinction between expert evidence, owner evidence, retailer claims, and manufacturer claims.
- No invented prices, specs, stock status, or warranty terms.
