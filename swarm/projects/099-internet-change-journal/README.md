# Internet Change Journal

Internet Change Journal tracks how a page, category, brand, or search result set evolves week by week. It turns recurring web scans into a dated journal of public internet changes: copy edits, page launches, category reshuffles, pricing-message shifts, SERP movement, screenshots or rendered-page evidence, and sourced analyst summaries.

The first version focuses on a small watchlist of brands and page groups. It uses Massive MCP to discover URLs, fetch JavaScript-rendered pages, handle captcha states, target country, city, and device variants, parse Google SERPs, and summarize meaningful weekly deltas with source links.

## Target Users

- Founders watching competitor positioning, landing pages, categories, and feature launches.
- Product marketers tracking how a category narrative changes over time.
- Analysts building public-web change logs for brands, vendors, or markets.
- SEO teams monitoring search-result movement and snippet changes.
- Sales and customer success teams watching account pages, pricing pages, partner pages, or public docs.
- Investors tracking brand momentum, hiring pages, product pages, and market-message shifts.

## Core Workflow

1. User creates a journal:
   - Brands, domains, categories, seed queries, or specific URLs
   - Country, city, and device targeting
   - Weekly scan cadence
   - Change types to watch, such as copy, layout, pricing language, navigation, SERP rank, or new pages
2. App calls `account_status` to estimate scan cost and available credits.
3. Massive MCP discovers and validates targets:
   - `web_search` for brand, category, and Google SERP snapshots
   - `web_fetch` for known pages and discovered URLs with JS rendering and captcha handling
4. App stores normalized weekly snapshots with raw evidence and fetch metadata.
5. App compares the latest snapshot with the prior comparable snapshot.
6. `ai_chat_completion` classifies deltas, suppresses noise, and writes a sourced weekly journal entry.
7. User reviews a timeline of changes by brand, page, category, or query.

## MVP Inputs

```json
{
  "journal_name": "AI support category watch",
  "cadence": "weekly",
  "targets": [
    {
      "label": "Intercom Fin",
      "brand": "Intercom",
      "domains": ["intercom.com"],
      "known_urls": ["https://www.intercom.com/fin"],
      "seed_queries": ["Intercom AI customer support", "Intercom Fin pricing"]
    },
    {
      "label": "Category SERP",
      "category": "AI customer support",
      "seed_queries": ["best AI customer support software"]
    }
  ],
  "markets": [
    {
      "country": "us",
      "city": "San Francisco",
      "device": "desktop"
    },
    {
      "country": "us",
      "city": "San Francisco",
      "device": "mobile"
    }
  ],
  "watch_rules": {
    "copy_changes": true,
    "new_or_removed_pages": true,
    "serp_rank_changes": true,
    "pricing_language": true,
    "navigation_changes": true,
    "minimum_change_score": 0.35
  },
  "fetch_options": {
    "render_js": true,
    "handle_captcha": true,
    "extract_main_content": true
  }
}
```

## MVP Output

```json
{
  "run_id": "internet-change-journal-2026-w18-ai-support",
  "journal_name": "AI support category watch",
  "period": {
    "current_week": "2026-W18",
    "previous_week": "2026-W17"
  },
  "summary": "Intercom emphasized Fin for support teams more prominently this week, while the category SERP added one new comparison article in the top five. No pricing-language change crossed the alert threshold.",
  "entries": [
    {
      "entry_id": "intercom-fin-copy-2026-w18",
      "target_label": "Intercom Fin",
      "change_type": "copy_change",
      "severity": "medium",
      "headline": "Hero copy shifted toward resolution rate claims",
      "what_changed": "The page's lead messaging added a stronger outcome-oriented claim and moved AI agent language higher in the page.",
      "previous_evidence_url": "https://www.intercom.com/fin",
      "current_evidence_url": "https://www.intercom.com/fin",
      "confidence": "medium"
    },
    {
      "entry_id": "ai-support-serp-2026-w18",
      "target_label": "Category SERP",
      "change_type": "serp_change",
      "severity": "low",
      "headline": "New comparison article entered the top five",
      "what_changed": "A newly discovered vendor-comparison page ranked fourth for the tracked query on desktop in San Francisco.",
      "evidence_urls": ["https://example.com/ai-support-comparison"],
      "confidence": "high"
    }
  ],
  "snapshot_counts": {
    "pages_fetched": 8,
    "queries_checked": 3,
    "blocked_or_partial": 1,
    "material_changes": 2
  }
}
```

## Tracking Dimensions

Each snapshot preserves:

- Journal name, target label, brand, category, URL, query, and scan week.
- Requested URL, final URL, fetch timestamp, HTTP status where available, redirect state, render mode, captcha status, and extraction confidence.
- Country, city, and device for every fetch and search request.
- Page title, meta description, headings, primary navigation text, main content excerpt, structured links, visible calls to action, and pricing or plan language when present.
- Google SERP rank, title, URL, domain, snippet, result type, and local or device context.
- Change type, old value, new value, similarity score, change score, severity, and evidence URLs.
- Source lineage separating known URL fetches, discovered pages, search snippets, and AI-generated summaries.

## First Build

Ship as a small CLI plus static report generator:

```bash
internet-change-journal scan \
  --journal fixtures/ai-support-category.json \
  --out reports/2026-W18.json
```

Minimum viable UI:

- Journal setup form for brands, URLs, categories, queries, markets, devices, and watch rules.
- Account status and estimated-credit panel before each weekly scan.
- Source discovery table showing known URLs, newly discovered URLs, and SERP results.
- Snapshot comparison view with prior/current excerpts side by side.
- Weekly journal timeline grouped by brand, page, category, or query.
- Evidence drawer with fetched excerpts, SERP snippets, final URLs, timestamps, and captcha/rendering notes.
- JSON, Markdown, and CSV exports for reporting or downstream analysis.

## Massive MCP Usage

- `account_status`: quota preflight and scan-cost gating.
- `web_search`: discover new pages, track category SERPs, preserve Google rank and snippet movement.
- Google SERP parsing: capture ranked result changes, titles, snippets, domains, and result features.
- `web_fetch`: fetch known and discovered pages with JS rendering, captcha handling, country/city/device targeting, final URL tracking, and extracted content.
- `ai_chat_completion`: classify deltas, group noisy edits into meaningful change themes, write weekly summaries, and generate sourced journal entries.
- Chatbot answers with sources: explain category or brand movement only when backed by preserved search or fetch evidence.

## Guardrails

- Do not treat every text diff as material; suppress boilerplate, cookie banners, timestamps, stock tickers, legal footers, and unrelated carousel churn.
- Keep search-result evidence separate from fetched-page evidence.
- Always preserve prior and current evidence URLs before producing a journal entry.
- Label blocked, captcha, redirected, partial, stale, localized, and device-specific snapshots.
- Compare only like-for-like snapshots by target, country, city, device, and source type unless the report explicitly says otherwise.
- Require human-readable rationale for every medium or high severity change.
- Store raw extracted text before normalization or AI summarization.
