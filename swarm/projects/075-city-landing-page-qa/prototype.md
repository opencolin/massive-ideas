# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type CityLandingQABrief = {
  site: {
    name: string;
    domain: string;
    template?: string;
  };
  pages: CityPageInput[];
  targets?: GeoDeviceTarget[];
  expectations?: CityPageExpectations;
  competitors?: string[];
  exclude_claims?: string[];
};

type CityPageInput = {
  city: string;
  region?: string;
  country: string;
  url: string;
  service?: string;
  slug?: string;
};

type GeoDeviceTarget = {
  country: string;
  city: string;
  region?: string;
  language?: string;
  device: "desktop" | "mobile";
};

type CityPageExpectations = {
  service?: string;
  require_local_phone?: boolean;
  require_city_specific_copy?: boolean;
  require_local_schema?: boolean;
  require_unique_faqs?: boolean;
  require_service_availability?: boolean;
  required_modules?: string[];
};

type PageFetchObservation = {
  page_id: string;
  url: string;
  target: GeoDeviceTarget;
  status_code: number;
  final_url: string;
  title?: string;
  meta_description?: string;
  h1?: string;
  headings: string[];
  ctas: string[];
  phone_numbers: string[];
  addresses: string[];
  local_entities: string[];
  neighborhoods: string[];
  faq_questions: string[];
  schema_types: string[];
  canonical_url?: string;
  robots_directives: string[];
  rendered_text: string;
  evidence_id: string;
  fetched_at: string;
};

type SerpObservation = {
  page_id: string;
  query: string;
  target: GeoDeviceTarget;
  rank: number;
  title: string;
  snippet?: string;
  url: string;
  domain: string;
  result_type:
    | "organic"
    | "ad"
    | "local_pack"
    | "people_also_ask"
    | "video"
    | "unknown";
  fetched_at: string;
};

type CityLandingIssue = {
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "localization"
    | "intent_match"
    | "duplication"
    | "technical_seo"
    | "schema"
    | "proof"
    | "conversion"
    | "unsupported_claim";
  title: string;
  evidence_id: string;
  source_urls?: string[];
  recommendation: string;
  confidence: "high" | "medium" | "low";
};

type CityLandingPageResult = {
  page_id: string;
  city: string;
  region?: string;
  country: string;
  url: string;
  target: GeoDeviceTarget;
  readiness_score: number;
  status: "publish" | "fix" | "hold" | "reject";
  intent_match_score: number;
  localization_score: number;
  technical_score: number;
  distinctiveness_score: number;
  issues: CityLandingIssue[];
  serp_patterns: {
    pattern: string;
    queries: string[];
    source_urls: string[];
  }[];
  confidence: "high" | "medium" | "low";
};

type CityLandingQAReport = {
  site: string;
  summary: string;
  overall_readiness_score: number;
  pages: CityLandingPageResult[];
  batch_warnings: string[];
};
```

## Pipeline

```ts
async function runCityLandingQA(
  brief: CityLandingQABrief
): Promise<CityLandingQAReport> {
  validateBrief(brief);

  const targets = expandTargets(brief);
  const queryPlan = createLocalQueryPlan(brief, targets);
  const estimatedCredits = estimateCredits(brief.pages, targets, queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for city landing-page QA");
  }

  const fetches = await fetchCityPages(brief.pages, targets);
  const serpEvidence = await collectLocalSerps(queryPlan);
  const duplicateSignals = compareSiblingPages(fetches);
  const classified = await classifyFindings(brief, fetches, serpEvidence, duplicateSignals);

  return assembleReport(brief, classified);
}
```

## Target Expansion

```ts
function expandTargets(brief: CityLandingQABrief): GeoDeviceTarget[] {
  if (brief.targets?.length) {
    return brief.targets;
  }

  return brief.pages.flatMap(page => [
    {
      country: page.country,
      region: page.region,
      city: page.city,
      language: page.country === "us" ? "en-US" : undefined,
      device: "desktop"
    },
    {
      country: page.country,
      region: page.region,
      city: page.city,
      language: page.country === "us" ? "en-US" : undefined,
      device: "mobile"
    }
  ]);
}
```

## Query Planning

```ts
function createLocalQueryPlan(
  brief: CityLandingQABrief,
  targets: GeoDeviceTarget[]
): LocalQueryPlanItem[] {
  return brief.pages.flatMap(page => {
    const service = page.service || brief.expectations?.service || "";
    const place = [page.city, page.region].filter(Boolean).join(" ");
    const base = `${service} ${place}`.trim();
    const competitor = brief.competitors?.[0];

    const queries = [
      base,
      `best ${base}`,
      `${base} near me`,
      `${base} reviews`,
      `${base} cost`,
      `${base} FAQ`
    ];

    if (competitor) {
      queries.push(`${competitor} ${place} alternative`);
    }

    return queries.map(query => ({
      page_id: page.slug || page.url,
      query,
      target: chooseTargetForPage(page, targets),
      priority: query.includes("near me") ? "high" : "medium"
    }));
  });
}
```

## Collection

```ts
async function fetchCityPages(
  pages: CityPageInput[],
  targets: GeoDeviceTarget[]
): Promise<PageFetchObservation[]> {
  const observations = [];

  for (const page of pages) {
    const target = chooseTargetForPage(page, targets);
    const response = await massive.web_fetch({
      url: page.url,
      render_js: true,
      country: target.country,
      city: target.city,
      device: target.device,
      captcha_handling: true
    });

    observations.push(extractPageObservation(page, target, response));
  }

  return observations;
}

