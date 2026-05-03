# Review Mining Bot

Review Mining Bot turns public customer reviews from G2, Capterra, app stores, and browser extension stores into source-backed product insights. It helps product, marketing, success, and sales teams understand what users praise, complain about, compare against, and repeatedly request across review surfaces.

The first version is intentionally narrow: mine one product or competitor set across a bounded list of review sources and produce an evidence-backed theme report.

## Target User

Primary users:

- Product managers looking for recurring customer pain and feature requests.
- Product marketers extracting competitive proof points and objections.
- Customer success leaders tracking sentiment by segment, platform, or geography.
- Founders validating whether public review complaints match their roadmap bets.
- Sales enablement teams turning competitor reviews into battlecard evidence.

## Core Workflow

1. User enters a mining brief:
   - Product or company name
   - Domain or app listing URLs, when known
   - Competitors to compare
   - Target sources
   - Geography, language, and device context
   - Topic filters such as onboarding, pricing, support, reliability, integrations, or AI features
2. App discovers review and marketplace pages using `web_search` with Google SERP parsing.
3. Massive MCP runs:
   - `account_status` to estimate available crawl and synthesis capacity
   - `web_search` for review pages, app listings, extension listings, alternatives, and complaint queries
   - `web_fetch` with JS rendering for review pages that load content dynamically
   - captcha handling for review platforms that challenge automated browsing
   - country, city, and device targeting for localized app-store and search surfaces
   - `ai_chat_completion` to extract themes, quotes, sentiment, feature mentions, and source-grounded summaries
4. App normalizes review snippets, ratings, dates, products, reviewers, source URLs, and source types.
5. AI clusters evidence into themes with sentiment, frequency, confidence, and representative review excerpts.
6. User gets a review insight report, competitor comparison, and exportable evidence table.

## MVP Inputs

```json
{
  "workspace": "Acme Product Team",
  "product": {
    "name": "ExampleCRM",
    "domain": "example-crm.com",
    "known_urls": [
      "https://www.g2.com/products/examplecrm/reviews",
      "https://apps.apple.com/us/app/examplecrm/id123456789"
    ]
  },
  "competitors": ["CompetitorCRM", "OtherPipeline"],
  "sources": ["g2", "capterra", "apple_app_store", "google_play", "chrome_web_store"],
  "geo": {
    "country": "us",
    "city": "New York",
    "device": "desktop"
  },
  "topics": ["pricing", "onboarding", "support", "integrations", "mobile app", "AI features"],
  "date_range": {
    "from": "2025-01-01",
    "to": "2026-05-02"
  },
  "languages": ["en"]
}
```

## MVP Output

```json
{
  "product": "ExampleCRM",
  "generated_at": "2026-05-02T12:00:00Z",
  "source_summary": {
    "reviews_found": 428,
    "reviews_used": 160,
    "sources": ["g2", "capterra", "apple_app_store", "chrome_web_store"]
  },
  "insight_summary": "Users consistently praise setup speed and CRM integrations, but complaints cluster around mobile reliability, opaque add-on pricing, and delayed support responses.",
  "themes": [
    {
      "theme": "Mobile reliability",
      "sentiment": "negative",
      "frequency": 34,
      "affected_sources": ["apple_app_store", "google_play"],
      "representative_evidence": [
        {
          "excerpt": "Mobile sync often fails after updating deals.",
          "rating": 2,
          "review_date": "2026-03-18",
          "source_url": "https://apps.apple.com/us/app/examplecrm/id123456789",
          "source_type": "apple_app_store"
        }
      ],
      "confidence": "high",
      "recommended_action": "Investigate mobile sync regressions and update release notes for recent fixes."
    }
  ],
  "competitor_comparison": [
    {
      "competitor": "CompetitorCRM",
      "relative_strength": "support responsiveness",
      "relative_weakness": "setup complexity",
      "evidence_count": 19
    }
  ],
  "alerts": [
    "Pricing complaints increased in the last 90 days across G2 and Capterra."
  ]
}
```

## Theme Scoring

Theme scores are 0-100:

- 30 points: frequency across unique reviews and source pages.
- 20 points: source diversity across G2, Capterra, app stores, and extension stores.
- 20 points: recency, favoring reviews from the last 6-12 months.
- 15 points: sentiment strength and specificity.
- 10 points: reviewer or context quality, when publicly available.
- 5 points: competitor relevance or repeated comparison language.

Automatic caps:

- Cap at 65 when a theme comes from one source only.
- Cap at 55 when evidence is older than 18 months.
- Cap at 45 when reviews are vague, duplicated, or likely syndicated.
- Cap at 35 when the source page could not be fetched and only a SERP snippet is available.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
review-miner run \
  --brief review-brief.json \
  --out insights.json \
  --evidence reviews.csv \
  --report review-report.md
```

Minimum viable UI after CLI validation:

- Mining brief setup form
- Source discovery preview
- Run status with credit estimate
- Theme table with sentiment, frequency, and confidence
- Review evidence drawer with URL lineage
- Competitor comparison view
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: preflight credits, quota, and run budget before discovery and fetch steps.
- `web_search`: discover public review pages, marketplace listings, complaint queries, app names, extension names, and competitor review pages.
- Google SERP parsing: preserve rank, title, snippet, URL, query, and source classification.
- `web_fetch`: fetch review pages and listing pages with JS rendering, captcha handling, and extraction of visible review content.
- Country, city, and device targeting: compare localized app store results, mobile-visible pages, and geography-sensitive review pages.
- `ai_chat_completion`: normalize reviews, classify topics, cluster themes, compare competitors, and generate source-grounded summaries.

## Guardrails

- Do not bypass logins, paywalls, or platform terms that restrict review access.
- Never fabricate review quotes; every excerpt must map to a fetched page or SERP snippet.
- Keep exact review text, AI summaries, and inferred themes separate.
- Preserve source URL, fetch timestamp, query, rank, platform, rating, date, and locale for every evidence item.
- Treat reviewer identity as optional context only; avoid collecting unnecessary personal data.
- Deduplicate syndicated reviews and repeated app-store localization mirrors.
- Mark confidence low when a source only exposes partial snippets or heavily paginated dynamic content.
