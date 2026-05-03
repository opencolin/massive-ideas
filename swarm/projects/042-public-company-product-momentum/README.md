# Public Company Product Momentum Tracker

Public Company Product Momentum Tracker measures how quickly public companies are shipping, repositioning, and promoting products by combining public web signals into a source-backed momentum score. It helps investors, corporate strategy teams, product marketers, and sales leaders spot where a public company is increasing product velocity before that activity is obvious in earnings commentary.

The first version is intentionally narrow: track a watchlist of public companies, collect product launch and positioning signals from public web sources, classify the evidence, and produce a ranked weekly momentum report with links, excerpts, and confidence.

## Target User

Primary users:

- Public market investors monitoring product execution and category expansion.
- Corporate strategy teams watching peer launches and roadmap direction.
- Product marketers tracking how competitors package, promote, and name new offerings.
- Sales and partnerships teams looking for recent public product proof points.
- Analysts building repeatable product-momentum notes across a coverage universe.

## Core Workflow

1. User submits a tracking brief:
   - Public companies, ticker symbols, and domains
   - Product categories, keywords, and exclusions
   - Countries, cities, devices, and cadence
   - Signal weights and alert thresholds
2. App checks run feasibility and credit budget with `account_status`.
3. App uses `web_search` to find recent product pages, docs, launch posts, changelogs, newsroom items, app marketplace pages, and Google SERP evidence.
4. App uses `web_fetch` with JS rendering, captcha handling, and geo/device targeting to collect source pages and visible product evidence.
5. App extracts launches, feature expansions, renamed products, integrations, developer docs, pricing/package changes, and release cadence signals.
6. App uses `ai_chat_completion` to classify signal type, novelty, business relevance, and confidence from the collected sources.
7. User receives a ranked report with company momentum scores, evidence, trend drivers, warnings, and follow-up questions.

## MVP Inputs

```json
{
  "watchlist": [
    {
      "company": "Adobe",
      "ticker": "ADBE",
      "domain": "adobe.com",
      "categories": ["creative software", "generative ai", "document cloud"]
    },
    {
      "company": "Salesforce",
      "ticker": "CRM",
      "domain": "salesforce.com",
      "categories": ["crm", "ai agents", "data cloud"]
    }
  ],
  "lookback_days": 30,
  "geo": {
    "country": "us",
    "city": "New York",
    "device": "desktop"
  },
  "cadence": "weekly",
  "signal_weights": {
    "new_product_launch": 30,
    "major_feature_release": 20,
    "developer_or_api_release": 15,
    "integration_or_partner_release": 15,
    "pricing_or_packaging_change": 10,
    "search_visibility_gain": 10
  },
  "exclude_terms": ["investor relations", "earnings call", "jobs", "support outage"]
}
```

## MVP Output

```json
{
  "run_id": "product-momentum-2026-05-02",
  "summary": "Adobe showed the strongest product momentum, led by new AI creative workflow pages, documentation updates, and launch coverage. Salesforce had moderate momentum from agent and data-cloud releases.",
  "rankings": [
    {
      "company": "Adobe",
      "ticker": "ADBE",
      "momentum_score": 82,
      "trend": "accelerating",
      "confidence": "high",
      "top_drivers": [
        "New generative AI product pages",
        "Fresh API documentation",
        "Multiple launch announcements in the last 30 days"
      ],
      "signals": [
        {
          "signal_type": "new_product_launch",
          "title": "Adobe launches new AI-assisted creative workflow",
          "observed_at": "2026-05-02T16:30:00Z",
          "source_url": "https://www.adobe.com/example-product",
          "evidence_excerpt": "New AI-assisted creative workflow for design teams",
          "confidence": "high",
          "score_impact": 24
        }
      ],
      "recommended_follow_up": "Review product pages and docs for packaging changes that may affect competitive messaging."
    }
  ],
  "warnings": []
}
```

## Signal Types

The tracker separates product momentum from generic corporate noise:

- `new_product_launch`
- `major_feature_release`
- `developer_or_api_release`
- `integration_or_partner_release`
- `pricing_or_packaging_change`
- `product_page_refresh`
- `docs_or_changelog_activity`
- `marketplace_or_app_listing_change`
- `search_visibility_gain`
- `customer_story_with_new_product`
- `regional_product_expansion`
- `cosmetic_or_corporate_noise`

## Scoring

Momentum scores are 0-100:

- 30 points: new product, major module, or named launch.
- 20 points: substantial feature release, product page expansion, or product-line repositioning.
- 15 points: developer documentation, API, SDK, changelog, or integration activity.
- 15 points: third-party marketplace, partner, or ecosystem evidence.
- 10 points: pricing, packaging, trial, or plan changes tied to a product.
- 10 points: search visibility and source diversity across SERP, company site, docs, and launch coverage.

Automatic caps:

- Cap at 70 when evidence comes from only one source type.
- Cap at 65 when sources are stale, undated, or outside the lookback window.
- Cap at 60 when pages could not be rendered with the requested geo or device target.
- Cap at 50 when the signal is mostly marketing copy without product-specific evidence.
- Cap at 40 when the signal is likely investor relations, hiring, generic thought leadership, or cosmetic page churn.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
product-momentum-tracker run \
  --brief product-momentum-brief.json \
  --snapshot-dir snapshots \
  --out product-momentum-report.json \
  --report-md product-momentum-report.md \
  --signals-csv product-momentum-signals.csv
```

Minimum viable UI after CLI validation:

- Watchlist setup with company, ticker, domain, and category fields
- Geo, city, device, cadence, and lookback controls
- Credit estimate preview
- Company ranking table with score changes over time
- Evidence drawer with source URLs, excerpts, and fetch metadata
- Signal filters by launch, docs, integration, pricing, SERP, and noise
- Export buttons for JSON, CSV, and Markdown
