# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ComparisonBrief = {
  topic: string;
  prompts: ComparedPrompt[];
  models: AnswerModel[];
  targets: AnswerTarget[];
  owned_domains?: string[];
  competitors?: string[];
  required_entities?: string[];
  freshness_days?: number;
  schedule?: "daily" | "weekly" | "monthly" | "manual";
  alert_thresholds?: AlertThresholds;
};

type AnswerModel = "chatgpt" | "gemini" | "perplexity" | "copilot";

type ComparedPrompt = {
  prompt: string;
  intent:
    | "recommendation"
    | "comparison"
    | "definition"
    | "buying-criteria"
    | "pricing"
    | "how-to"
    | "alternative";
  priority: "high" | "medium" | "low";
};

type AnswerTarget = {
  country: string;
  city?: string;
  device: "desktop" | "mobile";
};

type AlertThresholds = {
  owned_domain_missing_all_models?: boolean;
  competitor_recommended_by_models?: number;
  answer_similarity_below?: number;
  uncited_claims_above?: number;
  stale_source_share_above?: number;
};

type ModelAnswer = {
  answer_id: string;
  run_id: string;
  model: AnswerModel;
  topic: string;
  prompt: string;
  intent: ComparedPrompt["intent"];
  priority: ComparedPrompt["priority"];
  target: AnswerTarget;
  target_key: string;
  collected_at: string;
  answer_excerpt: string;
  cited_sources: AnswerSource[];
  extracted_claims: AnswerClaim[];
  recommended_brands: RecommendedBrand[];
  mentioned_competitors: string[];
  required_entities_present: string[];
  owned_domain_cited: boolean;
  source_count: number;
  fresh_source_count: number;
  uncited_claim_count: number;
  collection_status: "complete" | "partial" | "blocked" | "no_sources";
  confidence: "high" | "medium" | "low";
};

type AnswerSource = {
  url: string;
  domain: string;
  title?: string;
  cited_by_models: AnswerModel[];
  source_role:
    | "vendor"
    | "comparison"
    | "review"
    | "documentation"
    | "news"
    | "forum"
    | "statistics"
    | "unknown";
  freshness: "fresh" | "stale" | "undated" | "unknown";
  published_at?: string;
  fetched_at?: string;
  owned: boolean;
  competitor: boolean;
  fetch_status: "fetched" | "blocked" | "failed" | "skipped";
};

type AnswerClaim = {
  claim: string;
  claim_type: "recommendation" | "definition" | "feature" | "pricing" | "risk" | "statistic";
  source_urls: string[];
  support_status: "supported" | "uncited" | "contradicted" | "unverified";
};

type RecommendedBrand = {
  name: string;
  rank?: number;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  rationale?: string;
  source_urls: string[];
};

type AnswerComparison = {
  prompt: string;
  target_key: string;
  models_compared: AnswerModel[];
  consensus: string[];
  disagreements: AnswerDisagreement[];
  missing_sources: MissingSource[];
  visibility_score: number;
  citation_gap_score: number;
};

type AnswerDisagreement = {
  topic: string;
  models: Partial<Record<AnswerModel, string>>;
  severity: "high" | "medium" | "low";
  evidence_urls: string[];
};

type MissingSource = {
  gap_type: "owned_absent" | "stale_source" | "uncited_claim" | "competitor_only";
  model?: AnswerModel;
  claim?: string;
  recommended_action: string;
  evidence_urls: string[];
};

type ComparisonReport = {
  topic: string;
  run_id: string;
  summary: string;
  model_answers: ModelAnswer[];
  source_graph: AnswerSource[];
  comparisons: AnswerComparison[];
  alerts: {
    alert_type: string;
    severity: "high" | "medium" | "low" | "info";
    message: string;
    prompt?: string;
    target_key?: string;
    evidence_urls?: string[];
  }[];
};
```

## Pipeline

```ts
async function runMultiModelAnswerComparison(
  brief: ComparisonBrief,
  historyStore: HistoryStore
): Promise<ComparisonReport> {
  const runId = createRunId("mmac");
  const plan = expandComparisonPlan(brief);
  const estimatedCredits = estimateCredits(plan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for multi-model answer comparison");
  }

  const rawAnswers = await collectModelAnswers(brief, runId, plan);
  const enrichedAnswers = await verifyAndEnrichSources(brief, rawAnswers);
  const sourceGraph = buildSourceGraph(enrichedAnswers);
  const comparisons = await compareAnswers(brief, enrichedAnswers, sourceGraph);
  const previous = await historyStore.loadComparableSnapshots(brief, enrichedAnswers);
  const alerts = buildAlerts(brief, comparisons, enrichedAnswers, previous);
  const report = await summarizeComparisonRun(brief, runId, enrichedAnswers, sourceGraph, comparisons, alerts);

  await historyStore.saveRun(runId, enrichedAnswers, sourceGraph, comparisons, report);
  return report;
}
```

## Collection

```ts
function expandComparisonPlan(brief: ComparisonBrief) {
  return brief.prompts.flatMap(prompt =>
    brief.targets.flatMap(target =>
      brief.models.map(model => ({
        topic: brief.topic,
        prompt,
        model,
        target,
        target_key: makeTargetKey(target)
      }))
    )
  );
}

