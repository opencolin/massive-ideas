# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ResearchDepth = "quick" | "standard" | "deep";
type Confidence = "high" | "medium" | "low";

type ResearchReportRequest = {
  prompt: string;
  audience?: string;
  depth?: ResearchDepth;
  time_window_days?: number;
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  must_answer?: string[];
  preferred_sources?: string[];
  exclude_domains?: string[];
  seed_urls?: string[];
  output?: {
    format?: "markdown" | "json" | "both";
    citation_style?: "numbered" | "inline_ids";
  };
};

type Subquestion = {
  id: string;
  question: string;
  priority: "required" | "useful" | "optional";
  expected_source_types: SourceQuality[];
};

type QueryIntent =
  | "primary_source"
  | "recent_news"
  | "independent_analysis"
  | "competitor_or_vendor"
  | "customer_signal"
  | "risk_or_objection"
  | "definition_or_scope"
  | "contradiction_check";

type QueryPlanItem = {
  query: string;
  intent: QueryIntent;
  subquestion_id?: string;
  source: "google" | "ai_answer";
  max_results: number;
};

type SourceQuality =
  | "primary"
  | "authoritative"
  | "news"
  | "industry_analysis"
  | "company_owned"
  | "customer_story"
  | "directory"
  | "chatbot"
  | "weak";

