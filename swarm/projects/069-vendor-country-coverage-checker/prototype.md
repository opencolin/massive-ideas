# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type CoverageBrief = {
  vendor: {
    name: string;
    domain: string;
    seed_urls?: string[];
  };
  target_country: {
    name: string;
    iso2?: string;
    city?: string;
  };
  product?: string;
  buyer_context?: string;
  coverage_dimensions: string[];
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  exclusions?: string[];
};

type SourceType =
  | "official_availability"
  | "official_pricing"
  | "official_terms"
  | "official_privacy"
  | "official_dpa"
  | "official_subprocessors"
  | "official_support"
  | "official_help_article"
  | "official_status"
  | "third_party"
  | "unknown";

type SourceRecord = {
  vendor: string;
  url: string;
  title?: string;
  source_type: SourceType;
  query?: string;
  rank?: number;
  fetched_at: string;
  geo?: CoverageBrief["geo"];
  text: string;
};

type Evidence = {
  source_url: string;
  source_type: SourceType;
  claim: string;
  quote?: string;
  query?: string;
  rank?: number;
  fetched_at: string;
  geo?: CoverageBrief["geo"];
};

type CoverageCell = {
  dimension: string;
  normalized_dimension: string;
  status: "supported" | "unsupported" | "restricted" | "gated" | "unclear" | "not_found";
  confidence: "high" | "medium" | "low";
  details: string;
  evidence: Evidence[];
  review_flags: string[];
};

type CoverageReport = {
  vendor: string;
  target_country: string;
  product?: string;
  generated_at: string;
  not_legal_advice: true;
  recommendation: "likely_supported" | "needs_review" | "likely_not_supported" | "insufficient_public_evidence";
  summary: string;
  coverage: CoverageCell[];
  source_inventory: {
    url: string;
    source_type: SourceType;
    country_mentions: string[];
    dimensions_found: string[];
  }[];
  review_checklist: string[];
  limitations: string[];
};
```

## Pipeline

```ts
async function buildCoverageReport(brief: CoverageBrief): Promise<CoverageReport> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan, brief.coverage_dimensions.length);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for vendor country coverage check");
  }

  const discovered = await discoverSources(brief, queryPlan);
  const fetched = await fetchSources(brief, discovered);
  const extracted = await extractCoverageClaims(brief, fetched);
  const report = await synthesizeCoverageReport(brief, fetched, extracted);

  return enforceConservativeStatuses(report);
}
```

## Query Planning

```ts
function createQueryPlan(brief: CoverageBrief) {
  const vendor = brief.vendor.name;
  const domain = brief.vendor.domain;
  const country = brief.target_country.name;
  const iso2 = brief.target_country.iso2 ? ` OR ${brief.target_country.iso2}` : "";
  const product = brief.product ? ` ${brief.product}` : "";

  const coreQueries = [
    {
      intent: "official_availability",
      query: `site:${domain} ${vendor}${product} ${country}${iso2} availability supported countries`
    },
    {
      intent: "official_pricing",
      query: `site:${domain} ${vendor}${product} ${country}${iso2} pricing billing currency`
    },
    {
      intent: "official_terms",
      query: `site:${domain} ${vendor} terms restricted countries sanctions ${country}${iso2}`
    },
    {
      intent: "official_privacy",
      query: `site:${domain} ${vendor} privacy data residency subprocessors ${country}${iso2}`
    },
    {
      intent: "official_support",
      query: `site:${domain} ${vendor} help support ${country}${iso2}${product}`
    }
  ];

  const dimensionQueries = brief.coverage_dimensions.map(dimension => ({
    intent: "dimension",
    dimension,
    query: `site:${domain} ${vendor} ${country}${iso2} ${dimension}${product}`
  }));

  return [...coreQueries, ...dimensionQueries];
}
```

Limit the first MVP to one vendor, one country, one product or service line, and 6-12 coverage dimensions. Batch multi-country checks by country so localized evidence and pricing do not bleed across markets.

## Source Discovery

```ts
async function discoverSources(brief: CoverageBrief, queryPlan) {
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

  const seedUrls = (brief.vendor.seed_urls || []).map(url => ({
    url,
    source_type: classifyUrl(url),
    priority: 1
  }));

  return rankAndDedupeSources([...seedUrls, ...results]).slice(0, 50);
}
```

Source ranking should prefer:

- Official country availability and supported countries pages
- Official product, pricing, plan, billing, and currency pages
- Official terms, acceptable use, sanctions, restricted country, and export control pages
- Official privacy, DPA, data residency, and subprocessors pages
- Official help center pages for localized setup and feature availability
- Official status or incident pages only for operational availability claims
- Reputable third-party or government sources only as secondary context

## Fetching

```ts
async function fetchSources(brief: CoverageBrief, sources): Promise<SourceRecord[]> {
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
        vendor: brief.vendor.name,
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

Use the target country, city, and device on both search and fetch. If the same official URL renders different content by location, keep separate `SourceRecord` entries with distinct geo metadata.

## Claim Extraction

Use `ai_chat_completion` to extract structured claims from fetched sources. The extraction prompt should require:

- Exact country references, including aliases and ISO codes
- Product or plan scope
- Whether the claim is positive, negative, restrictive, gated, or ambiguous
- Source type and evidence strength
- Short quote or paraphrased evidence snippet
- Any dates, versions, policy effective dates, or "last updated" text
- Whether the claim is public documentation, terms, pricing, compliance, or support content

Example extracted claim:

```json
{
  "dimension": "pricing and billing currency",
  "normalized_dimension": "billing support",
  "claim_type": "restricted",
  "country": "Brazil",
  "product_scope": "payments API",
  "details": "Pricing page lists BRL settlement for local payment methods but says cross-border payouts require approval.",
  "source_url": "https://examplepay.com/br/pricing",
  "source_type": "official_pricing",
  "confidence": "medium",
  "review_flag": "Confirm settlement and payout terms with vendor."
}
```

## Synthesis Rules

```ts
function enforceConservativeStatuses(report: CoverageReport): CoverageReport {
  for (const cell of report.coverage) {
    if (cell.status !== "unclear" && cell.status !== "not_found" && cell.evidence.length === 0) {
      cell.status = "unclear";
      cell.confidence = "low";
      cell.review_flags.push("Downgraded because no public evidence supports the status.");
    }

    if (cell.status === "unsupported" && !hasExplicitNegativeEvidence(cell.evidence)) {
      cell.status = "unclear";
      cell.confidence = "low";
      cell.review_flags.push("Public evidence did not explicitly rule out support.");
    }
  }

  report.not_legal_advice = true;
  report.limitations = [
    "Based on public documentation, terms, pricing, and support pages only.",
    "Does not provide legal advice or determine regulatory compliance.",
    "Vendor confirmation may be required for plan-specific, contract-specific, or regulated use cases."
  ];

  return report;
}
```

Recommendation mapping:

- `likely_supported`: strong official evidence for core availability and no material unresolved blocker.
- `needs_review`: some support evidence exists, but material terms, plan, data, tax, industry, or support questions remain.
- `likely_not_supported`: official evidence explicitly excludes the country or requested use case.
- `insufficient_public_evidence`: public sources are sparse, contradictory, stale, or not product-specific.

## Exports

The MVP should write:

- JSON report for downstream systems
- CSV table with one row per coverage dimension
- Markdown brief for human review

CSV columns:

```text
vendor,target_country,product,dimension,status,confidence,details,evidence_urls,review_flags
```

Markdown sections:

- Summary and recommendation
- Public-docs disclaimer
- Coverage matrix
- Evidence table
- Open questions for vendor or counsel
- Source inventory
- Limitations
