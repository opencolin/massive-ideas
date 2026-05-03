# Prototype

This prototype sketches a small TypeScript playground with a JSON-first interface. The core object is a run log: every execution stores the exact MCP call, the raw MCP response, and a normalized source index that points back into the raw response.

## Data Model

```ts
type PlaygroundTool =
  | "account_status"
  | "web_fetch"
  | "web_search"
  | "ai_chat_completion";

type PlaygroundRunRequest = {
  workspace: string;
  calls: PlaygroundCall[];
  display: DisplayOptions;
};

type PlaygroundCall = {
  id: string;
  tool: PlaygroundTool;
  payload: Record<string, unknown>;
  enabled: boolean;
  depends_on?: string[];
};

type DisplayOptions = {
  show_raw_json: boolean;
  show_source_table: boolean;
  show_code_snippets: boolean;
  redact_secrets: boolean;
};

type ExecutionStatus =
  | "queued"
  | "running"
  | "complete"
  | "partial"
  | "blocked"
  | "failed"
  | "skipped";

type PlaygroundExecution = {
  id: string;
  tool: PlaygroundTool;
  call: Record<string, unknown>;
  raw_response: unknown;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  latency_ms?: number;
  estimated_credits?: number;
  actual_credits?: number;
  error?: PlaygroundError;
  sources: PlaygroundSource[];
};

type PlaygroundError = {
  code: string;
  message: string;
  retryable: boolean;
  response_path?: string;
};

type PlaygroundSource = {
  id: string;
  url: string;
  original_url?: string;
  final_url?: string;
  domain?: string;
  title?: string;
  snippet?: string;
  source_kind:
    | "fetched_page"
    | "serp_result"
    | "serp_feature"
    | "chat_citation"
    | "extracted_link"
    | "screenshot"
    | "unknown";
  tool: PlaygroundTool;
  execution_id: string;
  response_path: string;
  rank?: number;
  citation_index?: number;
  fetched_at?: string;
  target?: TargetContext;
};

type TargetContext = {
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type SourceOverlap = {
  normalized_url: string;
  source_ids: string[];
  found_by: PlaygroundTool[];
  titles: string[];
  ranks: number[];
  citation_indexes: number[];
};

type PlaygroundRun = {
  run_id: string;
  workspace: string;
  created_at: string;
  status: ExecutionStatus;
  account_status?: unknown;
  executions: PlaygroundExecution[];
  source_index: {
    sources: PlaygroundSource[];
    overlap: SourceOverlap[];
    unique_url_count: number;
  };
};
```

## Pipeline

```ts
async function runPlayground(request: PlaygroundRunRequest): Promise<PlaygroundRun> {
  validateRequest(request);

  const run: PlaygroundRun = {
    run_id: createRunId("massive-mcp-playground"),
    workspace: request.workspace,
    created_at: new Date().toISOString(),
    status: "running",
    executions: [],
    source_index: {
      sources: [],
      overlap: [],
      unique_url_count: 0
    }
  };

  if (request.calls.some(call => call.tool !== "account_status")) {
    run.account_status = await massive.account_status();
  }

  for (const call of request.calls.filter(call => call.enabled)) {
    const execution = await executePlaygroundCall(call, request.display);
    run.executions.push(execution);
  }

  const sources = run.executions.flatMap(execution => execution.sources);
  run.source_index = {
    sources,
    overlap: buildSourceOverlap(sources),
    unique_url_count: new Set(sources.map(source => normalizeUrl(source.url))).size
  };
  run.status = summarizeRunStatus(run.executions);

  return run;
}
```

## Exact Tool Execution

```ts
async function executePlaygroundCall(
  call: PlaygroundCall,
  display: DisplayOptions
): Promise<PlaygroundExecution> {
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const redactedCall = display.redact_secrets ? redactSecrets(call.payload) : call.payload;

  try {
    const rawResponse = await massive[call.tool](call.payload);
    const completedAt = new Date().toISOString();
    const execution: PlaygroundExecution = {
      id: call.id,
      tool: call.tool,
      call: redactedCall,
      raw_response: display.redact_secrets ? redactSecrets(rawResponse) : rawResponse,
      status: inferStatus(call.tool, rawResponse),
      started_at: startedAt,
      completed_at: completedAt,
      latency_ms: Date.now() - startedMs,
      sources: []
    };

    execution.sources = extractSources(execution);
    return execution;
  } catch (error) {
    return {
      id: call.id,
      tool: call.tool,
      call: redactedCall,
      raw_response: null,
      status: "failed",
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      latency_ms: Date.now() - startedMs,
      error: normalizeError(error),
      sources: []
    };
  }
}
```

