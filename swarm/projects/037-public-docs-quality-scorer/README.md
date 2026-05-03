# Public Docs Quality Scorer

Public Docs Quality Scorer audits public documentation sites and turns messy qualitative impressions into a source-backed scorecard. It helps developer relations, product, support, and platform teams find stale docs, missing onboarding paths, weak examples, broken links, poor search visibility, and confusing API reference gaps before prospects or users hit them.

The first version is intentionally narrow: take a docs homepage plus a few priority topics, fetch rendered docs pages, inspect Google results and AI assistant answers, and produce a scored report with evidence, issue severity, and recommended fixes.

## Target User

Primary users:

- Developer relations teams improving docs onboarding and example quality.
- Product teams checking whether launch docs explain a new feature clearly.
- Support teams identifying docs gaps that create avoidable tickets.
- API platform teams comparing reference completeness across products.
- Technical marketing teams checking whether docs rank and answer common integration questions.
- Agencies or consultants auditing public developer documentation for clients.

## Core Workflow

1. User creates a docs audit brief:
   - Docs root URL
   - Priority products, APIs, SDKs, or concepts
   - Target search queries and user tasks
   - Competitor or benchmark docs, optional
   - Country, city, and device targets, optional
   - Scoring weights and must-have docs criteria
2. App checks `account_status` and estimates run cost before collecting pages and search results.
3. Massive MCP runs:
   - `web_fetch` with JS rendering to collect docs homepages, guides, API references, examples, changelog pages, and search result landing pages
   - country, city, and device targeting to catch localized docs, mobile navigation, and region-specific content differences
   - captcha handling so blocked or challenged docs pages are classified separately
   - `web_search` with Google SERP parsing for target docs queries
   - `ai_chat_completion` to ask chatbot-style questions and inspect whether answers cite the official docs
4. App normalizes rendered HTML, extracted text, metadata, headings, links, code blocks, tables, timestamps, screenshots, SERP results, and AI answer sources.
5. App scores docs quality across completeness, freshness, findability, task success, examples, technical accuracy signals, accessibility, and evidence coverage.
6. User receives a prioritized report with issue evidence, page-level scores, query-level search results, chatbot source coverage, and JSON, CSV, and Markdown exports.

## MVP Inputs

```json
{
  "project": "payments-api-docs-audit",
  "docs_root": "https://docs.example.com",
  "priority_topics": [
    {
      "name": "Create a payment",
      "expected_pages": ["quickstart", "api reference", "error handling"],
      "must_include": ["authentication", "idempotency", "test card", "webhook"]
    },
    {
      "name": "Handle failed payments",
      "expected_pages": ["error codes", "retry guide", "webhook event reference"],
      "must_include": ["failure reason", "retry policy", "customer notification"]
    }
  ],
  "queries": [
    {
      "query": "example payments api create payment",
      "expected_domain": "docs.example.com",
      "intent": "quickstart"
    },
    {
      "query": "example payments api webhook failed payment",
      "expected_domain": "docs.example.com",
      "intent": "troubleshooting"
    }
  ],
  "targets": [
    { "country": "us", "city": "San Francisco", "device": "desktop" },
    { "country": "gb", "city": "London", "device": "mobile" }
  ],
  "competitors": [
    { "name": "BenchmarkPay", "docs_root": "https://docs.benchmarkpay.example" }
  ],
  "scoring_weights": {
    "task_coverage": 25,
    "freshness": 15,
    "examples": 15,
    "navigation": 15,
    "search_findability": 15,
    "ai_answer_coverage": 10,
    "accessibility_basics": 5
  }
}
```

## MVP Output

```json
{
  "project": "payments-api-docs-audit",
  "docs_root": "https://docs.example.com",
  "summary": "Docs score 71/100. The quickstart is findable and has working code examples, but failed-payment handling is split across stale pages and mobile navigation hides the API reference.",
  "overall_score": 71,
  "topic_scores": [
    {
      "topic": "Create a payment",
      "score": 84,
      "status": "good",
      "strong_signals": ["quickstart ranks first", "authentication covered", "copyable code examples present"],
      "weak_signals": ["idempotency appears only in API reference"]
    },
    {
      "topic": "Handle failed payments",
      "score": 58,
      "status": "needs_work",
      "strong_signals": ["error code reference exists"],
      "weak_signals": ["retry policy missing", "webhook guide last updated 2023-09-14"]
    }
  ],
  "issues": [
    {
      "issue_id": "docs-001",
      "severity": "high",
      "category": "missing_task_coverage",
      "title": "Failed-payment guide does not explain retry policy",
      "topic": "Handle failed payments",
      "evidence": {
        "source_url": "https://docs.example.com/payments/errors",
        "html_excerpt": "Failed payment errors return a code and message.",
        "fetched_at": "2026-05-02T19:10:00Z"
      },
      "recommendation": "Add a failed-payment recovery guide that explains retry timing, user notification, webhook events, and example handling code.",
      "confidence": "high"
    }
  ],
  "search_results": [
    {
      "query": "example payments api create payment",
      "country": "us",
      "device": "desktop",
      "expected_domain_rank": 1,
      "top_result_title": "Create a payment - Example Docs",
      "status": "pass"
    }
  ],
  "ai_answer_coverage": [
    {
      "question": "How do I handle a failed payment with Example API?",
      "model": "perplexity",
      "official_docs_cited": false,
      "answer_quality": "partial",
      "missing_points": ["retry policy", "webhook event name"]
    }
  ]
}
```

