# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type VendorMatrixBrief = {
  category: string;
  buyer_context?: string;
  vendors: {
    name: string;
    domain?: string;
    seed_urls?: string[];
  }[];
  criteria: {
    group: string;
    items: {
      name: string;
      weight: number;
      description?: string;
    }[];
  }[];
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  scoring?: {
    scale?: 3 | 5 | 10;
    unknown_policy?: "neutral" | "penalize_lightly" | "exclude_from_score";
    prefer_official_sources?: boolean;
  };
  deal_breakers?: string[];
  exclusions?: string[];
};

type SourceRecord = {
  vendor: string;
  url: string;
  title?: string;
  source_type:
    | "official_docs"
    | "pricing_page"
    | "product_page"
    | "security_page"
    | "status_page"
    | "integration_directory"
    | "review_site"
    | "analyst_page"
    | "comparison_page"
    | "third_party"
    | "unknown";
  query?: string;
  rank?: number;
  fetched_at: string;
  geo?: VendorMatrixBrief["geo"];
  text: string;
};

type Evidence = {
  source_url: string;
  source_type: SourceRecord["source_type"];
  claim: string;
  quote?: string;
  query?: string;
  rank?: number;
  fetched_at: string;
};

type MatrixCell = {
  score: number | null;
  status: "strong" | "adequate" | "weak" | "unknown" | "deal_breaker" | "conflict";
  rationale: string;
  confidence: "high" | "medium" | "low";
  evidence: Evidence[];
};

type MatrixRow = {
  criteria_group: string;
  criterion: string;
  normalized_criterion: string;
  weight: number;
  vendors: Record<string, MatrixCell>;
};

type VendorRanking = {
  vendor: string;
  weighted_score: number | null;
  confidence: "high" | "medium" | "low";
  best_for: string;
  risks: string[];
};

type VendorComparisonMatrix = {
  category: string;
  generated_at: string;
  recommendation: string;
  rankings: VendorRanking[];
  matrix: MatrixRow[];
  source_inventory: {
    vendor: string;
    url: string;
    source_type: SourceRecord["source_type"];
    criteria_supported: string[];
  }[];
  review_notes: string[];
};
```

## Pipeline

```ts
async function buildVendorMatrix(brief: VendorMatrixBrief): Promise<VendorComparisonMatrix> {
  validateBrief(brief);

  const normalizedBrief = normalizeWeights(brief);
  const queryPlan = createQueryPlan(normalizedBrief);
  const estimatedCredits = estimateCredits(queryPlan, normalizedBrief.vendors.length);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for vendor matrix run");
  }

  const discovered = await discoverSources(normalizedBrief, queryPlan);
  const fetched = await fetchSources(normalizedBrief, discovered);
  const extracted = await extractCriterionEvidence(normalizedBrief, fetched);
  const matrix = await synthesizeMatrix(normalizedBrief, fetched, extracted);

  return scoreAndRank(normalizedBrief, matrix);
}
```

## Query Planning

```ts
function createQueryPlan(brief: VendorMatrixBrief) {
  const flatCriteria = brief.criteria.flatMap(group =>
    group.items.map(item => ({
      group: group.group,
      criterion: item.name
    }))
  );

  return brief.vendors.flatMap(vendor => {
    const vendorTerm = vendor.domain || vendor.name;
    const criterionQueries = flatCriteria.flatMap(item => [
      {
        vendor: vendor.name,
        intent: "criterion_official",
        query: `site:${vendorTerm} ${item.criterion} ${brief.category}`
      },
      {
        vendor: vendor.name,
        intent: "criterion_third_party",
        query: `${vendor.name} ${item.criterion} review ${brief.category}`
      }
    ]);

    return [
      {
        vendor: vendor.name,
        intent: "pricing",
        query: `${vendor.name} pricing plans ${brief.category}`
      },
      {
        vendor: vendor.name,
        intent: "security",
        query: `${vendor.name} security trust SOC 2`
      },
      {
        vendor: vendor.name,
        intent: "docs",
        query: `site:${vendorTerm} docs features ${brief.category}`
      },
      {
        vendor: vendor.name,
        intent: "reviews",
        query: `${vendor.name} reviews pros cons ${brief.category}`
      },
      ...criterionQueries
    ];
  });
}
```

Limit the MVP to 3-6 vendors and 6-12 criteria. Larger comparisons should batch by vendor and criteria group so a failed source fetch only creates localized review flags.

## Source Discovery

```ts
async function discoverSources(brief: VendorMatrixBrief, queryPlan) {
  const results = [];

  for (const item of queryPlan) {
    const serp = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: 8
    });

    results.push(...normalizeSerpResults(item, serp));
  }

  const seedUrls = brief.vendors.flatMap(vendor =>
    (vendor.seed_urls || []).map(url => ({
      vendor: vendor.name,
      url,
      source_type: classifyUrl(url),
      priority: 1
    }))
  );

  return rankAndDedupeSources([...seedUrls, ...results]).slice(0, 80);
}
```

Source ranking should prefer:

- Official docs, product pages, and help centers
- Pricing, packaging, plan, and add-on pages
- Security, trust, compliance, and status pages
- Integration directories and partner marketplaces
- Vendor-authored comparison pages
- Recent reputable review and analyst pages

## Fetching

```ts
async function fetchSources(brief: VendorMatrixBrief, sources): Promise<SourceRecord[]> {
  const fetched = [];

  for (const source of sources) {
    const page = await massive.web_fetch({
      url: source.url,
      render_js: true,
      captcha: "auto",
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      timeout_ms: 15000,
      extract_main_content: true
    });

    if (page.ok && page.text?.length > 250) {
      fetched.push({
        vendor: source.vendor,
        url: page.final_url || source.url,
        title: page.title,
        source_type: source.source_type || classifyUrl(page.final_url || source.url),
        query: source.query,
        rank: source.rank,
        fetched_at: new Date().toISOString(),
        geo: brief.geo,
        text: page.text
      });
    }
  }

  return fetched;
}
```

## Extraction Prompt

```text
You are building a vendor comparison matrix for a real buying decision.

