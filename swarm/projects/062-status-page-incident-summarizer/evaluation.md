# Evaluation

Goal: prove Status Page Incident Summarizer finds real public incidents, reconstructs timelines accurately, cites the right evidence, and produces useful reliability briefs faster than manual status-page review.

## Test Set

Use 50 benchmark monitoring runs:

- 10 vendors with clean official status pages and dated incident histories.
- 8 vendors with incident detail pages split from status overview pages.
- 6 vendors with JavaScript-rendered status dashboards.
- 5 vendors with postmortems or support articles outside the primary status page.
- 5 vendors with regional component differences.
- 4 vendors with planned maintenance that should not be treated as outages.
- 4 vendors with duplicate updates across status page, support article, and postmortem.
- 4 vendors with sparse history pages where search discovery matters.
- 4 sources that trigger captcha, bot protection, partial rendering, or blocked fetches.

For each benchmark, create human labels:

- Vendor name, domain, official status URLs, and supporting URLs.
- Date window and market target.
- True incidents in the window.
- Incidents outside the window that should be excluded.
- Incident type, affected components, region, severity, and status.
- Start time, resolution time, and duration when available.
- Duplicate source groups that should collapse into one incident.
- Evidence text and URL required to justify each accepted incident.
- Pages that are official, supporting, or out of scope.

## Metrics

Primary metrics:

- Incident recall: at least 90% of human-labeled major-or-higher incidents should be found.
- High-severity precision: at least 90% of major or critical reported incidents should be valid after human review.
- Evidence validity: 100% of accepted incidents must include source URL, evidence ID, and fetched timestamp.
- Timeline accuracy: at least 95% of reported start and resolution times must match source evidence or be explicitly marked unknown.
- Duration accuracy: at least 95% of computed durations must match the extracted timeline.
- Deduplication accuracy: at least 90% agreement with human duplicate groups.
- Official-source accuracy: at least 95% of primary evidence should come from official vendor domains or be labeled supporting.
- Digest usefulness: average reviewer score of at least 4 out of 5 for summary, vendor narratives, and recommended actions.

Secondary metrics:

- Correct classification of outage, degradation, maintenance, security, data delay, messaging delay, regional, dependency, no-impact, and unclear incidents.
- Correct filtering by requested severity, component list, and date window.
- Correct handling of unresolved active incidents.
- Correct handling of localized or regional status differences.
- SERP discovery coverage for vendors without known status URLs.
- Captcha and blocked-page detection rate.
- Credit estimate accuracy versus actual run cost.
- CSV and Markdown export readability.

## Manual Review Rubric

Score each report from 1-5:

- Source coverage: Did discovery find the official status page, incident history, detail pages, support posts, and postmortems?
- Extraction accuracy: Are reported incidents real incidents rather than badges, maintenance notices, marketing copy, or generic support text?
- Timeline handling: Are start, update, monitoring, resolution, and unknown timestamps represented correctly?
- Classification: Are incident type, severity, affected components, region, and status labels reasonable?
- Deduplication: Are repeated updates merged without losing useful evidence?
- Evidence quality: Can every claim be traced to rendered page text and source URLs?
- Narrative quality: Does the digest explain what happened and why it matters without exaggeration?
- Actionability: Are recommended actions concrete enough for support, customer success, SRE, or vendor management?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every minor-or-higher incident has at least one evidence ID.
- No major or critical claim depends only on unsupported AI inference.
- Out-of-window incidents are excluded or clearly labeled as context.
- Blocked sources are surfaced as collection gaps.
- Planned maintenance is not overstated as an unplanned outage.

## Automated Checks

Run after every incident summary:

- JSON schema validation for the final report.
- Every accepted incident must include vendor, title, type, status, severity, confidence, source URL, and evidence ID.
- Every evidence ID must resolve to a stored status observation.
- Every status observation must include URL, source type, fetch status, target, and fetched timestamp.
- Timestamps must be ISO formatted when known.
- Resolved incidents with both timestamps must have non-negative computed duration.
- Incident dates outside the requested window must be excluded unless marked as context.
- No vendor digest may cite another vendor's evidence.
- Source URLs should match the vendor domain or be labeled supporting context.
- Markdown and CSV exports must reconcile with JSON incident counts.
- Incidents below the `minimum_severity` preference must be omitted.
- Active incidents must be omitted when `include_unresolved` is false.
- Blocked fetches must not produce incident records.

## Failure Modes To Track

- Treating current component status as an historical incident.
- Treating planned maintenance as an unplanned outage.
- Confusing crawl date, page modified date, or SERP date with incident start time.
- Missing JavaScript-rendered incident histories.
- Over-counting the same incident from status overview, incident page, and postmortem.
- Merging regional incidents too aggressively and losing market-specific impact.
- Promoting vague status language into critical customer impact.
- Missing unresolved incidents because they lack resolution timestamps.
- Ignoring support articles that contain the only customer-impact details.
- Letting AI summaries cite sources that do not support the claim.

## Golden Examples

Create fixture runs before implementation:

1. Clean incident history: dated official entries map directly to incident records.
2. Split incident: overview, incident detail, and postmortem describe one outage and should dedupe.
3. Current degradation: active unresolved incident should appear only when enabled by output preferences.
4. Planned maintenance: scheduled work should be informational unless unexpected impact is reported.
5. Regional outage: US region impacted but EU unaffected; market context must be preserved.
6. JavaScript dashboard: incident entries only appear after rendering.
7. Support-only impact: status page says degraded while support article explains affected customer workflow.
8. Blocked source: captcha prevents fetch and should be reported as a collection gap.

Each fixture should include:

- Input monitoring brief.
- Discovered source candidates.
- Rendered status observations.
- Human-labeled incident list.
- Duplicate groups.
- Expected digest summary.
- Expected recommended actions.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 50-run benchmark completes with no schema failures.
- Major-or-higher incident recall is at least 90%.
- Major/critical precision is at least 90%.
- Evidence validity is 100%.
- Timeline accuracy is at least 95%.
- Duration accuracy is at least 95%.
- Deduplication accuracy is at least 90%.
- Average digest usefulness score is at least 4 out of 5.
- Median review time for a 10-vendor monthly brief is under 20 minutes.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
