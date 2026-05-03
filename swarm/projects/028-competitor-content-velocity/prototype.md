# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type VelocityBrief = {
  owned_site: {
    name: string;
    domain: string;
  };
  competitors: Competitor[];
  topics: TopicCluster[];
  content_types?: ContentType[];
  geo?: GeoTarget;
  lookback_days: number;
  exclude?: string[];
};

type Competitor = {
  name: string;
  domain: string;
  seed_urls?: string[];
};

type TopicCluster = {
  name: string;
  keywords: string[];
  include_terms?: string[];
  exclude_terms?: string[];
};

type GeoTarget = {
  country: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type ContentType =
  | "blog"
  | "guide"
  | "comparison"
  | "landing_page"
  | "docs"
  | "changelog"
  | "webinar"
  | "case_study"
  | "unknown";

type QueryPlanItem = {
  competitor_domain: string;
  topic: string;
  query: string;
  intent: "freshness" | "site_search" | "keyword_rank" | "comparison" | "content_hub";
  geo: GeoTarget;
  priority: "high" | "medium" | "low";
};

type PageObservation = {
  url: string;
  canonical_url?: string;
  domain: string;
  title?: string;
  snippet?: string;
  content_hash?: string;
  visible_text_excerpt?: string;
  content_type: ContentType;
  topic: string;
  status: "new" | "updated" | "unchanged" | "removed" | "uncertain";
  first_seen?: string;
  last_seen: string;
  observed_publish_date?: string;
  publish_date_confidence: "high" | "medium" | "low" | "unknown";
  relevance_score: number;
  evidence: EvidenceItem[];
};

type SerpObservation = {
  query: string;
  rank: number;
  url: string;
  domain: string;
  title?: string;
  snippet?: string;
  result_type?: "organic" | "ad" | "video" | "people_also_ask" | "unknown";
  topic: string;
  geo: GeoTarget;
  observed_at: string;
};

type EvidenceItem = {
  source_type: "serp_result" | "web_fetch" | "snapshot_diff" | "ai_answer_source";
  url: string;
  query?: string;
  rank?: number;
  fetched_at?: string;
  note?: string;
};

type CompetitorVelocity = {
  name: string;
  domain: string;
  velocity_score: number;
  net_new_pages: number;
  meaningful_updates: number;
  serp_gains: number;
  topic_momentum: TopicMomentum[];
  notable_pages: PageObservation[];
  recommended_response: string;
  confidence: "high" | "medium" | "low";
};

type TopicMomentum = {
  topic: string;
  score: number;
  new_pages: number;
  updated_pages: number;
  rank_gains: number;
  signal: "accelerating" | "steady" | "declining" | "uncertain";
};

type VelocityReport = {
  period: {
    start: string;
    end: string;
  };
  summary: string;
  competitors: CompetitorVelocity[];
  alerts: {
    severity: "high" | "medium" | "low";
    message: string;
    topic?: string;
    source_urls: string[];
  }[];
  warnings: string[];
};
```

## Pipeline

```ts
async function trackContentVelocity(brief: VelocityBrief): Promise<VelocityReport> {
  validateBrief(brief);

  const previousSnapshot = await loadPreviousSnapshot(brief);
  const queryPlan = await createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan, brief.competitors);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for content velocity run");
  }

  const serp = await collectSerpObservations(queryPlan);
  const candidateUrls = selectCandidateUrls(brief, serp, previousSnapshot);
  const fetched = await fetchCandidatePages(candidateUrls);
  const classified = await classifyPageObservations(brief, fetched, serp);
  const diffed = diffAgainstSnapshot(previousSnapshot, classified, serp);
  const report = await synthesizeVelocityReport(brief, diffed, serp);

  await saveSnapshot(brief, diffed, serp, report);
  return report;
}
```

## Query Planning

```ts
async function createQueryPlan(brief: VelocityBrief): Promise<QueryPlanItem[]> {
  const geo = brief.geo || { country: "us", device: "desktop" };
  const deterministic: QueryPlanItem[] = [];

  for (const competitor of brief.competitors) {
    for (const topic of brief.topics) {
      for (const keyword of topic.keywords) {
        deterministic.push(
          {
            competitor_domain: competitor.domain,
            topic: topic.name,
            query: `${keyword} site:${competitor.domain}`,
            intent: "site_search",
            geo,
            priority: "high"
          },
          {
            competitor_domain: competitor.domain,
            topic: topic.name,
            query: `${keyword}`,
            intent: "keyword_rank",
            geo,
            priority: "high"
          },
          {
            competitor_domain: competitor.domain,
            topic: topic.name,
            query: `${keyword} ${competitor.name}`,
            intent: "comparison",
            geo,
            priority: "medium"
          },
          {
            competitor_domain: competitor.domain,
            topic: topic.name,
            query: `site:${competitor.domain} ${keyword} after:${isoDateDaysAgo(brief.lookback_days)}`,
            intent: "freshness",
            geo,
            priority: "medium"
          }
        );
      }
    }
  }

  const aiExpanded = await expandMonitoringQueries(brief);
  return dedupeQueryPlan([...deterministic, ...aiExpanded]);
}
```

Optional expansion via `ai_chat_completion`:

```ts
async function expandMonitoringQueries(brief: VelocityBrief): Promise<QueryPlanItem[]> {
  const response = await massive.ai_chat_completion({
    model: "fast",
    messages: [
      {
        role: "system",
        content: "Create competitor content monitoring search queries. Return strict JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          owned_site: brief.owned_site,
          competitors: brief.competitors,
          topics: brief.topics,
          content_types: brief.content_types,
          geo: brief.geo,
          exclude: brief.exclude
        })
      }
    ],
    response_format: {
      type: "json_schema",
      schema: "QueryPlanItem[]"
    }
  });

  return parseQueryPlan(response);
}
```

## Collection

```ts
async function collectSerpObservations(plan: QueryPlanItem[]): Promise<SerpObservation[]> {
  const results: SerpObservation[] = [];

  for (const item of plan) {
    const serp = await massive.web_search({
      query: item.query,
      country: item.geo.country,
      city: item.geo.city,
      device: item.geo.device || "desktop",
      parse_google_serp: true
    });

    for (const result of serp.results) {
      if (isTrackedDomain(result.url, item.competitor_domain)) {
        results.push({
          query: item.query,
          rank: result.rank,
          url: result.url,
          domain: item.competitor_domain,
          title: result.title,
          snippet: result.snippet,
          result_type: result.type || "unknown",
          topic: item.topic,
          geo: item.geo,
          observed_at: new Date().toISOString()
        });
      }
    }
  }

  return normalizeSerpObservations(results);
}

