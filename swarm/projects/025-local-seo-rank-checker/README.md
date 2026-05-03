# Local SEO Rank Checker

Local SEO Rank Checker compares how a business, website, or listing ranks across city-targeted Google searches. It helps local SEO teams, agencies, franchise operators, and multi-location businesses understand where they are visible, where competitors outrank them, and which city pages or listings need attention.

The first version is intentionally narrow: check one business against one keyword set across multiple cities and devices, then produce a source-backed rank report.

## Target User

Primary users:

- Local SEO agencies monitoring client visibility by city.
- Multi-location businesses comparing branch and service-area performance.
- Franchise marketers auditing brand presence against local operators.
- Home-service, healthcare, legal, and professional-services teams tracking "near me" and city-modified terms.
- Growth teams deciding which local landing pages need optimization.

## Core Workflow

1. User defines a rank-check brief:
   - Business name, domain, and optional Google Business Profile names
   - Keyword set and intent labels
   - Cities, countries, and devices to test
   - Competitor domains or business names to watch
   - Rank depth, result types, and exclusions
2. App checks `account_status` and estimates the run cost before collecting SERPs.
3. Massive MCP runs:
   - `web_search` with Google SERP parsing for every keyword, city, and device
   - country, city, and device targeting to simulate local search contexts
   - `web_fetch` with JS rendering for target pages, competitor pages, and local directories
   - captcha handling when public SERPs or ranking pages challenge collection
   - `ai_chat_completion` to classify local intent, summarize rank gaps, and produce recommendations with sources
4. App normalizes domains, business names, local pack entries, organic ranks, map results, ads, and directories.
5. App scores each city and keyword on visibility, rank position, competitor pressure, and evidence quality.
6. User receives a city-by-city rank report with tables, screenshots or SERP source links where available, and exportable JSON, CSV, and Markdown.

## MVP Inputs

```json
{
  "target": {
    "business_name": "Northstar Plumbing",
    "domain": "northstarplumbing.example",
    "gbp_names": ["Northstar Plumbing Austin", "Northstar Plumbing"]
  },
  "keywords": [
    {
      "query": "emergency plumber",
      "intent": "local_service",
      "priority": "high"
    },
    {
      "query": "water heater repair",
      "intent": "service",
      "priority": "high"
    },
    {
      "query": "best plumber near me",
      "intent": "comparison",
      "priority": "medium"
    }
  ],
  "locations": [
    { "country": "us", "city": "Austin", "device": "desktop" },
    { "country": "us", "city": "Round Rock", "device": "mobile" },
    { "country": "us", "city": "Cedar Park", "device": "mobile" }
  ],
  "competitors": [
    { "name": "Radiant Plumbing", "domain": "radiantplumbing.com" },
    { "name": "ABC Home & Commercial", "domain": "abchomeandcommercial.com" }
  ],
  "rank_depth": 20,
  "result_types": ["organic", "local_pack", "maps", "ads"],
  "exclusions": ["jobs", "DIY guides", "wholesale parts"]
}
```

## MVP Output

```json
{
  "target": {
    "business_name": "Northstar Plumbing",
    "domain": "northstarplumbing.example"
  },
  "summary": "Northstar Plumbing has strong organic visibility in Austin but weak mobile local-pack presence in Round Rock and Cedar Park. Radiant Plumbing appears in the local pack for two high-priority service terms.",
  "overall_visibility_score": 68,
  "locations": [
    {
      "country": "us",
      "city": "Austin",
      "device": "desktop",
      "visibility_score": 82,
      "average_organic_rank": 4.7,
      "local_pack_presence_rate": 0.67,
      "top_competitors": [
        {
          "name": "Radiant Plumbing",
          "domain": "radiantplumbing.com",
          "best_rank": 2,
          "wins_against_target": 2
        }
      ],
      "keyword_results": [
        {
          "query": "emergency plumber",
          "intent": "local_service",
          "target_organic_rank": 3,
          "target_local_pack_rank": 2,
          "best_competitor_rank": 1,
          "serp_features": ["local_pack", "ads", "people_also_ask"],
          "evidence_url": "https://www.google.com/search?q=emergency+plumber",
          "confidence": "high"
        }
      ],
      "recommended_actions": [
        "Improve Round Rock service-area signals and review coverage for emergency plumbing terms.",
        "Refresh Austin emergency plumber page title and internal links to defend top-three organic placement."
      ]
    }
  ],
  "rank_gaps": [
    {
      "gap_type": "local_pack_absent",
      "city": "Round Rock",
      "device": "mobile",
      "query": "water heater repair",
      "recommended_action": "Audit Google Business Profile category, reviews, and service-area content for Round Rock."
    }
  ]
}
```

## Rank Dimensions

Each observation preserves:

- Query text, intent, priority, and generated city-modified variant.
- Country, city, device, and collection timestamp.
- Organic rank, local pack rank, maps rank, ad presence, and SERP features.
- Target domain, normalized business names, GBP aliases, and URL match type.
- Competitor domains, business names, ranks, and repeated SERP wins.
- Source URL, parsed SERP fields, fetched page metadata, and confidence label.

## Scoring

Visibility scores are 0-100:

- 30 points: target organic rank depth and position across priority keywords.
- 25 points: local pack or maps presence for local-service and near-me intent.
- 15 points: consistency across desktop and mobile city targets.
- 10 points: competitor pressure, including direct rank losses and local pack displacement.
- 10 points: landing page relevance after fetching target and competitor pages.
- 10 points: evidence quality, source completeness, and result-type confidence.

Automatic caps:

- Cap at 70 when only organic results are available for strongly local queries.
- Cap at 60 when the target appears only through third-party directories.
- Cap at 50 when fewer than three relevant keyword observations are collected for a city.
- Cap at 40 when most results are excluded meanings, jobs, or informational pages.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
local-seo-rank-checker run \
  --brief rank-brief.json \
  --out local-rank-report.json \
  --csv local-ranks.csv \
  --report-md local-rank-report.md
```

Minimum viable UI after CLI validation:

- Rank brief setup form
- City, country, and device target editor
- Keyword list with intent and priority controls
- Credit estimate preview
- Run status by city and keyword
- City visibility matrix
- Keyword-level rank table
- Competitor win/loss view
- Local pack and organic evidence drawer
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: estimate and confirm available credits before batch rank checks.
- `web_search`: collect Google results for every query, city, country, and device target.
- Google SERP parsing: preserve rank, result type, title, snippet, URL, local pack entries, and SERP feature metadata.
- Country, city, and device targeting: compare true local visibility by search context.
- `web_fetch`: verify target and competitor page relevance with JS rendering.
- Captcha handling: keep collection resilient when SERPs, local directories, or target pages challenge requests.
- `ai_chat_completion`: classify result relevance, normalize business-name matches, summarize city rank gaps, and generate source-backed recommendations.

## Guardrails

- Treat ranks as point-in-time observations, not guaranteed positions for every searcher.
- Keep country, city, and device observations separate.
- Preserve query, location, device, rank, URL, and fetched-at timestamp for every claim.
- Distinguish organic rank, local pack rank, maps rank, and ad presence.
- Avoid scraping private profiles, gated directories, or personal contact data.
- Do not infer revenue, lead volume, or customer demand from rank alone.
- Mark ambiguous target matches for human review instead of forcing a win or loss.
