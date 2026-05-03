# Geo SERP Local Business Checker

Geo SERP Local Business Checker audits how a local business appears in Google search results from specific cities, countries, and devices. It is built for agencies, franchise marketers, and local operators who need to know whether a business shows up in the organic results, local pack, maps-style listings, ads, and answer surfaces for commercially valuable queries.

The first version is a batch checker: give it one business, a keyword set, and a geography matrix, then receive a source-backed visibility report with ranks, competitors, SERP features, and recommended fixes.

## Target User

Primary users:

- Local SEO agencies proving rank movement and local-pack coverage to clients.
- Multi-location businesses comparing branch visibility across service areas.
- Franchises checking whether national, regional, or branch pages are winning.
- Home-service, healthcare, legal, restaurant, and retail teams monitoring "near me" and city-modified terms.
- Growth teams deciding where city landing pages, review work, or Google Business Profile cleanup will matter most.

## Core Workflow

1. User creates a geo SERP brief:
   - Target business name, domain, and accepted aliases
   - Optional branch names, Google Business Profile names, and service-area hints
   - Keywords, priorities, and local-intent categories
   - City, country, and device targets
   - Competitors, directories, and result types to watch
2. App calls `account_status` to estimate credits and confirm the run can complete.
3. Massive MCP collects Google SERPs with:
   - `web_search` and Google SERP parsing for every query, city, country, and device
   - country, city, and device targeting to simulate local search contexts
   - captcha handling for resilient collection
   - `web_fetch` with JS rendering for target pages, competitor pages, and directory pages that need verification
4. App normalizes results into owned organic, local pack, maps, ads, directories, review sites, and answer features.
5. App uses deterministic matching plus `ai_chat_completion` to classify ambiguous business-name, branch, and franchise matches with sources.
6. User receives a report with geo visibility scores, rank tables, competitor displacement, local-pack presence, evidence links, CSV/JSON exports, and a Markdown summary.

## MVP Inputs

```json
{
  "target": {
    "business_name": "Summit Dental Studio",
    "domain": "summitdental.example",
    "aliases": ["Summit Dental", "Summit Dental Studio Seattle"],
    "locations": [
      {
        "label": "Seattle office",
        "city": "Seattle",
        "country": "us",
        "address_hint": "Capitol Hill"
      }
    ]
  },
  "keywords": [
    {
      "query": "emergency dentist",
      "intent": "urgent_local",
      "priority": "high"
    },
    {
      "query": "cosmetic dentist",
      "intent": "service_local",
      "priority": "high"
    },
    {
      "query": "best dentist near me",
      "intent": "comparison_local",
      "priority": "medium"
    }
  ],
  "geo_targets": [
    { "country": "us", "city": "Seattle", "device": "desktop" },
    { "country": "us", "city": "Seattle", "device": "mobile" },
    { "country": "us", "city": "Bellevue", "device": "mobile" }
  ],
  "competitors": [
    { "name": "Greenlake Dental", "domain": "greenlakedental.com" },
    { "name": "Bellevue Modern Dentistry", "domain": "bellevuemoderndentistry.com" }
  ],
  "rank_depth": 20,
  "result_types": ["organic", "local_pack", "maps", "ads", "ai_overview", "paa"],
  "exclusions": ["jobs", "insurance provider directories", "school programs"]
}
```

## MVP Output