async function collectModelAnswers(
  brief: ComparisonBrief,
  runId: string,
  plan: ComparisonPlanItem[]
): Promise<ModelAnswer[]> {
  const answers: ModelAnswer[] = [];

  for (const item of plan) {
    const searchContext = await massive.web_search({
      query: item.prompt.prompt,
      parse_google_serp: true,
      country: item.target.country,
      city: item.target.city,
      device: item.target.device,
      max_results: item.prompt.priority === "high" ? 10 : 6
    });

    const response = await massive.ai_chat_completion({
      model_family: item.model,
      prompt: buildAnswerPrompt(brief, item, searchContext),
      require_sources: true,
      country: item.target.country,
      city: item.target.city,
      device: item.target.device
    });

    const extracted = await extractAnswerStructure(brief, item, response, searchContext);

    answers.push({
      answer_id: createAnswerId(runId, item),
      run_id: runId,
      model: item.model,
      topic: brief.topic,
      prompt: item.prompt.prompt,
      intent: item.prompt.intent,
      priority: item.prompt.priority,
      target: item.target,
      target_key: item.target_key,
      collected_at: new Date().toISOString(),
      answer_excerpt: trimExcerpt(response.answer_text, 500),
      cited_sources: normalizeCitations(response.sources),
      extracted_claims: extracted.claims,
      recommended_brands: extracted.recommended_brands,
      mentioned_competitors: extracted.mentioned_competitors,
      required_entities_present: extracted.required_entities_present,
      owned_domain_cited: extracted.owned_domain_cited,
      source_count: response.sources.length,
      fresh_source_count: 0,
      uncited_claim_count: extracted.claims.filter(claim => claim.support_status === "uncited").length,
      collection_status: response.blocked ? "blocked" : response.sources.length ? "complete" : "no_sources",
      confidence: calculateAnswerConfidence(response, extracted)
    });
  }

  return answers;
}
```

## Source Verification

```ts
async function verifyAndEnrichSources(
  brief: ComparisonBrief,
  answers: ModelAnswer[]
): Promise<ModelAnswer[]> {
  const uniqueUrls = dedupeUrls(answers.flatMap(answer => answer.cited_sources.map(source => source.url)));
  const fetched = new Map<string, FetchedSource>();

  for (const url of uniqueUrls.slice(0, 80)) {
    try {
      const page = await massive.web_fetch({
        url,
        render_js: true,
        handle_captcha: true,
        timeout_ms: 20000
      });

      fetched.set(url, {
        url,
        title: page.title,
        text_excerpt: trimExcerpt(page.text, 1500),
        published_at: extractPublishedDate(page),
        fetched_at: new Date().toISOString(),
        status: "fetched"
      });
    } catch (error) {
      fetched.set(url, {
        url,
        fetched_at: new Date().toISOString(),
        status: "failed"
      });
    }
  }

  return answers.map(answer => enrichAnswerSources(brief, answer, fetched));
}
```

## Answer Comparison

```ts
async function compareAnswers(
  brief: ComparisonBrief,
  answers: ModelAnswer[],
  sourceGraph: AnswerSource[]
): Promise<AnswerComparison[]> {
  const groups = groupByPromptAndTarget(answers);
  const comparisons: AnswerComparison[] = [];

  for (const group of groups) {
    const result = await massive.ai_chat_completion({
      prompt: buildComparisonPrompt(brief, group.answers, sourceGraph),
      response_schema: "answer_comparison"
    });

    comparisons.push({
      prompt: group.prompt,
      target_key: group.target_key,
      models_compared: group.answers.map(answer => answer.model),
      consensus: result.consensus,
      disagreements: result.disagreements,
      missing_sources: result.missing_sources,
      visibility_score: calculateVisibilityScore(brief, group.answers),
      citation_gap_score: calculateCitationGapScore(brief, group.answers, sourceGraph)
    });
  }

  return comparisons;
}
```

## Alert Rules

```ts
function buildAlerts(
  brief: ComparisonBrief,
  comparisons: AnswerComparison[],
  answers: ModelAnswer[],
  previous: ModelAnswer[]
) {
  const alerts = [];

  for (const comparison of comparisons) {
    const matchingAnswers = answers.filter(
      answer => answer.prompt === comparison.prompt && answer.target_key === comparison.target_key
    );

    if (brief.alert_thresholds?.owned_domain_missing_all_models && matchingAnswers.every(answer => !answer.owned_domain_cited)) {
      alerts.push({
        alert_type: "owned_domain_absent",
        severity: "high",
        message: "No selected answer model cited an owned domain for this prompt.",
        prompt: comparison.prompt,
        target_key: comparison.target_key
      });
    }

    const competitorRecommendationCounts = countCompetitorRecommendations(brief, matchingAnswers);
    for (const [competitor, count] of Object.entries(competitorRecommendationCounts)) {
      if (count >= (brief.alert_thresholds?.competitor_recommended_by_models ?? 99)) {
        alerts.push({
          alert_type: "competitor_recommended",
          severity: "medium",
          message: `${competitor} was recommended by ${count} models for this prompt.`,
          prompt: comparison.prompt,
          target_key: comparison.target_key
        });
      }
    }

    if (comparison.citation_gap_score >= 70) {
      alerts.push({
        alert_type: "citation_gap",
        severity: "medium",
        message: "High citation gap score: competitors or third-party sources are filling the answer evidence set.",
        prompt: comparison.prompt,
        target_key: comparison.target_key
      });
    }
  }

  return alerts.concat(buildHistoricalChangeAlerts(brief, answers, previous));
}
```

## Exports

- JSON report for downstream analysis and dashboards.
- CSV answer table with one row per model, prompt, target, and run.
- CSV source table with one row per cited URL and model set.
- Markdown executive report with consensus, disagreements, source gaps, and actions.
- Append-only snapshot directory for trend analysis.
