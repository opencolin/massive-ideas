# Regional Demand Analyzer

Regional Demand Analyzer compares localized Google results and answer-engine sources to show where demand, buyer language, and competitive visibility differ by region. It helps growth, sales, and expansion teams decide which cities or countries deserve market entry, local landing pages, partner outreach, or paid-search tests.

The first version is intentionally narrow: analyze one product category across a bounded set of regions and produce a ranked regional demand map with source-backed evidence.

## Target User

Primary users:

- Growth teams prioritizing regional SEO and paid-search expansion.
- Sales leaders deciding where to assign territory focus.
- Marketplace operators comparing local supply and demand signals.
- Founders validating which launch cities have visible buyer intent.
- Agencies building localized content and campaign plans.

## Core Workflow

1. User enters a demand brief:
   - Product, service, or category
   - Buyer or searcher persona
   - Candidate regions
   - Query intents to test
   - Known competitors or local alternatives
   - Exclusions for ambiguous categories
2. App generates localized search queries for each region across purchase, comparison, informational, and near-me intent.
3. Massive MCP runs:
   - `account_status` to estimate credit budget before execution
   - `web_search` with Google SERP parsing for every region and query
   - country, city, and device targeting to capture local result differences
   - `web_fetch` with JS rendering for ranking pages, local directories, competitor pages, and landing pages
   - captcha handling when localized pages or SERPs block normal collection
   - `ai_chat_completion` to summarize demand patterns, local language, competitors, and confidence
4. App normalizes domains, local entities, SERP features, and query-intent matches.
5. App scores each region on visible demand, commercial intent, competition, content gaps, and source confidence.
6. User gets a ranked regional demand report with evidence and exportable recommendations.

## MVP Inputs

```json
{
  "category": "fractional CFO services",
  "buyer": "startup founders",
  "regions": [
    { "country": "us", "city": "Austin", "device": "desktop" },
    { "country": "us", "city": "Denver", "device": "desktop" },
    { "country": "us", "city": "Raleigh", "device": "desktop" }
  ],
  "intents": [
    "commercial",
    "comparison",
    "local",
    "pricing",
    "problem-aware"
  ],
  "known_competitors": ["Pilot", "Graphite Financial", "Kruze Consulting"],
  "exclusions": ["full-time CFO jobs", "accounting software"]
}
```

## MVP Output

```json
{
  "category": "fractional CFO services",
  "summary": "Austin shows the strongest commercial demand signal, with multiple high-intent localized SERPs, startup-specific language, and a mix of national vendors plus local accounting firms. Raleigh has lower competition and clearer content gaps.",
  "regions": [
    {
      "country": "us",
      "city": "Austin",
      "device": "desktop",
      "demand_score": 84,
      "commercial_intent_score": 88,
      "competition_score": 71,
      "content_gap_score": 62,
      "recommended_action": "Create a startup-focused Austin landing page and test paid search on fractional CFO and startup finance queries.",
      "top_queries": [
        {
          "query": "fractional CFO services Austin startups",
          "intent": "commercial",
          "serp_strength": 91,
          "evidence_count": 8
        }
      ],
      "visible_competitors": [
        {
          "name": "Example Finance",
          "domain": "examplefinance.com",
          "serp_mentions": 4,
          "best_rank": 2,
          "source_urls": ["https://examplefinance.com/austin-fractional-cfo"]
        }
      ],
      "local_language": [
        "startup CFO",
        "venture-backed finance",
        "cash runway",
        "fundraising support"
      ],
      "evidence": [
        {
          "claim": "Localized commercial query has multiple service providers and comparison pages.",
          "source_url": "https://example.com/fractional-cfo-austin",
          "source_type": "serp_result",
          "query": "fractional CFO services Austin startups",
          "rank": 3
        }
      ],
      "confidence": "high"
    }
  ],
  "cross_region_insights": [
    "National vendors rank in all regions, but local accounting firms dominate city-modified queries.",
    "Pricing pages are sparse, creating a content opportunity across all tested cities."
  ]
}
```

## Regional Scoring

Demand scores are 0-100:

- 25 points: density of relevant localized SERP results across query intents.
- 20 points: commercial intent, including transactional pages, local service pages, ads, maps, and comparison results.
- 15 points: region-specific language in titles, snippets, and fetched pages.
- 15 points: competitor visibility and quality of ranking domains.
- 15 points: content gaps where demand appears high but strong local pages are scarce.
- 10 points: evidence quality, freshness, and consistency across desktop/mobile or city/country targets.

Automatic caps:

- Cap at 60 when region evidence comes from fewer than three relevant SERP results.
- Cap at 55 when signals are mostly informational rather than commercial.
- Cap at 45 when the category appears ambiguous despite exclusions.
- Cap at 40 when localized results mostly show jobs, definitions, or unrelated meanings.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
regional-demand analyze \
  --brief demand-brief.json \
  --out regional-demand.json \
  --csv regions.csv \
  --report-md regional-demand.md
```

Minimum viable UI after CLI validation:

- Demand brief setup form
- Region list editor
- Query plan and credit estimate preview
- Run status by region and intent
- Ranked regional demand table
- SERP evidence and competitor visibility view
- Cross-region language and content-gap summary
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: estimate and confirm available credits before localized query expansion.
- `web_search`: collect Google SERPs for each region, query, and intent.
- Google SERP parsing: preserve rank, URL, title, snippet, result type, and SERP features for scoring.
- Country, city, and device targeting: compare regional differences and mobile/local pack sensitivity.
- `web_fetch`: fetch ranking pages with JS rendering and captcha handling to verify relevance and extract local language.
- `ai_chat_completion`: generate query plans, classify result intent, summarize regional patterns, and produce source-backed recommendations.

## Guardrails

- Treat localized SERP evidence as directional demand, not true search volume.
- Keep city-targeted, country-targeted, desktop, and mobile observations separate.
- Preserve query, region, rank, URL, and fetched-at timestamp for every claim.
- Do not infer private business performance, revenue, or customer counts from rankings.
- Avoid scraping gated directories, private communities, or personal contact data.
- Label low-evidence regions clearly instead of forcing a ranking.
- Separate demand strength from competition intensity so a crowded region is not automatically considered attractive.
