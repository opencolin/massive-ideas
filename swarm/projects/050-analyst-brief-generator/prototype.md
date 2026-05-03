# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type BriefType = "company" | "category" | "competitor" | "trend" | "market_event" | "account_context";

type AnalystBriefRequest = {
  topic: string;
  brief_type: BriefType;
  audience?: string;
  time_window_days?: number;
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  must_include?: string[];
  exclude_domains?: string[];
  seed_urls?: string[];
  output?: {
    format?: "markdown" | "json" | "both";
    citation_style?: "numbered" | "inline_ids";
  };
};

type QueryIntent =
  | "primary_source"
  | "recent_news"
  | "market_context"
  | "competitor_context"
  | "pricing"
  | "customer_signal"
  | "risk"
  | "regulatory"
  | "contradiction_check";

type QueryPlanItem = {
  query: string;
  intent: QueryIntent;
  source: "google" | "ai_answer";
  max_results: number;
};

type SourceRecord = {
  id: string;
  url: string;
  title?: string;
  domain: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source";
  query?: string;
  rank?: number;
  intent?: QueryIntent;
  snippet?: string;
  excerpt?: string;
  published_at?: string;
  fetched_at?: string;
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
  quality: "primary" | "authoritative" | "news" | "directory" | "company_owned" | "chatbot" | "weak";
};

type CitedClaim = {
  claim: string;
  interpretation?: string;
  confidence: "high" | "medium" | "low";
  citation_ids: string[];
};

type BriefSection = {
  title: string;
  summary: string;
  findings: CitedClaim[];
  contradictions: CitedClaim[];
  gaps: string[];
};

