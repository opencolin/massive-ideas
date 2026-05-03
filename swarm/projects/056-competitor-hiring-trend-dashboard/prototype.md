# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type HiringBrief = {
  tracked_company: {
    name: string;
    domain: string;
  };
  competitors: Competitor[];
  role_families: RoleFamily[];
  strategic_keywords?: string[];
  locations?: string[];
  geo?: GeoTarget;
  lookback_days: number;
  exclude?: string[];
};

type Competitor = {
  name: string;
  domain: string;
  careers_url?: string;
  ats_domains?: string[];
};

type RoleFamily =
  | "engineering"
  | "product"
  | "design"
  | "data"
  | "security"
  | "sales"
  | "marketing"
  | "customer_success"
  | "finance"
  | "people"
  | "operations"
  | "legal"
  | "other";

type Seniority =
  | "intern"
  | "entry"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "manager"
  | "director"
  | "executive"
  | "unknown";

type GeoTarget = {
  country: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type QueryPlanItem = {
  competitor_name: string;
  competitor_domain: string;
  query: string;
  intent: "careers_discovery" | "role_search" | "location_search" | "freshness" | "ats_lookup";
  role_family?: RoleFamily;
  location?: string;
  geo: GeoTarget;
  priority: "high" | "medium" | "low";
};

type PostingObservation = {
  url: string;
  canonical_url?: string;
  posting_id?: string;
  domain: string;
  competitor_name: string;
  title: string;
  department?: string;
  role_family: RoleFamily;
  seniority: Seniority;
  location?: string;
  location_mode: "onsite" | "hybrid" | "remote" | "unknown";
  salary_range?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: "hour" | "year" | "unknown";
  };
  status: "new" | "active" | "updated" | "removed" | "uncertain";
  strategic_themes: string[];
  first_seen?: string;
  last_seen: string;
  observed_posted_date?: string;
  posted_date_confidence: "high" | "medium" | "low" | "unknown";
  relevance_score: number;
  content_hash?: string;
  visible_text_excerpt?: string;
  evidence: EvidenceItem[];
};

