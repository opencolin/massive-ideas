# Prototype

This prototype sketches a Node or Python MVP that wraps Massive MCP tools: `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`. The key design choice is independence: the second pass must not simply summarize the first pass. It should use different query phrasing, skeptical prompts, and source-type targeting.

## Data Model

```ts
type ConsensusBrief = {
  question: string;
  context?: string;
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  research_policy?: {
    freshness_days?: number;
    max_sources_per_pass?: number;
    prefer_primary_sources?: boolean;
    include_forums?: boolean;
    include_news?: boolean;
    include_vendor_docs?: boolean;
  };
  risk_level?: "low" | "medium" | "high";
  output?: {
    include_source_log?: boolean;
    include_query_log?: boolean;
    include_follow_up_questions?: boolean;
  };
};

type QueryPlanItem = {
  pass: "direct" | "challenge";
  intent:
    | "direct_answer"
    | "primary_source"
    | "recent_update"
    | "counterclaim"
    | "limitations"
    | "regional_variant"
    | "source_specific";
  query: string;
  preferred_source_types?: SourceType[];
};

type SourceType =
  | "official_docs"
  | "official_page"
  | "news"
  | "research_report"
  | "regulatory"
  | "forum"
  | "review_site"
  | "comparison_page"
  | "blog"
  | "unknown";

type SourceRecord = {
  pass: "direct" | "challenge";
  query: string;
  rank?: number;
  url: string;
  title?: string;
  snippet?: string;
  source_type: SourceType;
  fetched_at: string;
  geo?: ConsensusBrief["geo"];
  text: string;
  fetch_status: "ok" | "blocked" | "captcha_unresolved" | "empty" | "error";
};

type ExtractedClaim = {
  claim: string;
  polarity: "supports" | "contradicts" | "qualifies" | "unknown";
  scope?: string;
  freshness?: string;
  source_url: string;
  source_type: SourceType;
  pass: "direct" | "challenge";
  confidence: "high" | "medium" | "low";
};

type ConsensusReport = {
  run_id: string;
  generated_at: string;
  question: string;
  short_answer: string;
  consensus: {
    level: "strong" | "moderate" | "mixed" | "weak" | "conflict" | "unknown";
    score: number;
    confidence: "high" | "medium" | "low";
    freshness: "current" | "recent_public_sources_found" | "stale" | "unknown";
    needs_human_review: boolean;
  };
  agreed_claims: {
    claim: string;
    supporting_sources: Pick<SourceRecord, "url" | "source_type" | "pass" | "fetched_at">[];
    confidence: "high" | "medium" | "low";
  }[];
  disputed_claims: {
    claim: string;
    status: "contradicted" | "overstated" | "scope_limited" | "stale" | "unresolved";
    reason: string;
    evidence: Pick<SourceRecord, "url" | "source_type" | "pass">[];
  }[];
  source_summary: {
    direct_pass_sources: number;
    challenge_pass_sources: number;
    primary_sources: number;
    third_party_sources: number;
    conflicts_found: number;
  };
  query_log?: QueryPlanItem[];
  source_log?: SourceRecord[];
  recommended_follow_ups?: string[];
};
```

## Pipeline

```ts
async function checkInternetConsensus(brief: ConsensusBrief): Promise<ConsensusReport> {
  validateBrief(brief);

  const normalized = applyDefaults(brief);
  const queryPlan = await createTwoPassQueryPlan(normalized);
  const estimatedCredits = estimateCredits(queryPlan, normalized.research_policy?.max_sources_per_pass || 12);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for consensus check");
  }

  const directSources = await runResearchPass(normalized, queryPlan, "direct");
  const challengeSources = await runResearchPass(normalized, queryPlan, "challenge");
  const claims = await extractClaims(normalized, [...directSources, ...challengeSources]);
  const clustered = await clusterClaims(normalized, claims);

  return synthesizeConsensusReport(normalized, queryPlan, [...directSources, ...challengeSources], clustered);
}
```

## Query Planning