Brief:
{{brief_json}}

Fetched source records:
{{source_records_json}}

For each vendor and criterion:
- Extract only claims supported by the provided public sources.
- Prefer official vendor sources for product capabilities, pricing, security, and availability.
- Use third-party reviews only as supporting context or for user sentiment.
- Return unknown when evidence is insufficient.
- Return conflict when sources disagree.
- Explain whether evidence describes public availability, plan gates, implementation burden, or risk.
- Include concise citations with source URL, source type, query, rank, and fetched timestamp.

Return strict JSON matching the VendorComparisonMatrix schema.
```

## Scoring

```ts
function scoreAndRank(brief: VendorMatrixBrief, matrix: VendorComparisonMatrix) {
  const scale = brief.scoring?.scale || 5;
  const unknownPolicy = brief.scoring?.unknown_policy || "penalize_lightly";

  const rankings = brief.vendors.map(vendor => {
    const cells = matrix.matrix.map(row => ({
      weight: row.weight,
      cell: row.vendors[vendor.name]
    }));

    const weightedScore = computeWeightedScore(cells, scale, unknownPolicy);
    const confidence = aggregateConfidence(cells.map(item => item.cell));

    return {
      vendor: vendor.name,
      weighted_score: weightedScore,
      confidence,
      best_for: summarizeBestFit(vendor.name, cells),
      risks: summarizeRisks(vendor.name, cells)
    };
  });

  return {
    ...matrix,
    rankings: rankings.sort((a, b) => (b.weighted_score || 0) - (a.weighted_score || 0)),
    recommendation: synthesizeRecommendation(rankings, matrix.review_notes)
  };
}
```

Recommended default score mapping on a 5-point scale:

- `strong`: 5
- `adequate`: 3.5
- `weak`: 1.5
- `unknown`: 2.5 when neutral, 2 when lightly penalized, excluded when configured
- `deal_breaker`: 0 and add mandatory review note
- `conflict`: 2.5 and add mandatory review note

## Exports

- Markdown: executive summary, ranking, matrix, risks, review notes, and citations.
- CSV: one row per criterion with vendor score, status, confidence, rationale, and top evidence URL columns.
- JSON: complete machine-readable object with source inventory and full evidence.
- Summary block: short recommendation suitable for a memo or slide.

## Implementation Notes

- Normalize weights to sum to 1.0 unless the user asks for unweighted scoring.
- Treat each criterion as a buyer question, not a keyword match.
- Keep official and third-party evidence separated in the source inventory.
- Store raw SERP metadata so source selection can be audited.
- Cache fetched pages by URL, geo, device, and timestamp bucket.
- Mark review-site snippets as lower authority unless fetched page text supports the claim.
