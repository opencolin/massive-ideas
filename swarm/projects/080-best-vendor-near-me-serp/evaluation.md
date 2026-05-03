# Evaluation

Goal: prove Best Vendor Near Me SERP Trend Tracker produces accurate, source-backed movement reports for local vendor-category SERPs faster than manual weekly searches, screenshots, and spreadsheet comparisons.

## Test Set

Use 40 benchmark trend scenarios with at least two snapshots each:

- 6 home-service categories with strong local pack behavior.
- 6 professional-service categories where individual practitioners and firms can be ambiguous.
- 5 healthcare or wellness categories where branch and practitioner names overlap.
- 5 event or wedding vendor categories where directories dominate results.
- 5 restaurant, hospitality, or venue categories with map-heavy SERPs.
- 4 franchise or multi-location categories with branch-specific names.
- 4 mobile-sensitive near-me categories.
- 3 sparse markets where the correct output may be low confidence.
- 2 cases with deliberate excluded meanings such as jobs, equipment, or informational guides.

For each benchmark, create human labels:

- Category, synonyms, and excluded meanings.
- City, country, device, and query template.
- Accepted vendor names, aliases, domains, and entity types.
- Expected organic rank movement by entity.
- Expected local pack or maps movement by entity.
- New top-10 and lost top-10 entrants.
- Directory versus owned-vendor classification.
- SERP examples that should be excluded.
- Human-written alert severity and recommended action.

## Metrics

Primary metrics:

- Movement accuracy: at least 92% of reported rank deltas should match human-reviewed parsed SERPs within one position.
- Entity match accuracy: at least 90% of vendor and directory identities should match human labels.
- Local pack change accuracy: at least 90% of local pack gains, losses, and rank changes should match human review.
- Alert precision: at least 85% of high-severity alerts should be judged valid and actionable.
- Evidence validity: 100% of trend claims should include query, city, device, result type, rank, snapshot timestamp, and source lineage.
- Time saved: reduce a weekly 10-city by 8-query trend review from multiple hours to under 20 minutes of human review.

Secondary metrics:

- Correct separation of organic, local pack, maps, and ads.
- Correct handling of mobile versus desktop divergence.
- Directory/listicle classification precision.
- Watched vendor alias recall.
- Ambiguous match detection rate.
- Credit estimate accuracy versus actual run cost.
- Summary faithfulness to computed movement facts.
- Snapshot storage completeness and replayability.

## Manual Review Rubric

Score each trend report from 1-5:

- Movement accuracy: Are rank gains, losses, new entrants, and exits correct?
- Entity accuracy: Are vendors, directories, marketplaces, publishers, and ads classified correctly?
- Local targeting: Are country, city, and device settings visible and kept separate?
- Surface separation: Are organic, local pack, maps, and ads never blended into one rank?
- Evidence quality: Can every movement claim be traced to a parsed SERP or fetched page?
- Alert usefulness: Are alerts specific to entity, query, location, device, result type, and likely next action?
- Restraint: Does the report avoid implying traffic, revenue, customer demand, or causation from rank movement alone?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-severity alert lacks supporting evidence.
- Every city-device-query pair includes confidence and snapshot timestamps.
- Organic, local pack, maps, and ads are presented as separate surfaces.
- Ambiguous matches are flagged instead of counted as confirmed movement.
- Directory visibility is labeled separately from owned vendor visibility.

## Automated Checks

Run after every trend report:

- JSON schema validation for brief, observations, movement, and final report.
- All scores must be integers from 0-100.
- Every observation must include snapshot ID, timestamp, query, city, country, device, result type, and rank.
- Every movement row must compare equivalent query, city, country, device, entity, and result type.
- Rank values must be positive integers or null when an entity is absent.
- Organic movement must exclude ads, local pack entries, and maps results.
- Local pack movement must only count observed local pack entries.
- New top-10 and lost top-10 alerts must have a prior comparable snapshot.
- Directory pages that mention vendors must not be counted as owned vendor ranks unless explicitly labeled.
- Desktop and mobile observations must never share the same movement key.
- CSV row counts must reconcile with JSON observations and movements.
- Markdown tables must include enough context to audit query, city, device, entity, rank, result type, and timestamp.

## Failure Modes To Track

- Counting ads as organic rank movement.
- Merging local pack rank with organic rank.
- Treating directory visibility as vendor-owned visibility.
- Matching the wrong branch of a franchise or multi-location vendor.
- Missing DBA names, abbreviations, or Google Business Profile aliases.
- Ignoring mobile-only or desktop-only SERP changes.
- Comparing different query variants as if they were the same trend line.
- Overstating market demand, traffic, leads, or revenue from rank movement.
- Letting AI summaries invent causal explanations without source facts.
- Ignoring excluded meanings such as jobs, gear, DIY guides, or informational articles.
- Reporting movement without a valid previous snapshot.
- Losing source lineage when SERP collection is challenged by captcha or rendering issues.

## Golden Examples

Create fixture runs before implementation:

1. Watched vendor gain: vendor moves from rank 9 to rank 3 organically.
2. Watched vendor loss: vendor exits top 10 and triggers a high-severity alert.
3. New local pack entrant: previously absent vendor appears in local pack rank 2.
4. Lost local pack presence: watched vendor disappears from local pack on mobile only.
5. Directory takeover: directories occupy most top-10 results across multiple query variants.
6. Organic-only movement: owned vendor page gains organically but local pack is unchanged.
7. Ambiguous entity: similar practitioner or branch name requires low-confidence review.
8. Mobile divergence: mobile SERP changes materially while desktop remains stable.
9. Excluded meaning: "best photographer near me jobs" style results are filtered.
10. No baseline: first snapshot reports visibility but suppresses movement alerts.

Each fixture should include:

- Input trend brief.
- Previous and current parsed SERP observations.
- Fetched page excerpts for ambiguous and high-impact results.
- Human entity labels.
- Expected movement rows.
- Expected alerts and severities.
- Expected confidence labels.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 40 benchmark trend scenarios complete without crashes.
- Movement accuracy is at least 92%.
- Entity match accuracy is at least 90%.
- Local pack change accuracy is at least 90%.
- High-severity alert precision is at least 85%.
- Evidence validity is 100%.
- Median human review time is under 20 minutes for a 10-city by 8-query weekly trend report.
- Credit cost is estimated before every snapshot and recorded after completion.
- JSONL snapshot history can regenerate movement reports.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
