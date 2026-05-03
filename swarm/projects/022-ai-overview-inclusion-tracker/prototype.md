# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type BrandEntity = {
  name: string;
  domain: string;
  aliases?: string[];
};

type TrackedQuery = {
  group: "category" | "alternatives" | "comparison" | "pricing" | "use_case" | "problem" | "custom";
  intent: "commercial" | "comparison" | "informational" | "problem-aware" | "transactional";
  query: string;
  priority?: "high" | "medium" | "low";
};

type InclusionBrief = {
  brand: BrandEntity;
  competitors: BrandEntity[];
  queries: TrackedQuery[];
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  preferred_sources?: string[];
  exclude?: string[];
};

type Evidence = {
  claim: string;
  source_url: string;
  source_type: "google_serp" | "fetched_page" | "ai_answer_source";
  query?: string;
  prompt?: string;
  rank?: number;
  serp_feature?: string;
  fetched_at: string;
};

type QueryInclusionResult = {
  query: string;
  group: TrackedQuery["group"];
  intent: TrackedQuery["intent"];
  ai_overview_present: boolean;
  brand_mentioned: boolean;
  brand_cited: boolean;
  mentioned_competitors: string[];
  cited_domains: string[];
  answer_position: "top" | "middle" | "bottom" | "not_present" | "unknown";
  sentiment: "positive" | "neutral_positive" | "neutral" | "neutral_negative" | "negative" | "unknown";
  evidence: Evidence[];
  recommended_action: string;
};