## Source Extraction

```ts
function extractSources(execution: PlaygroundExecution): PlaygroundSource[] {
  if (execution.tool === "web_fetch") {
    return extractFetchSources(execution);
  }

  if (execution.tool === "web_search") {
    return extractSearchSources(execution);
  }

  if (execution.tool === "ai_chat_completion") {
    return extractChatSources(execution);
  }

  return [];
}

function extractFetchSources(execution: PlaygroundExecution): PlaygroundSource[] {
  const response = execution.raw_response as FetchResponse;
  const primaryUrl = response.final_url ?? response.url ?? String(execution.call.url ?? "");

  const sources: PlaygroundSource[] = [{
    id: `${execution.id}:fetch:primary`,
    url: primaryUrl,
    original_url: String(execution.call.url ?? ""),
    final_url: response.final_url,
    domain: domainOf(primaryUrl),
    title: response.title,
    source_kind: "fetched_page",
    tool: "web_fetch",
    execution_id: execution.id,
    response_path: "$",
    fetched_at: execution.completed_at,
    target: targetFromCall(execution.call)
  }];

  for (const [index, link] of (response.links ?? []).entries()) {
    sources.push({
      id: `${execution.id}:fetch:link:${index}`,
      url: link.url,
      domain: domainOf(link.url),
      title: link.text,
      source_kind: "extracted_link",
      tool: "web_fetch",
      execution_id: execution.id,
      response_path: `$.links[${index}]`,
      target: targetFromCall(execution.call)
    });
  }

  return sources;
}

function extractSearchSources(execution: PlaygroundExecution): PlaygroundSource[] {
  const response = execution.raw_response as SearchResponse;

  return (response.results ?? []).map((result, index) => ({
    id: `${execution.id}:search:${index}`,
    url: result.url,
    domain: result.domain ?? domainOf(result.url),
    title: result.title,
    snippet: result.snippet,
    source_kind: result.serp_feature ? "serp_feature" : "serp_result",
    tool: "web_search",
    execution_id: execution.id,
    response_path: `$.results[${index}]`,
    rank: result.rank ?? index + 1,
    target: targetFromCall(execution.call)
  }));
}

function extractChatSources(execution: PlaygroundExecution): PlaygroundSource[] {
  const response = execution.raw_response as ChatResponse;

  return (response.sources ?? response.citations ?? []).map((source, index) => ({
    id: `${execution.id}:chat:${index}`,
    url: source.url,
    domain: source.domain ?? domainOf(source.url),
    title: source.title,
    snippet: source.excerpt,
    source_kind: "chat_citation",
    tool: "ai_chat_completion",
    execution_id: execution.id,
    response_path: source.response_path ?? `$.sources[${index}]`,
    citation_index: source.index ?? index + 1,
    target: targetFromCall(execution.call)
  }));
}
```

## UI States

- Empty: show four starter templates and the JSON editor.
- Ready: show exact tool calls with copy buttons before the run.
- Running: each call has independent progress, latency timer, and cancel affordance.
- Complete: raw response, normalized source table, and code snippets are available.
- Partial: completed calls stay visible when another call fails.
- Blocked: captcha, access denied, robots, timeout, or quota state is labeled without deleting raw response data.

## Presets

```ts
const presets = {
  fetchedPageWithRendering: {
    tool: "web_fetch",
    payload: {
      url: "https://linear.app/",
      render_js: true,
      handle_captcha: true,
      country: "us",
      city: "San Francisco",
      device: "desktop",
      extract_main_content: true
    }
  },
  localizedGoogleSerp: {
    tool: "web_search",
    payload: {
      query: "best payroll software for restaurants",
      parse_google_serp: true,
      country: "us",
      city: "Austin",
      device: "mobile",
      max_results: 10
    }
  },
  sourcedAnswer: {
    tool: "ai_chat_completion",
    payload: {
      messages: [
        {
          role: "user",
          content: "Compare Linear and Jira for product planning. Include sources."
        }
      ],
      answer_with_sources: true,
      max_sources: 8
    }
  }
};
```

## Export Formats

- `run.json`: complete run log with exact calls, raw responses, and normalized sources.
- `sources.csv`: flattened source table for spreadsheet review.
- `snippet.ts`: TypeScript client call using the same payload.
- `snippet.py`: Python client call using the same payload.
- `fixture.json`: redacted fixture suitable for regression tests.