```ts
async function createTwoPassQueryPlan(brief: ConsensusBrief): Promise<QueryPlanItem[]> {
  const directQueries: QueryPlanItem[] = [
    {
      pass: "direct",
      intent: "direct_answer",
      query: brief.question
    },
    {
      pass: "direct",
      intent: "primary_source",
      query: `${brief.question} official source documentation report`
    },
    {
      pass: "direct",
      intent: "recent_update",
      query: `${brief.question} latest update 2026`
    }
  ];

  const challengePrompt = {
    question: brief.question,
    context: brief.context,
    instruction:
      "Generate skeptical search queries that would reveal exceptions, counterexamples, stale claims, regional variants, or source disagreement."
  };

  const challengeQueries = await massive.ai_chat_completion({
    task: "create_challenge_search_queries",
    input: challengePrompt,
    output_schema: "QueryPlanItem[]"
  });

  return [...directQueries, ...challengeQueries];
}
```

For high-risk questions, add explicit query intents for regulatory sources, primary documentation, dates, and counterclaims. For low-risk questions, keep the run smaller and bias toward source diversity.

## Research Pass

```ts
async function runResearchPass(
  brief: ConsensusBrief,
  queryPlan: QueryPlanItem[],
  pass: "direct" | "challenge"
): Promise<SourceRecord[]> {
  const results: SourceRecord[] = [];
  const passQueries = queryPlan.filter(item => item.pass === pass);

  for (const item of passQueries) {
    const serp = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: 8
    });

    const candidates = normalizeSerpResults(item, serp);
    const ranked = rankForIndependence(candidates, results);

    for (const candidate of ranked.slice(0, 4)) {
      const fetched = await massive.web_fetch({
        url: candidate.url,
        render_js: true,
        country: brief.geo?.country,
        city: brief.geo?.city,
        device: brief.geo?.device || "desktop",
        captcha: "handle"
      });

      results.push(toSourceRecord(item, candidate, fetched, brief.geo));
    }
  }

  return dedupeSources(results).slice(0, brief.research_policy?.max_sources_per_pass || 12);
}
```

## Consensus Scoring

Use a conservative score from 0 to 1:

- Source independence: independent domains and non-syndicated source trails.
- Pass agreement: direct and challenge passes support the same core claim.
- Authority: primary, regulatory, official, or expert sources outweigh generic blogs.
- Freshness: dates match the brief's freshness policy.
- Scope match: sources answer the user's actual geography, product version, population, or category.
- Conflict severity: credible contradictions reduce score sharply.

Suggested mapping:

- `0.85-1.00`: `strong`
- `0.70-0.84`: `moderate`
- `0.50-0.69`: `mixed`
- `0.30-0.49`: `weak`
- Any unresolved high-authority contradiction: `conflict`
- Insufficient source coverage: `unknown`

## CLI Shape

```bash
consensus-check run \
  --brief consensus-brief.json \
  --out consensus-report.json \
  --markdown consensus-report.md
```

## First UI

- Question input with context and risk level controls.
- Geography, city, and device targeting controls.
- Source policy toggles for official docs, news, forums, reports, and freshness.
- Credit estimate before running.
- Two-column pass view: direct answer sources and challenge sources.
- Consensus meter with clear labels for strong, moderate, mixed, weak, conflict, and unknown.
- Claim table with agreed, disputed, scope-limited, stale, and unresolved filters.
- Source drawer showing query, rank, URL, fetched timestamp, source type, geography, device, and pass.
- Export buttons for Markdown and JSON.

## Guardrail Implementation

- Block high-confidence output when fewer than two independent source domains support the core answer.
- Cap confidence at medium when direct and challenge passes rely on the same source family.
- Cap confidence at low when all sources are third-party summaries.
- Mark `conflict` when high-authority sources disagree.
- Mark `unknown` when sources do not answer the actual question.
- Require explicit date handling when freshness policy is under 365 days.
- Keep copied snippets, press-release syndications, and scraped reposts from counting as independent sources.
