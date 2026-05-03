# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
teardown_brief.json
   |
   v
validate_and_estimate_run
   |
   v
discover_onboarding_sources
   |
   v
fetch_target_and_competitor_flows
   |
   v
extract_onboarding_signals
   |
   v
score_teardown_dimensions
   |
   v
generate_findings_and_experiments
   |
   v
render_report_exports
```

## File Layout

```text
onboarding-teardown-generator/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    brief.ts
    planner.ts
    discoverSources.ts
    fetchFlowPages.ts
    extractSignals.ts
    scoreTeardown.ts
    generateFindings.ts
    report.ts
    types.ts
  examples/
    crm-teardown-brief.json
    crm-teardown-report.json
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type Device = "desktop" | "mobile";
export type Severity = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";

export type FocusArea =
  | "message_match"
  | "signup_friction"
  | "activation_clarity"
  | "time_to_value"
  | "trust"
  | "competitive_differentiation";

export type FindingType =
  | "message_mismatch"
  | "signup_friction"
  | "activation_clarity_gap"
  | "trust_gap"
  | "pricing_uncertainty"
  | "competitive_table_stakes"
  | "device_specific_issue"
  | "source_consistency_gap";

export interface TeardownBrief {
  target: {
    brand: string;
    domain: string;
    signupUrl?: string;
  };
  persona: {
    role: string;
    companySize?: string;
    useCase: string;
    experienceLevel?: string;
  };
  geo: {
    country?: string;
    city?: string;
    device: Device;
  };
  categoryQueries: string[];
  competitors: Array<{ name: string; domain: string }>;
  focusAreas: FocusArea[];
  maxSerpResultsPerQuery: number;
  maxFetches: number;
}

export interface SourceObservation {
  id: string;
  sourceRole: "target" | "competitor" | "category_serp" | "review" | "docs" | "ai_answer";
  query?: string;
  rank?: number;
  title?: string;
  url: string;
  domain: string;
  snippet?: string;
  country?: string;
  city?: string;
  device: Device;
  collectedAt: string;
}

export interface OnboardingSignal {
  sourceId: string;
  url: string;
  stage: "homepage" | "pricing" | "signup_page" | "form" | "product_tour" | "docs" | "review" | "other";
  headline?: string;
  primaryCta?: string;
  promisedOutcome?: string;
  requiredFields: string[];
  trustSignals: string[];
  objectionsAddressed: string[];
  firstActionSuggested?: string;
  integrationsMentioned: string[];
  pricingOrTrialTerms: string[];
  frictionNotes: string[];
}

export interface TeardownFinding {
  findingType: FindingType;
  severity: Severity;
  stage: OnboardingSignal["stage"];
  whatHappened: string;
  whyItMatters: string;
  recommendation: string;
  evidence: Array<{
    sourceType: "google_serp" | "fetched_page" | "ai_answer";
    sourceUrl: string;
    observedFact: string;
  }>;
}

