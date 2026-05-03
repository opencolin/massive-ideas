# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type DocsAuditBrief = {
  project: string;
  docs_root: string;
  priority_topics: PriorityTopic[];
  queries: SearchQueryBrief[];
  targets: GeoDeviceTarget[];
  competitors?: CompetitorDocs[];
  scoring_weights?: ScoringWeights;
  ai_questions?: AiQuestionBrief[];
  max_discovered_pages?: number;
};

type PriorityTopic = {
  name: string;
  expected_pages: string[];
  must_include: string[];
  preferred_languages?: string[];
  user_task?: string;
};

type SearchQueryBrief = {
  query: string;
  expected_domain: string;
  intent: "quickstart" | "reference" | "troubleshooting" | "migration" | "pricing" | "concept" | "other";
};

type GeoDeviceTarget = {
  country: string;
  city?: string;
  device: "desktop" | "mobile" | "tablet";
};

type CompetitorDocs = {
  name: string;
  docs_root: string;
};

type ScoringWeights = {
  task_coverage: number;
  freshness: number;
  examples: number;
  navigation: number;
  search_findability: number;
  ai_answer_coverage: number;
  accessibility_basics: number;
};

type AiQuestionBrief = {
  question: string;
  topic: string;
  required_points: string[];
  preferred_sources?: string[];
};

type DocsPageObservation = {
  observation_id: string;
  source_url: string;
  final_url?: string;
  status_code?: number;
  target: GeoDeviceTarget;
  fetched_at: string;
  render_state: "ok" | "captcha" | "cookie_wall" | "login" | "timeout" | "blocked" | "error";
  screenshot_ref?: string;
  html_ref?: string;
  text_excerpt?: string;
  metadata: DocsPageMetadata;
  content_signals: ContentSignals;
};

type DocsPageMetadata = {
  title?: string;
  meta_description?: string;
  canonical?: string;
  robots?: string;
  language?: string;
  headings: { level: number; text: string }[];
  last_updated?: string;
  version_label?: string;
  nav_labels: string[];
  breadcrumb_labels: string[];
};

type ContentSignals = {
  links: { href: string; text?: string; status?: number }[];
  code_blocks: { language?: string; text_excerpt: string; copyable?: boolean }[];
  tables: { caption?: string; header_texts: string[] }[];
  api_endpoints: string[];
  sdk_mentions: string[];
  error_codes: string[];
  has_search_box?: boolean;
};

type SerpObservation = {
  query: string;
  target: GeoDeviceTarget;
  searched_at: string;
  organic_results: {
    rank: number;
    title: string;
    url: string;
    snippet?: string;
    is_expected_domain: boolean;
  }[];
  people_also_ask: string[];
  expected_domain_rank?: number;
};

type AiAnswerObservation = {
  question: string;
  topic: string;
  model: string;
  answered_at: string;
  answer_excerpt: string;
  cited_sources: { title?: string; url: string; is_official_docs: boolean }[];
  covered_points: string[];
  missing_points: string[];
};

type DocsIssue = {
  issue_id: string;
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "missing_task_coverage"
    | "stale_content"
    | "weak_examples"
    | "navigation"
    | "broken_link"
    | "search_findability"
    | "ai_answer_gap"
    | "accessibility"
    | "render_failure";
  title: string;
  topic?: string;
  source_url?: string;
  evidence: {
    observation_id?: string;
    query?: string;
    ai_question?: string;
    html_excerpt?: string;
    text_excerpt?: string;
    screenshot_ref?: string;
    fetched_at: string;
  };
  recommendation: string;
  confidence: "high" | "medium" | "low";
};

