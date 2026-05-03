# Best Vendor Near Me SERP Trend Tracker

Best Vendor Near Me SERP Trend Tracker monitors recurring Google searches like "best accountant near me," "best HVAC company near me," and "best wedding photographer near me" across cities and devices. It helps local-market operators, agencies, marketplaces, and category teams see which vendors, directories, ads, and review sites are gaining or losing visibility over time.

The first version is intentionally narrow: track one vendor category across selected cities, devices, and query variants, then produce a dated trend report with source-backed rank movement and competitor alerts.

## Target User

Primary users:

- Local SEO agencies tracking competitive movement for client categories.
- Franchise and multi-location marketing teams watching category SERPs by city.
- Marketplaces identifying which local vendors and directories dominate discovery.
- Private equity or roll-up teams monitoring local operator momentum.
- Sales teams finding newly visible vendors in a territory.
- Brand teams checking whether "best vendor near me" searches favor them, competitors, or third-party lists.

## Core Workflow

1. User defines a trend brief:
   - Vendor category and synonyms
   - Query templates such as "best {category} near me" and "top {category} in {city}"
   - Cities, countries, and devices to monitor
   - Watched vendors, domains, directories, and excluded meanings
   - Schedule, rank depth, and alert thresholds
2. App checks `account_status` and estimates per-run and monthly credit cost.
3. Massive MCP runs on each scheduled snapshot:
   - `web_search` with Google SERP parsing for every query, city, country, and device
   - country, city, and device targeting to compare local discovery surfaces
   - `web_fetch` with JS rendering for vendor pages, directory pages, and ranked listicles
   - captcha handling for Google SERPs, directories, and review pages that challenge collection
   - `ai_chat_completion` to normalize vendor names, classify result types, summarize movement, and cite sources
4. App stores timestamped SERP observations with rank, result type, URL, vendor entity, and evidence lineage.
5. App compares the latest snapshot against prior snapshots and baseline periods.
6. User receives a trend dashboard or export with winners, losers, new entrants, persistent directories, and source-backed alerts.

## MVP Inputs

```json
{
  "category": {
    "name": "wedding photographer",
    "synonyms": ["bridal photographer", "engagement photographer"],
    "excluded_meanings": ["stock photography jobs", "camera equipment"]
  },
  "query_templates": [
    "best wedding photographer near me",
    "top wedding photographer in {city}",
    "best bridal photographer {city}"
  ],
  "locations": [
    { "country": "us", "city": "Austin", "device": "desktop" },
    { "country": "us", "city": "Austin", "device": "mobile" },
    { "country": "us", "city": "San Antonio", "device": "mobile" }
  ],
  "watched_entities": [
    { "name": "Juniper & Lace Photography", "domain": "juniperlace.example", "aliases": ["Juniper Lace"] },
    { "name": "The Knot", "domain": "theknot.com", "entity_type": "directory" },
    { "name": "WeddingWire", "domain": "weddingwire.com", "entity_type": "directory" }
  ],
  "rank_depth": 20,
  "result_types": ["organic", "local_pack", "maps", "ads"],
  "cadence": "weekly",
  "alert_thresholds": {
    "rank_gain": 5,
    "rank_loss": 5,
    "new_top_10": true,
    "local_pack_change": true
  }
}
```

## MVP Output

