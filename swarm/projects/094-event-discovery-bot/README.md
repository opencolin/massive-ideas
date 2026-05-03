# Event Discovery Bot

Idea 94 is an event discovery bot that finds local events by combining venue calendars, organizer pages, ticketing sites, community calendars, and localized Google SERPs. It turns scattered event listings into a clean feed with dates, venues, sources, ticket links, categories, confidence, and freshness checks.

The bot is designed for local media teams, tourism boards, city guides, event marketers, community managers, hotels, coworking spaces, and anyone who needs a reliable calendar without manually checking dozens of sites every week.

## Problem

Local event discovery is fragmented. Venues publish calendars in different formats, ticketing sites expose incomplete or duplicate data, community calendars go stale, and Google results change by city, device, and query wording. Humans can build good calendars, but the work is repetitive and easy to miss.

This product creates a repeatable collection pipeline. It searches local SERPs, fetches rendered venue calendars, extracts structured event candidates, deduplicates repeats, validates date and location confidence, and produces a reviewable event feed with source provenance.

## Target Users

- Local publishers building weekend guides and neighborhood calendars.
- Tourism boards and destination marketers tracking public events.
- Hotels, concierges, coworking spaces, and apartment communities recommending nearby events.
- Event marketers monitoring competing or adjacent events.
- Community organizations collecting free, family, arts, civic, sports, or nightlife listings.
- Data teams enriching local business, venue, or travel products.

## Core Workflow

1. User defines a location, time window, event categories, and optional seed venues.
2. App checks `account_status` and estimates the discovery budget.
3. Bot builds search plans for venue calendars, event aggregators, ticketing pages, and local SERPs.
4. Massive MCP collects evidence through:
   - `web_search` with Google SERP parsing for local result discovery
   - country, city, and device targeting for location-sensitive results
   - `web_fetch` with JavaScript rendering for dynamic calendars and ticketing pages
   - captcha handling for public pages that challenge basic fetchers
   - `ai_chat_completion` for extraction, normalization, deduplication, and confidence review
5. App normalizes event candidates into a shared schema.
6. User reviews uncertain events, suppresses duplicates, and exports a public calendar feed or editorial brief.

## Event Objects

- Discovery run: location, time window, categories, source plan, search queries, and credit usage.
- Source: URL, domain, source type, query, rank, timestamp, region, city, device, and fetch status.
- Venue: name, address, neighborhood, source URL, website, and geocoding confidence.
- Event candidate: title, date, time, venue, ticket URL, price text, age limits, category, source IDs, and extraction confidence.
- Event cluster: one normalized event merged from duplicate candidates.
- Review note: why an event needs human review, was rejected, or was marked low confidence.
- Export: JSON, CSV, iCal, RSS, or Markdown guide output.

## MVP Inputs

```json
{
  "calendar_name": "Oakland Weekend Arts Calendar",
  "location": {
    "country": "us",
    "city": "Oakland",
    "region": "CA"
  },
  "time_window": {
    "start_date": "2026-05-08",
    "end_date": "2026-05-11"
  },
  "categories": ["music", "comedy", "art", "family"],
  "seed_venues": [
    "Fox Theater Oakland",
    "Oakland Museum of California",
    "The New Parish"
  ],
  "exclude_domains": [],
  "device": "mobile",
  "review_policy": {
    "require_source_url": true,
    "require_date_confidence": "medium",
    "auto_publish_high_confidence_only": false
  }
}
```

## MVP Output

```json
{
  "calendar_id": "cal_094_oakland_weekend_arts",
  "generated_at": "2026-05-02T20:00:00Z",
  "location": "Oakland, CA, US",
  "events": [
    {
      "id": "evt_001",
      "title": "Friday Nights at OMCA",
      "starts_at": "2026-05-08T17:00:00-07:00",
      "ends_at": null,
      "venue": {
        "name": "Oakland Museum of California",
        "address": "1000 Oak St, Oakland, CA"
      },
      "category": "art",
      "price_text": "Free with museum admission details on source page",
      "ticket_url": "https://example.org/events/friday-nights",
      "source_ids": ["src_001", "src_004"],
      "confidence": "high",
      "confidence_note": "Venue calendar and local SERP result agree on title, date, and venue."
    }
  ],
  "needs_review": [
    {
      "candidate_id": "cand_009",
      "reason": "SERP snippet has date, but fetched page did not expose a matching event."
    }
  ]
}
```

## Massive MCP Fit

- `account_status`: plan daily or weekly runs around available credits.
- `web_search`: discover local venue calendars, event roundups, ticketing pages, and community listings.
- Google SERP parsing: preserve query, rank, visible dates, local packs, and event result metadata.
- `web_fetch`: inspect venue calendars, JavaScript-heavy ticketing pages, and event detail pages.
- Captcha handling: retry public event pages that challenge ordinary fetches where allowed.
- Country, city, and device targeting: compare mobile and desktop local SERPs for city-specific event visibility.
- `ai_chat_completion`: extract event fields, normalize titles and venues, classify categories, detect duplicates, and explain confidence.

## Guardrails

- Preserve source provenance for every published event.
- Do not publish events without a source URL and a date.
- Treat chatbot answers and SERP snippets as leads until validated by fetched pages or multiple independent sources.
- Mark stale or ambiguous recurring events for review.
- Do not bypass authentication, paywalls, robots restrictions, private calendars, or site terms.
- Keep rejected and merged candidates auditable so users understand why an event disappeared.
- Make timezone and date parsing explicit.

## First Build

Ship as a local CLI and JSON-backed store:

```bash
event-bot create --name "Oakland Weekend Arts" --city Oakland --region CA --start 2026-05-08 --end 2026-05-11
event-bot discover cal_094_oakland_weekend_arts --category music --category art
event-bot fetch cal_094_oakland_weekend_arts --source src_001
event-bot review cal_094_oakland_weekend_arts
event-bot export cal_094_oakland_weekend_arts --format ical --out events.ics
```

Minimum viable UI after CLI validation:

- Calendar setup with city, time window, categories, device, and seed venues.
- Source table showing queries, ranks, domains, fetch status, and event counts.
- Candidate queue grouped by high confidence, duplicate, and needs review.
- Event detail panel with source evidence, normalized fields, and publish controls.
- Export controls for JSON, CSV, iCal, RSS, and Markdown.
