# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type MarketMapBrief = {
  seed_tool: {
    name: string;
    domain?: string;
  };
  vertical: string;
  buyer?: string;
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  map_goal?: string;
  include?: string[];
  exclude?: string[];
};

type QueryIntent =
  | "seed_alternatives"
  | "direct_competitors"
  | "best_tools"
  | "vertical_workflow"
  | "review_directory"
  | "integration_ecosystem"
  | "pricing"
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

type Vendor = {
  name: string;
  domain?: string;
  cluster: string;
  positioning: string;
  relationship_to_seed: "direct_competitor" | "adjacent_tool" | "integration_partner" | "category_neighbor" | "ambiguous";
  map_score: number;
  evidence: Evidence[];
  confidence: "high" | "medium" | "low";
};

type MarketCluster = {
  name: string;
  description: string;
  seed_adjacency: "direct_competitor" | "adjacent" | "ecosystem" | "emerging" | "ambiguous";
  vendors: string[];
};

type MarketMap = {
  seed_tool: string;
  vertical: string;
  market_summary: string;
  clusters: MarketCluster[];
  vendors: Vendor[];
  source_domains: {
    domain: string;
    role: "official" | "review" | "comparison" | "directory" | "marketplace" | "publisher" | "community" | "unknown";
    serp_mentions: number;
    ai_answer_citations: number;
  }[];
  gaps: string[];
};
```

## Pipeline

```ts
async function generateMarketMap(brief: MarketMapBrief): Promise<MarketMap> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for market map run");
  }

  const serpResults = await collectSerps(brief, queryPlan);
  const aiAnswers = await collectAiAnswers(brief, queryPlan);
  const fetchedPages = await fetchEvidencePages(brief, serpResults, aiAnswers);
  const candidates = await extractVendorCandidates(brief, serpResults, aiAnswers, fetchedPages);

  return synthesizeMarketMap(brief, candidates, serpResults, aiAnswers, fetchedPages);
}
```

## Query Planning

```ts
function createQueryPlan(brief: MarketMapBrief): QueryPlanItem[] {
  const seed = brief.seed_tool.name;
  const vertical = brief.vertical;
  const buyer = brief.buyer ? ` for ${brief.buyer}` : "";

  const base: QueryPlanItem[] = [
    { query: `${seed} alternatives ${vertical}`, intent: "seed_alternatives", source: "google" },
    { query: `${seed} competitors ${vertical}`, intent: "direct_competitors", source: "google" },
    { query: `best ${vertical} software${buyer}`, intent: "best_tools", source: "google" },
    { query: `${vertical} software tools`, intent: "vertical_workflow", source: "google" },
    { query: `${seed} integrations ${vertical}`, intent: "integration_ecosystem", source: "google" },
    { query: `${seed} pricing alternatives`, intent: "pricing", source: "google" },
    { query: `What tools are like ${seed} in ${vertical}? Cite sources.`, intent: "seed_alternatives", source: "ai_answer" },
    { query: `What software categories surround ${seed} for ${vertical}? Cite sources.`, intent: "vertical_workflow", source: "ai_answer" },
    { query: `What should ${buyer || "buyers"} compare when choosing tools like ${seed}? Cite sources.`, intent: "buyer_question", source: "ai_answer" }
  ];

  const includeQueries = (brief.include || []).flatMap(term => [
    { query: `${term} tools ${vertical}`, intent: "vertical_workflow", source: "google" as const },
    { query: `best ${term} software ${vertical}`, intent: "best_tools", source: "google" as const }
  ]);

  return [...base, ...includeQueries];
}
```

## SERP Collection

```ts
async function collectSerps(brief: MarketMapBrief, queryPlan: QueryPlanItem[]) {
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

- Query text and intent
- Rank, title, snippet, URL, and domain
- SERP feature metadata
- Local targeting fields
- Whether the result looks official, review, directory, marketplace, or publisher-led

## AI Answer Collection

```ts
async function collectAiAnswers(brief: MarketMapBrief, queryPlan: QueryPlanItem[]) {
  const prompts = queryPlan.filter(item => item.source === "ai_answer");
  const answers = [];

  for (const item of prompts) {
    answers.push(await massive.ai_chat_completion({
      model: "grounded-answer-with-sources",
      messages: [
        {
          role: "system",
          content: "Answer as a market analyst. Cite sources for every vendor, category, and relationship claim."
        },
        {
          role: "user",
          content: JSON.stringify({
            seed_tool: brief.seed_tool,
            vertical: brief.vertical,
            buyer: brief.buyer,
            include: brief.include,
            exclude: brief.exclude,
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
async function fetchEvidencePages(brief, serpResults, aiAnswers) {
  const urls = dedupeUrls([
    brief.seed_tool.domain ? `https://${brief.seed_tool.domain}` : undefined,
    ...serpResults.flatMap(result => result.urls.slice(0, 6)),
    ...aiAnswers.flatMap(answer => answer.source_urls || [])
  ].filter(Boolean)).slice(0, 60);

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

Prioritize:

- Seed vendor product, alternatives, integrations, pricing, and customer pages
- Official pages for candidate vendors
- Review and category directory pages
- App marketplace and integration ecosystem pages
- Vertical buying guides and comparison pages

## Candidate Extraction

```ts
async function extractVendorCandidates(brief, serpResults, aiAnswers, fetchedPages) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Extract candidate tools for a market map.",
          "Separate direct competitors from adjacent tools.",
          "Do not include excluded meanings or consumer-only tools.",
          "Every candidate must include evidence lineage."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ brief, serpResults, aiAnswers, fetchedPages })
      }
    ]
  });

  return JSON.parse(response.content);
}
```

## Synthesis Prompt

```ts
async function synthesizeMarketMap(brief, candidates, serpResults, aiAnswers, fetchedPages) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Build a sourced market map for tools like the seed tool in the requested vertical.",
          "Cluster vendors by buyer workflow and relationship to the seed.",
          "Keep SERP evidence, fetched-page evidence, and AI-answer evidence distinct.",
          "Score conservatively and label uncertainty."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          candidates,
          serpResults,
          aiAnswers,
          fetchedPages,
          required_schema: "MarketMap"
        })
      }
    ]
  });

  return validateMarketMap(JSON.parse(response.content));
}
```

## CLI Shape

```bash
market-map generate \
  --brief market-map.json \
  --out market-map-output.json \
  --csv vendors.csv \
  --brief-md market-map.md \
  --max-fetches 60
```

## Implementation Notes

- Normalize company identity by domain first, then brand aliases, then parent company.
- Store raw MCP responses separately from synthesized output for audit and re-scoring.
- Treat "alternatives" queries as direct-competitor evidence, but treat broad vertical queries as adjacency evidence until confirmed.
- Track inclusion and exclusion rule matches before scoring.
- Run schema validation before export.
