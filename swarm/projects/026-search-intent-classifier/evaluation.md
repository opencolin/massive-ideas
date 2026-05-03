# Evaluation

Goal: prove Search Intent Classifier can label thousands of keywords accurately enough for content planning while keeping uncertain rows visible and evidence-backed.

## Test Set

Use 30 benchmark keyword batches:

- 6 B2B SaaS batches with comparison, pricing, docs, and support terms.
- 5 ecommerce batches with transactional, commercial, and informational overlap.
- 5 local-service batches with city, "near me", map-pack, and mobile intent changes.
- 4 marketplace batches where category, brand, and job-to-be-done terms overlap.
- 4 healthcare, finance, or legal batches where terminology is high-stakes and ambiguity matters.
- 3 emerging AI categories where SERPs and chatbot answers shift quickly.
- 3 noisy exports containing irrelevant, navigational, misspelled, and duplicate keywords.

For each batch, create a human-labeled benchmark:

- Canonical keyword and near-duplicate groups.
- Primary and secondary intent labels.
- Recommended page type and funnel stage.
- Exclusions and irrelevant meanings.
- Google result mix for sampled keywords.
- Local and device-specific intent changes.
- Fetched-page examples for unclear SERPs.
- Expected confidence level and review-needed rows.

## Metrics

Primary metrics:

- Primary intent accuracy: at least 88% across benchmark rows.
- High-value keyword accuracy: at least 93% for rows with high volume, high CPC, or current rank.
- Ambiguity handling: at least 90% of human-labeled ambiguous rows should be labeled `ambiguous` or low confidence.
- Evidence validity: at least 95% of SERP-backed labels should cite a valid observation and source URL.
- Review queue recall: at least 85% of human-disagreed labels should appear in the low-confidence or review-needed queue.

Secondary metrics:

- Secondary intent usefulness.
- Recommended page-type accuracy.
- Funnel-stage accuracy.
- Duplicate and near-duplicate grouping quality.
- Intent distribution error by batch.
- SERP result-type parsing accuracy.
- Cost per 1,000 keywords.
- Runtime per 1,000 keywords.
- CSV and JSON schema validity.

## Manual Review Rubric

Score each batch from 1-5:

- Intent correctness: Does the primary label match what a searcher likely wants?
- Planning usefulness: Would a content team know what page type to create or avoid?
- Evidence quality: Are sampled SERPs and fetched pages connected to the label?
- Confidence calibration: Are uncertain rows actually marked for review?
- Local sensitivity: Are country, city, and device effects preserved?
- Noise handling: Are navigational, support, irrelevant, and duplicate terms separated cleanly?
- Export usability: Can the CSV be handed to a strategist without extra cleanup?

A batch is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-volume row is mislabeled with high confidence.
- No unsupported AI-only label is treated as SERP-backed.
- All ambiguous rows have a confidence reason.
- Every sampled SERP observation includes query, rank, URL, country, city, device, and timestamp.

## Automated Checks

Run after every batch:

- JSON schema validation for brief, keyword rows, observations, and report.
- Every keyword must have a primary intent, confidence, and recommended action.
- Every high-confidence row must have either deterministic modifier support or SERP evidence.
- Every SERP-backed evidence item must reference a real observation ID.
- Every source URL must be valid HTTP(S).
- Country, city, and device must be present on all SERP and fetch observations.
- Intent distribution totals must equal keyword count.
- Confidence must be one of `low`, `medium`, or `high`.
- Primary intent must be in the allowed taxonomy.
- `irrelevant` rows must cite an exclusion or SERP mismatch reason.
- `ambiguous` rows must include at least two plausible intents.
- CSV export must include all required columns and no unescaped newline corruption.

## Failure Modes To Track

- Treating a keyword modifier as definitive when the SERP shows a different dominant intent.
- Collapsing mobile local-pack intent into generic informational intent.
- Marking brand login, docs, or support terms as commercial opportunities.
- Overclassifying short head terms with high confidence.
- Propagating one representative SERP to variants that are not true near-duplicates.
- Letting high search volume bias intent toward transactional.
- Ignoring country-specific vocabulary or regional SERP differences.
- Treating chatbot answers as a substitute for Google SERP evidence.
- Fetching too many ranking pages when snippets already settle the label.
- Producing a technically correct export that still leaves strategists with no page-type decision.

## Golden Examples

Create fixture batches before implementation:

1. Clear comparison: "best X", "X alternatives", and "X vs Y" map to comparison pages.
2. Pricing: cost, plans, quote, calculator, and discount terms map to decision-stage pricing intent.
3. Navigational: login, app, support, docs, and brand-home terms are not content opportunities.
4. Local: "near me" and city terms trigger local intent and mobile-specific checks.
5. Ambiguous head term: a one-word keyword has mixed SERP results and should be low confidence.
6. Support: error, setup, integration, API, and troubleshooting terms map to retention or docs intent.
7. Irrelevant: excluded meanings are filtered with evidence.
8. SERP override: keyword wording suggests informational intent, but parsed results are mostly product category pages.

Each fixture should include:

- Input CSV rows.
- Brief configuration.
- Raw parsed SERP observations.
- Raw fetched-page excerpts where needed.
- Expected duplicate groups.
- Expected intent rows.
- Expected review queue rows.
- Acceptable intent distribution range.

## Launch Criteria

The MVP is ready for first users when:

- 30 benchmark batches complete without crashes.
- Primary intent accuracy is at least 88%.
- High-value keyword accuracy is at least 93%.
- Evidence validity is at least 95%.
- Review queue recall is at least 85%.
- Median cost per 1,000 keywords is documented.
- Median runtime per 1,000 keywords is documented.
- Duplicate grouping false-merge rate is below 3%.
- Every run records planned cost, actual collection counts, skipped URLs, and export paths.
