# Analyst Brief Generator

Analyst Brief Generator creates concise, source-backed briefs for market analysts, investors, strategy teams, and operators who need to understand a company, category, trend, or market event quickly. It combines live web discovery, rendered source collection, chatbot answers with sources, and a strict citation layer so every material claim can be traced back to evidence.

The first version is intentionally focused: given a research topic and a brief type, produce a short analyst-ready memo with cited findings, confidence levels, open questions, and an auditable source inventory.

## Problem

Analyst briefs are usually assembled from search results, company pages, news coverage, PDFs, blogs, and AI summaries under time pressure. The result can be useful, but it is often hard to audit: claims drift away from sources, snippets get treated as facts, and regional or device-specific evidence is missed.

This product turns Massive MCP into a repeatable brief factory that collects evidence, labels source quality, separates facts from interpretation, and exports a memo a human analyst can review rather than rebuild from scratch.

## Target Users

- Market intelligence teams preparing category or competitor briefs.
- Investors screening companies, sectors, and emerging trends.
- Corporate strategy teams tracking product, pricing, and market movement.
- Sales and customer teams preparing account or industry context.
- Communications and policy teams monitoring fast-moving narratives.

## Core Workflow

1. User enters a brief request:
   - topic, company, category, market, or event
   - brief type: company, category, competitor, trend, market event, or account context
   - geography, city, language, and device assumptions
   - required sections, excluded domains, and time window
   - preferred output format and citation style
2. App calls `account_status` and estimates quick, standard, or deep-run cost.
3. App generates discovery queries for primary sources, news, analyst commentary, competitor context, regulatory pages, and regional variants.
4. Massive MCP runs:
   - `web_search` with Google SERP parsing for source discovery and ranking metadata
   - `web_fetch` with JavaScript rendering for dynamic company pages, newsrooms, docs, PDFs, and market pages
   - captcha handling for public pages that block ordinary fetchers
   - country, city, and device targeting to reveal localized evidence
   - `ai_chat_completion` for sourced answer drafts, gap finding, synthesis, and brief generation
5. App normalizes all source evidence into a citation graph.
6. App drafts the analyst brief, then checks every material claim against cited evidence.
7. User receives Markdown, JSON, and optional CSV source exports.

## MVP Inputs

```json
{
  "topic": "AI coding assistant adoption in mid-market software teams",
  "brief_type": "trend",
  "audience": "strategy team",
  "time_window_days": 120,
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "must_include": [
    "market drivers",
    "vendor landscape",
    "buyer objections",
    "recent product launches",
    "risks and unknowns"
  ],
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
  "topic": "AI coding assistant adoption in mid-market software teams",
  "generated_at": "2026-05-02T12:00:00Z",
  "brief_type": "trend",
  "executive_summary": [
    {
      "claim": "Mid-market adoption appears to be moving from individual developer trials toward team-governed deployments.",
      "confidence": "medium",
      "citations": ["src_001", "src_004"]
    }
  ],
  "sections": [
    {
      "title": "Market Drivers",
      "findings": [
        {
          "claim": "Security review and codebase-context controls are recurring purchase criteria in recent vendor messaging.",
          "interpretation": "Governance is likely becoming a buying-team requirement rather than a late-stage objection.",
          "confidence": "medium",
          "citations": ["src_004", "src_009"]
        }
      ],
      "gaps": ["Need buyer interviews to validate budget ownership."]
    }
  ],
  "open_questions": [
    "Which functions own renewal and governance after developer-led adoption?"
  ],
  "source_inventory": [
    {
      "id": "src_001",
      "url": "https://www.examplevendor.com/blog/team-ai-coding",
      "title": "Team AI Coding Rollout",
      "source_type": "company_blog",
      "query": "AI coding assistant team adoption mid market",
      "rank": 3,
      "country": "us",
      "city": "San Francisco",
      "device": "desktop",
      "fetched_at": "2026-05-02T12:00:00Z"
    }
  ]
}
```

## Brief Sections

- Executive summary: 5-7 cited bullets with confidence labels.
- Situation snapshot: what is known, what changed recently, and why it matters.
- Evidence table: material claims, source IDs, source quality, and confidence.
- Market or company analysis: drivers, constraints, competitors, pricing, product movement, and buyer signals.
- Contradictions and gaps: conflicting sources, stale pages, missing primary evidence, and assumptions.
- Analyst takeaways: implications, watch items, and next research questions.
- Source inventory: every SERP result, fetched page, AI-answer source, query, rank, region, device, and fetch timestamp.

## Massive MCP Usage

- `account_status`: check credit availability and choose quick, standard, or deep mode.
- `web_search`: discover primary pages, news, market commentary, competitor content, regulatory sources, and recent updates.
- Google SERP parsing: preserve query, rank, title, snippet, URL, visible dates, and result type for audit trails.
- `web_fetch`: fetch and render source pages, including JavaScript-heavy sites, dynamic docs, newsrooms, PDFs, and localized pages.
- JavaScript rendering: capture content hidden from simple HTTP fetchers.
- Captcha handling: keep public-source collection resilient when pages challenge automated requests.
- Country, city, and device targeting: compare localized SERPs and page variants.
- `ai_chat_completion`: produce sourced synthesis, identify contradictions, draft brief sections, and run claim-source checks.

## Guardrails

- Do not present uncited claims as facts.
- Separate source-observed facts from analyst interpretation.
- Prefer primary and authoritative sources; label news, blogs, directories, chatbot answers, and syndicated pages.
- Preserve query, rank, fetch time, geography, device, and source type for each citation.
- Require at least one cited source for every material claim or move the claim to gaps.
- Mark stale, paywalled, inaccessible, contradictory, and region-specific evidence clearly.
- Do not provide investment, legal, medical, or financial advice; produce research context only.
- Cap confidence when evidence comes only from snippets, chatbot answers, or company-owned pages.

## First Build

Ship as a CLI:

```bash
analyst-brief build --input brief.json --out brief.md --json brief.json --sources sources.csv
```

Minimum viable UI after CLI validation:

- Brief setup form with topic, type, audience, geography, and depth.
- Source discovery preview with include, exclude, and refetch controls.
- Run status with estimated and actual credit usage.
- Brief viewer with citation drawer and source quality labels.
- Evidence table with claim-to-source mapping.
- Markdown, JSON, and CSV export.
