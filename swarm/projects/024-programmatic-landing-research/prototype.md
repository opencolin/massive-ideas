# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type LandingResearchBrief = {
  site: {
    name: string;
    domain?: string;
  };
  page_pattern:
    | "industry landing pages"
    | "location landing pages"
    | "competitor alternatives"
    | "integration pages"
    | "use-case pages"
    | "persona pages"
    | "custom";
  audience?: string;
  topics: LandingTopic[];
  geo?: GeoTarget;
  known_competitors?: string[];
  exclude?: string[];
};

type LandingTopic = {
  slug: string;
  topic: string;
  industry?: string;
  location?: string;
  competitor?: string;
  integration?: string;
  use_case?: string;
};

type GeoTarget = {
  country: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type LandingIntent =
  | "commercial"
  | "comparison"
  | "problem-aware"
  | "pricing"
  | "local"
  | "faq"
  | "informational";

type QueryPlanItem = {
  topic_slug: string;
  query: string;
  intent: LandingIntent;
  geo: GeoTarget;
  priority: "high" | "medium" | "low";
};

type SerpEvidence = {
  topic_slug: string;
  query: string;
  intent: LandingIntent;
  rank: number;
  title: string;
  snippet?: string;
  url: string;
  domain: string;
  result_type?: "organic" | "ad" | "local_pack" | "people_also_ask" | "video" | "unknown";
  geo: GeoTarget;
  fetched_at: string;
};

type FetchedSource = {
  url: string;
  domain: string;
  title?: string;
  text: string;
  page_type:
    | "vendor"
    | "comparison"
    | "directory"
    | "article"
    | "forum"
    | "documentation"
    | "unknown";
  relevant_claims: string[];
  buyer_language: string[];
  proof_points: string[];
  relevance: "high" | "medium" | "low" | "irrelevant";
};

type LandingPageBrief = {
  slug: string;
  topic: string;
  readiness_score: number;
  intent_clarity_score: number;
  differentiation_score: number;
  evidence_score: number;
  recommended_angle: string;
  primary_intents: LandingIntent[];
  serp_patterns: {
    pattern: string;
    source_urls: string[];
    queries: string[];
  }[];
  buyer_language: string[];
  outline_modules: string[];
  faq_candidates: {
    question: string;
    source_url?: string;
    query?: string;
  }[];
  content_gaps: string[];
  evidence: {
    claim: string;
    source_url: string;
    source_type: "serp_result" | "fetched_page" | "ai_answer_source";
    query?: string;
    rank?: number;
  }[];
  confidence: "high" | "medium" | "low";
};

type LandingResearchReport = {
  site: string;
  page_pattern: string;
  summary: string;
  pages: LandingPageBrief[];
  batch_warnings: string[];
};
```

## Pipeline

```ts
async function analyzeLandingPages(
  brief: LandingResearchBrief
): Promise<LandingResearchReport> {
  validateBrief(brief);

  const queryPlan = await createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for landing research batch");
  }

  const serpEvidence = await collectSerpEvidence(queryPlan);
  const fetchedSources = await fetchEvidenceSources(serpEvidence);
  const classified = await classifySources(brief, serpEvidence, fetchedSources);
  const briefs = await synthesizePageBriefs(brief, classified);

  return assembleReport(brief, briefs);
}
```

## Query Planning

```ts
async function createQueryPlan(brief: LandingResearchBrief): Promise<QueryPlanItem[]> {
  const geo = brief.geo || { country: "us", device: "desktop" };

  const deterministic = brief.topics.flatMap(topic => {
    const audience = brief.audience ? ` for ${brief.audience}` : "";
    const competitor = topic.competitor || brief.known_competitors?.[0];

    const items: QueryPlanItem[] = [
      {
        topic_slug: topic.slug,
        query: topic.topic,
        intent: "commercial",
        geo,
        priority: "high"
      },
      {
        topic_slug: topic.slug,
        query: `best ${topic.topic}${audience}`,
        intent: "comparison",
        geo,
        priority: "high"
      },
      {
        topic_slug: topic.slug,
        query: `${topic.topic} pricing`,
        intent: "pricing",
        geo,
        priority: "medium"
      },
      {
        topic_slug: topic.slug,
        query: `${topic.topic} problems`,
        intent: "problem-aware",
        geo,
        priority: "medium"
      },
      {
        topic_slug: topic.slug,
        query: `${topic.topic} FAQ`,
        intent: "faq",
        geo,
        priority: "low"
      }
    ];

    if (competitor) {
      items.push({
        topic_slug: topic.slug,
        query: `${brief.site.name} vs ${competitor} ${topic.topic}`,
        intent: "comparison",
        geo,
        priority: "medium"
      });
    }

    if (topic.location || geo.city) {
      items.push({
        topic_slug: topic.slug,
        query: `${topic.topic} ${topic.location || geo.city}`,
        intent: "local",
        geo,
        priority: "high"
      });
    }

    return items;
  });

  const aiExpanded = await expandTopicQueries(brief);
  return dedupeQueryPlan([...deterministic, ...aiExpanded]);
}
```

Optional expansion via `ai_chat_completion`:

```ts
async function expandTopicQueries(brief: LandingResearchBrief): Promise<QueryPlanItem[]> {
  const response = await massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content:
          "Generate landing-page research queries. Prefer buyer intent, comparison, pain, FAQ, and page-pattern-specific searches. Avoid excluded meanings."
      },
      {
        role: "user",
        content: JSON.stringify({
          site: brief.site,
          page_pattern: brief.page_pattern,
          audience: brief.audience,
          topics: brief.topics,
          known_competitors: brief.known_competitors,
          exclude: brief.exclude
        })
      }
    ]
  });

  return parseQueryPlan(response);
}
```

## SERP Collection

```ts
async function collectSerpEvidence(queryPlan: QueryPlanItem[]): Promise<SerpEvidence[]> {
  const evidence: SerpEvidence[] = [];

  for (const item of queryPlan) {
    const response = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: item.geo.country,
      city: item.geo.city,
      device: item.geo.device || "desktop",
      max_results: item.priority === "high" ? 10 : 6
    });

    evidence.push(...normalizeSerp(response, item));
  }

  return evidence;
}
```

Keep these fields for each result:

- Topic slug and query intent
- Country, city, and device target
- Rank, result type, URL, domain, title, and snippet
- SERP features such as ads, People Also Ask, local packs, videos, and comparison modules
- Collection timestamp

## Fetching Sources

```ts
async function fetchEvidenceSources(serpEvidence: SerpEvidence[]): Promise<FetchedSource[]> {
  const urls = chooseFetchCandidates(serpEvidence, {
    perTopic: 14,
    perDomain: 2,
    includeTopRanks: 5,
    includePeopleAlsoAskSources: true
  });

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

  return pages
    .filter(page => page.ok && page.text && page.text.length > 300)
    .map(normalizeFetchedSource);
}
```

Fetch priority:

- Top organic results for high-priority queries
- Competitor pages that match the page pattern
- Review, directory, and comparison pages with buyer-language density
- Pages exposing FAQ, schema, or People Also Ask answers
- Official vendor pages for proof-point and positioning comparison

## Synthesis

```ts
async function synthesizePageBriefs(
  brief: LandingResearchBrief,
  classified: ClassifiedLandingEvidence
): Promise<LandingPageBrief[]> {
  const response = await massive.ai_chat_completion({
    model: "strong-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content:
          "Create source-backed programmatic landing-page briefs. Every claim must cite evidence. Mark thin, duplicate, or ambiguous topics low confidence."
      },
      {
        role: "user",
        content: JSON.stringify({ brief, classified })
      }
    ]
  });

  return applyScoreCaps(validateBriefs(response));
}
```

Synthesis rules:

- Recommend a page only when the topic has distinct intent or a distinct angle.
- Preserve source lineage for every SERP pattern, content gap, and buyer-language claim.
- Deduplicate near-identical topics before scoring readiness.
- Keep recommended copy modules factual unless the user's product proof is supplied.
- Separate "what sources say" from "recommended page angle."

## Exports

Produce three files from the same report object:

- JSON: full source-backed report for app ingestion.
- CSV: one row per topic with scores, confidence, angle, top sources, and warnings.
- Markdown: human-readable page briefs with outline modules, buyer language, FAQs, and evidence.
