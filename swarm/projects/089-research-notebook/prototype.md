# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ResearchDepth = "quick" | "standard" | "deep";
type Confidence = "high" | "medium" | "low" | "unknown";

type NotebookScope = {
  time_window_days?: number;
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
  include_domains?: string[];
  exclude_domains?: string[];
};

type Notebook = {
  id: string;
  title: string;
  research_question: string;
  scope: NotebookScope;
  tags: string[];
  status: "active" | "paused" | "archived";
  created_at: string;
  updated_at: string;
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
  notebook_id: string;
  url: string;
  domain: string;
  title?: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source" | "seed_url";
  quality: SourceQuality;
  query?: string;
  rank?: number;
  snippet?: string;
  visible_date?: string;
  fetched_at?: string;
  fetch_status?: "pending" | "ok" | "failed" | "blocked";
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type Snippet = {
  id: string;
  notebook_id: string;
  source_id: string;
  text: string;
  location_hint?: string;
  tags: string[];
  extraction_reason: string;
  created_at: string;
};

type Claim = {
  id: string;
  notebook_id: string;
  text: string;
  confidence: Confidence;
  confidence_note: string;
  snippet_ids: string[];
  status: "candidate" | "accepted" | "rejected" | "needs_review";
  tags: string[];
};

type Gap = {
  id: string;
  notebook_id: string;
  text: string;
  gap_type: "missing_source" | "contradiction" | "stale_evidence" | "ambiguous_scope" | "weak_support";
  related_claim_ids: string[];
  created_at: string;
};

type NotebookRun = {
  id: string;
  notebook_id: string;
  run_type: "search" | "fetch" | "extract" | "confidence_review" | "refresh";
  input: unknown;
  output_summary: string;
  credits_estimated?: number;
  credits_used?: number;
  created_at: string;
};
```

## Pipeline

```ts
async function expandNotebook(notebook: Notebook, depth: ResearchDepth) {
  const plan = await planEvidenceCollection(notebook, depth);
  const estimate = estimateCredits(plan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimate.total) {
    throw new Error("Insufficient Massive MCP credits for notebook expansion");
  }

  const serpSources = await runSearchPlan(notebook, plan.queries);
  const aiLeads = await collectSourcedAiLeads(notebook, plan.ai_prompts);
  const fetchQueue = rankFetchCandidates(notebook, serpSources, aiLeads, depth);
  const fetchedSources = await fetchSources(notebook, fetchQueue);
  const snippets = await extractSnippets(notebook, fetchedSources);
  const claims = await clusterClaims(notebook, snippets);
  const reviewedClaims = await reviewConfidence(notebook, claims, snippets, fetchedSources);
  const gaps = await detectGaps(notebook, reviewedClaims, snippets, fetchedSources);

  return persistNotebookUpdate({
    sources: [...serpSources, ...aiLeads, ...fetchedSources],
    snippets,
    claims: reviewedClaims,
    gaps
  });
}
```

## Evidence Planning

```ts
async function planEvidenceCollection(notebook: Notebook, depth: ResearchDepth) {
  const response = await massive.ai_chat_completion({
    model: "research-planner",
    messages: [
      {
        role: "system",
        content: "Create an auditable source collection plan for a research notebook. Return JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          question: notebook.research_question,
          scope: notebook.scope,
          tags: notebook.tags,
          depth
        })
      }
    ],
    response_schema: "NotebookCollectionPlan"
  });

  return sanitizeCollectionPlan(response.json);
}
```

The plan should include:

- 4-10 evidence themes.
- 6-30 search queries depending on depth.
- Required source types for each theme.
- 1-3 sourced AI-answer prompts for source discovery and contradiction checks.
- Entity ambiguity warnings.
- Confidence risks to watch, such as vendor-only evidence or stale pages.

## Search Capture

```ts
async function runSearchPlan(notebook: Notebook, queries) {
  const records: SourceRecord[] = [];

  for (const item of queries) {
    const result = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: notebook.scope.country,
      city: notebook.scope.city,
      device: notebook.scope.device || "desktop",
      max_results: item.max_results
    });

    records.push(...normalizeSerpResults(result, notebook, item));
  }

  return records.filter(record => !isExcluded(record.url, notebook.scope.exclude_domains));
}
```

Search records must preserve:

- Notebook ID and run ID.
- Query, result rank, result type, title, URL, snippet, and visible date.
- Country, city, device, and search timestamp.
- Initial source-quality label and fetch priority.

## Fetch And Snippet Extraction

```ts
async function fetchSources(notebook: Notebook, candidates: SourceRecord[]) {
  const fetched = [];

  for (const source of candidates) {
    const page = await massive.web_fetch({
      url: source.url,
      render_js: true,
      captcha: "auto",
      extract_main_content: true,
      country: notebook.scope.country,
      city: notebook.scope.city,
      device: notebook.scope.device || "desktop",
      timeout_ms: 15000
    });

    fetched.push(normalizeFetchedPage(source, page));
  }

  return fetched;
}

async function extractSnippets(notebook: Notebook, sources: SourceRecord[]) {
  const response = await massive.ai_chat_completion({
    model: "evidence-extractor",
    messages: [
      {
        role: "system",
        content: [
          "Extract concise evidence snippets relevant to the notebook question.",
          "Prefer direct evidence over background context.",
          "Return source IDs, snippet text, tags, and extraction reasons as JSON."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ notebook, sources })
      }
    ],
    response_schema: "SnippetList"
  });

  return sanitizeSnippets(response.json, sources);
}
```

## Confidence Review

```ts
async function reviewConfidence(notebook, claims: Claim[], snippets: Snippet[], sources: SourceRecord[]) {
  const response = await massive.ai_chat_completion({
    model: "confidence-reviewer",
    messages: [
      {
        role: "system",
        content: [
          "Score claim confidence using only the provided snippets and sources.",
          "High confidence requires strong, direct, corroborated evidence.",
          "Cap snippet-only claims at low confidence.",
          "Cap company-owned-only claims at medium confidence.",
          "Mark unsupported claims as unknown or needs_review.",
          "Return corrected JSON only."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ notebook, claims, snippets, sources })
      }
    ],
    response_schema: "ReviewedClaimList"
  });

  return sanitizeReviewedClaims(response.json, snippets, sources);
}
```

## Notebook Markdown Export

```md
# {Notebook Title}

Question: {research_question}
Scope: {country}/{city}, {device}, last {time_window_days} days

## Current Findings

- [medium] Claim text. Sources: snip_001, snip_004

## Evidence Snippets

### adoption-signal

- snip_001 from src_001: Snippet text...

## Confidence Notes

- claim_001: Confidence rationale and caps applied.

## Gaps And Contradictions

- Missing independent adoption-rate evidence.

## Source Inventory

| ID | Quality | URL | Query | Rank | Fetched |
| --- | --- | --- | --- | --- | --- |
```

## Storage

For the first build, use append-friendly local files:

- `notebook.json`: canonical notebook metadata.
- `sources.jsonl`: one source record per line.
- `snippets.jsonl`: one snippet per line.
- `claims.jsonl`: one claim per line.
- `gaps.jsonl`: one gap per line.
- `runs.jsonl`: one Massive MCP operation per line.

This keeps the prototype inspectable and easy to migrate into SQLite or Postgres later.
