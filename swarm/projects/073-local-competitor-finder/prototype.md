# Prototype

## Prototype Goal

Build a CLI prototype that accepts a local business category and city, discovers public competitor candidates, verifies them with public pages, and writes JSON, Markdown, and CSV outputs. The prototype should prove that Massive MCP can combine localized SERP parsing, rendered public websites, and source-backed AI summarization into a useful local competitor directory.

## Command Shape

```bash
local-competitor-finder run \
  --category "commercial HVAC" \
  --city "Cleveland" \
  --country us \
  --out competitors.json \
  --report-md competitors.md \
  --csv competitors.csv
```

## Config Example

```json
{
  "scope": {
    "category": "commercial HVAC",
    "city": "Cleveland",
    "region": "Ohio",
    "country": "us",
    "service_terms": ["emergency repair", "maintenance contracts", "rooftop units"],
    "neighborhoods": ["Downtown", "Ohio City", "Lakewood", "Parma"]
  },
  "discovery": {
    "max_serp_results": 80,
    "max_fetches": 60,
    "include_directories": true,
    "include_official_sites": true,
    "include_review_snippets": true
  },
  "fetch_options": {
    "render_js": true,
    "country": "us",
    "city": "Cleveland",
    "device": "desktop"
  },
  "thresholds": {
    "min_confidence": "medium",
    "max_businesses": 40,
    "require_city_evidence": true
  }
}
```

## Pipeline

1. Load config and call `account_status` to estimate search and fetch budget.
2. Build query variants from category, city, service terms, neighborhoods, and source modifiers such as "near me", "services", "reviews", "best", "directory", and "official website".
3. Use `web_search` with Google SERP parsing to collect titles, snippets, URLs, ranks, visible ratings, visible review counts, and local pack style signals when available.
4. Classify SERP results as likely official site, directory profile, review page, aggregator, article, irrelevant, or ambiguous.
5. Normalize and de-duplicate business candidates by name, domain, URL path, city hints, and public profile overlap.
6. Fetch candidate official sites and public profiles with `web_fetch`, using JavaScript rendering and localized country/city/device settings.
7. Fetch likely service, about, location, contact, and review-summary pages when they are public and linked from the fetched source.
8. Ask `ai_chat_completion` to extract structured facts from each source:

```json
{
  "business": {
    "name": "Example Mechanical",
    "website_url": "https://www.examplemechanical.com",
    "category_match": "commercial HVAC contractor",
    "city_evidence": "Cleveland, OH service area",
    "neighborhood": "Downtown Cleveland",
    "services": ["HVAC maintenance", "emergency repair", "rooftop units"],
    "positioning": "Commercial contractor emphasizing fast response and maintenance agreements."
  },
  "citations": [
    {
      "claim": "Provides emergency commercial HVAC repair.",
      "source_url": "https://www.examplemechanical.com/services"
    }
  ]
}
```

9. Ask `ai_chat_completion` to merge duplicate profiles, reject unsupported service or location claims, and flag ambiguous businesses.
10. Score each business, then write JSON, Markdown, and CSV outputs.

## Data Model

### Search Result Observation

```json
{
  "query": "commercial HVAC Cleveland emergency repair",
  "rank": 3,
  "title": "Example Mechanical | Commercial HVAC Cleveland",
  "url": "https://www.examplemechanical.com",
  "snippet": "Commercial HVAC repair, maintenance, and rooftop unit service in Cleveland...",
  "visible_rating": "4.7",
  "visible_review_count": "86",
  "source_type_guess": "official_site",
  "observed_at": "2026-05-02T20:10:00Z"
}
```

### Business Candidate

```json
{
  "candidate_id": "example-mechanical-cleveland",
  "name": "Example Mechanical",
  "canonical_url": "https://www.examplemechanical.com",
  "source_urls": [
    "https://www.examplemechanical.com",
    "https://www.examplemechanical.com/services",
    "https://public-directory.example/biz/example-mechanical"
  ],
  "category": "commercial HVAC",
  "city": "Cleveland, Ohio",
  "neighborhood": "Downtown Cleveland",
  "services": ["emergency repair", "maintenance contracts", "rooftop units"],
  "positioning": "Commercial HVAC provider focused on preventive maintenance and rapid response.",
  "review_signal": {
    "rating": "4.7",
    "review_count": "86",
    "snippet": "Public snippets mention responsive technicians and maintenance quality.",
    "source_url": "https://www.google.com/search?q=example+mechanical+cleveland"
  },
  "confidence_score": 88,
  "confidence": "high",
  "warnings": []
}
```

### Citation

```json
{
  "candidate_id": "example-mechanical-cleveland",
  "claim_type": "service",
  "claim": "Offers rooftop unit maintenance and repair.",
  "source_url": "https://www.examplemechanical.com/commercial-hvac",
  "source_type": "official_site",
  "confidence": 0.91
}
```

## Markdown Report Layout

- Run summary and search scope.
- Ranked competitor table with name, URL, category confidence, neighborhood, services, positioning, and public review signal.
- Service coverage matrix by competitor.
- Neighborhood or service-area distribution.
- Positioning themes such as luxury, budget, emergency, family-owned, specialized, or enterprise-focused.
- Ambiguous, duplicate, stale, or closed candidates.
- Source log with queries, fetched URLs, render settings, observed timestamps, and confidence notes.

## CSV Columns

```text
rank,name,website_url,category,city,neighborhood,services,positioning,visible_rating,visible_review_count,review_snippet_source,confidence_score,confidence,source_urls,warnings
```

## Prototype Constraints

- Limit the first run to 80 SERP results, 40 candidate businesses, and 60 fetched public pages.
- Store public search metadata and rendered fetch metadata for reproducibility.
- Require at least one cited source for every included business.
- Require official-site or public-profile evidence before claiming services.
- Treat review and rating data as optional public signals, never as complete reputation analysis.
- Mark claims as `review_needed` when evidence comes only from snippets or ambiguous directory pages.

## Future UI

- Search setup with category, city, service terms, neighborhoods, country, device, and quota estimate.
- Ranked competitor directory with filters for service, neighborhood, confidence, source type, and review-signal availability.
- Evidence drawer showing source pages, snippets, fetch timestamps, and claim-level citations.
- Service matrix comparing competitors across offerings.
- Positioning theme map for quick market differentiation.
- Export buttons for JSON, CSV, Markdown, and agency-ready briefing notes.
