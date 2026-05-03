# MCP Demo App

MCP Demo App is a guided comparison workspace for showing how Massive MCP's `web_fetch`, `web_search`, and `ai_chat_completion` behave on the same research question. It puts raw page evidence, Google SERP context, and chatbot answers with sources into three synchronized columns so developers, sales engineers, and evaluators can see where each tool is strongest.

The first version is intentionally demo-sized: one prompt, one target market, one URL, one SERP query, and one chatbot answer. The app returns a side-by-side report with source lineage, freshness, extraction confidence, and suggested next API call.

## Target User

Primary users:

- Developers learning which Massive MCP tool to call for a workflow.
- Sales and solutions teams demoing JS rendering, captcha handling, SERP parsing, and chatbot answers with sources.
- Product teams evaluating how fetch, search, and chat outputs differ on the same question.
- QA teams building regression fixtures for tool output shape, latency, and source quality.
- New Massive MCP customers validating country, city, and device targeting before production integration.

## Core Workflow

1. User enters a demo brief:
   - Research question
   - URL to fetch
   - Search query
   - Target country, city, and device
   - Fetch options such as JS rendering and captcha handling
   - Chat instructions and preferred citation strictness
2. App checks `account_status` and shows estimated credits for the three calls.
3. Massive MCP runs:
   - `web_fetch` on the target URL with optional JS rendering, captcha handling, and device targeting
   - `web_search` with Google SERP parsing for the query and location
   - `ai_chat_completion` to answer the question with sources
4. App normalizes all outputs into shared evidence cards.
5. App renders three columns: fetched page, search results, and AI answer.
6. App produces a comparison summary that explains overlap, gaps, and when to use each MCP tool.

## MVP Inputs

```json
{
  "question": "What does Linear offer for product teams?",
  "fetch_url": "https://linear.app/",
  "search_query": "Linear product management software",
  "target": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "fetch_options": {
    "render_js": true,
    "handle_captcha": true,
    "extract_main_content": true,
    "include_screenshot": false
  },
  "search_options": {
    "parse_google_serp": true,
    "max_results": 8,
    "include_snippets": true
  },
  "chat_options": {
    "answer_with_sources": true,
    "citation_required": true,
    "max_sources": 6
  }
}
```

## MVP Output

```json
{
  "run_id": "mcp-demo-2026-05-02-linear",
  "question": "What does Linear offer for product teams?",
  "target_key": "us:san-francisco:desktop",
  "summary": "Fetch found the official positioning and product claims, search showed market-facing pages and third-party context, and chat produced a concise answer citing the official site plus review-style sources.",
  "panels": {
    "fetch": {
      "status": "complete",
      "url": "https://linear.app/",
      "title": "Linear",
      "render_js": true,
      "captcha_status": "not_encountered",
      "key_claims": [
        "Linear is positioned around product planning and issue tracking.",
        "The site highlights roadmaps, cycles, projects, and integrations."
      ],
      "source_confidence": "high"
    },
    "search": {
      "status": "complete",
      "query": "Linear product management software",
      "result_count": 8,
      "serp_features": ["organic_results", "site_links"],
      "top_domains": ["linear.app", "g2.com", "capterra.com"],
      "freshness_signal": "mixed"
    },
    "chat": {
      "status": "complete",
      "answer_excerpt": "Linear is a product development platform for planning, tracking, and shipping software work...",
      "source_count": 5,
      "citation_coverage": "high",
      "unsupported_claim_count": 0
    }
  },
  "comparison": {
    "overlap": [
      "All three outputs identify Linear as product development or product management software.",
      "Fetch and chat agree on planning, projects, and issue tracking as core capabilities."
    ],
    "differences": [
      {
        "dimension": "source type",
        "fetch": "Official first-party page",
        "search": "Ranking pages and snippets",
        "chat": "Synthesized answer with citations"
      },
      {
        "dimension": "best use",
        "fetch": "Verify exact page content",
        "search": "Discover public search context",
        "chat": "Summarize evidence into an answer"
      }
    ],
    "recommended_next_call": "Use web_fetch on the top non-official SERP results to validate third-party claims before comparing against the chat answer."
  }
}
```

## Comparison Dimensions

Each run preserves:

- Request parameters for fetch, search, chat, and targeting.
- Latency, credit estimate, completion status, and error state for each panel.
- Fetch metadata including final URL, render mode, captcha status, title, extracted text, and screenshot availability.
- Search metadata including result rank, domain, URL, title, snippet, SERP features, and local target.
- Chat metadata including answer text, cited URLs, source confidence, and unsupported claim count.
- Shared source graph linking fetched URLs, search results, and chat citations.
- Side-by-side claim overlap and disagreement notes.
- A recommended next MCP call for deeper validation.

## First Build

Ship as a small web demo backed by a single API route:

```bash
mcp-demo-app run \
  --question "What does Linear offer for product teams?" \
  --fetch-url "https://linear.app/" \
  --search-query "Linear product management software" \
  --country us \
  --city "San Francisco" \
  --device desktop \
  --out latest-demo.json
```

Minimum viable UI:

- Brief form for question, URL, query, location, and device.
- Credit estimate and `account_status` panel.
- Run button with per-tool progress states.
- Three synchronized output columns for fetch, search, and chat.
- Source overlap table showing URLs found by one, two, or all three tools.
- "When to use this tool" callouts generated from the observed outputs.
- Export buttons for JSON and Markdown.

## Massive MCP Usage

- `account_status`: show remaining credits and estimated cost before the demo run.
- `web_fetch`: fetch the requested URL with JS rendering, captcha handling, country/city/device targeting, and structured content extraction.
- `web_search`: run the query with Google SERP parsing and the same location/device targeting.
- `ai_chat_completion`: answer the research question with sources, then optionally summarize differences across all three panels.
- Chatbot answers with sources: preserve citation URLs and map them into the shared source graph.

## Guardrails

- Label fetched page content, search snippets, and chatbot synthesis as separate evidence types.
- Keep raw output expandable, but lead with short excerpts and structured fields.
- Do not treat chatbot answers as ground truth unless supported by fetched or searched sources.
- Preserve every URL, target, timestamp, and request option used in the comparison.
- Mark captcha, blocked, redirected, stale, or JS-dependent outputs clearly.
- Avoid implying that Google ranking equals factual authority.
- Keep demo fixtures free of private, gated, or sensitive account data.
