# Evaluation

Goal: prove AI Overview Tracker reliably captures Google AI Overview presence, cited sources, and narrative changes over time with enough evidence for SEO and content teams to act.

## Test Set

Use 30 tracked category-query runs across at least two collection dates:

- 6 mature B2B software categories with frequent AI Overview coverage.
- 5 emerging categories where definitions and cited sources change quickly.
- 5 local service categories tested across city and device targets.
- 4 comparison queries where competitor mentions are likely.
- 4 informational queries where source quality matters more than brand visibility.
- 3 ambiguous categories with mixed meanings.
- 3 sparse categories where AI Overviews may be absent or unstable.

For each benchmark, create human-labeled references:

- Whether an AI Overview is present for the query-target pair.
- Cited source URLs and domains when visible.
- Owned-domain and competitor-domain flags.
- Competitor mentions in the answer.
- Dominant themes and claims in the answer.
- Watch terms that should be detected.
- Whether a change between two snapshots is meaningful or noise.
- Human-written summary of the observed change.

## Metrics

Primary metrics:

- AI Overview presence accuracy: at least 95% agreement with human review.
- Cited source capture accuracy: at least 90% of visible cited URLs captured.
- Change precision: at least 85% of high and medium severity changes should be human-rated meaningful.
- Evidence validity: 100% of report claims about sources, competitors, and watch terms must link back to an observation, SERP result, or fetched source.
- Time saved: reduce weekly category review from 2-4 hours to under 20 minutes.

Secondary metrics:

- Competitor mention precision and recall.
- Owned-domain citation detection accuracy.
- Watch-term extraction accuracy.
- Narrative similarity agreement with human judgment.
- Correct handling of blocked, partial, or no-AI-Overview observations.
- Device and location divergence detection.
- Credit cost per tracked query-target pair.
- False-alert rate per weekly run.

## Manual Review Rubric

Score each report from 1-5:

- Capture fidelity: Did the tracker correctly identify AI Overview presence and cited sources?
- Evidence lineage: Can every claim be traced to query, target, timestamp, URL, and source type?
- Change usefulness: Are highlighted changes meaningful enough for a marketer or SEO lead to investigate?
- Narrative quality: Does the report explain how Google frames the category without overclaiming?
- Competitor awareness: Are competitor citations and mentions accurate?
- Local/device separation: Are city, country, mobile, and desktop observations kept distinct?
- Alert restraint: Does the report avoid noisy alerts for trivial wording changes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-severity alert is unsupported by source evidence.
- Blocked or partial observations are clearly labeled.
- AI Overview facts are distinguishable from organic SERP facts and AI synthesis.
- Like-for-like comparisons use the same query, country, city, and device.
- No report claims traffic, revenue, ranking benefit, or endorsement from AI Overview visibility alone.

## Automated Checks

Run after every tracking run:

- JSON schema validation for briefs, observations, changes, and reports.
- Every observation has run ID, query, target, collected-at timestamp, and collection status.
- Every cited source has a valid HTTP(S) URL and normalized domain.
- Every extracted claim has at least one source URL or is labeled as SERP-derived.
- Change comparisons use identical query and target keys.
- Scores are integers from 0-100.
- Blocked observations cannot trigger removal alerts unless confirmed in a later successful run.
- Owned and competitor domains are normalized before source comparisons.
- Markdown, CSV, and JSON exports reconcile on source counts and alert counts.
- Snapshot storage is append-only and does not overwrite historical observations.

## Failure Modes To Track

- Mistaking a missing or blocked collection for an AI Overview disappearance.
- Dropping AI Overview cited sources because they require JS rendering.
- Merging mobile and desktop observations into one trend.
- Treating ordinary organic rank movement as an AI Overview narrative change.
- Over-alerting on small wording differences while missing source churn.
- Misclassifying neutral informational sources as competitors.
- Missing competitor mentions that appear in answer text but not cited source domains.
- Letting AI synthesis invent a theme shift without source-backed before and after evidence.
- Storing too much answer text instead of structured excerpts and claims.
- Failing to distinguish first-seen sources from returning sources.

## Golden Examples

Create fixture runs before implementation:

1. AI Overview appears: prior run has no AI Overview, current run has one with three cited sources.
2. Owned source removed: owned domain is cited in baseline and absent in the next successful run.
3. Competitor narrative shift: competitor mention and cited competitor guide are added across multiple queries.
4. Theme shift: category definition moves from workflow automation to AI agent framing.
5. Mobile divergence: mobile has AI Overview and local pack, desktop has only organic results.
6. Blocked collection: current run is blocked and must not trigger disappearance or source removal alerts.
7. Sparse category: AI Overview is absent across runs and report should stay low-noise.

Each fixture should include:

- Input tracking brief
- Raw normalized SERP records
- AI Overview excerpt and cited source URLs
- Fetched source excerpts
- Human labels for presence, sources, competitors, watch terms, and themes
- Expected change objects and severity bands
- Disallowed claims

## Launch Criteria

The MVP is ready for first users when:

- 30 benchmark runs complete without crashes.
- AI Overview presence accuracy is at least 95%.
- Cited source capture accuracy is at least 90%.
- High and medium severity change precision is at least 85%.
- False high-severity alert rate is below 5%.
- Every report claim has source lineage.
- Median review time is under 20 minutes per category report.
- Credit estimate is shown before each run and actual usage is recorded after.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
