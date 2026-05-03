# Massive MCP Playground

Massive MCP Playground is a developer-facing sandbox for learning the exact shape of Massive MCP requests and responses. A user chooses a tool, fills in realistic parameters, runs the call, and sees the copyable MCP tool invocation beside the returned payload, extracted sources, latency, cost estimate, and targeting metadata.

The product is intentionally transparent. It does not hide `web_fetch`, `web_search`, `ai_chat_completion`, or `account_status` behind a polished research report. It shows the calls, the options, the raw response, and the source trail so builders can move from playground exploration to production integration with fewer surprises.

## Problem

Developers evaluating web intelligence APIs often struggle to answer practical questions:

- What does the request payload look like for JavaScript rendering, captcha handling, country, city, and device targeting?
- Which fields come back from Google SERP parsing versus page fetching versus chatbot answers?
- Where exactly did a chatbot answer get its sources?
- What happens when a page redirects, blocks, requires rendering, or returns partial content?
- How should a production app log source URLs, ranks, snippets, citations, and fetch timestamps?

Massive MCP Playground turns those unknowns into an inspectable run log.

## Target Users

- Developers integrating Massive MCP into apps, agents, or internal tools.
- Solutions engineers demoing exact API behavior to prospects.
- Product teams comparing web fetch, web search, and sourced chatbot answers.
- QA teams creating reproducible fixtures for source preservation and error states.
- Technical writers documenting request and response examples.
- Data teams validating source provenance before storing MCP outputs.

## Core Workflow

1. User selects one or more tools:
   - `account_status`
   - `web_fetch`
   - `web_search`
   - `ai_chat_completion`
2. User edits a structured request form or JSON payload.
3. Playground renders the exact MCP call before execution.
4. App optionally checks `account_status` and estimates credits.
5. Massive MCP runs the selected calls with requested targeting, rendering, captcha, SERP, and source options.
6. Playground displays:
   - Exact tool call payload
   - Raw JSON response
   - Normalized source table
   - Returned citations, URLs, snippets, ranks, and fetched timestamps
   - Timing, status, error, and credit metadata
7. User copies the call, exports the run, or converts it into a code snippet.

## MVP Inputs

```json
{
  "workspace": "source-debugging",
  "calls": [
    {
      "tool": "web_fetch",
      "payload": {
        "url": "https://linear.app/",
        "render_js": true,
        "handle_captcha": true,
        "country": "us",
        "city": "San Francisco",
        "device": "desktop",
        "extract_main_content": true,
        "include_links": true
      }
    },
    {
      "tool": "web_search",
      "payload": {
        "query": "Linear product management software",
        "parse_google_serp": true,
        "country": "us",
        "city": "San Francisco",
        "device": "desktop",
        "max_results": 8
      }
    },
    {
      "tool": "ai_chat_completion",
      "payload": {
        "messages": [
          {
            "role": "user",
            "content": "What does Linear offer product teams? Answer with sources."
          }
        ],
        "answer_with_sources": true,
        "max_sources": 6
      }
    }
  ],
  "display": {
    "show_raw_json": true,
    "show_source_table": true,
    "show_code_snippets": true
  }
}
```

## MVP Output

```json
{
  "run_id": "massive-mcp-playground-2026-05-02-linear",
  "created_at": "2026-05-02T12:00:00Z",
  "status": "complete",
  "account": {
    "checked": true,
    "remaining_credits": 18420,
    "estimated_credits": 3
  },
  "executions": [
    {
      "tool": "web_fetch",
      "call": {
        "url": "https://linear.app/",
        "render_js": true,
        "handle_captcha": true,
        "country": "us",
        "city": "San Francisco",
        "device": "desktop"
      },
      "status": "complete",
      "latency_ms": 1460,
      "source_count": 1,
      "sources": [
        {
          "url": "https://linear.app/",
          "final_url": "https://linear.app/",
          "title": "Linear",
          "source_kind": "fetched_page",
          "rank": null,
          "citation_index": null,
          "fetched_at": "2026-05-02T12:00:03Z"
        }
      ]
    },
    {
      "tool": "web_search",
      "call": {
        "query": "Linear product management software",
        "parse_google_serp": true,
        "country": "us",
        "city": "San Francisco",
        "device": "desktop",
        "max_results": 8
      },
      "status": "complete",
      "latency_ms": 920,
      "source_count": 8,
      "sources": [
        {
          "url": "https://linear.app/",
          "title": "Linear",
          "domain": "linear.app",
          "source_kind": "serp_result",
          "rank": 1,
          "snippet": "Plan and build products with Linear..."
        }
      ]
    },
    {
      "tool": "ai_chat_completion",
      "call": {
        "answer_with_sources": true,
        "max_sources": 6
      },
      "status": "complete",
      "latency_ms": 2100,
      "source_count": 5,
      "sources": [
        {
          "url": "https://linear.app/",
          "title": "Linear",
          "source_kind": "chat_citation",
          "citation_index": 1
        }
      ]
    }
  ],
  "source_index": {
    "unique_urls": 10,
    "overlap": [
      {
        "url": "https://linear.app/",
        "found_by": ["web_fetch", "web_search", "ai_chat_completion"]
      }
    ]
  }
}
```

## Interface

- Left rail: saved presets for fetch, search, chat, and combined source tracing.
- Main editor: form controls plus synchronized JSON editor for exact payloads.
- Call preview: copyable MCP tool invocation before execution.
- Response viewer: raw JSON, pretty JSON, and compact table modes.
- Source inspector: normalized table with URL, domain, title, rank, snippet, citation index, final URL, source type, and found-by badges.
- Diff view: compare two runs to see changed payload fields, response fields, source URLs, and latency.
- Code snippets: generate TypeScript, Python, curl, and MCP client examples from the exact call.

## Massive MCP Fit

- `account_status`: preflight quota, feature availability, and expected cost display.
- `web_fetch`: show request fields for JS rendering, captcha handling, device targeting, redirects, extracted text, links, screenshots, and final URLs.
- `web_search`: expose Google SERP parsing output with ranks, snippets, SERP features, URLs, and localized result behavior.
- `ai_chat_completion`: display sourced answers, citation URLs, source indexes, unsupported claims, and prompt/message payloads.
- Country, city, and device targeting: keep target metadata visible on every call and source row.

## Guardrails

- Always show exact request payloads before execution.
- Preserve raw responses without mutating field names.
- Keep normalized source rows linked back to their original response paths.
- Label missing, partial, redirected, blocked, captcha, and JS-rendered states.
- Do not merge source URLs without retaining the original URL and final URL.
- Do not treat chat citations, SERP snippets, and fetched page content as the same evidence type.
- Avoid storing secrets, account tokens, or private payload fields in exported runs.
