# Prototype

## Prototype Goal

Build a CLI prototype that accepts a structured itinerary and produces a source-backed freshness report for closures, hours, reservation requirements, transport disruptions, and local visitor rules. The prototype should prove that Massive MCP can discover current public travel sources, fetch rendered pages, compare them against planned itinerary assumptions, and produce a concise public information summary.

## Command Shape

```bash
itinerary-freshness run \
  --config itinerary-config.json \
  --out freshness-report.json \
  --report-md freshness-report.md \
  --csv itinerary-review.csv
```

## Config Example

```json
{
  "trip": {
    "name": "Kyoto fall trip",
    "destination": { "city": "Kyoto", "country": "jp", "timezone": "Asia/Tokyo" },
    "dates": { "start": "2026-10-12", "end": "2026-10-17" },
    "traveler_context": {
      "origin_country": "us",
      "language": "en",
      "party_size": 2
    }
  },
  "itinerary_items": [
    {
      "id": "day2-museum",
      "name": "Kyoto National Museum",
      "category": "museum",
      "planned_start": "2026-10-13T10:00:00+09:00",
      "planned_duration_minutes": 120,
      "address": "527 Chayacho, Higashiyama Ward, Kyoto",
      "assumptions": ["open Tuesday morning", "walk-up tickets available"],
      "source_url": "https://example-travel-blog.test/kyoto-museum-guide"
    },
    {
      "id": "day3-district",
      "name": "Gion evening walk",
      "category": "neighborhood",
      "planned_start": "2026-10-14T19:00:00+09:00",
      "assumptions": ["public streets open", "no special visitor restrictions"]
    }
  ],
  "freshness_checks": ["closures", "hours", "reservations", "local_rules", "transit_access"],
  "source_policy": {
    "official_sources_first": true,
    "include_recent_news": true,
    "include_serp_snippets": true,
    "max_sources_per_item": 8
  },
  "fetch_options": {
    "render_js": true,
    "country": "jp",
    "city": "Kyoto",
    "device": "mobile"
  }
}
```

## Pipeline

1. Load config and validate item dates against trip dates and destination timezone.
2. Call `account_status` to estimate scan budget for search, fetch, rendering, and chatbot extraction.
3. Generate item-specific queries for official pages, hours, closure notices, calendar pages, ticket pages, local rules, transport access, holidays, and recent advisories.
4. Use `web_search` and Google SERP parsing with country, city, language, and device targeting.
5. Rank sources by authority: official venue or agency pages, destination authorities, transit operators, recent local news, then third-party guides.
6. Fetch selected pages with `web_fetch`, JavaScript rendering, captcha handling, and the configured targeting profile.
7. Extract visible facts with `ai_chat_completion`:

```json
{
  "source_url": "https://example.gov/visitor-guidance",
  "source_type": "official_government",
  "facts": [
    {
      "topic": "local_rule",
      "summary": "The public page asks visitors not to photograph private roads in the district.",
      "date_scope": "current public guidance",
      "evidence_text": "Visitor guidance mentions photography restrictions on private roads.",
      "confidence": "medium"
    }
  ]
}
```

8. Normalize hours, dates, holidays, closure windows, reservation windows, and timezones.
9. Compare normalized facts against each itinerary item and assign a review status.
10. Write JSON, Markdown, and CSV outputs with evidence, confidence, and verification prompts.

## Data Model

### Itinerary Item Observation

```json
{
  "item_id": "day2-museum",
  "name": "Kyoto National Museum",
  "planned_start": "2026-10-13T10:00:00+09:00",
  "planned_assumptions": ["open Tuesday morning", "walk-up tickets available"],
  "observations": [
    {
      "topic": "hours",
      "public_source_summary": "Official calendar shows open 9:30-17:00 on the planned date.",
      "source_url": "https://example.jp/calendar",
      "source_type": "official_venue",
      "observed_at": "2026-05-02T17:00:00Z",
      "fetch_profile": { "country": "jp", "city": "Kyoto", "device": "mobile" },
      "confidence": "high"
    }
  ]
}
```

### Finding

```json
{
  "item_id": "day3-district",
  "status": "rule_to_verify",
  "severity": "medium",
  "topic": "local_rule",
  "planned_assumption": "no special visitor restrictions",
  "public_information_summary": "Official city visitor guidance describes behavior requests for the district and points visitors to posted notices.",
  "source_url": "https://example.kyoto.lg.jp/visitor-guidance",
  "evidence_text": "The page lists public visitor manners and district-specific notices.",
  "confidence": 0.72,
  "traveler_prompt": "Review the official visitor guidance before the evening walk. This is public information, not legal advice."
}
```

## Review Statuses

- `likely_current`: official or high-quality sources support the planned assumption.
- `needs_confirmation`: evidence is partial, stale, ambiguous, or only third-party.
- `conflict_found`: public sources disagree with each other or with the itinerary.
- `closed_or_unavailable`: official public source indicates closure, no service, or no availability for the planned time.
- `reservation_needed`: public source indicates timed entry, advance booking, permit, or capacity control.
- `rule_to_verify`: public source mentions visitor-facing rules, restrictions, permits, or conduct guidance.
- `insufficient_public_evidence`: no relevant current public source was found.

## Markdown Report Layout

- Trip summary and public-information disclaimer.
- Top itinerary risks.
- Day-by-day review table.
- Closure and hour mismatches.
- Reservation and timed-entry checks.
- Local public rules to verify.
- Transport or access advisories.
- Source inventory with timestamps and fetch profiles.
- Items with insufficient public evidence.

## Prototype Constraints

- Limit the first run to 25 itinerary items and 8 sources per item.
- Require at least one fetched source for each high-severity finding.
- Treat SERP snippets as clues unless corroborated by fetched pages.
- Do not make bookings, submit forms, log in, or access private trip records.
- Do not present local-rule summaries as legal advice or compliance determinations.
- Store raw fetch metadata so reviewers can reproduce observations.

## Future UI

- Calendar-style itinerary import and manual item editor.
- Item cards with status, confidence, source count, and planned-time fit.
- Side-by-side planned assumption versus current public source evidence.
- Map view for neighborhood or access advisories.
- Traveler brief export with only the highest-priority verification tasks.
- Recurring monitoring for trips, tours, or standard agency templates.