type AnalystBrief = {
  topic: string;
  brief_type: BriefType;
  generated_at: string;
  executive_summary: CitedClaim[];
  sections: BriefSection[];
  open_questions: string[];
  source_inventory: SourceRecord[];
};
```

## Pipeline

```ts
async function buildAnalystBrief(request: AnalystBriefRequest): Promise<AnalystBrief> {
  const queryPlan = createQueryPlan(request);
  const estimatedCredits = estimateCredits(queryPlan, request);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for analyst brief run");
  }

  const serpRecords = await collectSerpSources(request, queryPlan);
  const aiAnswers = await collectSourcedAnswers(request, queryPlan);
  const fetchedPages = await fetchCandidateSources(request, serpRecords, aiAnswers);
  const sourceInventory = normalizeSources(request, serpRecords, aiAnswers, fetchedPages);
  const draft = await synthesizeDraft(request, sourceInventory);
  const checked = await verifyClaimsAgainstSources(request, draft, sourceInventory);

  return enforceCitationPolicy(checked, sourceInventory);
}
```

## Query Planning

```ts
function createQueryPlan(request: AnalystBriefRequest): QueryPlanItem[] {
  const topic = request.topic;
  const window = request.time_window_days || 120;
  const include = (request.must_include || []).join(" ");

  const base: QueryPlanItem[] = [
    { query: `${topic} official`, intent: "primary_source", source: "google", max_results: 10 },
    { query: `${topic} recent news last ${window} days`, intent: "recent_news", source: "google", max_results: 10 },
    { query: `${topic} market analysis ${include}`, intent: "market_context", source: "google", max_results: 10 },
    { query: `${topic} competitors alternatives`, intent: "competitor_context", source: "google", max_results: 10 },
    { query: `${topic} pricing packaging`, intent: "pricing", source: "google", max_results: 10 },
    { query: `${topic} customers case studies reviews`, intent: "customer_signal", source: "google", max_results: 10 },
    { query: `${topic} risks concerns regulation`, intent: "risk", source: "google", max_results: 10 }
  ];

  const regulatory: QueryPlanItem[] =
    request.brief_type === "market_event" || request.must_include?.some(item => item.includes("regulat"))
      ? [{ query: `${topic} regulator policy compliance`, intent: "regulatory", source: "google", max_results: 10 }]
      : [];

  const aiAnswerQueries: QueryPlanItem[] = [
    {
      query: `Create a sourced analyst outline for ${topic}. Include only claims that can be cited.`,
      intent: "market_context",
      source: "ai_answer",
      max_results: 0
    },
    {
      query: `What claims about ${topic} are disputed, stale, or weakly sourced? Return sources.`,
      intent: "contradiction_check",
      source: "ai_answer",
      max_results: 0
    }
  ];

  return [...base, ...regulatory, ...aiAnswerQueries];
}
```

## Source Collection

```ts
async function collectSerpSources(request: AnalystBriefRequest, plan: QueryPlanItem[]) {
  const googleQueries = plan.filter(item => item.source === "google");
  const records = [];

  for (const item of googleQueries) {
    const result = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: request.geo?.country,
      city: request.geo?.city,
      device: request.geo?.device || "desktop",
      max_results: item.max_results
    });

    records.push(...normalizeSerpResult(result, item, request.geo));
  }

  return records.filter(record => !isExcluded(record.url, request.exclude_domains));
}
```

Preserve these fields from SERPs:

- Query text and query intent
- Result rank, URL, domain, title, and snippet
- Visible date, result type, and rich-result metadata when available
- Country, city, and device
- Search timestamp

## Fetching Evidence

```ts
async function fetchCandidateSources(request, serpRecords, aiAnswers) {
  const candidateUrls = dedupeUrls([
    ...(request.seed_urls || []),
    ...topUrlsByIntent(serpRecords, "primary_source", 15),
    ...topUrlsByIntent(serpRecords, "recent_news", 20),
    ...topUrlsByIntent(serpRecords, "market_context", 20),
    ...topUrlsByIntent(serpRecords, "competitor_context", 20),
    ...topUrlsByIntent(serpRecords, "pricing", 12),
    ...topUrlsByIntent(serpRecords, "risk", 20),
    ...aiAnswers.flatMap(answer => answer.source_urls || [])
  ])
    .filter(url => !isExcluded(url, request.exclude_domains))
    .slice(0, 90);

  const pages = [];
  for (const url of candidateUrls) {
    pages.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return pages.filter(page => page.ok && page.text && page.text.length > 300);
}
```

## Synthesis Prompt Shape

Use `ai_chat_completion` twice:

1. Draft the brief from normalized source records only.
2. Verify claim coverage and downgrade or remove unsupported claims.

System rules for both calls:

- Every material claim must include one or more citation IDs.
- Do not cite a source unless the source record supports the claim.
- Mark interpretation separately from source-observed fact.
- Move unsupported but useful ideas into `gaps`.
- Prefer primary and authoritative sources over snippets and chatbot sources.
- Cap confidence at `low` for SERP-only evidence.
- Cap confidence at `medium` for company-owned-only evidence unless independently corroborated.

## Claim Verification

```ts
function enforceCitationPolicy(brief: AnalystBrief, sources: SourceRecord[]): AnalystBrief {
  const sourceIds = new Set(sources.map(source => source.id));

  for (const section of [summarySection(brief), ...brief.sections]) {
    for (const finding of section.findings) {
      finding.citation_ids = finding.citation_ids.filter(id => sourceIds.has(id));

      if (finding.citation_ids.length === 0) {
        section.gaps.push(`Unsupported claim removed: ${finding.claim}`);
        finding.claim = "";
      }

      finding.confidence = capConfidenceBySourceQuality(finding, sources);
    }

    section.findings = section.findings.filter(finding => finding.claim);
  }

  return brief;
}
```

## CLI Shape

```bash
analyst-brief build \
  --input examples/ai-coding-assistants.json \
  --out out/ai-coding-assistants.md \
  --json out/ai-coding-assistants.json \
  --sources out/ai-coding-assistants.sources.csv
```

## Implementation Notes

- Store raw SERP, fetch, and AI-answer responses beside the final brief for auditability.
- Hash normalized source records so re-runs can reuse fresh enough evidence.
- Keep Markdown generation deterministic after the structured JSON brief is verified.
- Add a `--depth quick|standard|deep` flag that maps to source and fetch limits.
- Add `--geo country:city:device` once the CLI works for default desktop US runs.
