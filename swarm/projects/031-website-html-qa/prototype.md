# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type QaBrief = {
  project: string;
  urls: PageTarget[];
  targets: GeoDeviceTarget[];
  required_elements?: RequiredElement[];
  content_rules?: ContentRule[];
  seo_rules?: SeoRules;
  accessibility_rules?: AccessibilityRules;
  search_validation?: SearchValidation;
};

type PageTarget = {
  url: string;
  page_type: "homepage" | "pricing" | "lead_capture" | "content" | "checkout" | "other";
  priority: "high" | "medium" | "low";
};

type GeoDeviceTarget = {
  country: string;
  city?: string;
  device: "desktop" | "mobile" | "tablet";
};

type RequiredElement = {
  name: string;
  selector_hint?: string;
  required_text?: string;
  above_fold?: boolean;
};

type ContentRule = {
  rule: "no_placeholder_copy" | "currency_matches_country" | "legal_footer_visible" | "language_matches_country" | "no_broken_images";
  severity: "high" | "medium" | "low";
};

type SeoRules = {
  require_title?: boolean;
  require_meta_description?: boolean;
  require_canonical?: boolean;
  check_h1_count?: boolean;
  require_indexable?: boolean;
};

type AccessibilityRules = {
  image_alt_text?: boolean;
  form_labels?: boolean;
  button_names?: boolean;
};

type SearchValidation = {
  enabled: boolean;
  queries: string[];
  expected_domain: string;
};

type FetchObservation = {
  observation_id: string;
  url: string;
  final_url?: string;
  status_code?: number;
  target: GeoDeviceTarget;
  fetched_at: string;
  render_state: "ok" | "captcha" | "cookie_wall" | "timeout" | "blocked" | "error";
  screenshot_ref?: string;
  html_ref?: string;
  html_excerpt?: string;
  text_excerpt?: string;
  metadata: PageMetadata;
};

type PageMetadata = {
  title?: string;
  meta_description?: string;
  canonical?: string;
  robots?: string;
  h1_texts: string[];
  language?: string;
  schema_types: string[];
  links: { href: string; text?: string; status?: number }[];
};

type QaIssue = {
  issue_id: string;
  observation_id: string;
  url: string;
  target: GeoDeviceTarget;
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "render_failure"
    | "missing_required_element"
    | "layout"
    | "localization"
    | "seo"
    | "accessibility"
    | "link"
    | "serp_mismatch";
  title: string;
  evidence: {
    selector_hint?: string;
    html_excerpt?: string;
    text_excerpt?: string;
    screenshot_ref?: string;
    source_url?: string;
    fetched_at: string;
  };
  recommendation: string;
  confidence: "high" | "medium" | "low";
};

