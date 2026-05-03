# Franchise Territory Research Assistant

Franchise Territory Research Assistant helps franchisors, franchise development teams, and multi-unit buyers evaluate where a concept can expand without relying on stale market decks or manual city-by-city Google research. It turns a proposed market, brand category, and territory rules into a source-backed territory brief covering demand signals, local competitors, demographic proxies, nearby franchise density, and expansion risks.

The first version is a research workflow: give it a franchise concept, candidate cities or ZIP clusters, territory constraints, and competitor brands, then receive a ranked territory report with citations and confidence labels.

## Target User

Primary users:

- Franchise development teams screening inbound market requests.
- Emerging franchisors deciding which regions to prioritize next.
- Multi-unit operators comparing open territories across brands.
- Franchise brokers preparing market diligence for buyers.
- Local service, fitness, food, education, healthcare, and home-services concepts that depend on territory quality.

## Core Workflow

1. User creates a territory research brief:
   - Franchise concept, category, brand domain, and known location footprint
   - Candidate cities, states, ZIPs, counties, or DMAs
   - Territory rules such as radius, drive time, population minimum, protected ZIPs, or exclusive service areas
   - Competitor brands, substitute categories, and local search terms
   - Optional target customer, ticket size, and site criteria
2. App calls `account_status` to estimate available credits before running a market batch.
3. Massive MCP collects market evidence with:
   - `web_search` and Google SERP parsing for local demand, competitor, directory, and franchise-location queries
   - country, city, and device targeting to inspect local search realities by market
   - captcha handling for resilient collection
   - `web_fetch` with JS rendering for brand locators, competitor pages, city economic pages, broker listings, and directory pages
4. App normalizes findings into market demand, competitive saturation, nearby brand footprint, local business density, expansion blockers, and evidence quality.
5. App uses `ai_chat_completion` to classify ambiguous competitors, summarize market tradeoffs, and generate territory recommendations with source references.
6. User receives a ranked territory report with scorecards, source-backed notes, competitor maps for follow-up GIS work, CSV/JSON exports, and a Markdown investor-style brief.

## MVP Inputs

```json
{
  "concept": {
    "brand_name": "BrightPath Tutoring",
    "category": "after-school tutoring franchise",
    "domain": "brightpathtutoring.example",
    "customer_profile": "families with K-12 students seeking math and test-prep support",
    "site_criteria": ["suburban retail", "near schools", "household income above market median"]
  },
  "candidate_territories": [
    {
      "label": "Plano, TX",
      "country": "us",
      "state": "TX",
      "cities": ["Plano", "Frisco", "Allen"],
      "zip_codes": ["75024", "75025", "75034", "75013"]
    },
    {
      "label": "Raleigh-Cary, NC",
      "country": "us",
      "state": "NC",
      "cities": ["Raleigh", "Cary", "Apex"],
      "zip_codes": ["27607", "27613", "27513", "27502"]
    }
  ],
  "territory_rules": {
    "protected_radius_miles": 5,
    "minimum_population": 75000,
    "avoid_existing_brand_radius_miles": 8,
    "exclusive_zip_policy": "no_overlap"
  },
  "competitors": [
    { "name": "Mathnasium", "domain": "mathnasium.com" },
    { "name": "Kumon", "domain": "kumon.com" },
    { "name": "Sylvan Learning", "domain": "sylvanlearning.com" }
  ],
  "research_queries": [
    "math tutoring",
    "SAT prep",
    "after school tutoring",
    "private tutor near me"
  ],
  "result_depth": 20
}
```

## MVP Output

