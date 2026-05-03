# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type TargetScanBrief = {
  buyer: {
    name: string;
    domain?: string;
    thesis: string;
  };
  niche: string;
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  target_profile?: {
    business_models?: string[];
    company_stage?: string[];
    customer_type?: string;
    must_have?: string[];
    exclude?: string[];
  };
  max_targets?: number;
};

type QueryIntent =
  | "niche_vendor"
  | "best_tools"
  | "directory"
  | "review_site"
  | "partner_ecosystem"
  | "funding_or_news"
  | "local_market"
  | "buyer_question";

type QueryPlanItem = {
  query: string;
  intent: QueryIntent;
  source: "google" | "ai_answer";
};

type Evidence = {
  claim: string;
  source_url: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source";
  query?: string;
  prompt?: string;
  rank?: number;
  fetched_at: string;
};

type TargetCompany = {
  name: string;
  domain?: string;
  segment: string;
  target_score: number;
  fit_type: "core_platform" | "capability_add_on" | "customer_access" | "regional_leader" | "watchlist" | "disqualified";
  strategic_rationale: string;
  business_model?: string;
  geo_fit?: string;
  ownership_signal?: string;
  traction_signals: string[];
  risks: string[];
  evidence: Evidence[];
  confidence: "high" | "medium" | "low";
};

type Segment = {
  name: string;
  description: string;
  targets: string[];
};