type DocsQualityReport = {
  project: string;
  docs_root: string;
  summary: string;
  overall_score: number;
  topic_scores: {
    topic: string;
    score: number;
    status: "excellent" | "good" | "needs_work" | "poor";
    strong_signals: string[];
    weak_signals: string[];
  }[];
  issues: DocsIssue[];
  pages: {
    url: string;
    target: GeoDeviceTarget;
    status: "completed" | "partial" | "failed";
    score: number;
    matched_topics: string[];
    warnings: string[];
  }[];
  search_results: SerpObservation[];
  ai_answer_coverage: AiAnswerObservation[];
};
```

## Pipeline

```ts
async function runDocsQualityScorer(brief: DocsAuditBrief): Promise<DocsQualityReport> {
  const collectionPlan = await buildCollectionPlan(brief);
  const estimatedCredits = estimateCredits(collectionPlan, brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for docs quality audit");
  }

  const pageObservations = await collectDocsPages(collectionPlan.pages);
  const serpObservations = await collectSerpObservations(brief);
  const aiAnswers = await collectAiAnswerObservations(brief);

  const deterministicIssues = runDeterministicDocsChecks(brief, pageObservations, serpObservations);
  const aiIssues = await inspectDocsQualityWithAi(brief, pageObservations, serpObservations, aiAnswers);

  return synthesizeDocsQualityReport(brief, pageObservations, serpObservations, aiAnswers, [
    ...deterministicIssues,
    ...aiIssues
  ]);
}
```

## Collection Planning

Start with the docs root, sitemap links when visible, priority topic landing candidates, and Google results for each query:

```ts
async function buildCollectionPlan(brief: DocsAuditBrief) {
  const rootRuns = brief.targets.map(target => ({
    url: brief.docs_root,
    target,
    reason: "docs_root"
  }));

  const queryRuns = brief.queries.flatMap(query =>
    brief.targets.map(target => ({
      query,
      target,
      reason: "serp_discovery"
    }))
  );

  return {
    pages: rootRuns,
    searches: queryRuns,
    maxPages: brief.max_discovered_pages ?? 40
  };
}
```

After fetching the root page, add high-value internal URLs:

- Quickstart, getting started, tutorial, examples, guides, API reference, changelog, SDK, error, webhook, migration, troubleshooting, and FAQ links.
- Canonical docs URLs discovered from Google result pages.
- Competitor docs roots and equivalent pages if benchmarks are configured.

## Page Collection

```ts
async function collectDocsPages(pageRuns): Promise<DocsPageObservation[]> {
  const observations: DocsPageObservation[] = [];

  for (const run of pageRuns) {
    const response = await massive.web_fetch({
      url: run.url,
      render_js: true,
      capture_screenshot: true,
      country: run.target.country,
      city: run.target.city,
      device: run.target.device,
      wait_until: "networkidle",
      timeout_ms: 30000
    });

    observations.push(normalizeDocsFetchResponse(response, run));
  }

  return observations;
}
```

Normalization should preserve:

- Final URL, redirects, status code, render state, screenshot, HTML artifact, and timestamp.
- Headings, side navigation, breadcrumbs, visible search box, code blocks, tables, links, API paths, SDK languages, error codes, version labels, and last-updated dates.
- Challenge indicators including captcha, bot challenge, timeout, login wall, blocked response, and cookie wall.

## Search And AI Checks

```ts
async function collectSerpObservations(brief: DocsAuditBrief): Promise<SerpObservation[]> {
  const observations = [];

  for (const query of brief.queries) {
    for (const target of brief.targets) {
      const serp = await massive.web_search({
        query: query.query,
        country: target.country,
        city: target.city,
        device: target.device,
        parse_google_serp: true
      });

      observations.push(normalizeSerp(serp, query, target));
    }
  }

  return observations;
}

async function collectAiAnswerObservations(brief: DocsAuditBrief): Promise<AiAnswerObservation[]> {
  const questions = brief.ai_questions ?? defaultQuestionsFromTopics(brief.priority_topics);
  const observations = [];

  for (const question of questions) {
    const answer = await massive.ai_chat_completion({
      prompt: buildDocsQuestionPrompt(question, brief.docs_root),
      require_sources: true
    });

    observations.push(normalizeAiAnswer(answer, question, brief.docs_root));
  }

  return observations;
}
```

Prompt shape for answer evaluation:

```text
You are evaluating whether public documentation can answer a developer task.
Question: {{question}}
Official docs root: {{docs_root}}
Required points: {{required_points}}

Answer the question using public web sources. Return cited sources. Then list which required points were covered, which were missing, and whether official docs were cited.
```

## Deterministic Checks

Run deterministic checks before AI scoring:

- Required topic terms are present on at least one relevant official docs page.
- Expected page types exist for each priority topic.
- Code blocks exist for quickstarts and examples.
- Preferred SDK languages appear where configured.
- Last-updated dates are present and not older than the configured freshness threshold.
- Internal links do not produce obvious 404, blocked, timeout, or redirect-loop states.
- Search query expected domain appears in the top results.
- Mobile docs navigation exposes search, sections, and current page context.
- Render failures are excluded from normal docs content checks.

## AI Review Pass

Use `ai_chat_completion` for judgment that needs synthesis, but force every finding to cite observation IDs:

```text
Review these docs observations for topic "{{topic}}".
Only report issues supported by the supplied rendered text, metadata, SERP observations, or AI answer observations.
Do not make claims about runtime behavior unless the evidence says so.
Return JSON issues with category, severity, title, evidence observation IDs, recommendation, and confidence.
```

Good AI-reviewed issues:

- "The quickstart never explains where to find the API key."
- "The webhook guide mentions failed payments but does not name the event payload."
- "Mobile navigation hides the API reference link that is visible on desktop."
- "Google ranks an old blog post above the official guide for the exact integration query."

Bad AI-reviewed issues:

- "The docs probably reduce conversion."
- "The API is unreliable."
- "Developers will hate this layout."
- "This endpoint is wrong" without official-source contradiction.

## Report Synthesis

For each priority topic:

1. Match pages by headings, URL path, nav labels, and query landing pages.
2. Score deterministic dimensions.
3. Apply AI-supported issue penalties.
4. Preserve strong signals and weak signals separately.
5. Cap scores for missing coverage, render failures, or insufficient evidence.

Export artifacts:

- `docs-quality-report.json`
- `docs-quality-issues.csv`
- `docs-quality-report.md`
- `artifacts/pages/*.html`
- `artifacts/screenshots/*.png`
- `artifacts/serp/*.json`
- `artifacts/ai-answers/*.json`
