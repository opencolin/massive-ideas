# Evaluation

Goal: prove Travel Itinerary Freshness Checker catches meaningful stale itinerary assumptions while staying calibrated, source-backed, and clearly framed as public travel information rather than legal advice.

## Test Set

Use 50 benchmark itinerary items across at least 10 destinations:

- 8 stable attractions with normal hours that should pass as likely current.
- 8 attractions with seasonal, weekly, holiday, or temporary closures.
- 6 items with timed-entry, advance reservation, permit, or capacity requirements.
- 6 transit-dependent items with ferry, rail, road, shuttle, airport, or trailhead access changes.
- 5 neighborhood or destination items with visitor-facing local rules or conduct guidance.
- 5 restaurants, markets, or small venues where hours vary across official and third-party sources.
- 4 outdoor or park items where weather, fire, maintenance, or seasonal access affects plans.
- 4 intentionally ambiguous items lacking address, date, or category clarity.
- 4 stale-trap items where old blogs conflict with current official pages.

For each item, create a human-labeled benchmark:

- Expected review status and severity.
- Canonical official sources and acceptable secondary sources.
- Known stale, misleading, or duplicated sources.
- Expected closure, hours, reservation, transport, or local-rule facts.
- Required caveats for date, timezone, season, holiday, geography, and source freshness.
- Disallowed claims, especially legal conclusions or guaranteed availability.
- Recommended traveler verification prompt.

## Baselines

Compare against:

- Manual review of top Google results by a human after 10 minutes.
- Single Google-style search summarized without rendered fetches.
- Single `ai_chat_completion` answer with sources.
- Official-source-only fetch without SERP discovery.
- Static itinerary validation that checks dates but does not use public web evidence.

The MVP should show measurable gains in closure detection, hour mismatch detection, source traceability, and uncertainty handling.

## Metrics

Primary metrics:

- Review status accuracy: at least 85% match with human labels.
- High-severity recall: at least 90% of closure, unavailable, reservation-needed, and rule-to-verify items are flagged.
- Source validity: at least 95% of cited sources are relevant, public, and inspectable.
- Official-source coverage: at least 85% of high-severity findings include an official source or explicit note that no official source was found.
- Overclaim rate: fewer than 5% of reports present volatile hours, availability, or local rules as guaranteed.
- Public-information framing: 100% of reports that mention rules include a not-legal-advice disclaimer.

Secondary metrics:

- Correct timezone handling for planned item times.
- Correct holiday and seasonal-date handling.
- SERP snippet corroboration rate.
- JavaScript-rendered page success rate.
- Captcha-challenge outcome logging.
- Duplicate-source suppression rate.
- Median runtime and cost per itinerary item.
- User-rated usefulness for deciding what to verify before travel.

## Manual Review Rubric

Score each report from 1-5:

- Usefulness: Does it help a traveler know what to confirm or adjust?
- Evidence quality: Are official and high-quality sources prioritized?
- Traceability: Can every finding be tied to URL, source type, excerpt, timestamp, and fetch profile?
- Calibration: Does confidence match the evidence strength and freshness?
- Freshness: Does it handle date, season, timezone, holiday, and temporary closure language correctly?
- Safety: Does it avoid legal advice, guarantees, and unsupported compliance claims?
- Brevity: Is the traveler summary concise without hiding important uncertainty?

An output is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-severity finding lacks a source URL or explicit missing-source explanation.
- Every rule-like statement is framed as a public-source summary.
- The report distinguishes official evidence from third-party or SERP evidence.
- Traveler prompts are actionable without implying legal advice.

## Automated Checks

Run after every report:

- JSON schema validation.
- Every itinerary item has id, name, planned_start, status, confidence, and evidence array.
- Every cited source has URL, source type, fetched timestamp, fetch status, final URL, render status, country, city, and device.
- Every `closed_or_unavailable`, `reservation_needed`, or `rule_to_verify` finding has at least one fetched source or an explicit unresolved reason.
- Every local-rule section includes "public information" and "not legal advice" language.
- Confidence is between 0 and 1.
- Status is one of the allowed review statuses.
- No finding uses guarantee language such as "will be open" unless quoting a source and caveating observation time.
- Planned local time and destination timezone are present for each item.
- Duplicate domains and syndicated copies are flagged before scoring.

## Failure Modes To Track

- Trusting stale travel blogs over current official pages.
- Treating a Google business-profile snippet as definitive without fetched corroboration.
- Missing closure notices hidden behind JavaScript calendars.
- Confusing regular hours with holiday or seasonal hours.
- Failing to convert planned item times into destination timezone.
- Collapsing local visitor guidance into legal advice.
- Overlooking country, city, language, or mobile-specific variants.
- Missing temporary transport changes that affect access to an attraction.
- Citing sources that mention a venue but do not answer the itinerary question.
- Producing too many low-value warnings and making the report noisy.

## Golden Examples

Create fixtures for:

1. Normal open hours: official page confirms planned visit fits published hours.
2. Weekly closure: itinerary schedules a museum on its regular closed day.
3. Timed entry: official ticket page requires advance reservation.
4. Temporary closure: official notice says trail or venue is closed during trip dates.
5. Conflicting hours: official page and third-party snippet disagree.
6. Local rule: official city page publishes visitor conduct or access guidance.
7. Transit disruption: official operator page changes access to the planned item.
8. Stale blog trap: old guide contradicts current venue calendar.
9. JS-rendered calendar: closure data appears only after rendered fetch.
10. Unknown: no current official public source is available.

Each fixture should include:

- Input itinerary item.
- Search queries and SERP snippets.
- Fetched source excerpts and metadata.
- Expected extracted facts.
- Expected status, confidence range, and traveler prompt.
- Sources that should be excluded or downweighted.

## Launch Criteria

The MVP is ready for first users when:

- 50-item benchmark completes without crashes.
- Review status accuracy is at least 85%.
- High-severity recall is at least 90%.
- Source validity is at least 95%.
- Public-information framing passes automated checks.
- Median run cost and runtime are shown before execution and recorded after completion.
- Markdown, JSON, and CSV reports are readable without manual cleanup.
- At least 80% of pilot users say the tool helped them decide what to verify before travel.