type InclusionReport = {
  brand: string;
  domain: string;
  summary: string;
  run: {
    country?: string;
    city?: string;
    device?: string;
    checked_at: string;
  };
  scorecard: {
    brand_inclusion_rate: number;
    brand_citation_rate: number;
    competitor_inclusion_rate: number;
    average_sentiment: QueryInclusionResult["sentiment"];
    visibility_score: number;
  };
  query_results: QueryInclusionResult[];
  competitor_share: {
    name: string;
    mentions: number;
    citations: number;
    top_cited_pages: string[];
  }[];
  source_opportunities: {
    source_domain: string;
    reason: string;
    queries: string[];
  }[];
};
```

## Pipeline

```ts
async function runInclusionTracker(brief: InclusionBrief): Promise<InclusionReport> {
  const expandedQueries = expandQueries(brief);
  const estimatedCredits = estimateCredits(expandedQueries);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for inclusion tracking run");
  }

  const serpSnapshots = await collectGoogleSnapshots(brief, expandedQueries);
  const chatbotSnapshots = await collectGroundedAnswers(brief, expandedQueries);
  const evidencePages = await fetchEvidencePages(brief, serpSnapshots, chatbotSnapshots);
  const queryResults = classifyQueryInclusion(brief, expandedQueries, serpSnapshots, chatbotSnapshots, evidencePages);

  return synthesizeInclusionReport(brief, queryResults, serpSnapshots, chatbotSnapshots, evidencePages);
}
```

## Query Expansion

```ts
function expandQueries(brief: InclusionBrief): TrackedQuery[] {
  const brand = brief.brand.name;
  const competitors = brief.competitors.map(c => c.name);
  const userQueries = brief.queries;

  const competitorAlternativeQueries = competitors.map(name => ({
    group: "alternatives" as const,
    intent: "comparison" as const,
    query: `${name} alternatives`,
    priority: "medium" as const
  }));

  const brandComparisonQueries = competitors.map(name => ({
    group: "comparison" as const,
    intent: "comparison" as const,
    query: `${brand} vs ${name}`,
    priority: "high" as const
  }));

  return dedupeQueries([
    ...userQueries,
    ...competitorAlternativeQueries,
    ...brandComparisonQueries
  ]);
}
```

Expansion rules:

- Keep user-provided query text unchanged.
- Add competitor alternatives queries only when the competitor list is present.
- Add direct comparison queries for high-value competitor pairs.
- Keep every generated query linked to a group, intent, and priority.
- Avoid expanding into broad category terms unless the user included category queries.

## Google Snapshot Collection

```ts
async function collectGoogleSnapshots(brief: InclusionBrief, queries: TrackedQuery[]) {
  const snapshots = [];

  for (const item of queries) {
    snapshots.push(await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: 10,
      include_serp_features: true
    }));
  }

  return normalizeSerpSnapshots(snapshots, queries);
}
```

Preserve:

- Query, group, intent, priority, location, and device
- AI Overview presence and visible answer text
- AI Overview citations, if available
- Organic rank context for brand, competitors, and cited sources
- SERP features such as related questions, ads, local packs, and discussions
- Capture timestamp for volatility analysis

## Grounded Answer Collection

```ts
async function collectGroundedAnswers(brief: InclusionBrief, queries: TrackedQuery[]) {
  const answers = [];

  for (const item of queries) {
    answers.push(await massive.ai_chat_completion({
      model: "grounded-answer-with-sources",
      messages: [
        {
          role: "system",
          content: "Answer like a neutral buyer research assistant. Cite sources for every brand, competitor, and recommendation claim."
        },
        {
          role: "user",
          content: JSON.stringify({
            question: item.query,
            brand: brief.brand,
            competitors: brief.competitors,
            exclusions: brief.exclude
          })
        }
      ]
    }));
  }

  return normalizeGroundedAnswers(answers, queries);
}
```

Use chatbot answers as a comparison channel, not as a replacement for Google AI Overview evidence. Keep both evidence types separate in the final report.

## Fetching Evidence

```ts
async function fetchEvidencePages(brief, serpSnapshots, chatbotSnapshots) {
  const urls = dedupeUrls([
    `https://${brief.brand.domain}`,
    ...brief.preferred_sources?.map(source => source.startsWith("http") ? source : `https://${source}`) || [],
    ...brief.competitors.map(c => `https://${c.domain}`),
    ...serpSnapshots.flatMap(snapshot => snapshot.ai_overview_citations || []),
    ...serpSnapshots.flatMap(snapshot => snapshot.organic_urls?.slice(0, 5) || []),
    ...chatbotSnapshots.flatMap(answer => answer.source_urls || [])
  ]).slice(0, 75);

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

  return pages.filter(page => page.ok && page.text?.length > 250);
}
```

## Inclusion Classification

```ts
function classifyQueryInclusion(brief, queries, serpSnapshots, chatbotSnapshots, evidencePages): QueryInclusionResult[] {
  return queries.map(query => {
    const serp = findSnapshotForQuery(serpSnapshots, query.query);
    const answer = findAnswerForQuery(chatbotSnapshots, query.query);
    const brandSignals = detectEntitySignals(brief.brand, serp, answer);
    const competitorSignals = brief.competitors.flatMap(competitor => detectEntitySignals(competitor, serp, answer));
    const citedDomains = extractCitedDomains(serp, answer);

    return {
      query: query.query,
      group: query.group,
      intent: query.intent,
      ai_overview_present: Boolean(serp?.features?.ai_overview),
      brand_mentioned: brandSignals.mentioned,
      brand_cited: brandSignals.cited,
      mentioned_competitors: competitorSignals.filter(s => s.mentioned).map(s => s.name),
      cited_domains: citedDomains,
      answer_position: classifyAnswerPosition(brief.brand, serp, answer),
      sentiment: classifySentiment(brief.brand, serp, answer),
      evidence: buildEvidence(query, serp, answer, evidencePages, brandSignals, competitorSignals),
      recommended_action: recommendAction(brief, query, brandSignals, competitorSignals, citedDomains, evidencePages)
    };
  });
}
```

Entity matching should check:

- Brand name, aliases, domain, and product names
- Competitor names, aliases, and domains
- Owned citations versus third-party citations
- Exclusion terms for ambiguous entities
- Whether the answer describes the correct product category

## Scoring

```ts
function scoreVisibility(results: QueryInclusionResult[]): number {
  const weighted = results.map(result => {
    const priorityWeight = result.intent === "commercial" || result.intent === "comparison" ? 1.25 : 1;
    const mention = result.brand_mentioned ? 25 : 0;
    const citation = result.brand_cited ? 20 : 0;
    const placement = { top: 10, middle: 6, bottom: 3, not_present: 0, unknown: 0 }[result.answer_position];
    const sentiment = { positive: 10, neutral_positive: 8, neutral: 5, neutral_negative: 2, negative: 0, unknown: 0 }[result.sentiment];

    return (mention + citation + placement + sentiment) * priorityWeight;
  });

  return clamp(Math.round(average(weighted)), 0, 100);
}
```

Apply caps after base scoring:

- No cited owned or preferred sources: max 65.
- No Google AI Overview evidence: max 55.
- Ambiguous entity match: max 40.
- No AI Overview or grounded answer present: max 30.

## Storage

Store each run as immutable snapshots:

- `brief.json`: normalized input and generated queries
- `serp-snapshots.jsonl`: raw Google SERP observations
- `answer-snapshots.jsonl`: grounded chatbot answers with sources
- `fetched-pages.jsonl`: fetched evidence metadata and extracted text hashes
- `report.json`: final normalized inclusion report
- `query-results.csv`: flat table for analysis
- `report.md`: human-readable summary

For trend reporting, compare new runs against prior snapshots by query, region, device, and entity.