type SerpObservation = {
  query: string;
  rank: number;
  url: string;
  domain: string;
  title?: string;
  snippet?: string;
  result_type?: "organic" | "job_pack" | "ad" | "unknown";
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

type RoleFamilyMomentum = {
  role_family: RoleFamily;
  score: number;
  active_postings: number;
  net_new_postings: number;
  removed_postings: number;
  seniority_mix: Seniority[];
  locations: string[];
  signal: "accelerating" | "steady" | "declining" | "uncertain";
};

type CompetitorHiringTrend = {
  name: string;
  domain: string;
  hiring_momentum_score: number;
  active_postings: number;
  net_new_postings: number;
  removed_postings: number;
  meaningful_updates: number;
  role_family_momentum: RoleFamilyMomentum[];
  strategic_themes: {
    theme: string;
    evidence_count: number;
    confidence: "high" | "medium" | "low";
    source_urls: string[];
  }[];
  notable_postings: PostingObservation[];
  recommended_watch: string;
  confidence: "high" | "medium" | "low";
};

type HiringTrendReport = {
  period: {
    start: string;
    end: string;
  };
  summary: string;
  competitors: CompetitorHiringTrend[];
  alerts: {
    severity: "high" | "medium" | "low";
    message: string;
    role_family?: RoleFamily;
    source_urls: string[];
  }[];
  warnings: string[];
};
```

## Pipeline

```ts
async function trackHiringTrends(brief: HiringBrief): Promise<HiringTrendReport> {
  validateBrief(brief);

  const previousSnapshot = await loadPreviousSnapshot(brief);
  const queryPlan = await createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan, brief.competitors);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for hiring trend run");
  }

  const serp = await collectSerpObservations(queryPlan);
  const candidateUrls = selectCandidatePostingUrls(brief, serp, previousSnapshot);
  const fetched = await fetchCandidatePages(candidateUrls);
  const postings = await classifyPostingObservations(brief, fetched, serp);
  const diffed = diffAgainstSnapshot(previousSnapshot, postings, serp);
  const report = await synthesizeHiringTrendReport(brief, diffed, serp);

  await saveSnapshot(brief, diffed, serp, report);
  return report;
}
```

## Query Planning

```ts
async function createQueryPlan(brief: HiringBrief): Promise<QueryPlanItem[]> {
  const geo = brief.geo || { country: "us", device: "desktop" };
  const plan: QueryPlanItem[] = [];

  for (const competitor of brief.competitors) {
    plan.push(
      {
        competitor_name: competitor.name,
        competitor_domain: competitor.domain,
        query: `${competitor.name} careers`,
        intent: "careers_discovery",
        geo,
        priority: "high"
      },
      {
        competitor_name: competitor.name,
        competitor_domain: competitor.domain,
        query: `site:${competitor.domain} jobs OR careers after:${isoDateDaysAgo(brief.lookback_days)}`,
        intent: "freshness",
        geo,
        priority: "medium"
      }
    );

    for (const roleFamily of brief.role_families) {
      plan.push({
        competitor_name: competitor.name,
        competitor_domain: competitor.domain,
        query: `${competitor.name} ${roleFamily} jobs`,
        intent: "role_search",
        role_family: roleFamily,
        geo,
        priority: "high"
      });
    }

    for (const location of brief.locations || []) {
      plan.push({
        competitor_name: competitor.name,
        competitor_domain: competitor.domain,
        query: `${competitor.name} jobs ${location}`,
        intent: "location_search",
        location,
        geo,
        priority: "medium"
      });
    }
  }

  const aiExpanded = await expandHiringQueries(brief);
  return dedupeQueryPlan([...plan, ...aiExpanded]);
}
```

Optional expansion via `ai_chat_completion`:

```ts
async function expandHiringQueries(brief: HiringBrief): Promise<QueryPlanItem[]> {
  const response = await massive.ai_chat_completion({
    model: "fast",
    messages: [
      {
        role: "system",
        content: "Create competitor hiring monitoring search queries. Return strict JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          competitors: brief.competitors,
          role_families: brief.role_families,
          strategic_keywords: brief.strategic_keywords,
          locations: brief.locations,
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
  const observations: SerpObservation[] = [];

  for (const item of plan) {
    const serp = await massive.web_search({
      query: item.query,
      country: item.geo.country,
      city: item.geo.city,
      device: item.geo.device || "desktop",
      parse_google_serp: true
    });

    for (const result of serp.results) {
      observations.push({
        query: item.query,
        rank: result.rank,
        url: result.url,
        domain: normalizeDomain(result.url),
        title: result.title,
        snippet: result.snippet,
        result_type: result.type || "organic",
        geo: item.geo,
        observed_at: new Date().toISOString()
      });
    }
  }

  return observations;
}

async function fetchCandidatePages(urls: string[]): Promise<FetchedPage[]> {
  const pages: FetchedPage[] = [];

  for (const url of urls) {
    const fetched = await massive.web_fetch({
      url,
      render_js: true,
      handle_captcha: true,
      include_links: true,
      include_visible_text: true
    });

    pages.push({
      url,
      final_url: fetched.final_url,
      title: fetched.title,
      visible_text: fetched.visible_text,
      links: fetched.links,
      fetched_at: fetched.fetched_at,
      content_hash: hashContent(fetched.visible_text)
    });
  }

  return pages;
}
```

## Classification

```ts
async function classifyPostingObservations(
  brief: HiringBrief,
  fetched: FetchedPage[],
  serp: SerpObservation[]
): Promise<PostingObservation[]> {
  const response = await massive.ai_chat_completion({
    model: "accurate",
    messages: [
      {
        role: "system",
        content: [
          "Classify public job postings for competitive hiring intelligence.",
          "Return only supported facts and label uncertainty.",
          "Do not infer headcount, budget, revenue, confidential strategy, or launch timing."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          pages: fetched.map(page => ({
            url: page.final_url || page.url,
            title: page.title,
            visible_text_excerpt: page.visible_text.slice(0, 8000),
            content_hash: page.content_hash,
            fetched_at: page.fetched_at
          })),
          serp
        })
      }
    ],
    response_format: {
      type: "json_schema",
      schema: "PostingObservation[]"
    }
  });

  return enforcePostingGuardrails(parsePostings(response), brief);
}
```

## Diffing and Trend Synthesis

```ts
function diffAgainstSnapshot(
  previous: HiringSnapshot,
  currentPostings: PostingObservation[],
  serp: SerpObservation[]
): PostingObservation[] {
  return currentPostings.map(posting => {
    const prior = findPriorPosting(previous, posting);

    if (!prior) {
      return { ...posting, status: "new", first_seen: posting.last_seen };
    }

    if (prior.content_hash && prior.content_hash !== posting.content_hash) {
      return {
        ...posting,
        status: "updated",
        first_seen: prior.first_seen,
        evidence: [
          ...posting.evidence,
          {
            source_type: "snapshot_diff",
            url: posting.url,
            note: "Posting content hash changed from previous snapshot."
          }
        ]
      };
    }

    return { ...posting, status: "active", first_seen: prior.first_seen };
  });
}

async function synthesizeHiringTrendReport(
  brief: HiringBrief,
  postings: PostingObservation[],
  serp: SerpObservation[]
): Promise<HiringTrendReport> {
  const grouped = groupByCompetitor(postings);
  const competitors = Object.values(grouped).map(group =>
    scoreCompetitorHiringTrend(brief, group, serp)
  );

  const response = await massive.ai_chat_completion({
    model: "accurate",
    messages: [
      {
        role: "system",
        content: "Write a concise hiring trend report using only supplied observations and evidence URLs."
      },
      {
        role: "user",
        content: JSON.stringify({ brief, competitors, postings, serp })
      }
    ],
    response_format: {
      type: "json_schema",
      schema: "HiringTrendReport"
    }
  });

  return applyScoreCapsAndWarnings(parseReport(response));
}
```

## Dashboard Views

- Overview: competitor leaderboard, active postings, net-new postings, removals, and momentum score.
- Role family heatmap: competitor by function with acceleration, steady state, and decline labels.
- Seniority mix: leadership, staff, principal, and manager role shifts over time.
- Location map: remote, hybrid, city, country, and regional expansion signals.
- Strategic themes: AI-labeled initiatives backed by specific postings and snippets.
- Posting table: title, competitor, family, seniority, location, status, first seen, last seen, confidence, and evidence.
- Alerts: notable acceleration, leadership hiring, geography expansion, role removals, compensation changes, and low-confidence warnings.

## Persistence

Store one snapshot per run:

```text
snapshots/
  2026-04-01T090000Z/
    brief.json
    query-plan.json
    serp-observations.json
    fetched-pages.json
    postings.json
    report.json
    report.md
    postings.csv
```

Snapshot matching order:

1. Explicit posting ID from ATS page or structured data.
2. Canonical URL after removing tracking parameters.
3. Employer domain plus normalized title plus normalized location.
4. SERP URL plus title when fetch is unavailable.

## Guardrail Checks

```ts
function enforcePostingGuardrails(
  postings: PostingObservation[],
  brief: HiringBrief
): PostingObservation[] {
  return postings
    .filter(posting => !matchesExcludedPattern(posting, brief.exclude || []))
    .map(posting => ({
      ...posting,
      relevance_score: clamp(posting.relevance_score, 0, 100),
      strategic_themes: posting.strategic_themes.filter(Boolean),
      evidence: dedupeEvidence(posting.evidence)
    }))
    .map(capLowConfidenceAggregatorOnlyEvidence)
    .map(capUnresolvedCanonicalIds)
    .map(removeUnsupportedCompensationClaims);
}
```
