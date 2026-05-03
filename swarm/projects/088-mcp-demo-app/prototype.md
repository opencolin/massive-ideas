# Prototype

This is a lightweight implementation sketch for a TypeScript web app. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type DemoBrief = {
  question: string;
  fetch_url: string;
  search_query: string;
  target: DemoTarget;
  fetch_options: FetchOptions;
  search_options: SearchOptions;
  chat_options: ChatOptions;
};

type DemoTarget = {
  country: string;
  city?: string;
  device: "desktop" | "mobile";
};

type FetchOptions = {
  render_js: boolean;
  handle_captcha: boolean;
  extract_main_content: boolean;
  include_screenshot: boolean;
};

type SearchOptions = {
  parse_google_serp: boolean;
  max_results: number;
  include_snippets: boolean;
};

type ChatOptions = {
  answer_with_sources: boolean;
  citation_required: boolean;
  max_sources: number;
};

type ToolPanelStatus = "queued" | "running" | "complete" | "partial" | "blocked" | "failed";

type FetchPanel = {
  tool: "web_fetch";
  status: ToolPanelStatus;
  url: string;
  final_url?: string;
  title?: string;
  fetched_at?: string;
  latency_ms?: number;
  render_js: boolean;
  captcha_status: "not_encountered" | "solved" | "blocked" | "unknown";
  content_excerpt?: string;
  key_claims: EvidenceClaim[];
  source_confidence: "high" | "medium" | "low";
  error?: string;
};

type SearchPanel = {
  tool: "web_search";
  status: ToolPanelStatus;
  query: string;
  searched_at?: string;
  latency_ms?: number;
  result_count: number;
  serp_features: string[];
  results: SearchResult[];
  top_domains: string[];
  error?: string;
};

type ChatPanel = {
  tool: "ai_chat_completion";
  status: ToolPanelStatus;
  prompt: string;
  answered_at?: string;
  latency_ms?: number;
  answer_excerpt?: string;
  cited_sources: DemoSource[];
  extracted_claims: EvidenceClaim[];
  citation_coverage: "high" | "medium" | "low" | "none";
  unsupported_claim_count: number;
  error?: string;
};

type SearchResult = {
  rank: number;
  url: string;
  domain: string;
  title: string;
  snippet?: string;
  serp_feature: "organic" | "paid" | "local_pack" | "paa" | "knowledge" | "unknown";
};

type DemoSource = {
  url: string;
  domain: string;
  title?: string;
  found_by: ("fetch" | "search" | "chat")[];
  source_type: "official" | "third_party" | "review" | "docs" | "news" | "unknown";
  confidence: "high" | "medium" | "low";
};

type EvidenceClaim = {
  text: string;
  evidence_type: "page_content" | "serp_snippet" | "chat_citation" | "chat_synthesis";
  source_urls: string[];
  support_status: "supported" | "partial" | "unsupported" | "unverified";
};

type ToolDifference = {
  dimension: string;
  fetch: string;
  search: string;
  chat: string;
};

type DemoComparison = {
  overlap: string[];
  differences: ToolDifference[];
  source_overlap: DemoSource[];
  recommended_next_call: string;
};

type DemoReport = {
  run_id: string;
  question: string;
  target_key: string;
  created_at: string;
  summary: string;
  panels: {
    fetch: FetchPanel;
    search: SearchPanel;
    chat: ChatPanel;
  };
  comparison: DemoComparison;
};
```

## Pipeline

```ts
async function runMcpDemo(brief: DemoBrief): Promise<DemoReport> {
  validateBrief(brief);

  const runId = createRunId("mcp-demo", brief);
  const targetKey = makeTargetKey(brief.target);
  const estimatedCredits = estimateDemoCredits(brief);
  const account = await massive.account_status();

  if (!account.ok || account.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for demo run");
  }

  const [fetchPanel, searchPanel, chatPanel] = await Promise.all([
    runFetchPanel(brief),
    runSearchPanel(brief),
    runChatPanel(brief)
  ]);

  const sourceOverlap = buildSourceOverlap(fetchPanel, searchPanel, chatPanel);
  const comparison = await comparePanels(brief, fetchPanel, searchPanel, chatPanel, sourceOverlap);

  return {
    run_id: runId,
    question: brief.question,
    target_key: targetKey,
    created_at: new Date().toISOString(),
    summary: comparisonToSummary(comparison),
    panels: {
      fetch: fetchPanel,
      search: searchPanel,
      chat: chatPanel
    },
    comparison
  };
}
```

## Tool Calls

```ts
async function runFetchPanel(brief: DemoBrief): Promise<FetchPanel> {
  const started = Date.now();
  const response = await massive.web_fetch({
    url: brief.fetch_url,
    country: brief.target.country,
    city: brief.target.city,
    device: brief.target.device,
    render_js: brief.fetch_options.render_js,
    handle_captcha: brief.fetch_options.handle_captcha,
    extract_main_content: brief.fetch_options.extract_main_content,
    include_screenshot: brief.fetch_options.include_screenshot
  });

  return {
    tool: "web_fetch",
    status: response.blocked ? "blocked" : "complete",
    url: brief.fetch_url,
    final_url: response.final_url,
    title: response.title,
    fetched_at: new Date().toISOString(),
    latency_ms: Date.now() - started,
    render_js: brief.fetch_options.render_js,
    captcha_status: response.captcha_status ?? "unknown",
    content_excerpt: excerpt(response.main_content ?? response.text, 700),
    key_claims: extractFetchClaims(response),
    source_confidence: scoreFetchConfidence(response)
  };
}