async function fetchCandidatePages(urls: string[]): Promise<PageObservation[]> {
  const pages: PageObservation[] = [];

  for (const url of urls) {
    const fetched = await massive.web_fetch({
      url,
      render_js: true,
      handle_captcha: true,
      extract_main_content: true
    });

    pages.push({
      url,
      canonical_url: fetched.canonical_url,
      domain: domainFromUrl(url),
      title: fetched.title,
      visible_text_excerpt: fetched.text?.slice(0, 4000),
      content_hash: hashMeaningfulContent(fetched.text || ""),
      content_type: "unknown",
      topic: "unknown",
      status: "uncertain",
      last_seen: new Date().toISOString(),
      observed_publish_date: extractPublishDate(fetched),
      publish_date_confidence: estimatePublishDateConfidence(fetched),
      relevance_score: 0,
      evidence: [
        {
          source_type: "web_fetch",
          url,
          fetched_at: new Date().toISOString()
        }
      ]
    });
  }

  return pages;
}
```

## Classification And Diffing

```ts
async function classifyPageObservations(
  brief: VelocityBrief,
  pages: PageObservation[],
  serp: SerpObservation[]
): Promise<PageObservation[]> {
  const response = await massive.ai_chat_completion({
    model: "reasoning",
    messages: [
      {
        role: "system",
        content: [
          "Classify competitor content pages for content velocity tracking.",
          "Use only supplied page text, SERP metadata, and brief topics.",
          "Return strict JSON with topic, content_type, relevance_score, and evidence notes."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ brief, pages, serp })
      }
    ]
  });

  return mergeClassifications(pages, response);
}

function diffAgainstSnapshot(
  previous: Snapshot | null,
  currentPages: PageObservation[],
  currentSerp: SerpObservation[]
): PageObservation[] {
  return currentPages.map(page => {
    const prior = previous?.pagesByCanonicalUrl[page.canonical_url || page.url];

    if (!prior) {
      return { ...page, status: "new", first_seen: page.last_seen };
    }

    if (prior.content_hash && prior.content_hash !== page.content_hash) {
      return {
        ...page,
        status: "updated",
        first_seen: prior.first_seen,
        evidence: [
          ...page.evidence,
          {
            source_type: "snapshot_diff",
            url: page.url,
            note: "Meaningful content hash changed from previous snapshot"
          }
        ]
      };
    }

    return { ...page, status: "unchanged", first_seen: prior.first_seen };
  });
}
```

## Reporting

```ts
async function synthesizeVelocityReport(
  brief: VelocityBrief,
  pages: PageObservation[],
  serp: SerpObservation[]
): Promise<VelocityReport> {
  const scored = scoreCompetitors(brief, pages, serp);

  const synthesis = await massive.ai_chat_completion({
    model: "reasoning",
    messages: [
      {
        role: "system",
        content: "Write a concise source-backed competitor content velocity report. Do not invent metrics."
      },
      {
        role: "user",
        content: JSON.stringify({ brief, scored, pages, serp })
      }
    ]
  });

  return validateReportJson(synthesis);
}
```

## Implementation Notes

- Store snapshots as dated JSON files so early prototypes can run without a database.
- Use canonical URL plus normalized title as the main dedupe key.
- Prefer observed page diffs over inferred publish dates when deciding whether a page is updated.
- Keep country, city, and device attached to every SERP observation.
- Include raw source URLs in exports so reviewers can inspect every alert.
- Start with weekly cadence; daily monitoring can multiply cost before the signal is proven.