export interface TeardownReport {
  target: TeardownBrief["target"];
  persona: TeardownBrief["persona"];
  geo: TeardownBrief["geo"];
  generatedAt: string;
  summary: string;
  overallScore: number;
  riskLevel: RiskLevel;
  scores: Record<FocusArea, number>;
  sources: SourceObservation[];
  targetSignals: OnboardingSignal[];
  competitorSignals: OnboardingSignal[];
  teardownFindings: TeardownFinding[];
  competitivePatterns: Array<{
    pattern: string;
    frequency: number;
    exampleUrls: string[];
  }>;
  experimentBacklog: Array<{
    priority: number;
    hypothesis: string;
    change: string;
    metric: string;
  }>;
}
```

## Massive MCP Adapter

```ts
export interface MassiveClient {
  accountStatus(): Promise<{ ok: boolean; remaining?: number }>;
  webSearch(input: {
    query: string;
    country?: string;
    city?: string;
    device?: Device;
    parseSerp: true;
  }): Promise<Array<{
    rank: number;
    title: string;
    url: string;
    snippet?: string;
    resultType?: string;
  }>>;
  webFetch(input: {
    url: string;
    renderJs: boolean;
    country?: string;
    city?: string;
    device?: Device;
    captcha?: "auto" | "fail";
  }): Promise<{
    url: string;
    status: number;
    title?: string;
    markdown: string;
  }>;
  aiChatCompletion(input: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    responseFormat?: "json";
  }): Promise<{ content: string }>;
}
```

## Source Discovery

```ts
export function planDiscoveryQueries(brief: TeardownBrief): string[] {
  const brandQueries = [
    `${brief.target.brand} signup`,
    `${brief.target.brand} pricing`,
    `${brief.target.brand} onboarding`,
    `${brief.target.brand} getting started`
  ];

  const competitorQueries = brief.competitors.flatMap((competitor) => [
    `${competitor.name} signup`,
    `${competitor.name} pricing`,
    `${competitor.name} getting started`
  ]);

  return [...brandQueries, ...brief.categoryQueries, ...competitorQueries];
}
```

Deduplicate sources by normalized canonical URL. Keep target-domain pages even when they appear in multiple SERPs, because repeated discovery can indicate message consistency or category relevance.

## Fetch Strategy

1. Always fetch the provided signup URL first when present.
2. Fetch target homepage, pricing page, public onboarding docs, template pages, and product tour pages discovered through SERPs.
3. Fetch top competitor signup and pricing pages for comparison.
4. Use JS rendering for all signup, pricing, and product tour URLs.
5. Use captcha handling set to `auto`; record captcha, blocked, or heavy challenge states as friction observations.
6. Stop when `maxFetches` is reached, prioritizing target pages, then competitors, then reviews and docs.

## AI Extraction Prompts

Use `ai_chat_completion` for bounded JSON extraction:

- Extract page-level onboarding signals from fetched Markdown.
- Classify signup friction from forms, terms, copy, and observed blockers.
- Compare target messaging to persona and use case.
- Summarize competitor onboarding norms without treating every norm as a required feature.
- Ask a chatbot-style answer for the category and preserve cited sources when available.
- Generate experiment recommendations only from sourced findings.

Guardrails:

- Do not infer private in-product behavior unless a public source supports it.
- Do not label captcha as intentional product friction; record it as observed access friction.
- Separate evidence from recommendation language.
- Preserve source URLs for every finding.

## Scoring Algorithm

```ts
export function riskLevel(score: number): RiskLevel {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  return "high";
}

export function weightedOverall(scores: Record<FocusArea, number>): number {
  return Math.round(
    scores.message_match * 0.2 +
      scores.signup_friction * 0.15 +
      scores.activation_clarity * 0.2 +
      scores.time_to_value * 0.15 +
      scores.trust * 0.15 +
      scores.competitive_differentiation * 0.15
  );
}
```

Apply evidence caps after weighted scoring. A strong-looking flow with weak source collection should receive a cautious score and an explicit low-evidence warning.

## Report Generation

Markdown report sections:

1. Executive summary
2. Scorecard
3. Top findings
4. Stage-by-stage teardown
5. Competitive patterns
6. Experiment backlog
7. Evidence and sources
8. Collection notes and skipped sources

CSV exports:

- `teardown-findings.csv`: finding type, severity, stage, recommendation, evidence URL.
- `teardown-sources.csv`: source role, query, rank, URL, title, device, country, city, status.
- `experiment-backlog.csv`: priority, hypothesis, change, metric, linked finding type.

## CLI Stub

```ts
async function run() {
  const brief = await loadBrief(process.argv);
  await validateBrief(brief);
  await assertAccountCapacity(brief);
  const sources = await discoverSources(brief);
  const fetchedPages = await fetchFlowPages(brief, sources);
  const signals = await extractOnboardingSignals(brief, fetchedPages);
  const findings = await generateFindings(brief, signals, sources);
  const report = scoreAndAssembleReport(brief, sources, signals, findings);
  await writeExports(report);
}
```

## Prototype Milestones

- Day 1: brief schema, source discovery, account status check.
- Day 2: fetch prioritization, JS rendering, captcha/access-state recording.
- Day 3: extraction prompts and typed JSON validation.
- Day 4: scoring, evidence caps, and finding generation.
- Day 5: Markdown, JSON, and CSV exports with fixtures.
- Day 6: benchmark evaluation pass and false-positive cleanup.
- Day 7: CLI polish and first internal teardown run.
