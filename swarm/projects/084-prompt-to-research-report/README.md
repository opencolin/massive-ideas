# Prompt-to-Research-Report Agent

Idea 84 is a prompt-to-research-report agent that turns a natural-language research request into a structured, cited report using live web evidence. It is designed for users who know the question they need answered but do not want to manually plan searches, open tabs, compare source quality, track citations, and format the final deliverable.

The first version accepts a single prompt, clarifies scope when needed, runs a quota-aware research workflow through Massive MCP, and returns a Markdown report where every material claim is backed by source evidence or explicitly marked as uncertain.

## Problem

Research prompts are easy to write but hard to execute well. A good report needs query planning, source discovery, rendered-page collection, source-quality judgment, contradiction checks, recency checks, and a citation map that survives synthesis. Generic chatbot answers can sound polished while hiding weak evidence, stale sources, or unsupported claims.

This agent makes the research process auditable. It records what was searched, what was fetched, what evidence supported each claim, and where the web evidence was insufficient.

## Target Users

- Founders and operators validating market, customer, or competitor questions.
- Product and growth teams turning ambiguous prompts into source-backed decisions.
- Analysts preparing first-pass research reports for internal review.
- Content and strategy teams collecting evidence before writing briefs, memos, or positioning.
- Sales and partnerships teams researching accounts, categories, or public signals.

## Core Workflow

1. User enters a plain-English research prompt and optional constraints.
2. App checks `account_status` and selects quick, standard, or deep research depth.
3. App converts the prompt into a research plan:
   - report objective
   - subquestions
   - required source types
   - search queries
   - geography, city, device, and recency assumptions
   - citation and confidence requirements
4. Massive MCP runs:
   - `web_search` with Google SERP parsing for source discovery
   - `web_fetch` with JavaScript rendering for pages, docs, pricing pages, newsrooms, and dynamic evidence
   - captcha handling for public pages that challenge basic fetchers
   - country, city, and device targeting for localized evidence
   - `ai_chat_completion` for sourced outline generation, synthesis, contradiction checks, and claim verification
5. App normalizes evidence into source records and claim records.
6. App drafts the report, then validates that material claims cite supporting evidence.
7. User receives a Markdown report, JSON evidence graph, and source inventory export.

## MVP Inputs

```json
{
  "prompt": "Research whether mid-market SaaS companies are adopting AI customer support agents in 2026, including drivers, objections, vendors, and proof points.",
  "audience": "product strategy team",
  "depth": "standard",
  "time_window_days": 180,
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "must_answer": [
    "What evidence suggests adoption is increasing?",
    "Which vendors are visible in the market?",
    "What objections or risks appear in credible sources?",
    "What remains uncertain?"
  ],
  "preferred_sources": ["vendor pages", "customer stories", "news", "industry analysis"],
  "exclude_domains": ["example.com"],
  "output": {
    "format": "markdown",
    "citation_style": "numbered"
  }
}
```

## MVP Output

```json
{
  "prompt": "Research whether mid-market SaaS companies are adopting AI customer support agents in 2026...",
  "generated_at": "2026-05-02T19:30:00Z",
  "research_depth": "standard",
  "report_title": "AI Customer Support Agent Adoption in Mid-Market SaaS",
  "executive_summary": [
    {
      "claim": "Public evidence suggests adoption is moving from experiments toward production customer-support workflows, but proof is stronger in vendor-owned sources than independent buyer data.",
      "confidence": "medium",
      "citations": ["src_003", "src_011", "src_018"]
    }
  ],
  "sections": [
    {
      "title": "Adoption Signals",
      "answer": "Vendor case studies, product launch pages, and recent news indicate growing use of AI agents for ticket deflection, routing, and self-service.",
      "claims": [
        {
          "claim": "Ticket deflection and faster response time are recurring value propositions across vendor and customer-story evidence.",
          "confidence": "medium",
          "citations": ["src_003", "src_007"]
        }
      ],
      "gaps": ["Need independent buyer survey data for adoption rate estimates."]
    }
  ],
  "contradictions": [
    {
      "issue": "Vendor adoption claims are stronger than independent market validation.",
      "citations": ["src_003", "src_018"],
      "resolution": "Report adoption as directional, not quantified."
    }
  ],
  "source_inventory": [
    {
      "id": "src_003",
      "url": "https://www.examplevendor.com/customers/saas-support-ai",
      "title": "SaaS Support AI Customer Story",
      "source_type": "company_customer_story",
      "query": "mid market SaaS AI customer support agent adoption customer story",
      "rank": 2,
      "country": "us",
      "city": "San Francisco",
      "device": "desktop",
      "fetched_at": "2026-05-02T19:30:00Z"
    }
  ]
}
```

## Report Template

- Title and prompt restatement.
- Method note: depth, geography, device, time window, and source count.
- Executive summary: 5-8 cited bullets with confidence labels.
- Direct answer: concise answer to the user's prompt.
- Evidence-backed sections: each subquestion answered with cited claims.
- Contradictions and caveats: conflicts, weak evidence, stale sources, and regional differences.
- What is still unknown: questions that public web evidence did not answer.
- Suggested next research: follow-up searches, interviews, datasets, or sources.
- Source inventory: every SERP result, fetched page, AI-answer source, query, rank, region, device, timestamp, and source-quality label.

## Massive MCP Fit

- `account_status`: verify credits and estimate cost before expanding a prompt into many searches.
- `web_search`: discover primary sources, news, commentary, reports, competitor pages, customer stories, and regional variants.
- Google SERP parsing: preserve query, rank, result type, snippet, visible date, and source metadata.
- `web_fetch`: collect rendered source pages, dynamic docs, newsrooms, pricing pages, PDFs, and JavaScript-heavy content.
- Captcha handling: classify public challenge pages and retry where allowed.
- Country, city, and device targeting: reveal localized SERPs and page variants.
- `ai_chat_completion`: generate research plans, synthesize cited answers, find contradictions, and verify claim-source alignment.

## Guardrails

- Every material claim must include citations or be moved to "unknowns."
- Separate observed facts from interpretation and recommendation.
- Prefer primary, authoritative, and independently verifiable sources.
- Label chatbot answers as research aids unless confirmed by fetched web evidence.
- Preserve search query, rank, URL, fetch timestamp, geography, device, and source type.
- Cap confidence when evidence comes only from snippets, company-owned sources, or stale pages.
- Make ambiguity explicit when prompts contain same-name entities, broad categories, or missing geography.
- Do not bypass authentication, paywalls, private data, robots restrictions, or site terms.
- Do not provide legal, medical, financial, or investment advice; produce research context only.

## First Build

Ship as a CLI:

```bash
research-report build --prompt "Research AI customer support agent adoption in mid-market SaaS" --depth standard --out report.md --json evidence.json --sources sources.csv
```

Minimum viable UI after CLI validation:

- Prompt box with optional audience, geography, recency, and depth controls.
- Research plan preview with editable subquestions and queries.
- Source discovery table with include, exclude, and refetch controls.
- Report viewer with citation drawer and source-quality badges.
- Evidence graph showing claim-to-source mapping.
- Markdown, JSON, and CSV export.