## Scoring Dimensions

Page and topic observations preserve:

- Source URL, final URL, country, city, device, fetched timestamp, render state, and screenshot reference.
- Title, meta description, headings, canonical URL, language, last-updated date, and visible navigation labels.
- Links, broken links, redirects, API endpoint mentions, SDK language tabs, code blocks, tables, and copyable snippets.
- Topic coverage signals for required concepts, expected pages, examples, troubleshooting, limitations, and next steps.
- Search signals from Google SERP position, title/snippet relevance, People Also Ask, and competing results.
- AI answer signals from chatbot response accuracy, missing points, cited sources, and whether official docs were cited.
- Challenge, captcha, blocked, timeout, or render-failure state when collection is incomplete.

## Score Formula

Default score is 0-100:

- 25 points: priority user tasks are covered with clear page paths and required concepts.
- 15 points: docs are fresh, version-aware, and not contradicted by changelogs or current pages.
- 15 points: examples are practical, complete, copyable, and include expected languages or SDKs.
- 15 points: navigation, information architecture, headings, and mobile docs UX support task completion.
- 15 points: official docs are findable in Google for target queries and snippets match page intent.
- 10 points: chatbot answers cite official docs and cover required facts.
- 5 points: accessibility basics pass for headings, link text, code block readability, and mobile layout.

Automatic caps:

- Cap at 45 when core docs pages are blocked, challenged, or unavailable.
- Cap at 55 when a priority task has no clear official docs path.
- Cap at 65 when docs are findable only through non-official pages or stale mirrors.
- Cap at 75 when the report lacks rendered HTML or screenshot evidence for high-severity findings.
- Cap at 80 when no search or AI answer validation was run for externally discoverable docs.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown artifacts:

```bash
docs-quality-scorer run \
  --brief docs-audit-brief.json \
  --out docs-quality-report.json \
  --issues-csv docs-quality-issues.csv \
  --report-md docs-quality-report.md \
  --artifacts-dir artifacts
```

Minimum viable UI after CLI validation:

- Docs audit brief setup form
- Priority topic and required concept editor
- URL discovery and inclusion review
- Credit estimate preview
- Run status by URL, query, target, and model
- Topic scorecards
- Issue triage table with evidence drawer
- SERP and chatbot answer comparison view
- Export buttons for JSON, CSV, Markdown, screenshots, and HTML excerpts

## Massive MCP Usage

- `account_status`: estimate and confirm credits before docs, SERP, and chatbot collection.
- `web_fetch`: collect rendered docs pages, screenshots, extracted text, metadata, links, code blocks, and page state.
- JS rendering: support docs sites built with Docusaurus, Mintlify, ReadMe, GitBook, Next.js, and custom SPA docs.
- Country, city, and device targeting: detect localized docs differences and mobile navigation failures.
- Captcha handling: classify blocked or challenged docs pages separately from docs quality issues.
- `web_search`: collect Google results, snippets, People Also Ask, and official docs rank for target queries.
- Google SERP parsing: preserve result title, URL, snippet, rank, and query context.
- `ai_chat_completion`: ask task-oriented docs questions, inspect answer completeness, and record cited sources.

## Guardrails

- Treat docs quality as source-backed observations, not taste.
- Keep every issue tied to a fetched page, SERP result, or chatbot answer source.
- Do not claim the docs are technically wrong unless evidence contradicts another official source or user-provided truth.
- Distinguish missing docs, stale docs, confusing navigation, search discoverability, and AI answer coverage.
- Do not scrape private, authenticated, customer-specific, or gated docs unless the user explicitly owns access.
- Mark captcha, blocked, timeout, login, and cookie-wall states separately from content failures.
- Avoid ranking or conversion claims without external analytics evidence.
