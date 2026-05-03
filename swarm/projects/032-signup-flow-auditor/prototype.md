# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
signup_audit_brief.json
   |
   v
validate_and_estimate_run
   |
   v
discover_signup_entry_points
   |
   v
fetch_public_flow_pages
   |
   v
extract_forms_steps_and_claims
   |
   v
normalize_competitor_comparisons
   |
   v
score_and_prioritize_gaps
   |
   v
render_report_exports
```

## File Layout

```text
signup-flow-auditor/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    brief.ts
    planner.ts
    discoverEntryPoints.ts
    fetchFlowPages.ts
    extractFlowSignals.ts
    normalize.ts
    score.ts
    report.ts
    types.ts
  examples/
    crm-brief.json
    crm-report.json
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type Device = "desktop" | "mobile";
export type Priority = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";

export type FlowType =
  | "free_trial"
  | "freemium"
  | "demo_request"
  | "quote_request"
  | "waitlist"
  | "contact_sales";

export type GapType =
  | "missing_entry_point"
  | "excessive_field_friction"
  | "unclear_commitment"
  | "pricing_visibility_gap"
  | "persona_mismatch"
  | "mobile_friction"
  | "localization_gap"
  | "trust_gap"
  | "activation_delay"
  | "ai_answer_gap";

export interface SignupAuditBrief {
  target: {
    brand: string;
    domain: string;
    entryPoints?: string[];
  };
  geo: {
    country?: string;
    city?: string;
    device: Device;
  };
  persona?: {
    role?: string;
    companySize?: string;
    useCase?: string;
  };
  flowTypes: FlowType[];
  competitors: Array<{ name: string; domain: string; entryPoints?: string[] }>;
  excludedActions: string[];
  maxSearches: number;
  maxFetches: number;
}

export interface EntryPointObservation {
  id: string;
  companyName: string;
  domain: string;
  flowType?: FlowType;
  source: "provided" | "site_search" | "google_serp" | "fetched_page" | "ai_inferred";
  query?: string;
  rank?: number;
  url: string;
  title?: string;
  snippet?: string;
  country?: string;
  city?: string;
  device: Device;
  collectedAt: string;
  confidence: Confidence;
}

export interface FlowPageObservation {
  id: string;
  companyName: string;
  domain: string;
  flowType: FlowType;
  url: string;
  fetchedAt: string;
  status: number;
  title?: string;
  pageRole:
    | "home"
    | "pricing"
    | "signup"
    | "demo"
    | "contact"
    | "onboarding"
    | "help"
    | "other";
  rendered: boolean;
  contentHash: string;
  visibleCtas: string[];
  requiredFields: string[];
  optionalFields: string[];
  hiddenOrDynamicFields: string[];
  authOptions: Array<"email" | "google_sso" | "microsoft_sso" | "saml" | "other">;
  creditCardRequired?: boolean;
  pricingVisibleBeforeSignup?: boolean;
  trialTermsVisible?: boolean;
  trustSignals: string[];
  blockers: string[];
}

export interface AiAnswerObservation {
  id: string;
  prompt: string;
  collectedAt: string;
  answer: string;
  targetMentioned: boolean;
  competitorsMentioned: string[];
  frictionClaims: Array<{ company: string; claim: string }>;
  citedSources: Array<{ url: string; domain: string; title?: string }>;
}

export interface SignupGapCard {
  gapType: GapType;
  severity: Priority;
  confidence: Confidence;
  whyItMatters: string;
  recommendedAction: string;
  evidence: Array<{
    observationId: string;
    sourceType: "entry_point" | "fetched_page" | "google_serp" | "ai_answer";
    sourceUrl: string;
    observedFact: string;
  }>;
}

export interface SignupAuditReport {
  target: SignupAuditBrief["target"];
  generatedAt: string;
  geo: SignupAuditBrief["geo"];
  auditScore: number;
  summary: string;
  flowComparisons: FlowPageObservation[];
  entryPointObservations: EntryPointObservation[];
  aiAnswerObservations: AiAnswerObservation[];
  gaps: SignupGapCard[];
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
    html?: string;
  }>;
  aiChatCompletion(input: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    responseFormat?: "json";
  }): Promise<{ content: string }>;
}
```

## Entry Point Planner

Generate bounded discovery queries:

```ts
export function planEntryPointQueries(company: { name: string; domain: string }, flowTypes: FlowType[]) {
  const flowTerms = flowTypes.flatMap((type) => {
    if (type === "free_trial") return ["free trial", "start trial", "signup"];
    if (type === "demo_request") return ["demo", "request demo", "contact sales"];
    if (type === "freemium") return ["free plan", "sign up free"];
    if (type === "quote_request") return ["pricing", "get quote"];
    if (type === "waitlist") return ["waitlist", "early access"];
    return ["contact sales", "talk to sales"];
  });

  return Array.from(new Set([
    `${company.name} signup`,
    `${company.name} pricing`,
    ...flowTerms.map((term) => `site:${company.domain} ${term}`),
    ...flowTerms.map((term) => `${company.name} ${term}`)
  ]));
}
```

## Flow Extraction Strategy

1. Fetch provided and discovered entry points with `renderJs: true`.
2. Extract visible CTAs, form labels, required markers, placeholder text, auth buttons, pricing copy, trial terms, and trust signals.
3. Follow only public same-domain links that look like signup, demo, pricing, or onboarding steps.
4. Stop before submitting personal data, creating paid accounts, or accepting legal agreements.
5. Ask `ai_chat_completion` to convert page text and form metadata into structured `FlowPageObservation` records.
6. Deduplicate observations by normalized URL, content hash, company, flow type, and page role.

## Scoring Rules

Start at 100 and subtract:

- 15 for no discoverable signup or demo entry point for a requested flow type.
- 10 when required field count is more than two fields above competitor median.
- 8 when phone number is required before value is demonstrated.
- 8 when credit card, trial length, cancellation, or sales-contact expectations are unclear.
- 8 when pricing is hidden while competitors expose plan context before conversion.
- 7 when mobile page fetch reveals overlays, inaccessible forms, or severe layout blockers.
- 6 when persona-specific routing is missing but competitors route by role, team size, or use case.
- 6 when trust signals are absent near the conversion CTA.
- 5 when chatbot answers or third-party sources describe competitors as easier to try.

Clamp scores to 0-100, then apply README score caps.

## Report Generation

The report renderer should create:

- `signup-audit-report.json`: full normalized observations and gap cards.
- `signup-audit-report.md`: executive summary, competitor table, priority gaps, and experiments.
- `signup-flow-comparison.csv`: one row per company, flow type, and entry point.
- `signup-flow-gaps.csv`: one row per gap card and evidence source.

## Guardrails

- Do not submit forms with real or fabricated personal data.
- Do not create accounts, purchase plans, accept terms, or bypass access controls.
- Treat captcha handling as page-access support only, not as permission to perform private actions.
- Keep AI-derived field extraction tied to fetched public source URLs.
- Mark post-submit activation observations as unavailable unless the user explicitly supplies test-account permission.
