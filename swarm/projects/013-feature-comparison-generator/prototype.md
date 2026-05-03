# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ComparisonBrief = {
  category: string;
  audience?: string;
  vendors: {
    name: string;
    domain?: string;
    seed_urls?: string[];
  }[];
  features: string[];
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  plans_to_track?: string[];
  exclusions?: string[];
};

type SourceRecord = {
  vendor: string;
  url: string;
  title?: string;
  source_type: "official_docs" | "pricing_page" | "product_page" | "help_center" | "security_page" | "comparison_page" | "third_party" | "unknown";
  query?: string;
  rank?: number;
  fetched_at: string;
  geo?: ComparisonBrief["geo"];
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

type FeatureCell = {
  status: "supported" | "unsupported" | "partial" | "plan_gated" | "region_gated" | "unknown";
  availability?: string;
  notes: string;
  confidence: "high" | "medium" | "low";
  evidence: Evidence[];
};

type ComparisonRow = {
  feature: string;
  normalized_feature: string;
  vendors: Record<string, FeatureCell>;
};

type FeatureComparison = {
  category: string;
  generated_at: string;
  summary: string;
  comparison: ComparisonRow[];
  source_inventory: {
    vendor: string;
    url: string;
    source_type: SourceRecord["source_type"];
    features_found: string[];
  }[];
  review_notes: string[];
};
```

## Pipeline

```ts
async function buildFeatureComparison(brief: ComparisonBrief): Promise<FeatureComparison> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan, brief.vendors.length);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for feature comparison run");
  }

  const discovered = await discoverSources(brief, queryPlan);
  const fetched = await fetchSources(brief, discovered);
  const extracted = await extractFeatureClaims(brief, fetched);

  return synthesizeComparison(brief, fetched, extracted);
}
```

## Query Planning

```ts
function createQueryPlan(brief: ComparisonBrief) {
  return brief.vendors.flatMap(vendor => {
    const vendorTerm = vendor.domain || vendor.name;
    const featureQueries = brief.features.flatMap(feature => [
      {
        vendor: vendor.name,
        intent: "feature_docs",
        query: `site:${vendorTerm} ${feature} ${brief.category} docs`
      },
      {
        vendor: vendor.name,
        intent: "pricing",
        query: `site:${vendorTerm} ${feature} pricing plan`
      }
    ]);

    return [
      {
        vendor: vendor.name,
        intent: "pricing",
        query: `${vendor.name} pricing ${brief.category}`
      },
      {
        vendor: vendor.name,
        intent: "docs",
        query: `${vendor.name} docs ${brief.category} features`
      },
      {
        vendor: vendor.name,
        intent: "comparison",
        query: `${vendor.name} alternatives feature comparison ${brief.category}`
      },
      ...featureQueries
    ];
  });
}
```

Limit the first MVP to 3-5 vendors and 8-15 features. Larger matrices should batch by vendor and feature area so a failed fetch does not invalidate the whole run.

## Source Discovery

```ts
async function discoverSources(brief: ComparisonBrief, queryPlan) {
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

  return rankAndDedupeSources([...seedUrls, ...results]).slice(0, 60);
}
```

Source ranking should prefer:

- Official docs and help center pages
- Pricing, plan, packaging, and add-on pages
- Product feature pages
- Security, compliance, and integration directory pages
- Vendor-authored comparison pages
- Recent reputable third-party comparison pages

## Fetching

```ts
async function fetchSources(brief: ComparisonBrief, sources): Promise<SourceRecord[]> {
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

```ts
async function extractFeatureClaims(brief: ComparisonBrief, sources: SourceRecord[]) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Extract only evidence-backed product feature and pricing/package claims.",
          "Use official vendor pages as stronger evidence than third-party pages.",
          "Do not infer support from vague marketing language.",
          "Return JSON with vendor, feature, status, availability, evidence, confidence, and review_notes."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          sources: sources.map(source => ({
            vendor: source.vendor,
            url: source.url,
            source_type: source.source_type,
            query: source.query,
            rank: source.rank,
            fetched_at: source.fetched_at,
            text: source.text.slice(0, 12000)
          }))
        })
      }
    ]
  });

  return JSON.parse(response.content);
}
```

## Synthesis Rules

```ts
function synthesizeComparison(brief, sources, extracted): FeatureComparison {
  const rows = brief.features.map(feature => ({
    feature,
    normalized_feature: normalizeFeatureName(feature),
    vendors: Object.fromEntries(
      brief.vendors.map(vendor => [
        vendor.name,
        chooseBestCell(feature, vendor.name, extracted.claims)
      ])
    )
  }));

  return {
    category: brief.category,
    generated_at: new Date().toISOString(),
    summary: summarizeMatrix(rows),
    comparison: rows,
    source_inventory: buildSourceInventory(sources, extracted.claims),
    review_notes: collectReviewNotes(rows, extracted.review_notes)
  };
}
```

Cell selection should:

- Prefer official current pages over third-party pages.
- Prefer pricing or plan pages for availability and packaging claims.
- Use `partial` when feature wording is close but not equivalent.
- Use `unknown` when only weak, stale, or ambiguous evidence exists.
- Downgrade confidence when evidence conflicts across sources.
- Keep unsupported claims only when a source explicitly says the feature is unavailable.

## Exports

The CLI should produce:

- `comparison.json`: full structured output with evidence and crawl context.
- `comparison.csv`: one row per feature, one status column per vendor, plus evidence URL columns.
- `comparison.md`: human-readable table with linked source footnotes and review notes.

Markdown cells should stay compact:

```md
| Feature | ExampleDesk | SampleSupport |
| --- | --- | --- |
| AI agent | Supported, Pro+ [[1]] | Partial, Enterprise [[2]] |
```

## Review Loop

Flag cells for manual review when:

- Confidence is low.
- Evidence is third-party only.
- Official pages conflict.
- Feature names are semantically close but not exact.
- Availability depends on plan, add-on, region, beta status, or sales contact.
- The source page required captcha handling or rendered minimal text.