```json
{
  "category": "wedding photographer",
  "snapshot_at": "2026-05-02T16:00:00Z",
  "summary": "Austin mobile SERPs shifted toward directories this week. The Knot gained top-three organic visibility on two query variants, while Juniper & Lace dropped from local pack rank 2 to absent for 'best wedding photographer near me'.",
  "market_trend_score": 61,
  "locations": [
    {
      "country": "us",
      "city": "Austin",
      "device": "mobile",
      "visibility_leaders": [
        {
          "entity": "The Knot",
          "domain": "theknot.com",
          "entity_type": "directory",
          "share_of_top_10": 0.67,
          "best_rank": 1,
          "movement": "+4"
        }
      ],
      "query_trends": [
        {
          "query": "best wedding photographer near me",
          "serp_features": ["local_pack", "ads", "people_also_ask"],
          "new_top_10_entities": ["The Knot"],
          "lost_top_10_entities": ["Juniper & Lace Photography"],
          "local_pack_changes": [
            {
              "entity": "Juniper & Lace Photography",
              "previous_rank": 2,
              "current_rank": null,
              "change": "lost_local_pack"
            }
          ],
          "evidence_url": "https://www.google.com/search?q=best+wedding+photographer+near+me",
          "confidence": "high"
        }
      ],
      "alerts": [
        {
          "alert_type": "watched_vendor_loss",
          "severity": "high",
          "entity": "Juniper & Lace Photography",
          "query": "best wedding photographer near me",
          "reason": "Watched vendor lost mobile local-pack presence in Austin.",
          "recommended_action": "Review Google Business Profile category, reviews, city service copy, and local-pack competitors for this query."
        }
      ]
    }
  ],
  "persistent_sources": [
    {
      "domain": "theknot.com",
      "entity_type": "directory",
      "cities_visible": 2,
      "queries_visible": 3,
      "trend": "rising"
    }
  ]
}
```

## Trend Dimensions

Each observation preserves:

- Query text, query template, category, synonym coverage, and excluded meanings.
- Country, city, device, fetched-at timestamp, and snapshot ID.
- Organic rank, local pack rank, maps rank, ad presence, and SERP features.
- Vendor name, aliases, domain, entity type, and match confidence.
- Directory/listicle ownership versus owned vendor visibility.
- Previous rank, current rank, absolute movement, top-10 entry or exit, and local-pack state change.
- Parsed SERP source, fetched page metadata, AI classification source IDs, and confidence label.

## Scoring

Market trend scores are 0-100:

- 25 points: stability and visibility of watched vendors across priority queries.
- 20 points: share of top positions controlled by owned vendors versus directories or ads.
- 15 points: local pack or maps presence for near-me queries.
- 15 points: rank momentum, including gains, losses, and new entrants.
- 10 points: consistency across mobile and desktop city targets.
- 10 points: fetched-page relevance and category match quality.
- 5 points: evidence completeness and confidence.

Automatic caps:

- Cap at 70 when no historical baseline exists yet.
- Cap at 65 when only organic results are available for strongly local near-me queries.
- Cap at 60 when most visibility belongs to generic directories rather than identifiable vendors.
- Cap at 50 when fewer than three query snapshots exist for a city-device pair.
- Cap at 40 when query intent is ambiguous or dominated by excluded meanings.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
best-vendor-serp-tracker run \
  --brief trend-brief.json \
  --history-dir ./snapshots \
  --out trend-report.json \
  --csv trend-observations.csv \
  --report-md trend-report.md
```

Minimum viable UI after CLI validation:

- Trend brief setup form
- Category synonym and exclusion editor
- City, country, and device target matrix
- Watched vendor and directory list
- Credit estimate preview
- Snapshot run status by query and location
- Rank movement table
- Local pack change timeline
- New entrant and lost visibility alerts
- Evidence drawer for parsed SERPs and fetched pages
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate and confirm credits before scheduled SERP snapshots.
- `web_search`: collect Google results for query, city, country, and device combinations.
- Google SERP parsing: preserve rank, title, snippet, URL, local pack entries, ads, maps, and SERP feature metadata.
- Country, city, and device targeting: distinguish real local movement from geography or device differences.
- `web_fetch`: verify ranked vendor pages, directories, and listicles with JS rendering.
- Captcha handling: keep recurring collection resilient when public SERPs or directories challenge access.
- `ai_chat_completion`: normalize vendor entities, classify directories versus vendors, summarize movement, and generate source-backed alerts.

## Guardrails

- Treat ranks as point-in-time observations, not guaranteed positions for every searcher.
- Never merge desktop and mobile movement into one rank line.
- Separate organic, local pack, maps, and ads.
- Do not infer revenue, lead volume, or customer demand from SERP movement alone.
- Mark ambiguous vendor matches for review instead of forcing entity identity.
- Label directory visibility separately from owned vendor visibility.
- Preserve source lineage for every movement claim.
- Respect exclusions and avoid collecting gated, private, or personal contact data.