async function collectLocalSerps(
  queryPlan: LocalQueryPlanItem[]
): Promise<SerpObservation[]> {
  const results = [];

  for (const item of queryPlan) {
    const serp = await massive.web_search({
      query: item.query,
      country: item.target.country,
      city: item.target.city,
      device: item.target.device,
      parse_google_serp: true
    });

    results.push(...normalizeSerp(item, serp));
  }

  return results;
}
```

## Analysis Steps

1. Validate that fetched pages render, resolve to the expected URL, and are indexable.
2. Extract city, region, phone, address, service area, neighborhoods, CTAs, FAQs, reviews, offers, schema, and internal links.
3. Compare visible city signals to the requested target and sibling city pages.
4. Search local SERPs for intent, competitor modules, local-pack language, FAQ questions, and proof expectations.
5. Use `ai_chat_completion` to classify issues only from supplied page and SERP evidence.
6. Apply scoring caps for wrong-city content, thin duplication, sparse evidence, noindex/canonical defects, and unsupported claims.
7. Export report, issue table, and per-city evidence bundle.

## Scoring Function

```ts
function scoreCityPage(result: Partial<CityLandingPageResult>): number {
  let score = 100;

  for (const issue of result.issues || []) {
    if (issue.severity === "critical") score -= 30;
    if (issue.severity === "high") score -= 18;
    if (issue.severity === "medium") score -= 10;
    if (issue.severity === "low") score -= 4;
  }

  if (hasWrongCityContent(result)) score = Math.min(score, 45);
  if (hasMissingLocalProof(result)) score = Math.min(score, 50);
  if (isMostlyDuplicate(result)) score = Math.min(score, 60);
  if (hasSparseEvidence(result)) score = Math.min(score, 70);
  if (isBlockedOrNoindexed(result)) score = Math.min(score, 35);

  return Math.max(0, Math.min(100, Math.round(score)));
}
```

## CLI Contract

```bash
city-landing-qa run \
  --brief city-qa-brief.json \
  --out city-qa-report.json \
  --csv city-qa-issues.csv \
  --report-md city-qa-report.md \
  --evidence-dir evidence/
```

Outputs:

- `city-qa-report.json`: full typed report with page results and evidence references.
- `city-qa-issues.csv`: one row per issue for sorting and assignment.
- `city-qa-report.md`: human-readable QA summary.
- `evidence/`: rendered page extracts, SERP snapshots, schema extracts, and normalized observations.

## Implementation Notes

- Use deterministic extraction for metadata, schema, phone numbers, canonical tags, and headings before invoking AI.
- Keep local SERP queries bounded to avoid runaway credit usage on large city lists.
- Cache fetches by URL, city, country, device, and timestamp window.
- Diff sibling pages after stripping city names, phone numbers, and addresses to detect template duplication.
- Store prompt inputs and model outputs for auditability, but redact form values and unnecessary personal data.