async function runSearchPanel(brief: DemoBrief): Promise<SearchPanel> {
  const started = Date.now();
  const response = await massive.web_search({
    query: brief.search_query,
    country: brief.target.country,
    city: brief.target.city,
    device: brief.target.device,
    parse_google_serp: brief.search_options.parse_google_serp,
    max_results: brief.search_options.max_results,
    include_snippets: brief.search_options.include_snippets
  });

  const results = normalizeSearchResults(response.results);

  return {
    tool: "web_search",
    status: "complete",
    query: brief.search_query,
    searched_at: new Date().toISOString(),
    latency_ms: Date.now() - started,
    result_count: results.length,
    serp_features: response.serp_features ?? [],
    results,
    top_domains: uniqueDomains(results).slice(0, 5)
  };
}

async function runChatPanel(brief: DemoBrief): Promise<ChatPanel> {
  const started = Date.now();
  const response = await massive.ai_chat_completion({
    prompt: brief.question,
    answer_with_sources: brief.chat_options.answer_with_sources,
    citation_required: brief.chat_options.citation_required,
    max_sources: brief.chat_options.max_sources,
    country: brief.target.country,
    city: brief.target.city,
    device: brief.target.device
  });

  const claims = normalizeChatClaims(response);

  return {
    tool: "ai_chat_completion",
    status: response.answer ? "complete" : "partial",
    prompt: brief.question,
    answered_at: new Date().toISOString(),
    latency_ms: Date.now() - started,
    answer_excerpt: excerpt(response.answer, 700),
    cited_sources: normalizeChatSources(response.sources),
    extracted_claims: claims,
    citation_coverage: scoreCitationCoverage(claims, response.sources),
    unsupported_claim_count: claims.filter(claim => claim.support_status === "unsupported").length
  };
}
```

## Comparison Logic

```ts
function buildSourceOverlap(
  fetchPanel: FetchPanel,
  searchPanel: SearchPanel,
  chatPanel: ChatPanel
): DemoSource[] {
  const byUrl = new Map<string, DemoSource>();

  addSource(byUrl, fetchPanel.final_url ?? fetchPanel.url, "fetch", fetchPanel.title);

  for (const result of searchPanel.results) {
    addSource(byUrl, result.url, "search", result.title);
  }

  for (const source of chatPanel.cited_sources) {
    addSource(byUrl, source.url, "chat", source.title);
  }

  return [...byUrl.values()].sort((a, b) => b.found_by.length - a.found_by.length);
}

async function comparePanels(
  brief: DemoBrief,
  fetchPanel: FetchPanel,
  searchPanel: SearchPanel,
  chatPanel: ChatPanel,
  sourceOverlap: DemoSource[]
): Promise<DemoComparison> {
  const comparison = await massive.ai_chat_completion({
    prompt: [
      "Compare these Massive MCP outputs for a demo app.",
      `Question: ${brief.question}`,
      `Fetch claims: ${JSON.stringify(fetchPanel.key_claims)}`,
      `Search results: ${JSON.stringify(searchPanel.results.slice(0, 5))}`,
      `Chat claims: ${JSON.stringify(chatPanel.extracted_claims)}`,
      "Return overlap bullets, differences across fetch/search/chat, and one recommended next MCP call."
    ].join("\n"),
    answer_with_sources: false
  });

  return parseComparison(comparison.answer, sourceOverlap);
}
```

## UI Layout

- Header: brief title, target chip, credit estimate, account status.
- Left panel: `web_fetch` with final URL, render/captcha badges, page title, excerpt, and claims.
- Middle panel: `web_search` with SERP features, ranked results, snippets, and top domains.
- Right panel: `ai_chat_completion` with answer excerpt, citations, and unsupported claim count.
- Bottom band: source overlap table and recommended next call.
- Export tray: JSON, Markdown, and shareable demo fixture.

## Error Handling

- If `web_fetch` is blocked, keep search and chat panels running and recommend fetching cached or SERP-discovered URLs.
- If `web_search` returns no results, show the raw query and target so the user can adjust locale or wording.
- If `ai_chat_completion` returns low citation coverage, mark unsupported claims and recommend fetch/search validation.
- If `account_status` fails, block the run before spending any credits.
- If one panel fails, the report remains usable with explicit missing-panel status.
