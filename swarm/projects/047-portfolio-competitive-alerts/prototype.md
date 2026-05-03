# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type PortfolioAlertsBrief = {
  portfolio: {
    name: string;
    default_geo?: GeoTarget;
  };
  companies: PortfolioCompany[];
  alert_rules: AlertRules;
  exclude?: string[];
  delivery?: DeliveryConfig;
};

type PortfolioCompany = {
  name: string;
  domain: string;
  category: string;
  competitors: CompetitorTarget[];
  tracked_topics: string[];
  tracked_keywords: string[];
  geo_overrides?: GeoTarget[];
  notes?: string;
};

type CompetitorTarget = {
  name: string;
  domain: string;
  known_urls?: string[];
  aliases?: string[];
};

type GeoTarget = {
  country: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type AlertRules = {
  cadence: "daily" | "weekly" | "manual";
  minimum_severity: "low" | "medium" | "high";
  include_ai_answers: boolean;
  include_pricing: boolean;
  include_serp_changes: boolean;
  lookback_days: number;
  max_alerts_per_company?: number;
};

type DeliveryConfig = {
  markdown_digest?: boolean;
  csv_export?: boolean;
  json_export?: boolean;
  slack_channel?: string;
  email_recipients?: string[];
};

type Observation = {
  observation_id: string;
  portfolio_company: string;
  portfolio_domain: string;
  competitor?: string;
  competitor_domain?: string;
  signal_type: SignalType;
  topic?: string;
  source_type: "web_search" | "web_fetch" | "ai_chat_completion" | "snapshot_diff";
  url: string;
  title?: string;
  query?: string;
  rank?: number;
  snippet?: string;
  excerpt?: string;
  geo: GeoTarget;
  observed_at: string;
  first_seen_at?: string;
  content_hash?: string;
  confidence: "high" | "medium" | "low";
  warnings: string[];
};

type SignalType =
  | "competitive_launch"
  | "feature_release"
  | "pricing_change"
  | "packaging_change"
  | "comparison_page"
  | "alternatives_page"
  | "serp_gain"
  | "ai_answer_inclusion"
  | "docs_or_api_update"
  | "integration_update"
  | "marketplace_update"
  | "regional_expansion"
  | "positioning_shift"
  | "emerging_competitor"
  | "noise";

type CompetitiveAlert = {
  alert_id: string;
  portfolio_company: string;
  competitor?: string;
  severity: "high" | "medium" | "low";
  severity_score: number;
  signal_type: SignalType;
  topic?: string;
  title: string;
  why_it_matters: string;
  confidence: "high" | "medium" | "low";
  observed_at: string;
  evidence: EvidenceItem[];
  recommended_follow_up: string;
  warnings: string[];
};

type EvidenceItem = {
  source_type: Observation["source_type"];
  url: string;
  title?: string;
  query?: string;
  rank?: number;
  excerpt?: string;
  fetched_at?: string;
  observed_at: string;
  country: string;
  city?: string;
  device?: string;
};

type PortfolioAlertReport = {
  run_id: string;
  portfolio: string;
  generated_at: string;
  summary: string;
  alerts: CompetitiveAlert[];
  suppressed: SuppressedObservation[];
  warnings: string[];
};

type SuppressedObservation = {
  observation_id: string;
  reason: string;
  url: string;
  signal_type?: SignalType;
};
```

## Pipeline

```ts
async function runPortfolioAlerts(
  brief: PortfolioAlertsBrief
): Promise<PortfolioAlertReport> {
  validateBrief(brief);

  const queryPlan = buildQueryPlan(brief);
  const fetchPlan = buildFetchPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan, fetchPlan, brief.alert_rules);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for portfolio alerts run");
  }

  const previous = await loadPreviousObservations(brief);
  const searchObservations = await collectSearchObservations(brief, queryPlan);
  const fetchedObservations = await collectFetchObservations(brief, fetchPlan, searchObservations);
  const aiAnswerObservations = brief.alert_rules.include_ai_answers
    ? await collectAiAnswerObservations(brief)
    : [];

  const observations = normalizeObservations([
    ...searchObservations,
    ...fetchedObservations,
    ...aiAnswerObservations
  ]);

  const candidates = compareWithPreviousSnapshots(brief, previous, observations);
  const classified = await classifyAndScoreCandidates(brief, candidates);
  const report = await synthesizePortfolioReport(brief, classified);

  await saveObservations(observations);
  await saveReport(report);
  return report;
}
```

## Query Planning

Build predictable queries per portfolio company so runs are explainable and repeatable.

```ts
function buildQueryPlan(brief: PortfolioAlertsBrief): SearchQuery[] {
  return brief.companies.flatMap((company) => {
    const geos = company.geo_overrides || [brief.portfolio.default_geo || { country: "us" }];
    const competitorQueries = company.competitors.flatMap((competitor) => [
      `${competitor.name} pricing`,
      `${competitor.name} changelog`,
      `${competitor.name} alternatives ${company.category}`,
      `${competitor.name} vs ${company.name}`,
      `site:${competitor.domain} (${company.tracked_topics.join(" OR ")})`
    ]);

    const topicQueries = company.tracked_keywords.flatMap((keyword) => [
      keyword,
      `${keyword} alternatives`,
      `${keyword} comparison`
    ]);

    return geos.flatMap((geo) =>
      [...competitorQueries, ...topicQueries].map((query) => ({
        portfolio_company: company.name,
        portfolio_domain: company.domain,
        query,
        geo
      }))
    );
  });
}
```

## Search Collection

Use `web_search` for discovery and rank movement. Preserve every result with query, rank, and target context before deduplication.

```ts
async function collectSearchObservations(
  brief: PortfolioAlertsBrief,
  queries: SearchQuery[]
): Promise<Observation[]> {
  const observations: Observation[] = [];

  for (const item of queries) {
    const result = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: item.geo.country,
      city: item.geo.city,
      device: item.geo.device || "desktop"
    });

    for (const serp of result.results) {
      const mapped = mapSerpResultToObservation(brief, item, serp);
      if (mapped) observations.push(mapped);
    }
  }

  return observations;
}
```

## Fetch Collection

Use `web_fetch` for competitor and discovered URLs because important product, pricing, and docs changes often render behind JavaScript tabs, accordions, or region selectors.

```ts
async function fetchCompetitivePage(
  company: PortfolioCompany,
  competitor: CompetitorTarget,
  url: string,
  geo: GeoTarget
): Promise<Observation> {
  const response = await massive.web_fetch({
    url,
    render_js: true,
    captcha: "solve",
    country: geo.country,
    city: geo.city,
    device: geo.device || "desktop",
    wait_for_network_idle: true,
    extract_visible_text: true,
    include_html: false
  });

  const cleanedText = removeBoilerplate(response.visible_text, [
    "cookie",
    "footer",
    "newsletter",
    "copyright"
  ]);

  const extracted = await massive.ai_chat_completion({
    model: "fast",
    messages: [
      {
        role: "system",
        content: "Extract competitive-intelligence signals from public page text. Return JSON only with signal_type, topic, excerpt, novelty_hint, confidence, and warnings."
      },
      {
        role: "user",
        content: JSON.stringify({
          portfolio_company: company.name,
          category: company.category,
          competitor: competitor.name,
          tracked_topics: company.tracked_topics,
          url,
          page_text: cleanedText.slice(0, 12000)
        })
      }
    ]
  });

  return {
    observation_id: stableObservationId(company.domain, competitor.domain, url, geo),
    portfolio_company: company.name,
    portfolio_domain: company.domain,
    competitor: competitor.name,
    competitor_domain: competitor.domain,
    signal_type: extracted.signal_type,
    topic: extracted.topic,
    source_type: "web_fetch",
    url,
    title: response.title,
    excerpt: extracted.excerpt,
    geo,
    observed_at: new Date().toISOString(),
    content_hash: stableHash(cleanedText),
    confidence: extracted.confidence,
    warnings: [...(response.warnings || []), ...(extracted.warnings || [])]
  };
}
```

## AI Answer Monitoring

Use `ai_chat_completion` for sourced chatbot-style answers when `include_ai_answers` is enabled. Treat answer inclusion as a discovery signal, then fetch cited sources before creating high-confidence alerts.

```ts
async function collectAiAnswerObservations(
  brief: PortfolioAlertsBrief
): Promise<Observation[]> {
  const prompts = brief.companies.flatMap((company) =>
    company.tracked_keywords.map((keyword) => ({
      company,
      prompt: `What are the best ${keyword} vendors? Include sources.`
    }))
  );

  const observations: Observation[] = [];

  for (const item of prompts) {
    const answer = await massive.ai_chat_completion({
      model: "research",
      require_sources: true,
      messages: [{ role: "user", content: item.prompt }]
    });

    observations.push(...mapAnswerSourcesToObservations(item.company, item.prompt, answer));
  }

  return observations;
}
```

## Classification And Scoring

```ts
async function classifyAndScoreCandidates(
  brief: PortfolioAlertsBrief,
  candidates: Observation[]
): Promise<CompetitiveAlert[]> {
  const nonNoise = candidates.filter((obs) => !isSuppressedByRules(obs, brief.exclude || []));
  const grouped = groupObservationsByCompanyCompetitorTopic(nonNoise);
  const alerts: CompetitiveAlert[] = [];

  for (const group of grouped) {
    const scored = scoreSeverity(group, brief.alert_rules);
    if (scored.severityScore < minimumScore(brief.alert_rules.minimum_severity)) continue;

    const synthesis = await massive.ai_chat_completion({
      model: "fast",
      messages: [
        {
          role: "system",
          content: "Create a concise competitive alert from public evidence. Separate observed facts from recommendation. Do not invent revenue, adoption, churn, customer loss, or private roadmap claims."
        },
        {
          role: "user",
          content: JSON.stringify({ brief, observations: group, severity: scored })
        }
      ]
    });

    alerts.push({
      alert_id: stableAlertId(group),
      portfolio_company: group[0].portfolio_company,
      competitor: group[0].competitor,
      severity: scored.severity,
      severity_score: scored.severityScore,
      signal_type: scored.primarySignalType,
      topic: scored.topic,
      title: synthesis.title,
      why_it_matters: synthesis.why_it_matters,
      confidence: scored.confidence,
      observed_at: latestObservedAt(group),
      evidence: group.map(toEvidenceItem),
      recommended_follow_up: synthesis.recommended_follow_up,
      warnings: collectWarnings(group)
    });
  }

  return rankAndCapAlerts(alerts, brief.alert_rules.max_alerts_per_company);
}
```

## Storage

Store one immutable observation file per run and one normalized current-state index per portfolio:

```text
snapshots/
  seed-fund-i/
    runs/
      2026-05-02T170000Z.observations.json
      2026-05-02T170000Z.alerts.json
    current-index.json
    suppressed-urls.json
```

`current-index.json` stores the latest content hash, first-seen date, last-seen date, last rank, source type, signal type, and confidence for each company/domain/URL/query/geo/device tuple.

## Output Modes

Generate:

- `alerts.json`: complete machine-readable report.
- `alerts.csv`: one row per alert with severity, company, competitor, topic, URL, rank, confidence, and owner.
- `alerts.md`: founder or investor-readable digest with source links.
- `alert-events.jsonl`: append-only event stream for Slack, email, CRM, or data warehouse integrations.

## MVP Implementation Order

1. Brief schema, validation, and credit estimate.
2. Query planner and SERP observation collector.
3. Fetch planner for known competitor URLs and discovered candidate URLs.
4. Snapshot comparison and duplicate suppression.
5. AI classification, severity scoring, and report synthesis.
6. JSON, CSV, and Markdown outputs.
7. Benchmark fixtures and automated evaluation.
8. Optional delivery integrations after alert quality is stable.