type QaReport = {
  project: string;
  summary: string;
  overall_score: number;
  tested_targets: number;
  issues: QaIssue[];
  pages: {
    url: string;
    target: GeoDeviceTarget;
    status: "completed" | "partial" | "failed";
    score: number;
    passed_checks: string[];
    failed_checks: string[];
    warnings: string[];
  }[];
};
```

## Pipeline

```ts
async function runWebsiteHtmlQa(brief: QaBrief): Promise<QaReport> {
  const fetchRuns = buildFetchRuns(brief);
  const estimatedCredits = estimateCredits(fetchRuns, brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for website QA run");
  }

  const observations = await collectRenderedPages(fetchRuns);
  const deterministicIssues = runDeterministicChecks(brief, observations);
  const aiIssues = await inspectVisualAndHtmlEvidence(brief, observations, deterministicIssues);
  const serpIssues = brief.search_validation?.enabled
    ? await validateSerpLandingBehavior(brief)
    : [];

  return synthesizeQaReport(brief, observations, [
    ...deterministicIssues,
    ...aiIssues,
    ...serpIssues
  ]);
}
```

## Fetch Planning

Create one run for every URL, country, city, and device target:

```ts
function buildFetchRuns(brief: QaBrief) {
  return brief.urls.flatMap(page =>
    brief.targets.map(target => ({
      url: page.url,
      page,
      target,
      render_js: true,
      capture_screenshot: true,
      wait_until: "networkidle",
      timeout_ms: page.priority === "high" ? 30000 : 20000
    }))
  );
}
```

## Rendered Page Collection

```ts
async function collectRenderedPages(fetchRuns): Promise<FetchObservation[]> {
  const observations: FetchObservation[] = [];

  for (const run of fetchRuns) {
    const response = await massive.web_fetch({
      url: run.url,
      render_js: run.render_js,
      capture_screenshot: run.capture_screenshot,
      country: run.target.country,
      city: run.target.city,
      device: run.target.device,
      wait_until: run.wait_until,
      timeout_ms: run.timeout_ms
    });

    observations.push(normalizeFetchResponse(response, run));
  }

  return observations;
}
```

Normalization should preserve:

- Final URL, redirects, status code, and render state.
- Screenshot artifact reference and rendered HTML artifact reference.
- Extracted title, meta description, canonical, robots tag, headings, language, schema, text, and links.
- Challenge indicators, including captcha, bot challenge, timeout, blocked, and cookie wall.

## Deterministic Checks

```ts
function runDeterministicChecks(brief: QaBrief, observations: FetchObservation[]): QaIssue[] {
  const issues: QaIssue[] = [];

  for (const observation of observations) {
    if (observation.render_state !== "ok") {
      issues.push(renderStateIssue(observation));
      continue;
    }

    issues.push(...checkRequiredElements(brief.required_elements || [], observation));
    issues.push(...checkSeoRules(brief.seo_rules || {}, observation));
    issues.push(...checkAccessibilityBasics(brief.accessibility_rules || {}, observation));
    issues.push(...checkContentRules(brief.content_rules || [], observation));
  }

  return issues;
}
```

Use deterministic checks for facts that can be extracted from DOM or metadata:

- Missing title, canonical, meta description, robots directives, or duplicate H1s.
- Missing selector hints, required text, or expected links.
- Placeholder strings such as "lorem ipsum", "TODO", "coming soon", or template names.
- Currency symbols and language tags that clearly conflict with the target country.
- Images without alt text, forms without labels, and buttons without accessible names.

## AI Visual And HTML Inspection

Use `ai_chat_completion` after deterministic extraction, not as the sole source of truth:

```ts
async function inspectVisualAndHtmlEvidence(
  brief: QaBrief,
  observations: FetchObservation[],
  existingIssues: QaIssue[]
): Promise<QaIssue[]> {
  return massive.ai_chat_completion({
    model: "qa-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "You are a website QA reviewer.",
          "Report only issues supported by screenshot, rendered HTML, extracted text, or metadata evidence.",
          "Keep country, city, and device context separate.",
          "Do not infer analytics, rankings, or revenue impact."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          observations: observations.map(compactObservationForAi),
          existing_issues: existingIssues
        })
      }
    ]
  });
}
```

AI inspection is best for:

- Above-the-fold CTA visibility.
- Broken or overlapping layout in screenshot evidence.
- Country-specific copy mismatches that require judgment.
- Cookie or captcha pages that look like content but are not the intended page.
- Contradictions between rendered text, metadata, and expected page purpose.

## Optional SERP Validation

```ts
async function validateSerpLandingBehavior(brief: QaBrief): Promise<QaIssue[]> {
  const issues: QaIssue[] = [];

  for (const query of brief.search_validation?.queries || []) {
    for (const target of brief.targets) {
      const serp = await massive.web_search({
        query,
        parse_google_serp: true,
        country: target.country,
        city: target.city,
        device: target.device,
        max_results: 10
      });

      issues.push(...compareSerpResultsToExpectedDomain(serp, brief.search_validation!, target));
    }
  }

  return issues;
}
```

SERP validation should only check observable search result facts:

- Indexed title and snippet differ from current rendered metadata.
- Expected domain is missing for a branded or exact landing-page query.
- Search result lands on the wrong locale, redirect, or broken page.

## Report Synthesis

Scoring combines deterministic and AI-classified issues:

```ts
function scoreObservation(observation: FetchObservation, issues: QaIssue[]): number {
  if (observation.render_state === "captcha" || observation.render_state === "blocked") return 50;
  if (observation.render_state === "timeout" || observation.render_state === "error") return 40;

  const penalties = issues.reduce((sum, issue) => {
    if (issue.severity === "critical") return sum + 40;
    if (issue.severity === "high") return sum + 25;
    if (issue.severity === "medium") return sum + 10;
    return sum + 4;
  }, 0);

  return Math.max(0, 100 - penalties);
}
```

The final report should include:

- Executive summary with issue count by severity.
- One row per URL-target pair.
- One issue object per finding with concrete evidence.
- Screenshot and HTML references for every high or critical issue.
- CSV export for triage tools.
- Markdown export for quick human review.
