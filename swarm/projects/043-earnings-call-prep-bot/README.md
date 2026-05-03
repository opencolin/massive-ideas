# Earnings Call Prep Bot

Earnings Call Prep Bot creates a sourced briefing for investors, analysts, executives, and communications teams before a public company earnings call. It pulls recent product launches, pricing changes, customer signals, executive commentary, competitive news, regulatory context, and market coverage into a concise prep pack.

The first version is intentionally narrow: given one public company and an upcoming or recent earnings date, produce a briefing that separates reported facts from likely discussion themes and ties every claim to source evidence.

## Problem

Earnings prep usually means scanning investor relations pages, transcripts, company blogs, product pages, news, analyst notes, app stores, social chatter, and competitor announcements under time pressure. Important product or news context is easy to miss, especially when it lives on JavaScript-heavy pages or in localized search results.

This bot gives the user a repeatable source-backed brief with the likely call topics, recent product context, and questions worth asking.

## Target Users

- Public-market investors preparing for earnings calls.
- Investor relations and communications teams building executive prep.
- Corporate strategy teams tracking competitors before call cycles.
- Product marketing teams watching how launches may enter market narratives.
- Sales and customer teams preparing account-specific executive updates.

## Core Workflow

1. User enters a company brief:
   - company name, ticker, investor relations URL, and earnings date
   - fiscal quarter or period
   - competitor list
   - products, segments, or geographies to watch
   - country, city, and device context for localized search and rendering
   - preferred output format
2. App checks `account_status` and estimates collection cost.
3. App builds discovery queries for investor relations, earnings materials, product updates, press releases, news, analyst coverage, competitor moves, and regulatory issues.
4. Massive MCP runs:
   - `web_search` with Google SERP parsing for recent news and source discovery
   - `web_fetch` with JavaScript rendering for IR pages, product pages, newsroom pages, app pages, and dynamic blogs
   - captcha handling for public pages that block simple fetchers
   - country, city, and device targeting for localized SERPs, product pages, pricing, and regulatory coverage
   - `ai_chat_completion` to extract facts, cluster themes, draft call questions, and cite sources
5. App ranks sources by recency, authority, relevance to the quarter, and evidence quality.
6. User receives a Markdown and JSON prep pack with facts, themes, risks, questions, and source inventory.

## MVP Inputs

```json
{
  "company": {
    "name": "ExampleCloud",
    "ticker": "EXCL",
    "ir_url": "https://investors.examplecloud.com",
    "website": "https://www.examplecloud.com"
  },
  "period": {
    "fiscal_quarter": "Q1 FY2026",
    "earnings_date": "2026-05-08",
    "lookback_days": 90
  },
  "watch_topics": [
    "AI product launches",
    "enterprise pricing",
    "international expansion",
    "security incidents",
    "large customer wins"
  ],
  "competitors": ["SampleStack", "Northstar Apps"],
  "geo": {
    "country": "us",
    "city": "New York",
    "device": "desktop"
  }
}
```

## MVP Output

```json
{
  "company": "ExampleCloud",
  "ticker": "EXCL",
  "generated_at": "2026-05-02T12:00:00Z",
  "period": "Q1 FY2026",
  "executive_summary": "ExampleCloud entered the call cycle with three AI product announcements, a packaging change for enterprise customers, and elevated media attention around European expansion.",
  "themes": [
    {
      "theme": "AI product monetization",
      "why_it_matters": "Recent launch language emphasizes paid enterprise workflow features rather than free experimentation.",
      "confidence": "high",
      "facts": [
        {
          "claim": "ExampleCloud announced an enterprise AI workflow add-on during the quarter.",
          "source_url": "https://www.examplecloud.com/news/ai-workflow-add-on",
          "source_type": "company_newsroom",
          "published_at": "2026-04-12"
        }
      ],
      "suggested_questions": [
        "What early adoption signals are you seeing for the new AI workflow add-on?"
      ]
    }
  ],
  "product_timeline": [
    {
      "date": "2026-04-12",
      "event": "Enterprise AI workflow add-on announced",
      "impact": "Potential upsell and attach-rate discussion point",
      "sources": ["https://www.examplecloud.com/news/ai-workflow-add-on"]
    }
  ],
  "risk_watch": [
    {
      "risk": "European expansion may require higher go-to-market investment.",
      "evidence": "Company opened localized hiring and pricing pages for Germany and France.",
      "confidence": "medium",
      "sources": ["https://www.examplecloud.com/careers"]
    }
  ],
  "source_inventory": []
}
```

## Brief Sections

- Executive summary: 5-8 bullets on the likely call narrative.
- Product timeline: launches, feature updates, pricing changes, packaging, integrations, and roadmap hints.
- News context: recent coverage, customer wins, incidents, partnerships, regulatory items, and market events.
- Competitive context: competitor launches, positioning changes, pricing shifts, and category narratives.
- Management watch: recent executive interviews, conference appearances, and public comments.
- Question bank: questions for analysts, executives, or internal prep.
- Source inventory: every source with URL, title, type, publish date, fetch time, SERP query, rank, geo, and device.

## Massive MCP Usage

- `account_status`: preflight credit availability and choose quick, standard, or deep prep mode.
- `web_search`: discover recent company, product, competitor, regulatory, and market coverage.
- Google SERP parsing: preserve query, rank, title, snippet, URL, and result type for auditability.
- `web_fetch`: fetch investor relations pages, press releases, dynamic product pages, blogs, transcripts, and news pages.
- JavaScript rendering: handle modern IR sites, newsroom indexes, docs, product comparison pages, and app marketplaces.
- Captcha handling: improve collection resilience for public sources that challenge automated traffic.
- Country, city, and device targeting: detect localized product, pricing, regulatory, and search-result differences.
- `ai_chat_completion`: extract evidence-backed facts, cluster themes, draft questions, and produce the final brief.

## Guardrails

- Do not invent financial estimates, ratings, or trading advice.
- Separate observed facts from interpretation and likely call themes.
- Prefer primary sources for company claims and clearly label news, analyst, and third-party sources.
- Preserve publish date, fetch date, query, rank, geo, and device context for every cited source.
- Treat unsourced or weakly sourced claims as review notes, not facts.
- Mark stale, syndicated, paywalled, region-specific, and ambiguous sources clearly.
- Do not claim causal impact on revenue, margins, or guidance unless management or filings state it directly.

## First Build

Ship as a CLI:

```bash
earnings-prep build --brief brief.json --out prep.md --json prep.json
```

Minimum viable UI after CLI validation:

- Company and earnings-period setup form
- Discovery preview with included and excluded sources
- Run status with credit estimate
- Brief viewer with source drawer
- Product timeline and question bank tabs
- Markdown and JSON export
