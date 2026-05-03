# Prototype

## Concept

Agentic Browsing Benchmark runs public research tasks through a fixed Massive MCP tool budget and grades whether the agent found, rendered, interpreted, and cited JS-heavy web evidence correctly.

The prototype is deliberately benchmark-first rather than app-first: define tasks, execute traces, score outputs, and export reports.

## Benchmark Pack

```json
{
  "id": "js_public_research_v0",
  "name": "JS Public Research v0",
  "description": "Public rendering and research tasks for JavaScript-heavy websites.",
  "policy": {
    "scope": "public_rendering_research",
    "disallowed": [
      "authenticated_sessions",
      "private_data",
      "security_testing",
      "captcha_bypass_objectives",
      "rate_limit_evasion"
    ]
  },
  "defaults": {
    "tool_budget": {
      "web_fetch": 8,
      "web_search": 3,
      "ai_chat_completion": 1
    },
    "profiles": [
      {
        "country": "us",
        "city": "San Francisco",
        "device": "desktop"
      },
      {
        "country": "us",
        "city": "New York",
        "device": "mobile"
      }
    ]
  },
  "tasks": [
    {
      "id": "ecommerce_filter_availability",
      "category": "ecommerce",
      "prompt": "Using public pages only, find whether the named product category has in-stock items under the requested filters and cite the rendered evidence.",
      "start": {
        "type": "url",
        "value": "https://www.example-shop.com/collections/running-shoes"
      },
      "requires_js": true,
      "expected_observations": [
        "product grid renders after JavaScript",
        "filter state changes visible results",
        "at least one product or empty-state message is cited"
      ],
      "answer_contract": {
        "fields": ["availability_status", "filters_used", "evidence_urls", "confidence"],
        "must_cite_rendered_fetch": true
      }
    }
  ]
}
```

## Task Types

- `direct_url_research`: answer from one public JS-heavy URL.
- `serp_to_rendered_page`: start from Google results, choose relevant public sources, then render pages.
- `localized_comparison`: compare what a page shows across country, city, or device profiles.
- `client_route_navigation`: follow public in-page navigation, tabs, filters, or client-side routes.
- `answer_verification`: compare chatbot or SERP claims against fetched rendered pages.

## Runner Sketch

```ts
type ToolBudget = {
  web_fetch: number;
  web_search: number;
  ai_chat_completion: number;
};

type RenderProfile = {
  country?: string;
  city?: string;
  device: "desktop" | "mobile" | "tablet";
};

type BenchmarkTask = {
  id: string;
  category: string;
  prompt: string;
  start: { type: "url" | "query"; value: string };
  requires_js: boolean;
  profiles?: RenderProfile[];
  expected_observations: string[];
  answer_contract: {
    fields: string[];
    must_cite_rendered_fetch: boolean;
  };
};

type ToolTraceEvent = {
  tool: "web_fetch" | "web_search" | "ai_chat_completion" | "account_status";
  input: Record<string, unknown>;
  output_summary: Record<string, unknown>;
  source_urls: string[];
  timestamp: string;
};

type BenchmarkRun = {
  pack_id: string;
  agent_id: string;
  started_at: string;
  completed_at?: string;
  task_results: TaskResult[];
};
```

## Execution Flow

1. Load benchmark pack.
2. Call `account_status` and estimate whether the pack can run within credits.
3. For URL-start tasks, call `web_fetch` with JS rendering for each required profile.
4. For query-start tasks, call `web_search`, select candidate public URLs, then call `web_fetch` with rendering.
5. Use `ai_chat_completion` only when the benchmark mode allows assisted synthesis or judge comparison.
6. Store all tool calls as trace events with source URLs and short output summaries.
7. Produce a structured final answer for each task.
8. Score task results using deterministic checks plus optional evidence-bounded LLM judging.

## Output Shape

```json
{
  "run_id": "run_2026_05_02_087",
  "pack_id": "js_public_research_v0",
  "agent_id": "massive_mcp_reference_agent",
  "overall_score": 84,
  "summary": "The agent completed 8 of 10 public rendering tasks with strong citation quality and one mobile localization miss.",
  "task_results": [
    {
      "task_id": "ecommerce_filter_availability",
      "status": "pass",
      "score": 91,
      "final_answer": {
        "availability_status": "in_stock",
        "filters_used": ["size 10", "road running"],
        "evidence_urls": ["https://www.example-shop.com/collections/running-shoes"],
        "confidence": "high"
      },
      "scores": {
        "render_fidelity": 20,
        "navigation": 17,
        "evidence_grounding": 20,
        "localization": 14,
        "friction_handling": 10,
        "answer_quality": 10
      },
      "trace_digest": {
        "web_fetch_calls": 3,
        "web_search_calls": 0,
        "ai_chat_completion_calls": 1,
        "rendered_sources_cited": 1
      }
    }
  ]
}
```

## Reference Agent Prompt

```text
You are evaluating public webpages for a rendering and research benchmark.
Use only public information available through the provided Massive MCP tools.
Prefer rendered page evidence for JS-heavy pages.
Do not attempt to access accounts, private data, protected systems, or security-sensitive surfaces.
If a captcha, consent wall, paywall, geoblock, or unavailable page prevents observation, say so clearly.
Cite the URLs you used and distinguish raw search snippets from rendered page observations.
Return the answer in the requested JSON contract.
```

## Report Artifacts

- `run.json`: complete machine-readable run result.
- `trace.jsonl`: one trace event per Massive MCP call.
- `report.md`: human-readable task summaries, failures, and examples.
- `leaderboard.csv`: pack ID, agent ID, score, task pass rate, citation rate, and blocked rate.
