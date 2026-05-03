# Travel Itinerary Freshness Checker

Travel Itinerary Freshness Checker reviews a planned trip against current public information about attraction closures, seasonal hours, timed-entry requirements, transit disruptions, weather-sensitive access, and local visitor rules. It turns a static itinerary into a source-backed travel information summary so travelers can spot items that need confirmation before they go.

The product is a public travel information assistant, not legal advice. It summarizes public sources, highlights uncertainty, and points users to official pages to verify. It does not decide whether a traveler is legally allowed to do something, replace local authorities, or provide personalized legal, immigration, health, or safety advice.

## Problem

Travel plans go stale quickly. A museum may close one wing on Tuesdays, a trail may shut for fire recovery, a ferry timetable may change by season, a city may require reservations for a viewpoint, or a destination may publish visitor rules that are different from what older blogs say. Search results often mix current official pages with outdated travel articles, scraped opening hours, AI snippets, and forum posts.

This checker gives users a repeatable way to refresh an itinerary shortly before travel. It separates confirmed changes from weak signals, preserves evidence, and makes it obvious where a traveler should click through or contact the venue.

## Target Users

- Independent travelers reviewing a trip before departure.
- Travel advisors checking client itineraries for stale assumptions.
- Group trip planners coordinating attractions, transport, restaurants, and local activities.
- Tour operators monitoring recurring routes and seasonal operating changes.
- Destination marketers or concierge teams preparing source-backed visitor updates.

## Inputs

- Trip destination, country, city, dates, timezone, party details, and preferred language.
- Itinerary items with name, address or coordinates, category, planned date and time, booking status, source URL, and notes.
- Freshness concerns, such as closures, opening hours, reservation rules, local visitor requirements, transport access, holidays, weather closures, or neighborhood restrictions.
- Source preferences, such as official sources only, include recent news, include Google SERP snippets, or include venue social pages.
- Search and fetch targeting by country, city, device, and language to see traveler-localized public pages.

## Public Sources

Preferred source types:

- Official attraction, park, museum, venue, restaurant, transit, airport, ferry, rail, tourism board, city, and government pages.
- Official hours pages, calendars, ticketing pages, closure notices, visitor rules, advisories, FAQs, PDFs, and public alerts.
- Public map, business profile, or SERP snippets when clearly labeled as third-party observations.
- Recent local news or destination authority posts when official pages are sparse.

Excluded source types:

- Private accounts, booking dashboards, loyalty portals, payment flows, non-public records, or leaked documents.
- Attempts to bypass access controls, paywalls, robots restrictions, or private reservation systems.
- Legal conclusions about whether the traveler complies with a rule.

## Core Workflow

1. User uploads or enters itinerary items and trip context.
2. App checks available quota and capabilities with `account_status`.
3. App discovers public sources with `web_search`, including localized Google SERP parsing for each destination or itinerary item.
4. App fetches official and high-signal secondary pages with `web_fetch`, using JavaScript rendering, captcha handling, and country/city/device targeting.
5. App uses `ai_chat_completion` to extract hours, closure dates, reservation requirements, transport access notes, and public local-rule summaries from fetched evidence.
6. App compares extracted facts against the planned itinerary and produces a public information summary with freshness risks, evidence links, confidence, and verification prompts.

## MVP Output

Each run produces:

- Trip freshness summary with destination, travel dates, run timestamp, and scope.
- Item-by-item review table with status: likely current, needs confirmation, conflict found, closed or unavailable, rule to verify, or insufficient public evidence.
- Source-backed findings with topic, public-source summary, source URL, source type, observed date, excerpt, and confidence.
- Suggested itinerary adjustments framed as planning prompts, such as "consider moving this to Wednesday" or "verify timed-entry availability on the official ticket page."
- Local public rules section for visitor-facing rules, clearly labeled as public information rather than legal advice.
- Missing-evidence notes for items where no current official source was found.

## Massive MCP Fit

- `account_status`: preflight quota and feature availability before multi-item itinerary scans.
- `web_search`: discover official venue pages, advisories, calendars, public alerts, transport updates, and localized SERP snippets.
- Google SERP parsing: capture current snippets, business-profile hours, result freshness, and conflicting public summaries.
- `web_fetch`: retrieve public pages with JavaScript rendering, captcha handling, and country/city/device targeting.
- `ai_chat_completion`: normalize dates, hours, closure notices, local public rules, uncertainty, and traveler-readable summaries with citations.

## Guardrails

- Frame outputs as public travel information summaries, not legal advice.
- Require source links and excerpts for every closure, hours, or rule-like claim.
- Prefer official sources; label third-party sources and SERP snippets as weaker evidence.
- Preserve observed timestamp, fetch location, device, render status, final URL, and source type.
- Distinguish "source says this rule exists" from "this rule applies to you."
- Do not access private bookings, accounts, payment pages, traveler documents, or non-public systems.
- Avoid guarantees. Hours, closures, reservations, weather access, and local rules can change without notice.

## Example Summary

```text
Trip: Kyoto, Japan, Oct 12-17 2026
Scope: Public sources collected on 2026-05-02 from US desktop and JP mobile views

Finding:
- Fushimi Inari Shrine appears open 24 hours on official tourism pages, but nearby facilities and shops have separate hours.
- Kyoto City public visitor guidance mentions crowd-management requests in popular districts.
- A planned Monday museum stop needs confirmation because the official calendar shows regular Monday closure.

Verification:
- Check the museum's official calendar before finalizing the day plan.
- Confirm any timed-entry or reservation requirements on official ticket pages.
- Treat visitor-rule notes as public information, not legal advice.
```

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown reports:

```bash
itinerary-freshness run \
  --config itinerary.json \
  --out freshness.json \
  --csv itinerary-review.csv \
  --report-md travel-summary.md
```

Minimum viable UI after CLI validation:

- Itinerary upload and item normalization.
- Destination, date, country, city, language, and device controls.
- Evidence table with source type, timestamp, fetch metadata, and excerpt.
- Item detail view with planned assumption versus current public observation.
- Filters for closure risk, hour mismatch, reservation needed, local rule, and low confidence.
- Export to Markdown, CSV, JSON, or printable traveler brief.
