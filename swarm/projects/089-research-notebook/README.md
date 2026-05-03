# Automated Research Notebook

Idea 89 is an automated research notebook that captures sources, snippets, claims, and confidence as research happens. Instead of producing only a polished final answer, it maintains an auditable workspace where every useful page, search result, chatbot answer, excerpt, and inference is stored with provenance.

The notebook is designed for analysts, founders, investors, product teams, and operators who need to gather evidence over time, compare source quality, and return later to see why a conclusion was trusted or left uncertain.

## Problem

Research work often gets scattered across browser tabs, copied snippets, screenshots, chat transcripts, and half-finished notes. By the time a memo or decision is written, the connection between a claim and its supporting evidence is easy to lose.

This product keeps the evidence trail intact. It records search queries, SERP ranks, fetched pages, snippets, source metadata, confidence scores, and unresolved questions in one notebook that can be reviewed, exported, and refreshed.

## Target Users

- Strategy and market researchers collecting evidence across many sessions.
- Product managers validating competitors, buyer needs, pricing, or category movement.
- Investors and diligence teams tracking company, market, and risk signals.
- Content and thought-leadership teams building source banks before writing.
- Sales and customer teams creating account or industry notebooks.

## Core Workflow

1. User creates a notebook with a research question, scope, and optional geography.
2. App checks `account_status` and suggests a quick, standard, or deep evidence budget.
3. User adds seed URLs, search prompts, or open questions.
4. Massive MCP collects evidence through:
   - `web_search` with Google SERP parsing for source discovery
   - `web_fetch` with JavaScript rendering for dynamic pages and docs
   - captcha handling for public pages that challenge simple fetchers
   - country, city, and device targeting for localized evidence
   - `ai_chat_completion` for sourced answer drafts, claim extraction, and confidence review
5. App stores source records, snippets, extracted claims, notes, tags, confidence, and citations.
6. User reviews the notebook, promotes claims to findings, marks gaps, and exports a memo-ready evidence pack.

## Notebook Objects

- Notebook: research question, scope, owner, status, geography, device, and time window.
- Source: URL, title, domain, source type, query, SERP rank, fetch status, timestamp, region, and device.
- Snippet: quoted or paraphrased evidence with page location, source ID, tags, and extraction reason.
- Claim: a statement inferred from one or more snippets, with confidence and citation IDs.
- Confidence note: explanation for why confidence is high, medium, low, or unknown.
- Gap: unanswered question, missing source type, contradiction, stale evidence, or weak citation.
- Run: search/fetch/chat operation with inputs, outputs, costs, and errors.

## MVP Inputs

```json
{
  "notebook_title": "AI support agents in mid-market SaaS",
  "research_question": "What evidence shows mid-market SaaS companies adopting AI support agents?",
  "scope": {
    "time_window_days": 180,
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "seed_queries": [
    "mid market SaaS AI support agent customer story",
    "AI customer support agent adoption SaaS 2026",
    "AI support automation objections customer service teams"
  ],
  "seed_urls": [],
  "tags": ["market", "customer-support", "ai-agents"],
  "confidence_policy": {
    "require_fetched_page_for_medium": true,
    "cap_company_only_claims": "medium",
    "cap_snippet_only_claims": "low"
  }
}
```

## MVP Output

```json
{
  "notebook_id": "nb_089_ai_support_agents",
  "created_at": "2026-05-02T19:30:00Z",
  "question": "What evidence shows mid-market SaaS companies adopting AI support agents?",
  "sources": [
    {
      "id": "src_001",
      "url": "https://example.com/customer-story",
      "title": "Example Customer Story",
      "domain": "example.com",
      "source_type": "company_customer_story",
      "query": "mid market SaaS AI support agent customer story",
      "rank": 3,
      "country": "us",
      "city": "San Francisco",
      "device": "desktop",
      "fetched_at": "2026-05-02T19:31:10Z"
    }
  ],
  "snippets": [
    {
      "id": "snip_001",
      "source_id": "src_001",
      "text": "The customer describes using AI to triage support tickets and reduce first response time.",
      "tags": ["adoption-signal", "support-workflow"],
      "extraction_reason": "Direct evidence of production workflow"
    }
  ],
  "claims": [
    {
      "id": "claim_001",
      "text": "Public evidence suggests AI support agents are being adopted for triage and response-time reduction, but most visible proof comes from vendor-owned sources.",
      "confidence": "medium",
      "confidence_note": "Supported by fetched customer-story pages, but independent buyer data is missing.",
      "citation_ids": ["snip_001"]
    }
  ],
  "gaps": [
    "Need independent survey or buyer-side evidence before estimating adoption rate."
  ]
}
```

## Massive MCP Fit

- `account_status`: estimate evidence budget before large notebook refreshes.
- `web_search`: collect candidate sources and preserve query/rank context.
- Google SERP parsing: store snippets, dates, result types, ranks, and source discovery trail.
- `web_fetch`: capture rendered pages, dynamic evidence, docs, PDFs, pricing pages, and changelogs.
- Captcha handling: identify and retry public challenge pages where allowed.
- Country, city, and device targeting: compare localized SERPs and page variants.
- `ai_chat_completion`: extract candidate snippets, cluster claims, identify contradictions, and explain confidence.

## Guardrails

- Preserve source provenance for every snippet and claim.
- Treat chatbot answers as leads until verified by fetched or otherwise inspectable sources.
- Cap confidence when evidence is snippet-only, stale, company-owned-only, or geographically mismatched.
- Separate direct evidence from interpretation.
- Make contradictions and unknowns visible instead of smoothing them away.
- Do not bypass authentication, paywalls, robots restrictions, private data, or site terms.
- Support export without losing query, rank, timestamp, region, device, or confidence rationale.

## First Build

Ship as a local CLI and JSON-backed notebook store:

```bash
research-notebook create --title "AI support agents" --question "What evidence shows adoption in mid-market SaaS?"
research-notebook search nb_089_ai_support_agents --query "mid market SaaS AI support agent customer story"
research-notebook fetch nb_089_ai_support_agents --source src_001
research-notebook summarize nb_089_ai_support_agents --out notebook.md
```

Minimum viable UI after CLI validation:

- Notebook list with status, last refresh, source count, and confidence summary.
- Research question editor with scope, geography, device, and time-window controls.
- Source table with query, rank, source quality, fetch status, and include/exclude controls.
- Snippet board grouped by theme, source type, and confidence.
- Claim editor showing citations, confidence notes, contradictions, and gaps.
- Export to Markdown, JSON, and CSV.