type SourceRecord = {
  id: string;
  url: string;
  domain: string;
  title?: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source";
  quality: SourceQuality;
  query?: string;
  rank?: number;
  intent?: QueryIntent;
  snippet?: string;
  excerpt?: string;
  visible_date?: string;
  fetched_at?: string;
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type CitedClaim = {
  claim: string;
  evidence_note?: string;
  interpretation?: string;
  confidence: Confidence;
  citation_ids: string[];
};

type ReportSection = {
  title: string;
  question?: string;
  answer: string;
  claims: CitedClaim[];
  contradictions: CitedClaim[];
  gaps: string[];
};

type ResearchReport = {
  prompt: string;
  report_title: string;
  generated_at: string;
  depth: ResearchDepth;
  method_note: string;
  executive_summary: CitedClaim[];
  sections: ReportSection[];
  unknowns: string[];
  suggested_next_research: string[];
  source_inventory: SourceRecord[];
};
```

## Pipeline

```ts
async function buildResearchReport(request: ResearchReportRequest): Promise<ResearchReport> {
  const normalized = normalizeRequest(request);
  const plan = await createResearchPlan(normalized);
  const estimate = estimateCredits(plan, normalized.depth);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimate.total) {
    throw new Error("Insufficient Massive MCP credits for this research report");
  }

  const serpRecords = await runSearches(normalized, plan.queries);
  const aiAnswers = await collectSourcedAiAnswers(normalized, plan);
  const fetchedPages = await fetchEvidencePages(normalized, serpRecords, aiAnswers);
  const sourceInventory = normalizeSourceInventory(normalized, serpRecords, aiAnswers, fetchedPages);
  const draft = await synthesizeReport(normalized, plan, sourceInventory);
  const verified = await verifyClaims(normalized, draft, sourceInventory);

  return enforceReportPolicy(verified, sourceInventory);
}
```

## Prompt-to-Plan

```ts
async function createResearchPlan(request: ResearchReportRequest) {
  const response = await massive.ai_chat_completion({
    model: "research-planner",
    messages: [
      {
        role: "system",
        content: "Turn research prompts into auditable web research plans. Return JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          prompt: request.prompt,
          audience: request.audience,
          must_answer: request.must_answer,
          preferred_sources: request.preferred_sources,
          time_window_days: request.time_window_days,
          geo: request.geo
        })
      }
    ],
    response_schema: "ResearchPlan"
  });

  return sanitizeResearchPlan(response.json);
}
```

The plan should include:

- One report objective.
- 4-8 subquestions.
- 8-24 Google queries depending on depth.
- 1-3 sourced AI-answer prompts for outline and contradiction checks.
- Required source types for each subquestion.
- Ambiguity warnings for same-name entities, broad topics, or missing region.

## Source Discovery

```ts
async function runSearches(request: ResearchReportRequest, queries: QueryPlanItem[]) {
  const googleQueries = queries.filter(item => item.source === "google");
  const records: SourceRecord[] = [];

  for (const item of googleQueries) {
    const result = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: request.geo?.country,
      city: request.geo?.city,
      device: request.geo?.device || "desktop",
      max_results: item.max_results
    });

    records.push(...normalizeSerpResults(result, item, request.geo));
  }

  return records.filter(record => !isExcluded(record.url, request.exclude_domains));
}
```

Preserve from every SERP record:

- Query, intent, subquestion, and rank.
- Title, URL, domain, snippet, visible date, and rich result type.
- Country, city, device, and search timestamp.
- Whether the result appears primary, independent, recent, local, or weak.

## Evidence Fetching

```ts
async function fetchEvidencePages(request, serpRecords, aiAnswers) {
  const perDepthLimit = { quick: 20, standard: 60, deep: 120 };
  const limit = perDepthLimit[request.depth || "standard"];
  const candidateUrls = rankCandidateUrls([
    ...(request.seed_urls || []),
    ...serpRecords.map(record => record.url),
    ...aiAnswers.flatMap(answer => answer.source_urls || [])
  ])
    .filter(url => !isExcluded(url, request.exclude_domains))
    .slice(0, limit);

  const pages = [];
  for (const url of candidateUrls) {
    pages.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      extract_main_content: true,
      country: request.geo?.country,
      city: request.geo?.city,
      device: request.geo?.device || "desktop",
      timeout_ms: 15000
    }));
  }

  return pages.filter(page => page.ok && page.text && page.text.length > 300);
}
```

## Synthesis and Verification

```ts
async function verifyClaims(request, draft: ResearchReport, sources: SourceRecord[]) {
  const result = await massive.ai_chat_completion({
    model: "claim-verifier",
    messages: [
      {
        role: "system",
        content: [
          "Check every material claim against the provided source inventory.",
          "Remove unsupported claims or move them to unknowns.",
          "Cap confidence for snippet-only, stale, or company-owned-only evidence.",
          "Return corrected JSON only."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ request, draft, sources })
      }
    ],
    response_schema: "ResearchReport"
  });

  return result.json;
}
```

Verification rules:

- Each material claim needs at least one citation ID.
- Citation IDs must resolve to fetched, SERP, or AI-answer source records.
- Fetched-page evidence outranks SERP snippets.
- Chatbot answer sources must be confirmed by fetched pages or labeled as chatbot context.
- Contradictions stay visible instead of being averaged away.
- Same-name ambiguity is surfaced in the method note and unknowns.

## Rendering

```ts
function renderMarkdown(report: ResearchReport) {
  return [
    `# ${report.report_title}`,
    "",
    `Prompt: ${report.prompt}`,
    "",
    `Method: ${report.method_note}`,
    "",
    "## Executive Summary",
    ...report.executive_summary.map(renderClaimBullet),
    "",
    ...report.sections.flatMap(renderSection),
    "",
    "## Unknowns",
    ...report.unknowns.map(item => `- ${item}`),
    "",
    "## Suggested Next Research",
    ...report.suggested_next_research.map(item => `- ${item}`),
    "",
    "## Sources",
    ...report.source_inventory.map(renderSource)
  ].join("\n");
}
```

## CLI Shape

```bash
research-report build \
  --prompt "Research whether AI support agents are being adopted by mid-market SaaS companies" \
  --audience "product strategy team" \
  --depth standard \
  --country us \
  --city "San Francisco" \
  --device desktop \
  --out report.md \
  --json evidence.json \
  --sources sources.csv
```

## Implementation Notes

- Cache normalized source records by URL, country, city, device, and fetch date.
- Use depth to control query count, fetch count, and verification strictness.
- Keep raw SERP, raw fetch, normalized source, claim, and rendered report artifacts.
- Store excluded domains and failed fetches in the run log for auditability.
- Make the report useful even when evidence is sparse by emphasizing unknowns and next research.
