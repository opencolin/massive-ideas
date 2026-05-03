# Evaluation

Goal: prove Alternative Data Feed can produce useful, source-backed public web signals that are faster and more reliable than manual monitoring of job posts, pricing pages, and public company pages.

## Test Set

Use 60 company-week fixtures across at least three categories:

- 15 high-growth B2B SaaS companies with frequent hiring and product updates.
- 10 mature public software companies with broad public page footprints.
- 10 infrastructure or developer-tool companies where docs and integrations are strong signals.
- 10 vertical SaaS companies where regional pages and customer pages matter.
- 10 companies with sparse public updates to test false-positive control.
- 5 intentionally ambiguous companies with name collisions, subsidiaries, or stale job-board pages.

For each fixture, create a human-labeled benchmark:

- known company domain and allowed source domains
- expected public source map
- material job changes and ignored evergreen roles
- material pricing or packaging changes
- new product, docs, integration, or changelog signals
- regional expansion signals
- positioning changes worth reporting
- disallowed claims and likely false positives

## Metrics

Primary metrics:

- Event precision: at least 85% of reported events should be judged materially correct by reviewers.
- Source support: at least 95% of observed facts should have a valid source URL and evidence excerpt.
- Fact-inference separation: 100% of events should separate observed fact from interpretation.
- Material change recall: detect at least 75% of human-labeled high-materiality events.
- Time saved: reduce a first-pass weekly watchlist review from 4-8 hours to under 45 minutes.

Secondary metrics:

- Correct signal classification by type.
- Correct company-domain matching for ambiguous names.
- Duplicate event rate across pages and SERP results.
- Job-post deduplication accuracy.
- Pricing extraction accuracy for plan, price, currency, period, and limits.
- Regional targeting relevance across country, city, and device variants.
- Blocked or partial fetch rate by source type.
- Cost per company-week monitored.

## Manual Review Rubric

Score each feed from 1-5:

- Evidence quality: Are events grounded in inspectable public sources?
- Materiality: Would the signal plausibly matter to the target user?
- Interpretation restraint: Does the system avoid overstating intent, revenue impact, or causality?
- Coverage: Did it find the obvious careers, pricing, product, and docs changes?
- Noise control: Did it suppress cosmetic page changes, duplicates, and stale reposts?
- Usability: Can a reviewer understand the company, signal, source, and uncertainty quickly?

A feed is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-materiality event lacks a source.
- No investment recommendation or private intent claim is presented as fact.
- Observed facts and interpretations are visibly distinct.
- Duplicate events are below 10% of the feed.
- Search-only events are labeled as discovery evidence unless fetched-page evidence confirms them.

## Automated Checks

Run after every feed generation:

- JSON schema validation for all snapshots, events, and feed exports.
- Every event must include company, domain, signal type, observed fact, confidence, score, and evidence.
- Every evidence item must include a valid HTTP(S) URL.
- Confidence must be a number from 0 to 1.
- Score must be an integer from 0 to 100.
- Materiality must be `low`, `medium`, or `high`.
- Events without fetched first-party evidence must have confidence capped at 0.7.
- Search-only events must have score capped at 60.
- Investment-advice phrases must be blocked from generated interpretations.
- Event observed dates cannot be in the future.
- Source domains must match allowed company domains or approved third-party sources.
- Prior and current snapshot IDs must reconcile for every diff-based event.

## Failure Modes To Track

- Treating an evergreen job post as a fresh hiring signal.
- Counting duplicate job posts from ATS pages and job-board mirrors.
- Reporting A/B test copy or localized content as a global change.
- Missing pricing changes hidden behind JavaScript toggles or region selectors.
- Overstating a page addition as a confirmed product launch.
- Confusing similarly named companies, subsidiaries, or unrelated app listings.
- Letting chatbot output introduce facts absent from source text.
- Blending weak signals into a single high-confidence story.
- Ignoring blocked fetches instead of surfacing collection gaps.
- Producing a feed that is too noisy for weekly review.

## Golden Examples

Create fixture bundles before implementation:

1. Hiring spike: company adds many first-party roles across one department and two cities.
2. Evergreen jobs: company has many job URLs but no meaningful week-over-week change.
3. Pricing change: plan price and feature limits change behind rendered pricing cards.
4. Product surface expansion: new integration page, docs page, and changelog entry appear together.
5. Regional variant: country-targeted fetch shows different prices or landing pages.
6. Positioning-only change: homepage or comparison copy changes without product evidence.
7. Ambiguous company: SERP includes unrelated brands with similar names.

Each fixture should include:

- input watchlist row
- source map
- raw SERP records
- fetched page excerpts
- prior and current normalized snapshots
- expected events
- expected suppressed non-events
- acceptable confidence and score ranges

## Launch Criteria

The MVP is ready for first users when:

- 60 company-week benchmark completes without crashes.
- Event precision is at least 85%.
- High-materiality event recall is at least 75%.
- Source support is at least 95%.
- Duplicate event rate is below 10%.
- Median reviewer time is under 45 minutes per weekly feed.
- Blocked, skipped, and partial pages are visible in the run log.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
