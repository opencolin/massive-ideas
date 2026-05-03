# Evaluation

Goal: prove Competitor Content Velocity Tracker identifies meaningful competitor publishing and SERP movement faster than manual monitoring, while avoiding noisy alerts from duplicate URLs, low-relevance pages, inferred dates, or thin SERP artifacts.

## Test Set

Use 30 tracking runs:

- 6 runs with clear competitor blog or guide acceleration.
- 5 runs with comparison and alternative pages where SERP movement matters more than net-new volume.
- 4 runs with documentation or changelog updates that may indicate product or messaging shifts.
- 4 runs with regional or mobile-specific SERP differences.
- 3 runs with sparse competitor activity where the correct output is a quiet report.
- 3 runs with ambiguous pages such as jobs, press, support, or login results that should be excluded.
- 3 runs with canonicalization and duplicate URL issues.
- 2 runs with uncertain publish dates where confidence should be capped.

For each run, create a human-labeled benchmark:

- Competitor domains and tracked topics
- Known new pages, updated pages, unchanged pages, and irrelevant pages
- SERP ranks by query, country, city, and device
- Expected content type for each relevant URL
- Expected topic cluster for each relevant URL
- Pages that should be excluded
- Expected alert severity and recommended response
- Disallowed claims, especially inferred traffic, revenue, or private strategy

## Metrics

Primary metrics:

- New-page detection precision: at least 90% of pages labeled new should be truly new to the tracker and relevant to tracked topics.
- Relevant movement recall: at least 80% of human-labeled significant competitor movements should appear in the report.
- Evidence validity: at least 95% of alerts and page claims should include inspectable source lineage.
- Noise control: fewer than 10% of high-severity alerts should be caused by excluded, duplicate, or low-relevance pages.
- Time saved: reduce weekly competitor content review from 2-4 hours to under 20 minutes of review.

Secondary metrics:

- Content type classification accuracy across blog, guide, comparison, landing page, docs, changelog, webinar, and case study.
- Topic classification agreement with human labels.
- Publish-date confidence calibration.
- SERP rank delta accuracy against stored snapshots.
- Canonical URL deduplication precision.
- Device and geography separation accuracy.
- Credit estimate accuracy before execution.
- Helpfulness of recommended response in reviewer ratings.

## Manual Review Rubric

Score each competitor report from 1-5:

- Signal quality: Does it surface real competitor motion instead of generic activity?
- Evidence quality: Are every alert and page-level claim tied to source URLs, ranks, fetches, or diffs?
- Relevance: Does the report stay within the tracked topics and exclusions?
- Freshness: Does it correctly distinguish new, updated, unchanged, and uncertain pages?
- Strategic usefulness: Does the recommended response help a content or growth team decide what to do next?
- Restraint: Does it avoid unsupported claims about traffic, intent, revenue, or confidential strategy?
- Readability: Can a reviewer understand what changed without opening every source?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every high-severity alert has at least two evidence items or a clear low-confidence warning.
- Every SERP claim includes query, rank, geography, device, URL, and observed time.
- Every update claim includes a previous snapshot reference or is labeled as inferred.
- Excluded page types are absent from high-confidence recommendations.
- AI recommendations are visibly separated from observed facts.

## Automated Checks

Run after every velocity report:

- JSON schema validation for report and snapshot files.
- Scores must be integers from 0-100.
- Every page observation must include URL, domain, status, content type, topic, confidence, and evidence.
- Every SERP observation must include query, rank, URL, country, device, and observed timestamp.
- High-severity alerts must include at least one source URL.
- Pages with inferred publish dates cannot exceed the configured confidence cap.
- Competitor domains must be normalized consistently across URLs and SERP results.
- Duplicate canonical URLs must collapse into one page observation per run.
- Excluded URL patterns and content types must not drive velocity score increases.
- Markdown, CSV, and JSON exports must reconcile on competitor, topic, URL, status, score, and warning fields.
- No final report may include fabricated traffic, revenue, customer, or conversion claims.

## Failure Modes To Track

- Mistaking search index discovery for actual publication date.
- Treating duplicate URLs, tracking parameters, or pagination as multiple new pages.
- Over-alerting on press, jobs, support, login, or legal pages.
- Missing meaningful page refreshes because the URL did not change.
- Merging mobile and desktop SERP movement into one misleading rank delta.
- Ignoring country or city differences in competitive visibility.
- Classifying a competitor mention as topic momentum when the page is mostly unrelated.
- Letting AI recommendations imply private strategy from public evidence.
- Reporting SERP gains without preserving query and rank lineage.
- Hiding uncertainty behind polished summaries.

## Golden Examples

Create fixture runs before implementation:

1. Competitor acceleration: one domain publishes several related guides and gains tracked rankings.
2. Quiet market: no meaningful activity and the report correctly avoids noisy alerts.
3. Comparison push: competitor launches alternative pages and appears in comparison SERPs.
4. Docs refresh: important product docs change without a new URL.
5. Local SERP shift: mobile or city-targeted results differ from desktop national results.
6. Duplicate trap: sitemap, tracking parameters, and canonical URLs point to the same page.
7. Exclusion trap: jobs and press pages mention tracked keywords but should not count.
8. Uncertain dates: search freshness suggests a page is new, but fetched evidence is inconclusive.

Each fixture should include:

- Input velocity brief
- Previous snapshot
- Raw SERP observations by query, country, city, and device
- Fetched page excerpts and hashes
- Human status labels for each URL
- Expected velocity score bands
- Expected topic momentum signals
- Expected alert severity
- Disallowed claims and recommendations

## Launch Criteria

The MVP is ready for first users when:

- 30-run benchmark completes without crashes.
- New-page detection precision is at least 90%.
- Relevant movement recall is at least 80%.
- Evidence validity is at least 95%.
- High-severity alert noise is below 10%.
- Median reviewer time is under 20 minutes per weekly report.
- Publish-date uncertainty is capped and visible.
- Snapshot-to-report reconciliation passes automatically.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
