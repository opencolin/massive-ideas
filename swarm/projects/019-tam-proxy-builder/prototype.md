# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type TamBrief = {
  market: string;
  buyer?: string;
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  company_filters: {
    industries: string[];
    size_bands?: string[];
    exclude?: string[];
  };
  hiring_keywords: string[];
  search_keywords: string[];
  pricing_assumption: {
    annual_acv_low: number;
    annual_acv_high: number;
  };
};

type QueryIntent =
  | "company_count"
  | "directory"
  | "job_post"
  | "search_demand"
  | "category_language"
  | "pricing_proxy";

type QueryPlanItem = {
  query: string;
  intent: QueryIntent;
  source: "google" | "ai_answer";
  max_results: number;
};

type Evidence = {
  claim: string;
  source_url: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source";
  query?: string;
  rank?: number;
  fetched_at: string;
};

type Signal = {
  name: "Company count" | "Hiring demand" | "Search demand" | "Pricing proxy";
  proxy_value: number | string;
  weight: number;
  confidence: "high" | "medium" | "low";
  evidence: Evidence[];
};

type TamProxy = {
  estimated_accounts_low: number;
  estimated_accounts_mid: number;
  estimated_accounts_high: number;
  annual_revenue_low: number;
  annual_revenue_mid: number;
  annual_revenue_high: number;
  evidence_score: number;
  confidence: "high" | "medium" | "low";
};

type TamProxyReport = {
  market: string;
  tam_summary: string;
  tam_proxy: TamProxy;
  signals: Signal[];
  assumptions: {
    name: string;
    value: string;
    rationale: string;
  }[];
  gaps: string[];
};
```

## Pipeline

```ts
async function buildTamProxy(brief: TamBrief): Promise<TamProxyReport> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for TAM proxy run");
  }

  const serpResults = await collectSerps(brief, queryPlan);
  const answerResults = await collectAiAnswers(brief, queryPlan);
  const pages = await fetchSignalPages(serpResults, answerResults);
  const normalizedSignals = await normalizeSignals(brief, serpResults, answerResults, pages);

  return synthesizeTamProxy(brief, normalizedSignals);
}
```

## Query Planning

```ts
function createQueryPlan(brief: TamBrief): QueryPlanItem[] {
  const geo = brief.geo?.city ? ` ${brief.geo.city}` : "";
  const industries = brief.company_filters.industries;

  const companyQueries = industries.flatMap(industry => [
    { query: `${industry} companies${geo}`, intent: "company_count", source: "google", max_results: 10 },
    { query: `${industry} directory${geo}`, intent: "directory", source: "google", max_results: 10 },
    { query: `${industry} association members${geo}`, intent: "directory", source: "google", max_results: 10 }
  ]);

  const jobQueries = brief.hiring_keywords.flatMap(keyword =>
    industries.map(industry => ({
      query: `${industry} ${keyword} jobs${geo}`,
      intent: "job_post",
      source: "google",
      max_results: 10
    }))
  );

  const searchQueries = brief.search_keywords.map(keyword => ({
    query: `${keyword}${geo}`,
    intent: "search_demand",
    source: "google",
    max_results: 10
  }));

  const answerQueries = [
    {
      query: `What public signals can estimate TAM for ${brief.market}? Cite sources.`,
      intent: "category_language",
      source: "ai_answer",
      max_results: 0
    },
    {
      query: `What company types and false positives should be included or excluded for ${brief.market}? Cite sources.`,
      intent: "company_count",
      source: "ai_answer",
      max_results: 0
    }
  ];

  return [...companyQueries, ...jobQueries, ...searchQueries, ...answerQueries] as QueryPlanItem[];
}
```

## SERP Collection

```ts
async function collectSerps(brief: TamBrief, queryPlan: QueryPlanItem[]) {
  const googleQueries = queryPlan.filter(item => item.source === "google");
  const results = [];

  for (const item of googleQueries) {
    results.push(await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: item.max_results
    }));
  }

  return normalizeSerpResults(results, googleQueries);
}
```

Preserve these fields:

- Query text and intent
- Result rank
- Title and snippet
- URL and domain
- SERP feature type, when available
- Any visible counts, ranges, dates, location tags, or job-post metadata

## Fetching Evidence Pages

```ts
async function fetchSignalPages(serpResults, answerResults) {
  const candidateUrls = dedupeUrls([
    ...topUrlsByIntent(serpResults, "company_count", 20),
    ...topUrlsByIntent(serpResults, "directory", 20),
    ...topUrlsByIntent(serpResults, "job_post", 25),
    ...topUrlsByIntent(serpResults, "search_demand", 15),
    ...answerResults.flatMap(answer => answer.source_urls || [])
  ]).slice(0, 60);

  const fetched = [];
  for (const url of candidateUrls) {
    fetched.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return fetched.filter(page => page.ok && page.text?.length > 300);
}
```

Prioritize:

- Industry directories and association pages
- Search result pages with visible counts or structured snippets
- Job boards and employer career pages
- Vendor and category pages that reveal buyer language
- Review sites, marketplaces, and comparison pages
- Public reports only when accessible without gates

## Signal Normalization

```ts
async function normalizeSignals(brief, serpResults, answerResults, pages) {
  return massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Extract TAM proxy signals from public web evidence.",
          "Keep company-count, hiring-demand, search-demand, and pricing evidence separate.",
          "Do not invent exact counts. Use ranges and confidence when evidence is partial.",
          "Return only claims supported by SERP records, fetched pages, or sourced AI answers."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ brief, serpResults, answerResults, pages })
      }
    ]
  });
}
```

Normalization tasks:

- Deduplicate companies by domain, brand, parent company, and location page.
- Convert visible counts into ranges with source lineage.
- Estimate hiring intensity from matching job-post count, role specificity, and repeated pain keywords.
- Classify search demand as low, medium, or high from commercial SERP density and keyword breadth.
- Identify exclusions and false-positive clusters.
- Flag stale, generic, circular, or unsupported sources.

## TAM Synthesis

```ts
async function synthesizeTamProxy(brief, normalizedSignals): Promise<TamProxyReport> {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "You are a market-sizing analyst building a TAM proxy model.",
          "Use ranges, assumptions, and sensitivity. Never present proxy estimates as definitive TAM.",
          "Every material claim must cite evidence. Explain gaps plainly."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          normalizedSignals,
          required_output: "TamProxyReport"
        })
      }
    ]
  });

  return validateTamProxyReport(response.json);
}
```

## Scoring Sketch

```ts
function evidenceScore(signals: Signal[]): number {
  const signalScore = signals.reduce((sum, signal) => {
    const confidenceMultiplier = { high: 1, medium: 0.7, low: 0.35 }[signal.confidence];
    const evidenceMultiplier = Math.min(signal.evidence.length / 3, 1);
    return sum + 100 * signal.weight * confidenceMultiplier * evidenceMultiplier;
  }, 0);

  return Math.round(Math.max(0, Math.min(100, signalScore)));
}
```

Apply caps after scoring:

- Search-only models cap at 70.
- Company-count-only models cap at 65.
- Generic publisher-heavy models cap at 55.
- Ambiguous markets with unresolved exclusions cap at 40.

## Exports

The CLI should write:

- `tam-proxy.json`: full report with raw evidence IDs.
- `signals.csv`: one row per signal and evidence item.
- `tam-proxy.md`: human-readable brief with assumptions and sensitivity ranges.
- `raw/serps.jsonl`, `raw/pages.jsonl`, and `raw/answers.jsonl` for audit and replay.
