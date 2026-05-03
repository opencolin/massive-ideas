# Market Entrant Monitor

Market Entrant Monitor answers the recurring strategy question, "Who is entering this market?" It watches public web signals for new companies, product lines, regional launches, and repositioned incumbents, then produces a source-backed entrant digest for market researchers, founders, investors, and competitive intelligence teams.

The MVP is intentionally narrow: start from a market definition, search the live web for recent entrant evidence, verify pages with rendered fetches, classify entrant type and confidence, and output a ranked report with citations and warnings.

## Target Users

- Strategy and corporate development teams tracking category threats.
- Founders watching new competitors, adjacent products, and regional copycats.
- Investors mapping emerging markets before obvious funding rounds.
- Product marketers monitoring new positioning and launch narratives.
- Sales leaders spotting new vendors entering customer accounts or geographies.

## Core Workflow

1. User submits a market brief:
   - Market name, category keywords, jobs-to-be-done, and exclusions
   - Known competitors, incumbents, and adjacent categories
   - Countries, cities, devices, languages, and monitoring cadence
   - Lookback window, source preferences, and alert thresholds
2. App checks run feasibility and budget with `account_status`.
3. App uses `web_search` with Google SERP parsing to find recent launch, comparison, directory, marketplace, funding, and product-page evidence.
4. App uses `web_fetch` with JavaScript rendering, captcha handling, and geo/device targeting to verify each source and extract visible evidence.
5. App detects new entrant candidates, deduplicates aliases and domains, and separates true entrants from incumbents, affiliates, resellers, agencies, and generic content.
6. App uses `ai_chat_completion` to classify entrant type, product relevance, novelty, market fit, and source-grounded confidence.
7. User receives a ranked digest with entrant profiles, evidence excerpts, source URLs, warnings, and recommended follow-up research.

## MVP Inputs

```json
{
  "market": {
    "name": "AI customer support agents for ecommerce",
    "category_keywords": ["ai customer support", "ecommerce helpdesk", "shopify support automation"],
    "jobs_to_be_done": ["answer customer questions", "deflect tickets", "automate returns"],
    "exclude_terms": ["call center hiring", "generic chatbot", "internal support team"]
  },
  "known_players": [
    {
      "name": "Gorgias",
      "domain": "gorgias.com",
      "role": "incumbent"
    },
    {
      "name": "Intercom",
      "domain": "intercom.com",
      "role": "adjacent_incumbent"
    }
  ],
  "lookback_days": 30,
  "geo": {
    "country": "us",
    "city": "New York",
    "device": "desktop",
    "language": "en"
  },
  "cadence": "weekly",
  "min_confidence": "medium",
  "alert_thresholds": {
    "new_company_score": 70,
    "incumbent_expansion_score": 75,
    "regional_entry_score": 65
  }
}
```

## MVP Output

```json
{
  "run_id": "market-entrant-monitor-2026-05-02",
  "market": "AI customer support agents for ecommerce",
  "summary": "Three likely entrants appeared in the last 30 days: one startup with a new Shopify-focused product page, one incumbent expanding into automated returns, and one regional launch in the US market.",
  "entrants": [
    {
      "company": "ExampleAgent",
      "domain": "exampleagent.ai",
      "entrant_type": "new_company",
      "entry_score": 84,
      "confidence": "high",
      "first_seen_at": "2026-05-02T15:40:00Z",
      "market_fit": "Directly targets Shopify merchants with AI ticket deflection and returns automation.",
      "top_evidence": [
        {
          "source_type": "product_page",
          "url": "https://exampleagent.ai/shopify",
          "title": "AI support agent for Shopify stores",
          "excerpt": "Automate ecommerce support, returns, and order-status questions with an AI agent trained on your store policies.",
          "observed_at": "2026-05-02T15:40:00Z"
        }
      ],
      "recommended_follow_up": "Check funding, customer logos, and app marketplace reviews before treating this as a high-priority threat."
    }
  ],
  "suppressed_candidates": [
    {
      "name": "Example BPO",
      "reason": "agency_or_service_provider_not_product_entrant"
    }
  ],
  "warnings": []
}
```

## Entrant Types

- `new_company`
- `new_product_line`
- `incumbent_expansion`
- `regional_entry`
- `vertical_entry`
- `marketplace_entry`
- `open_source_or_developer_entry`
- `funded_entrant`
- `stealth_or_waitlist_signal`
- `reseller_or_agency_noise`
- `content_only_noise`
- `stale_or_duplicate_signal`

## Scoring

Entry scores are 0-100:

- 25 points: clear product-market match to the user-defined category and jobs-to-be-done.
- 20 points: strong novelty evidence, such as recent launch language, first-seen domain, app listing, funding post, or new product page.
- 15 points: source quality from official pages, marketplaces, docs, funding announcements, or reputable coverage.
- 15 points: independent corroboration across SERP, product page, marketplace, docs, review site, or launch coverage.
- 10 points: geo, vertical, or buyer specificity that matches the monitoring brief.
- 10 points: traction proxy, such as customer logos, reviews, changelog activity, community mentions, or partner pages.
- 5 points: confidence in company identity, domain ownership, and relationship to known players.

Automatic caps:

- Cap at 75 when there is only one source type.
- Cap at 70 when the entrant is an incumbent expansion rather than a new company.
- Cap at 65 when the source is undated or outside the lookback window.
- Cap at 60 when JavaScript rendering, captcha handling, or geo targeting failed.
- Cap at 50 when evidence is mostly SEO content without a concrete product, listing, launch, or docs page.
- Cap at 40 for agencies, resellers, job posts, listicles, directories without source confirmation, or generic thought leadership.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
market-entrant-monitor run \
  --brief market-brief.json \
  --snapshot-dir snapshots \
  --out entrant-report.json \
  --report-md entrant-report.md \
  --entrants-csv entrant-candidates.csv
```

Minimum viable UI after CLI validation:

- Market brief setup with keywords, jobs-to-be-done, exclusions, and known players
- Geo, city, language, device, cadence, and lookback controls
- Credit estimate preview
- Entrant ranking table with type, score, confidence, and first-seen date
- Evidence drawer with rendered text excerpts, SERP rank, source URL, and fetch metadata
- Filters for new company, incumbent expansion, regional entry, marketplace entry, and noise
- Export buttons for JSON, CSV, and Markdown