```json
{
  "target": {
    "business_name": "Summit Dental Studio",
    "domain": "summitdental.example"
  },
  "summary": "Summit Dental Studio ranks strongly for Seattle desktop service queries but loses mobile local-pack visibility in Bellevue. Competitors appear above the target in two high-priority mobile checks.",
  "overall_geo_visibility_score": 71,
  "geo_results": [
    {
      "country": "us",
      "city": "Seattle",
      "device": "mobile",
      "visibility_score": 78,
      "owned_organic_presence_rate": 0.67,
      "local_pack_presence_rate": 0.33,
      "average_owned_organic_rank": 5.5,
      "top_serp_competitors": [
        {
          "name": "Greenlake Dental",
          "domain": "greenlakedental.com",
          "appearances": 3,
          "wins_against_target": 1,
          "best_surface": "local_pack"
        }
      ],
      "keyword_results": [
        {
          "query": "emergency dentist",
          "target_organic_rank": 4,
          "target_local_pack_rank": null,
          "best_competitor_rank": 2,
          "serp_features": ["local_pack", "ads", "people_also_ask"],
          "evidence": {
            "source_type": "google_serp",
            "source_url": "https://www.google.com/search?q=emergency+dentist",
            "observed_at": "2026-05-02T17:00:00Z"
          },
          "confidence": "high"
        }
      ],
      "recommended_actions": [
        "Strengthen Seattle emergency dentist page relevance with urgent-care language and internal links.",
        "Audit Google Business Profile categories and review coverage for mobile local-pack loss."
      ]
    }
  ],
  "alerts": [
    {
      "type": "competitor_above_target",
      "city": "Seattle",
      "device": "mobile",
      "query": "emergency dentist",
      "surface": "local_pack",
      "message": "Greenlake Dental appears in the local pack while the target is absent."
    }
  ]
}
```

## Visibility Dimensions

Each observation preserves:

- Query, original keyword, intent, priority, and optional generated city modifier.
- Country, city, device, language if provided, and collection timestamp.
- Result surface: organic, local pack, maps, ads, AI overview, people also ask, image pack, review site, or directory.
- Rank by surface, URL, title, snippet, business name, rating metadata when available, and normalized domain.
- Target match type: exact domain, alias, GBP name, branch name, directory mention, redirect, or ambiguous.
- Competitor match type and whether the competitor appears above the target.
- Evidence source URL, parsed SERP payload lineage, fetched-page metadata, and confidence.

## Scoring

Geo visibility scores are 0-100:

- 25 points: owned organic presence and rank depth across high-priority keywords.
- 25 points: local pack or maps presence for local and near-me intent.
- 15 points: mobile versus desktop consistency within the same city.
- 10 points: competitor displacement pressure by surface and priority.
- 10 points: landing page relevance after `web_fetch` verification.
- 10 points: broad SERP coverage, including answer surfaces and review/directory context.
- 5 points: evidence completeness and low ambiguity.

Automatic caps:

- Cap at 75 when the target has owned organic visibility but no local-pack or maps presence for urgent local intent.
- Cap at 65 when visibility is mostly through third-party directories.
- Cap at 55 when branch or franchise matching is ambiguous.
- Cap at 50 when fewer than three keyword observations are collected for a city-device pair.
- Cap at 40 when results are dominated by excluded meanings such as jobs, schools, or wholesale products.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
geo-serp-local-checker run \
  --brief geo-serp-brief.json \
  --out geo-serp-report.json \
  --csv geo-serp-results.csv \
  --report-md geo-serp-report.md
```

Minimum viable UI after CLI validation:

- Geo brief setup form
- Target business and alias manager
- Keyword grid with intent and priority
- City, country, and device matrix
- Credit estimate preview
- Run progress by query and geo target
- SERP visibility heatmap
- Keyword-level rank table
- Competitor displacement view
- Local pack and organic evidence drawer
- JSON, CSV, and Markdown exports

## Massive MCP Usage

- `account_status`: check account and estimate available credits before batch SERP collection.
- `web_search`: collect Google SERPs for each query and geo-device target.
- Google SERP parsing: preserve ranks, result types, titles, snippets, URLs, local pack entries, SERP features, and source lineage.
- Country, city, and device targeting: compare local visibility in realistic search contexts.
- `web_fetch`: verify owned pages, competitor pages, review sites, and directories, with JS rendering when required.
- Captcha handling: keep SERP and page collection resilient.
- `ai_chat_completion`: classify ambiguous local business matches, summarize geo gaps, and generate recommendations with citations to observations.

## Guardrails

- Treat every rank as a point-in-time observation, not a universal position.
- Keep country, city, device, and result surface separate.
- Never combine organic, local pack, maps, and ads into one rank.
- Do not count a third-party directory mention as owned visibility unless labeled that way.
- Flag ambiguous franchise, branch, DBA, and alias matches for review.
- Avoid scraping private profiles, gated directories, or personal contact data.
- Do not infer traffic, leads, revenue, or conversion impact from SERP rank alone.
- Require observation IDs and source lineage for every recommendation.
