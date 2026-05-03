# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type TrackingBrief = {
  category: string;
  queries: TrackedQuery[];
  targets: SearchTarget[];
  owned_domains?: string[];
  competitors?: string[];
  watch_terms?: string[];
  schedule?: "daily" | "weekly" | "monthly" | "manual";
  alert_thresholds?: AlertThresholds;
};

type TrackedQuery = {
  query: string;
  intent:
    | "definition"
    | "comparison"
    | "commercial"
    | "problem-aware"
    | "pricing"
    | "how-to"
    | "alternative";
  priority: "high" | "medium" | "low";
};

type SearchTarget = {
  country: string;
  city?: string;
  device: "desktop" | "mobile";
};

type AlertThresholds = {
  ai_overview_appears?: boolean;
  ai_overview_disappears?: boolean;
  owned_domain_removed?: boolean;
  owned_domain_added?: boolean;
  competitor_mentions_added?: number;
  summary_similarity_below?: number;
  cited_source_churn_above?: number;
};

type AioSource = {
  url: string;
  domain: string;
  title?: string;
  source_role:
    | "definition"
    | "example"
    | "comparison"
    | "statistic"
    | "how_to"
    | "vendor"
    | "unknown";
  owned: boolean;
  competitor: boolean;
  fetched_at?: string;
  relevance: "high" | "medium" | "low" | "irrelevant";
};

type AioObservation = {
  observation_id: string;
  run_id: string;
  category: string;
  query: string;
  intent: TrackedQuery["intent"];
  priority: TrackedQuery["priority"];
  target: SearchTarget;
  target_key: string;
  collected_at: string;
  ai_overview_present: boolean;
  summary_excerpt?: string;
  cited_sources: AioSource[];
  organic_results: OrganicResult[];
  mentioned_entities: string[];
  mentioned_competitors: string[];
  watch_terms_present: string[];
  extracted_claims: ExtractedClaim[];
  narrative_score: number;
  collection_status: "complete" | "partial" | "blocked" | "no_aio";
  confidence: "high" | "medium" | "low";
};

type OrganicResult = {
  rank: number;
  url: string;
  domain: string;
  title: string;
  snippet?: string;
  result_type: "organic" | "ad" | "local_pack" | "paa" | "unknown";
};

type ExtractedClaim = {
  claim: string;
  claim_type: "definition" | "benefit" | "risk" | "vendor" | "process" | "statistic";
  source_urls: string[];
};

type AioChange = {
  change_type:
    | "aio_appeared"
    | "aio_disappeared"
    | "source_added"
    | "source_removed"
    | "owned_domain_added"
    | "owned_domain_removed"
    | "competitor_added"
    | "competitor_removed"
    | "theme_shift"
    | "watch_term_shift";
  severity: "high" | "medium" | "low" | "info";
  score: number;
  query: string;
  target_key: string;
  before?: string;
  after?: string;
  evidence_urls: string[];
};

type AioReport = {
  category: string;
  run_id: string;
  summary: string;
  observations: AioObservation[];
  changes: AioChange[];
  alerts: {
    alert_type: string;
    severity: "high" | "medium" | "low" | "info";
    message: string;
    query?: string;
    target_key?: string;
    evidence_urls?: string[];
  }[];
};
```

## Pipeline

```ts
async function runAiOverviewTracker(
  brief: TrackingBrief,
  historyStore: HistoryStore
): Promise<AioReport> {
  const runId = createRunId("aio");
  const plannedSearches = expandTrackingPlan(brief);
  const estimatedCredits = estimateCredits(plannedSearches);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for AI Overview tracking run");
  }

  const observations = await collectObservations(brief, runId, plannedSearches);
  const previous = await historyStore.loadComparableSnapshots(brief, observations);
  const changes = await detectChanges(brief, previous, observations);
  const alerts = buildAlerts(brief, changes, observations);
  const report = await summarizeRun(brief, runId, observations, changes, alerts);

  await historyStore.saveRun(runId, observations, report);
  return report;
}
```

## Search Collection

```ts
function expandTrackingPlan(brief: TrackingBrief) {
  return brief.queries.flatMap(query =>
    brief.targets.map(target => ({
      category: brief.category,
      query,
      target,
      target_key: makeTargetKey(target)
    }))
  );
}