type TargetScan = {
  niche: string;
  buyer: string;
  scan_summary: string;
  targets: TargetCompany[];
  segments: Segment[];
  watchlist: { name: string; reason: string }[];
  source_domains: {
    domain: string;
    role: "official" | "review" | "directory" | "marketplace" | "publisher" | "news" | "community" | "unknown";
    mentions: number;
  }[];
};
```

## Pipeline

```ts
async function runTargetScan(brief: TargetScanBrief): Promise<TargetScan> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan, brief.max_targets || 50);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for target scan");
  }

  const serpResults = await collectSerps(brief, queryPlan);
  const aiAnswers = await collectAiAnswers(brief, queryPlan);
  const fetchedPages = await fetchCandidatePages(brief, serpResults, aiAnswers);
  const candidates = await extractCandidates(brief, serpResults, aiAnswers, fetchedPages);
  const normalized = normalizeCandidates(candidates);

  return synthesizeTargetScan(brief, normalized, serpResults, aiAnswers, fetchedPages);
}
```

## Query Planning

```ts
function createQueryPlan(brief: TargetScanBrief): QueryPlanItem[] {
  const niche = brief.niche;
  const customer = brief.target_profile?.customer_type || "";
  const mustHave = brief.target_profile?.must_have || [];

  const base: QueryPlanItem[] = [
    { query: `${niche} companies`, intent: "niche_vendor", source: "google" },
    { query: `best ${niche} software`, intent: "best_tools", source: "google" },
    { query: `${niche} vendor directory`, intent: "directory", source: "google" },
    { query: `${niche} reviews`, intent: "review_site", source: "google" },
    { query: `${niche} integrations partners`, intent: "partner_ecosystem", source: "google" },
    { query: `${niche} funding acquisition founder`, intent: "funding_or_news", source: "google" },
    {
      query: `Which companies serve ${customer || `buyers of ${niche}`} in ${niche}? Cite sources.`,
      intent: "buyer_question",
      source: "ai_answer"
    },
    {
      query: `What acquisition targets would fit this thesis: ${brief.buyer.thesis}? Cite sources.`,
      intent: "buyer_question",
      source: "ai_answer"
    }
  ];

  const capabilityQueries = mustHave.flatMap(capability => [
    { query: `${capability} ${niche} software`, intent: "niche_vendor", source: "google" as const },
    { query: `${capability} tools for ${customer || niche}`, intent: "best_tools", source: "google" as const }
  ]);

  return [...base, ...capabilityQueries];
}
```

## SERP Collection

```ts
async function collectSerps(brief: TargetScanBrief, queryPlan: QueryPlanItem[]) {
  const googleQueries = queryPlan.filter(item => item.source === "google");
  const results = [];

  for (const item of googleQueries) {
    results.push(await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: 10
    }));
  }

  return normalizeSerpResults(results, googleQueries);
}
```

Preserve:

- Query text, intent, and target geography
- Rank, title, snippet, URL, and domain
- SERP feature metadata
- Whether the result appears to be official, directory, review, marketplace, partner, news, or community content
- Candidate-company names found in title, snippet, and rich-result metadata

## AI Answer Collection

```ts
async function collectAiAnswers(brief: TargetScanBrief, queryPlan: QueryPlanItem[]) {
  const prompts = queryPlan.filter(item => item.source === "ai_answer");
  const answers = [];

  for (const item of prompts) {
    answers.push(await massive.ai_chat_completion({
      model: "grounded-answer-with-sources",
      messages: [
        {
          role: "system",
          content: "Answer as a corporate development analyst. Cite sources for every company, fit, and risk claim. Do not imply any company is for sale."
        },
        {
          role: "user",
          content: JSON.stringify({
            buyer: brief.buyer,
            niche: brief.niche,
            target_profile: brief.target_profile,
            question: item.query
          })
        }
      ]
    }));
  }

  return normalizeAnswerResults(answers, prompts);
}
```

## Fetching Evidence

```ts
async function fetchCandidatePages(brief, serpResults, aiAnswers) {
  const urls = dedupeUrls([
    brief.buyer.domain ? `https://${brief.buyer.domain}` : undefined,
    ...serpResults.flatMap(result => result.urls.slice(0, 6)),
    ...aiAnswers.flatMap(answer => answer.source_urls || [])
  ].filter(Boolean)).slice(0, 80);

  const pages = [];
  for (const url of urls) {
    pages.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return pages.filter(page => page.ok && page.text?.length > 300);
}
```

Prioritize official company pages, directories, partner pages, review profiles, press pages, leadership pages, pricing pages, integration pages, and recent news.

## Candidate Extraction

Extraction should produce raw candidate records before scoring:

```ts
type RawCandidate = {
  names: string[];
  domains: string[];
  source_mentions: Evidence[];
  product_claims: string[];
  customer_claims: string[];
  geography_claims: string[];
  ownership_clues: string[];
  traction_clues: string[];
  disqualifiers: string[];
};
```

Normalization rules:

- Merge by canonical domain first, then normalized brand.
- Keep separate products when one parent company owns multiple niche products.
- Preserve parent-company evidence without overwriting product-level positioning.
- Treat acquired, public, or enterprise-scale companies as disqualified or watchlist when they violate the target profile.
- Keep agencies, consultants, and resellers out of core targets unless the brief explicitly includes services.

## Scoring Sketch

```ts
function scoreTarget(brief: TargetScanBrief, company: RawCandidate): TargetCompany {
  const relevance = scoreNicheRelevance(brief, company); // 0-25
  const strategicFit = scoreStrategicFit(brief, company); // 0-20
  const evidence = scoreEvidence(company); // 0-15
  const acquisitionPlausibility = scoreAcquisitionPlausibility(brief, company); // 0-15
  const traction = scoreTraction(company); // 0-10
  const geography = scoreGeoFit(brief, company); // 0-10
  const contactability = scoreContactability(company); // 0-5

  let targetScore = relevance + strategicFit + evidence + acquisitionPlausibility + traction + geography + contactability;
  targetScore = applyCaps(brief, company, targetScore);

  return buildTargetCompany(brief, company, targetScore);
}
```

## Output Generation

The final report should include:

- Executive scan summary
- Ranked target list
- Segment map by product surface or buyer workflow
- Watchlist for adjacent but useful companies
- Disqualified companies with reasons
- Source-domain summary
- Methodology and query appendix
- CSV-safe flattened fields for CRM import

## CLI Contract

```bash
ma-target-scanner run --brief target-scan.json --out reports/targets.json
ma-target-scanner export --input reports/targets.json --format csv --out reports/targets.csv
ma-target-scanner report --input reports/targets.json --out reports/target-scan.md
```

Exit codes:

- `0`: scan completed and exported.
- `1`: invalid brief or schema failure.
- `2`: insufficient Massive MCP credits.
- `3`: collection failed for more than 30% of planned sources.
- `4`: output failed automated evidence checks.
