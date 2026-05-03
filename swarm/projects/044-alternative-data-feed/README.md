# Alternative Data Feed

A source-backed feed that turns public web changes into market intelligence signals. The MVP watches job posts, pricing pages, product pages, docs, changelogs, and other public pages, then normalizes those observations into structured alternative data events for investors, strategy teams, and GTM operators.

## Problem

Teams want earlier indicators than quarterly reports, press releases, and analyst notes. Hiring plans, pricing changes, integration launches, new compliance pages, support docs, and regional landing pages often reveal business momentum before official announcements. The signals are public, but they are noisy, fragmented, rendered in JavaScript, region-specific, and hard to compare across companies.

This product creates a repeatable feed of observed web evidence and separates facts from interpretation.

## Target Users

- investors tracking public and private company momentum
- corporate strategy teams monitoring competitors and categories
- RevOps and sales teams looking for account expansion signals
- product marketers watching positioning, packaging, and launch motion
- data teams that need sourced, auditable web-derived features

## MVP Outcome

Given a watchlist of companies and signal definitions, produce a daily or weekly feed:

| Company | Signal | Observed fact | Interpretation | Confidence | Sources |
| --- | --- | --- | --- | --- | --- |
| Northstar AI | hiring expansion | 18 new enterprise support roles appeared across Austin and London | likely scaling post-sale enterprise motion | 0.84 | careers page, SERP jobs result |
| Acme Data | pricing change | Team plan price moved from $49 to $59 per seat | monetization or packaging test worth tracking | 0.91 | current pricing page, prior snapshot |
| BrightOps | product launch | New SAP integration page and implementation docs are live | enterprise integration roadmap is expanding | 0.78 | integration page, docs page |

Each feed item includes timestamped sources, extracted evidence, inferred significance, and a confidence score.

## Why Massive MCP

Massive MCP is the collection and reasoning layer for a product that depends on current, public, heterogeneous web evidence.

- `web_search`: discover job posts, new pricing pages, public docs, landing pages, and third-party indexed pages.
- Google SERP parsing: turn search result titles, snippets, URLs, dates, and ranking context into structured discovery evidence.
- `web_fetch`: fetch source pages with JavaScript rendering for modern careers pages, pricing calculators, docs, app directories, and comparison pages.
- Captcha handling: improve coverage on job boards, company sites, and pages that block simple scrapers.
- Country, city, and device targeting: detect regional pricing, local hiring, mobile-only experiences, and geo-specific landing pages.
- `ai_chat_completion`: extract normalized events, classify signal type, generate interpretations, and summarize evidence with citations.
- `account_status`: estimate and gate batch runs before crawling large watchlists.

## Signal Types

The MVP should support six initial alternative data signals:

- Hiring velocity: new roles, removed roles, department concentration, seniority mix, location expansion, first-time roles.
- Pricing and packaging: price changes, plan changes, free-trial changes, limits, feature gating, contact-sales movement.
- Product surface area: new pages, integrations, docs, changelog items, SDKs, API references, templates.
- Market expansion: region pages, language pages, local case studies, office pages, geo-specific hiring.
- GTM positioning: homepage copy changes, comparison pages, industry pages, partner pages, customer logos.
- Operational signals: status incidents, support docs, security pages, trust center updates, compliance claims.

## Core Workflow

1. Ingest watchlist:
   - company name, domain, category, public/private flag, ticker if applicable, peer group, tracked regions.
2. Expand source map:
   - careers, pricing, docs, blog, changelog, status, trust, integrations, app marketplace, SERP queries.
3. Estimate run cost and check `account_status`.
4. Discover candidate URLs with `web_search` and Google SERP parsing.
5. Fetch known and discovered URLs with `web_fetch`, JS rendering, captcha handling, and geo/device targeting.
6. Extract page facts:
   - visible text, structured entities, prices, roles, locations, dates, plans, product names, source metadata.
7. Compare against prior snapshots:
   - additions, removals, field-level changes, repeated observations, suspected noise.
8. Classify events with `ai_chat_completion`:
   - signal type, observed fact, interpretation, confidence, materiality, disqualifiers.
9. Score and publish:
   - feed records, JSON feature table, Markdown digest, CSV export, and raw evidence archive.

## MVP Scope

### In Scope

- watchlist CSV or JSON input
- configurable signal definitions and source types
- SERP discovery for unknown public pages
- rendered fetch of known company pages
- snapshot storage and diffing
- structured event extraction with source citations
- confidence and materiality scoring
- Markdown, JSON, and CSV outputs
- explicit separation of observed fact, inference, and unsupported gaps

### Out of Scope

- authenticated scraping or private data access
- investment recommendations or trading signals
- direct broker, CRM, or data warehouse integrations
- long-term backtesting infrastructure
- social media firehose ingestion
- claims based only on model memory

## Data Model

```json
{
  "company": {
    "name": "Northstar AI",
    "domain": "northstar.example",
    "category": "enterprise AI support",
    "watchlist": "ai-infrastructure-peers"
  },
  "event": {
    "event_id": "evt_2026_05_02_northstar_hiring_001",
    "signal_type": "hiring_velocity",
    "observed_at": "2026-05-02T16:30:00Z",
    "observed_fact": "Careers page lists 18 open enterprise support roles across Austin and London.",
    "interpretation": "The company may be expanding post-sale enterprise support capacity.",
    "materiality": "medium",
    "confidence": 0.84
  },
  "features": {
    "role_count": 18,
    "new_role_count": 11,
    "locations": ["Austin", "London"],
    "departments": ["Customer Support", "Solutions"]
  },
  "sources": [
    {
      "url": "https://northstar.example/careers",
      "source_type": "careers_page",
      "fetched_at": "2026-05-02T16:29:20Z",
      "evidence": "Enterprise Support Engineer - Austin"
    }
  ],
  "lineage": {
    "discovered_by": "web_search",
    "collected_by": "web_fetch",
    "classified_by": "ai_chat_completion",
    "previous_snapshot_id": "snap_2026_04_25_northstar_careers"
  }
}
```

## Scoring

Default signal score is 100 points:

- recency: 0-20
- source reliability: 0-20
- change magnitude: 0-20
- category relevance: 0-15
- repeat confirmation: 0-15
- actionability: 0-10

Scores should be persona-specific. An investor may upweight hiring velocity, pricing, and product expansion. A product marketer may upweight positioning, comparison pages, and integration launches. A RevOps team may upweight territory hiring and customer-facing support changes.

## CLI Sketch

```bash
altdata-feed run --watchlist companies.csv --config config.investor.yaml --days 7
altdata-feed report --run latest --format markdown --out reports/weekly-feed.md
altdata-feed export --run latest --format json --out exports/events.json
altdata-feed features --run latest --out exports/company_features.csv
```

## Risks

- Public page changes can be cosmetic, temporary, or caused by experiments.
- Job posts can be evergreen, duplicated, aggregated, or reposted.
- Regional targeting can reveal different prices or pages that are not globally representative.
- Company names and domains can collide across subsidiaries or similarly named brands.
- Some source pages may block fetching, require JS, or present captcha challenges.
- Alternative data users may overinterpret weak signals; the product must preserve uncertainty.

## Build Plan

1. Build a local CLI with `run`, `report`, `export`, and `features` commands.
2. Define watchlist, source map, snapshot, event, and feature schemas.
3. Add Massive MCP adapters for `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.
4. Implement source discovery and rendered fetch collection.
5. Implement diffing for job, pricing, page, and positioning facts.
6. Add strict event extraction prompts that require source-backed observed facts.
7. Evaluate on a hand-labeled watchlist of companies across three categories.
