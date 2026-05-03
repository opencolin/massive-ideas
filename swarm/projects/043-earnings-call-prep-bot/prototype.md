# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type EarningsPrepBrief = {
  company: {
    name: string;
    ticker?: string;
    ir_url?: string;
    website?: string;
  };
  period: {
    fiscal_quarter?: string;
    earnings_date?: string;
    lookback_days?: number;
  };
  watch_topics?: string[];
  competitors?: string[];
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  output?: {
    audience?: "investor" | "ir" | "strategy" | "sales" | "product";
    formats?: ("markdown" | "json")[];
  };
};

type SourceRecord = {
  url: string;
  final_url?: string;
  title?: string;
  source_type:
    | "investor_relations"
    | "earnings_material"
    | "sec_filing"
    | "transcript"
    | "company_newsroom"
    | "product_page"
    | "blog"
    | "pricing_page"
    | "news"
    | "analyst_note"
    | "competitor"
    | "regulatory"
    | "social"
    | "unknown";
  query?: string;
  rank?: number;
  published_at?: string;
  fetched_at: string;
  geo?: EarningsPrepBrief["geo"];
  text: string;
};

type Evidence = {
  claim: string;
  source_url: string;
  source_type: SourceRecord["source_type"];
  published_at?: string;
  fetched_at: string;
  query?: string;
  rank?: number;
};

type Theme = {
  theme: string;
  why_it_matters: string;
  confidence: "high" | "medium" | "low";
  facts: Evidence[];
  suggested_questions: string[];
  review_notes?: string[];
};

type ProductTimelineItem = {
  date?: string;
  event: string;
  impact: string;
  confidence: "high" | "medium" | "low";
  sources: string[];
};

type EarningsPrepPack = {
  company: string;
  ticker?: string;
  generated_at: string;
  period?: string;
  executive_summary: string;
  themes: Theme[];
  product_timeline: ProductTimelineItem[];
  news_context: Theme[];
  competitive_context: Theme[];
  risk_watch: {
    risk: string;
    evidence: string;
    confidence: "high" | "medium" | "low";
    sources: string[];
  }[];
  question_bank: string[];
  source_inventory: Omit<SourceRecord, "text">[];
};
```

## Pipeline

```ts
async function buildEarningsPrep(brief: EarningsPrepBrief): Promise<EarningsPrepPack> {
  const plan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(plan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for earnings prep run");
  }

  const discovered = await discoverSources(brief, plan);
  const fetched = await fetchSources(brief, discovered);
  const extracted = await extractEarningsFacts(brief, fetched);

  return synthesizePrepPack(brief, fetched, extracted);
}
```

## Query Planning

```ts
function createQueryPlan(brief: EarningsPrepBrief) {
  const company = brief.company.name;
  const ticker = brief.company.ticker ? ` ${brief.company.ticker}` : "";
  const quarter = brief.period.fiscal_quarter || "";
  const topics = brief.watch_topics || ["product launch", "pricing", "customer win", "partnership", "regulation"];

  const baseQueries = [
    `${company}${ticker} earnings date ${quarter}`,
    `${company}${ticker} earnings release ${quarter}`,
    `${company}${ticker} investor relations presentation ${quarter}`,
    `${company}${ticker} earnings call transcript ${quarter}`,
    `${company} product launch last ${brief.period.lookback_days || 90} days`,
    `${company} newsroom product update pricing partnership`,
    `${company} analyst coverage product news earnings`
  ];

  const topicQueries = topics.map(topic => `${company} ${topic} recent news earnings`);
  const competitorQueries = (brief.competitors || []).flatMap(competitor => [
    `${competitor} product launch recent`,
    `${competitor} pricing news recent`,
    `${competitor} earnings product commentary`
  ]);

  return [...baseQueries, ...topicQueries, ...competitorQueries].map(query => ({
    query,
    max_results: 8
  }));
}
```

## Source Discovery

```ts
async function discoverSources(brief: EarningsPrepBrief, plan) {
  const results = [];

  for (const item of plan) {
    const serp = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: item.max_results
    });

    results.push(...normalizeSerpResults(item.query, serp));
  }

  const seeds = [brief.company.ir_url, brief.company.website]
    .filter(Boolean)
    .map(url => ({
      url,
      source_type: classifyUrl(url),
      priority: 1
    }));

  return rankAndDedupeSources([...seeds, ...results]).slice(0, 70);
}
```

Rank sources by:

- investor relations, earnings releases, presentations, transcripts, and filings
- company newsroom, product pages, changelog, pricing pages, and blogs
- reputable news and analyst coverage
- competitor primary sources
- regulatory or government sources
- recent third-party commentary as secondary context only

## Fetching

```ts
async function fetchSources(brief: EarningsPrepBrief, sources): Promise<SourceRecord[]> {
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

    if (page.ok && page.text?.length > 300) {
      fetched.push({
        url: source.url,
        final_url: page.final_url,
        title: page.title,
        source_type: source.source_type || classifyUrl(page.final_url || source.url),
        query: source.query,
        rank: source.rank,
        published_at: page.published_at,
        fetched_at: new Date().toISOString(),
        geo: brief.geo,
        text: trimForExtraction(page.text)
      });
    }
  }

  return fetched;
}
```

## Extraction Prompt

Ask `ai_chat_completion` to return strict JSON:

```json
{
  "facts": [
    {
      "claim": "Company announced a new enterprise AI add-on.",
      "category": "product_launch",
      "date": "2026-04-12",
      "company_or_competitor": "company",
      "business_relevance": "Possible monetization and attach-rate discussion point.",
      "confidence": "high",
      "source_url": "https://example.com/news",
      "source_type": "company_newsroom"
    }
  ],
  "excluded_claims": [
    {
      "claim": "Revenue impact from the launch",
      "reason": "No source states revenue impact."
    }
  ]
}
```

Extraction rules:

- Use only supplied source text.
- Keep facts atomic and cite one or more URLs.
- Preserve dates, product names, segment names, and geography.
- Label interpretation separately from observed evidence.
- Downgrade confidence when sources are stale, syndicated, ambiguous, or third-party.
- Never infer financial impact unless a source states it.

## Synthesis

Group extracted facts into:

- product and packaging timeline
- management and investor-relations context
- recent company news
- competitive context
- risk watch
- analyst or investor question bank

The final Markdown should lead with the most decision-useful themes, then provide detailed timelines and source inventory. JSON should preserve all evidence fields so a UI can render source drawers and filters.

## CLI Sketch

```bash
earnings-prep build --brief brief.json --out reports/examplecloud.md --json reports/examplecloud.json
earnings-prep sources --brief brief.json --out runs/examplecloud-sources.json
earnings-prep validate --json reports/examplecloud.json
```

## MVP Limits

- One company per run.
- Up to 10 competitors.
- 30-90 day lookback by default.
- 70 fetched sources per run.
- No trading recommendations, price targets, or unsupported financial forecasts.
- No authenticated paywalled source access in the first version.