```json
{
  "concept": {
    "brand_name": "BrightPath Tutoring",
    "category": "after-school tutoring franchise"
  },
  "summary": "Plano, TX is the strongest candidate because demand signals are broad and household-fit proxies are favorable, but competitor density is high. Raleigh-Cary has lower saturation and cleaner white space, with slightly weaker evidence for test-prep demand.",
  "ranked_territories": [
    {
      "label": "Plano, TX",
      "territory_score": 82,
      "demand_score": 88,
      "competition_score": 61,
      "brand_fit_score": 86,
      "evidence_score": 92,
      "recommended_action": "priority_diligence",
      "key_findings": [
        "High local search density for math tutoring and SAT prep across Plano, Frisco, and Allen.",
        "Mathnasium and Kumon have multiple visible locations, so protected-radius modeling is required before awarding ZIP exclusivity.",
        "School-adjacent and suburban retail signals match the concept's site criteria."
      ],
      "competitors": [
        {
          "name": "Mathnasium",
          "observed_locations": 4,
          "top_surface": "local_pack",
          "evidence_observation_ids": ["obs_104", "obs_118"]
        }
      ],
      "risks": [
        {
          "type": "competitive_saturation",
          "severity": "medium",
          "note": "Several national tutoring brands appear in local pack results for high-priority terms."
        }
      ],
      "evidence": [
        {
          "observation_id": "obs_104",
          "source_type": "google_serp",
          "query": "math tutoring Plano",
          "city": "Plano",
          "device": "mobile",
          "observed_at": "2026-05-02T17:00:00Z"
        }
      ]
    }
  ]
}
```

## Territory Dimensions

Each observation preserves:

- Territory label, country, state, city, ZIP, device, and timestamp.
- Query, intent, category, and whether it is demand, competitor, site, demographic proxy, or regulatory research.
- Result surface: organic, local pack, maps, ads, AI overview, people also ask, directory, brand locator, broker listing, or government/economic source.
- Competitor name, matched domain, location hints, address snippets, ratings, and confidence.
- Existing brand footprint and overlap risk when brand-location pages can be fetched.
- Evidence URL, parsed SERP lineage, fetched-page metadata, and confidence.

## Scoring

Territory scores are 0-100:

- 25 points: demand signals across local SERPs, directories, and answer surfaces.
- 20 points: competitive white space after direct and substitute competitors are counted.
- 15 points: concept fit based on site criteria, customer-profile proxies, and local business context.
- 15 points: protected territory feasibility using radius, ZIP, and overlap constraints.
- 10 points: existing brand adjacency and cannibalization risk.
- 10 points: source quality, evidence completeness, and freshness.
- 5 points: clarity of recommendation and low ambiguity.

Automatic caps:

- Cap at 75 when competitor density is high and no protected territory model has been validated.
- Cap at 70 when demand is mostly inferred from broad category pages rather than local SERPs.
- Cap at 65 when brand locator or competitor location data is incomplete.
- Cap at 55 when ZIP/city boundaries are ambiguous or overlap existing protected areas.
- Cap at 45 when fewer than three high-quality sources support a territory recommendation.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
franchise-territory-research run \
  --brief territory-brief.json \
  --out territory-report.json \
  --csv territory-observations.csv \
  --report-md territory-brief.md
```

Minimum viable UI after CLI validation:

- Territory brief setup form
- Franchise concept and site-criteria editor
- Candidate market and ZIP grid
- Competitor and substitute-category manager
- Credit estimate preview
- Run progress by territory and query
- Territory ranking table
- Demand versus competition scorecard
- Evidence drawer with SERP and fetched-page sources
- JSON, CSV, and Markdown exports

## Massive MCP Usage

- `account_status`: check account and estimate credits before territory batches.
- `web_search`: collect Google SERPs for each demand, competitor, and category query by city and device.
- Google SERP parsing: preserve local pack entries, organic results, ads, answer surfaces, titles, snippets, URLs, ranks, and source lineage.
- Country, city, and device targeting: compare local demand and competition from realistic search contexts.
- `web_fetch`: inspect brand locators, competitor pages, broker listings, chamber pages, school district pages, and government/economic pages, with JS rendering when needed.
- Captcha handling: keep high-volume local research resilient.
- `ai_chat_completion`: classify competitors, summarize territory tradeoffs, flag ambiguous evidence, and produce recommendation narratives with citations.

## Guardrails

- Treat territory scores as research prioritization, not legal territory approval.
- Keep SERP evidence separate from demographic, real estate, broker, and government sources.
- Do not infer revenue, unit economics, or franchise success from demand signals alone.
- Flag protected-territory conflicts that require GIS or franchisor system-of-record confirmation.
- Separate direct competitors, substitute businesses, directories, and unrelated category matches.
- Preserve source citations on every material claim.
