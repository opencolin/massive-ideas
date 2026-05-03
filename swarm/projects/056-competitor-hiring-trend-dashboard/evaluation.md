# Evaluation

Goal: prove Competitor Hiring Trend Dashboard surfaces meaningful public hiring movement faster than manual monitoring, while avoiding noisy conclusions from duplicate job boards, aggregator artifacts, evergreen talent pages, stale postings, or unsupported strategic inference.

## Test Set

Use 30 tracking runs:

- 5 runs with clear role-family acceleration, such as security, AI infrastructure, enterprise sales, or customer success.
- 4 runs with leadership or seniority shifts where staff, principal, manager, director, or executive roles matter more than volume.
- 4 runs with geographic expansion, including city-specific, country-specific, remote, hybrid, and mobile-search differences.
- 4 runs with sparse competitor activity where the correct output is a quiet report.
- 3 runs with posting removals or reduced hiring in a role family.
- 3 runs with compensation, location, department, or scope changes on existing postings.
- 3 runs with duplicate ATS mirrors, canonical URL conflicts, and tracking parameters.
- 2 runs with aggregator-only evidence where confidence should be capped.
- 2 runs with exclusion traps such as internships, talent communities, agencies, expired postings, and unrelated roles.

For each run, create a human-labeled benchmark:

- Competitor domains, careers URLs, ATS domains, and tracked role families
- Known active, new, updated, removed, duplicate, and irrelevant postings
- SERP ranks by query, country, city, and device
- Expected role family, seniority, location mode, and strategic themes for each relevant posting
- Pages that should be excluded
- Expected alert severity and recommended watch areas
- Disallowed claims, especially headcount, budget, revenue, launch timing, customer impact, or private roadmap

## Metrics

Primary metrics:

- New-posting precision: at least 90% of postings labeled new should be truly new to the tracker and relevant to tracked role families.
- Relevant movement recall: at least 80% of human-labeled significant hiring movements should appear in the report.
- Evidence validity: at least 95% of alerts and posting-level claims should include inspectable source lineage.
- Duplicate control: fewer than 5% of active postings should be duplicated after canonicalization.
- Noise control: fewer than 10% of high-severity alerts should be caused by excluded, stale, duplicate, or low-relevance postings.
- Time saved: reduce weekly competitor hiring review from 2-3 hours to under 15 minutes of review.

Secondary metrics:

- Role family classification accuracy across engineering, product, design, data, security, sales, marketing, customer success, finance, people, operations, legal, and other.
- Seniority classification agreement with human labels.
- Location and remote/hybrid/onsite classification accuracy.
- Strategic theme agreement with human labels.
- Removed-posting detection precision.
- Posting update detection accuracy from content hashes and visible text diffs.
- SERP rank lineage accuracy against stored snapshots.
- Credit estimate accuracy before execution.
- Helpfulness of recommended watch areas in reviewer ratings.

## Manual Review Rubric

Score each competitor report from 1-5:

- Signal quality: Does it surface real hiring motion instead of generic job board churn?
- Evidence quality: Are every alert and posting-level claim tied to source URLs, ranks, fetches, or diffs?
- Relevance: Does the report stay within tracked role families, locations, keywords, and exclusions?
- Freshness: Does it correctly distinguish new, active, updated, removed, duplicate, and uncertain postings?
- Classification quality: Are role family, seniority, location mode, and strategic themes plausible from the posting text?
- Strategic usefulness: Does the recommended watch area help a team decide what to monitor next?
- Restraint: Does it avoid unsupported claims about headcount, budget, revenue, customers, launch timing, or private strategy?
- Readability: Can a reviewer understand what changed without opening every source?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every high-severity alert has at least two evidence items or a clear low-confidence warning.
- Every SERP claim includes query, rank, geography, device, URL, and observed time.
- Every update claim includes a previous snapshot reference or is labeled as inferred.
- Aggregator-only evidence is capped and visibly marked.
- Excluded page types are absent from high-confidence recommendations.
- AI recommendations are visibly separated from observed facts.

## Automated Checks

Run after every hiring trend report:

- JSON schema validation for report and snapshot files.
- Scores must be integers from 0-100.
- Every posting observation must include URL, domain, title, status, role family, seniority, last seen, confidence, and evidence.
- Every SERP observation must include query, rank, URL, country, device, and observed timestamp.
- High-severity alerts must include at least one source URL.
- Postings found only on aggregators cannot exceed the configured confidence cap.
- Competitor domains, ATS domains, and canonical URLs must normalize consistently.
- Duplicate canonical URLs must collapse into one posting observation per run.
- Excluded URL patterns, role types, and locations must not drive momentum score increases.
- Removed postings must be based on prior snapshot evidence, not a single failed fetch.
- Markdown, CSV, and JSON exports must reconcile on competitor, posting URL, status, role family, score, and warning fields.
- No final report may include fabricated headcount, budget, revenue, customer impact, or launch timing.

## Failure Modes To Track

- Mistaking search index discovery for actual posting date.
- Treating duplicate ATS mirrors, tracking parameters, or aggregators as multiple new postings.
- Over-alerting on internships, talent communities, agencies, expired postings, or unrelated roles.
- Missing meaningful changes because the posting URL did not change.
- Misclassifying seniority when titles use company-specific leveling language.
- Merging mobile and desktop SERP results into one misleading signal.
- Ignoring country or city differences in hiring visibility.
- Treating a keyword mention in boilerplate as evidence of strategic theme.
- Reporting compensation changes without preserving the exact source page and timestamp.
- Inferring layoffs or roadmap changes from removed postings without sufficient evidence.
- Hiding uncertainty behind polished summaries.

## Golden Examples

Create fixture runs before implementation:

1. Role-family acceleration: one competitor adds several security roles across seniority bands.
2. Quiet market: no meaningful hiring movement and the report correctly avoids noisy alerts.
3. Leadership push: competitor adds director and principal roles in one strategic function.
4. Geography expansion: competitor opens multiple postings in a new city or country.
5. Remote policy shift: postings change from remote to hybrid with source-backed diffs.
6. Duplicate trap: employer careers page, ATS board, search result, and aggregator point to the same role.
7. Exclusion trap: internships and evergreen talent community pages match keywords but should not count.
8. Aggregator-only evidence: SERPs show a role, but employer pages cannot be fetched, so confidence is capped.
9. Removal signal: prior active postings disappear across two runs and are reported as removed with caution.
10. Compensation update: fetched posting text changes salary range and triggers a medium-confidence alert.

Each fixture should include:

- Input hiring brief
- Previous snapshot
- Raw SERP observations by query, country, city, and device
- Fetched page excerpts and hashes
- Human status labels for each posting URL
- Expected hiring momentum score bands
- Expected role family momentum signals
- Expected strategic theme labels
- Expected alert severity
- Disallowed claims and recommendations

## Launch Criteria

The MVP is ready for first users when:

- 30-run benchmark completes without crashes.
- New-posting precision is at least 90%.
- Relevant movement recall is at least 80%.
- Evidence validity is at least 95%.
- Duplicate active postings are below 5%.
- High-severity alert noise is below 10%.
- Median reviewer time is under 15 minutes per weekly report.
- Aggregator-only and unresolved-canonical evidence is capped and visible.
- Snapshot-to-report reconciliation passes automatically.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
