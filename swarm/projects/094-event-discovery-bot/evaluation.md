# Evaluation

Goal: prove the event discovery bot can collect useful local events from venue calendars and local SERPs while preserving provenance, avoiding duplicates, and keeping uncertain events out of auto-published feeds.

## Test Set

Use 45 discovery scenarios:

- 8 weekend city calendars across different US metros.
- 6 venue-seed scenarios with JavaScript-heavy calendars.
- 5 music and nightlife scenarios with ticketing pages and age restrictions.
- 5 family and community scenarios with free or civic events.
- 5 arts, museum, and gallery scenarios with recurring events.
- 4 tourism-board scenarios using aggregator and official venue sources.
- 4 mobile-vs-desktop local SERP scenarios.
- 4 sparse or rural scenarios where the correct result includes few events and clear gaps.
- 4 adversarial scenarios with stale roundups, postponed events, duplicate pages, or ambiguous venues.

For each scenario, create a human-labeled benchmark:

- Location, date range, categories, and device.
- Required seed venues and known important sources.
- Known stale, duplicate, syndicated, or irrelevant sources.
- Events that should be published, merged, rejected, or marked needs review.
- Expected title, date, venue, ticket URL, category, and price fields.
- Confidence caps for snippet-only, stale, or aggregator-only evidence.
- Expected gaps and manual-review notes.

## Metrics

Primary metrics:

- Event precision: at least 90% of published events are real, public, in scope, and within the requested date range.
- Event recall: at least 80% of benchmark-important events are discovered.
- Date accuracy: at least 95% of published event start dates are correct.
- Venue accuracy: at least 95% of published events have the correct venue name.
- Source provenance completeness: 100% of published events include at least one source URL.
- Duplicate suppression: at least 95% of duplicate event candidates merge into one event cluster.
- Unsafe auto-publish prevention: 100% of unknown-date, past, cancelled, or conflicting-date events are rejected or marked needs review.

Secondary metrics:

- Correct category classification.
- Correct timezone normalization.
- Correct mobile and desktop SERP targeting.
- Freshness against the requested date window.
- Ticket URL preservation.
- Price and age-limit extraction accuracy.
- Fetch success on JavaScript-rendered calendars.
- Cost per discovery run by city, category, and time window.
- Export completeness for JSON, CSV, iCal, RSS, and Markdown.

## Manual Review Rubric

Score each generated calendar from 1-5:

- Scope fit: Are events in the requested city, categories, and date range?
- Source quality: Are venue, organizer, ticketing, or authoritative local sources prioritized?
- Field quality: Are title, date, venue, URL, price, and category usable?
- Confidence quality: Are uncertain or conflicting events flagged clearly?
- Deduplication quality: Are repeated listings merged without losing useful source links?
- Freshness: Does the feed avoid stale roundups and expired event pages?
- Reviewability: Can a human quickly understand where each event came from?

A calendar is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every published event has a source URL and parsed date.
- No cancelled, past, private, or out-of-scope event is auto-published.
- Duplicate clusters preserve all useful source IDs.
- SERP source records preserve query, rank, country, city, device, and timestamp.
- Fetched source records preserve URL, fetch timestamp, status, rendering settings, and extracted text summary.
- Chatbot-derived inferences are represented as confidence notes, not standalone evidence.

## Automated Checks

Run after every discovery job:

- Validate calendar, source, venue, candidate, cluster, and run records against JSON schemas.
- Every candidate has a valid source ID.
- Every published event has a title, source URL, date, city, and status.
- Event dates fall within the requested time window unless explicitly marked recurring or needs review.
- Event timestamps include timezone or timezone inference metadata.
- Excluded domains do not appear in source records or exports.
- SERP records include query, rank, country, city, and device.
- Fetched records include fetch timestamp, status, rendering settings, and source URL.
- Confidence values are only `high`, `medium`, `low`, or `unknown`.
- Snippet-only events cannot exceed low confidence.
- Aggregator-only events cannot exceed medium confidence without corroboration.
- Conflicting dates force needs-review status.
- Cancelled, postponed, sold-out, and private indicators are captured in notes.
- iCal export validates and contains no duplicate UID values.

## Failure Modes To Track

- Publishing stale events from old roundups.
- Treating recurring event descriptions as specific upcoming dates.
- Losing the source query, rank, geography, device, or timestamp.
- Missing event cards because JavaScript rendering was skipped.
- Over-merging separate events with similar names at the same venue.
- Under-merging duplicate listings from ticketing sites and venue calendars.
- Confusing venue names with neighborhood, city, or promoter names.
- Parsing doors time as event start time without noting uncertainty.
- Ignoring cancelled, postponed, private, age-restricted, or sold-out indicators.
- Producing exports that hide confidence or source provenance.

## Golden Examples

Create fixture calendars before implementation:

1. Weekend arts guide: multiple venue calendars and a local newspaper roundup.
2. Music calendar: ticketing pages, venue pages, age limits, and sold-out indicators.
3. Family events: civic, library, museum, and parks calendars.
4. Tourism board: official events mixed with stale aggregator listings.
5. JavaScript calendar: events visible only after rendering.
6. Mobile local SERP: result ordering and snippets differ from desktop.
7. Sparse rural area: few valid events and explicit coverage gaps.
8. Ambiguous venue: similarly named venues in nearby cities.
9. Recurring event: weekly listing with unclear next occurrence.
10. Cancellation case: original event page exists, but current page says postponed.

Each fixture should include:

- Input calendar request.
- Expected search plan and seed venues.
- Raw SERP records.
- Fetched page excerpts.
- Extracted candidates.
- Expected duplicate clusters.
- Published, rejected, and needs-review events.
- Confidence notes and caps.
- Expected JSON, CSV, iCal, RSS, and Markdown export checks.

## Launch Criteria

The MVP is ready for first users when:

- 45-scenario benchmark completes without crashes.
- Event precision is at least 90%.
- Event recall is at least 80%.
- Date accuracy is at least 95%.
- Venue accuracy is at least 95%.
- Source provenance completeness reaches 100%.
- Duplicate suppression is at least 95%.
- Unsafe auto-publish prevention reaches 100%.
- Median human review time for a standard city weekend calendar is under 8 minutes.
- Credit usage is logged for every search, fetch, extraction, dedupe, and export run.