async function collectObservations(
  brief: TrackingBrief,
  runId: string,
  plan: TrackingPlanItem[]
): Promise<AioObservation[]> {
  const observations: AioObservation[] = [];

  for (const item of plan) {
    const serp = await massive.web_search({
      query: item.query.query,
      parse_google_serp: true,
      country: item.target.country,
      city: item.target.city,
      device: item.target.device,
      max_results: item.query.priority === "high" ? 10 : 6
    });

    const normalized = normalizeGoogleSerp(serp, item);
    const citedSources = await fetchAndClassifySources(brief, normalized.aio_cited_urls);
    const extracted = await extractAioMeaning(brief, normalized, citedSources);

    observations.push({
      observation_id: createObservationId(runId, item),
      run_id: runId,
      category: brief.category,
      query: item.query.query,
      intent: item.query.intent,
      priority: item.query.priority,
      target: item.target,
      target_key: item.target_key,
      collected_at: new Date().toISOString(),
      ai_overview_present: normalized.ai_overview_present,
      summary_excerpt: normalized.ai_overview_excerpt,
      cited_sources: citedSources,
      organic_results: normalized.organic_results,
      mentioned_entities: extracted.mentioned_entities,
      mentioned_competitors: extracted.mentioned_competitors,
      watch_terms_present: extracted.watch_terms_present,
      extracted_claims: extracted.claims,
      narrative_score: extracted.narrative_score,
      collection_status: normalized.collection_status,
      confidence: calculateObservationConfidence(normalized, citedSources, extracted)
    });
  }

  return observations;
}
```

## Source Fetching

```ts
async function fetchAndClassifySources(
  brief: TrackingBrief,
  urls: string[]
): Promise<AioSource[]> {
  const uniqueUrls = dedupeUrls(urls).slice(0, 12);
  const sources: AioSource[] = [];

  for (const url of uniqueUrls) {
    const page = await massive.web_fetch({
      url,
      render_js: true,
      handle_captcha: true,
      extract_text: true
    });

    const classified = await massive.ai_chat_completion({
      model: "fast-json",
      response_format: "json",
      messages: [
        {
          role: "system",
          content: "Classify why this page may be cited in a Google AI Overview. Return strict JSON."
        },
        {
          role: "user",
          content: JSON.stringify({
            category: brief.category,
            owned_domains: brief.owned_domains || [],
            competitors: brief.competitors || [],
            url,
            title: page.title,
            text_excerpt: page.text?.slice(0, 6000)
          })
        }
      ]
    });

    sources.push({
      url,
      domain: domainFromUrl(url),
      title: page.title,
      source_role: classified.source_role || "unknown",
      owned: isOwnedDomain(url, brief.owned_domains || []),
      competitor: isCompetitorSource(url, page.text, brief.competitors || []),
      fetched_at: new Date().toISOString(),
      relevance: classified.relevance || "low"
    });
  }

  return sources;
}
```

## Meaning Extraction

Use `ai_chat_completion` to convert volatile AI Overview text and source evidence into stable, auditable fields:

```ts
async function extractAioMeaning(
  brief: TrackingBrief,
  serp: NormalizedSerp,
  sources: AioSource[]
) {
  if (!serp.ai_overview_present) {
    return {
      mentioned_entities: [],
      mentioned_competitors: [],
      watch_terms_present: [],
      claims: [],
      narrative_score: 0
    };
  }

  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content:
          "Extract category narrative facts from a Google AI Overview observation. Use only supplied text and sources. Return JSON with claims and source_urls."
      },
      {
        role: "user",
        content: JSON.stringify({
          category: brief.category,
          competitors: brief.competitors || [],
          watch_terms: brief.watch_terms || [],
          ai_overview_excerpt: serp.ai_overview_excerpt,
          cited_sources: sources,
          organic_results: serp.organic_results.slice(0, 10)
        })
      }
    ]
  });
}
```

## Change Detection

```ts
async function detectChanges(
  brief: TrackingBrief,
  previous: AioObservation[],
  current: AioObservation[]
): Promise<AioChange[]> {
  const changes: AioChange[] = [];
  const previousByKey = indexByComparableKey(previous);

  for (const observation of current) {
    const prior = previousByKey.get(comparableKey(observation));

    if (!prior) {
      changes.push(newObservationChange(observation));
      continue;
    }

    changes.push(...presenceChanges(prior, observation));
    changes.push(...sourceSetChanges(brief, prior, observation));
    changes.push(...competitorChanges(prior, observation));
    changes.push(...watchTermChanges(prior, observation));

    const similarity = await compareNarratives(prior, observation);
    if (similarity < (brief.alert_thresholds?.summary_similarity_below || 0.7)) {
      changes.push(themeShiftChange(prior, observation, similarity));
    }
  }

  return changes.sort((a, b) => b.score - a.score);
}
```

Comparison rules:

- Compare only the same query, country, city, and device.
- Treat blocked or partial collections as inconclusive unless repeated.
- Use source URL set difference for citations and domain set difference for broader source churn.
- Use semantic similarity for answer themes, but include source-backed before and after summaries.
- Keep high-priority query changes above low-priority query changes when scores tie.

## Storage

Use append-only files for the MVP:

```text
snapshots/
  2026-05-02T09-00-00Z/
    observations.jsonl
    report.json
    sources.csv
    report.md
  index.json
```

`index.json` tracks the latest comparable snapshot per category, query, target, and device. Later versions can move the same model into Postgres with tables for runs, observations, sources, claims, and changes.

## Exports

Generate:

- JSON report for downstream automation.
- CSV of AI Overview sources with query, target, source role, owned flag, competitor flag, first seen, and last seen.
- Markdown report with executive summary, presence matrix, top changes, alerts, and evidence links.
- Optional Slack or email-ready summary once alert quality is validated.
