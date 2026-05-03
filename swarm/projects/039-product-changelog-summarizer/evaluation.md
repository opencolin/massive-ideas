# Evaluation

Goal: prove Product Changelog Summarizer finds real competitor product changes, cites the right evidence, and produces a useful digest faster than manual changelog review.

## Test Set

Use 50 benchmark monitoring runs:

- 10 SaaS competitors with official changelog pages.
- 8 competitors with release notes split across docs, blog, and help center.
- 6 competitors with JavaScript-rendered changelog feeds.
- 5 competitors with pricing or packaging updates mixed into marketing pages.
- 5 mobile-first products with app-store release notes.
- 5 companies with regional release availability or localized pricing pages.
- 4 competitors with noisy docs updates that should not become product changes.
- 4 competitors with duplicate announcements across blog, docs, and changelog.
- 3 sources that trigger captcha, bot protection, or partial fetch failures.

For each benchmark, create human labels:

- Competitor name, domain, and source URLs.
- Date window and market target.
- True product changes in the window.
- Changes outside the window that should be excluded.
- Change type, product area, buyer segment, and impact label.
- Duplicate source groups that should collapse into one change.
- Evidence text and URL required to justify each accepted change.
- Pages that are official, supporting, or out of scope.

## Metrics

Primary metrics:

- Change recall: at least 90% of human-labeled medium-or-higher changes should be found.
- High-impact precision: at least 90% of high or critical reported changes should be valid after human review.
- Evidence validity: 100% of accepted changes must include source URL, evidence ID, and fetched timestamp.
- Date accuracy: at least 95% of reported dates must match source evidence or be explicitly marked unknown.
- Deduplication accuracy: at least 90% agreement with human duplicate groups.
- Official-source accuracy: at least 95% of primary evidence should come from official domains or be labeled supporting.
- Digest usefulness: average reviewer score of at least 4 out of 5 for executive summary and recommended actions.

Secondary metrics:

- Correct classification of feature, AI, pricing, integration, security, UX, deprecation, docs-only, and unclear changes.
- Correct filtering by requested product areas, buyer segments, and keywords.
- Correct handling of localized or regional release differences.
- SERP discovery coverage for competitors without known changelog URLs.
- Captcha and blocked-page detection rate.
- Credit estimate accuracy versus actual run cost.
- CSV and Markdown export readability.

## Manual Review Rubric

Score each report from 1-5:

- Source coverage: Did discovery find the obvious official changelog, docs, release-note, and pricing sources?
- Extraction accuracy: Are reported changes real product changes rather than navigation text, marketing copy, or generic docs edits?
- Date handling: Are in-window, out-of-window, and unknown-date changes treated correctly?
- Classification: Are change type, product area, impact, and audience labels reasonable?
- Deduplication: Are repeated announcements merged without losing useful evidence?
- Evidence quality: Can every claim be traced to rendered page text and source URLs?
- Narrative quality: Does the digest explain what changed and why it matters without exaggeration?
- Actionability: Are recommended actions concrete enough for product, marketing, or sales teams?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every medium-or-higher change has at least one evidence ID.
- No reported high-impact claim depends only on unsupported AI inference.
- Out-of-window changes are excluded or clearly labeled as context.
- Blocked sources are surfaced as collection gaps.

## Automated Checks

Run after every changelog summary:

- JSON schema validation for the final report.
- Every accepted change must include competitor, title, change type, impact, confidence, source URL, and evidence ID.
- Every evidence ID must resolve to a stored source observation.
- Every source observation must include URL, source type, fetch status, target, and fetched timestamp.
- Dates must be ISO formatted when known.
- Change dates outside the requested window must be excluded unless marked as context.
- No competitor digest may cite another competitor's evidence.
- Source URLs should match the competitor domain or be labeled supporting context.
- Markdown and CSV exports must reconcile with JSON change counts.
- Low-confidence changes must be omitted when `include_low_confidence` is false.
- Impact values must obey the minimum-impact output preference.
- Blocked fetches must not produce product changes.

## Failure Modes To Track

- Treating crawl date, page modified date, or SERP date as the release date.
- Over-counting the same announcement from changelog, docs, and blog pages.
- Missing JavaScript-rendered changelog entries.
- Treating documentation wording changes as product launches.
- Promoting vague marketing claims into high-impact competitive signals.
- Confusing partner announcements with first-party product releases.
- Missing pricing or packaging updates because they are outside changelog pages.
- Losing localized differences by merging market-specific pages too aggressively.
- Including stale app-store release notes outside the requested window.
- Letting AI summaries cite sources that do not support the claim.

## Golden Examples

Create fixture runs before implementation:

1. Clean changelog: dated official entries map directly to product changes.
2. Split announcement: blog post, docs page, and changelog entry describe one release and should dedupe.
3. Pricing update: plan limit change appears on pricing and help-center pages but not the changelog.
4. Docs-only update: page says docs were reorganized and should not become a feature launch.
5. AI feature launch: new assistant capability with enterprise availability and high impact.
6. Regional rollout: feature is available in the US but not EU; market context must be preserved.
7. JavaScript feed: changelog entries only appear after rendering.
8. Blocked source: captcha prevents fetch and should be reported as a collection gap.

Each fixture should include:

- Input monitoring brief.
- Discovered source candidates.
- Rendered source observations.
- Human-labeled change list.
- Duplicate groups.
- Expected digest summary.
- Expected recommended actions.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 50-run benchmark completes with no schema failures.
- Medium-or-higher change recall is at least 90%.
- High/critical precision is at least 90%.
- Evidence validity is 100%.
- Date accuracy is at least 95%.
- Deduplication accuracy is at least 90%.
- Average digest usefulness score is at least 4 out of 5.
- Median review time for a 10-competitor monthly digest is under 30 minutes.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
