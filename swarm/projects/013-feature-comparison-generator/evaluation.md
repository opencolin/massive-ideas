# Evaluation

Goal: prove Feature Comparison Table Generator creates a useful, source-backed feature matrix faster and more reliably than manual documentation and pricing-page review.

## Test Set

Use 20 comparison briefs:

- 6 mature B2B software categories with public docs and pricing pages.
- 4 emerging AI categories with ambiguous feature language.
- 4 integration-heavy categories where feature names vary by vendor.
- 3 compliance or security-oriented categories where source quality matters.
- 2 localized pricing or packaging categories.
- 1 intentionally sparse category with limited public documentation.

For each brief, create a human-labeled benchmark:

- Vendor list and canonical domains
- Feature list and accepted synonyms
- Expected status per vendor-feature cell
- Expected plan or packaging availability when public
- High-quality source URLs
- Disallowed inferences
- Notes on ambiguity, localization, and stale pages

## Metrics

Primary metrics:

- Cell accuracy: at least 85% of evaluated cells match human labels.
- Source validity: at least 95% of non-unknown cells include a relevant inspectable source.
- Unsupported safety: at least 98% of `unsupported` cells must be explicitly supported by evidence, not absence of evidence.
- Review usefulness: at least 80% of flagged review notes should be judged actionable by a product marketer.
- Time saved: reduce first-pass comparison-table creation from 3-6 hours to under 30 minutes of review.

Secondary metrics:

- Feature synonym normalization accuracy.
- Plan and add-on availability accuracy.
- Region/device-specific packaging detection.
- Duplicate source and duplicate vendor rate.
- Cost per completed matrix.
- Percentage of cells marked `unknown`.
- Confidence calibration across high, medium, and low confidence cells.

## Manual Review Rubric

Score each generated comparison from 1-5:

- Feature relevance: Does the table compare the requested capabilities rather than generic product claims?
- Cell correctness: Are statuses accurate and appropriately conservative?
- Evidence quality: Do linked sources actually support the cell claims?
- Packaging clarity: Are plan, add-on, beta, and region constraints clear?
- Source diversity: Does the result prioritize official pages while noting third-party context?
- Readability: Can a sales or marketing user understand and reuse the table quickly?

A comparison is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-confidence cell is unsupported by cited evidence.
- `unsupported` is used only with explicit evidence.
- Official and third-party evidence are clearly distinguishable.
- Low-confidence and ambiguous cells are easy to find.

## Automated Checks

Run after every comparison build:

- JSON schema validation for the final comparison.
- Every requested feature appears exactly once in the output matrix.
- Every requested vendor appears in every feature row.
- Cell status must be one of the allowed statuses.
- Confidence must be high, medium, or low.
- Non-unknown cells must include at least one valid HTTP(S) evidence URL.
- Evidence URLs must preserve source type, fetched timestamp, and vendor.
- `unsupported` cells must include explicit negative evidence text or be downgraded to `unknown`.
- Official-source claims should not be overwritten by weaker third-party claims without a conflict note.
- Plan-gated and region-gated cells must include availability text.

## Failure Modes To Track

- Treating absence of a feature mention as proof that the feature is unsupported.
- Equating broad AI language with a specific requested AI capability.
- Missing plan gates because pricing tables render client-side.
- Letting third-party comparison pages override official docs.
- Merging similarly named features that are materially different.
- Missing localization differences in pricing, currency, compliance, or availability.
- Losing query, rank, fetch context, or source type during synthesis.
- Producing a table that is technically sourced but too verbose for battlecard use.

## Golden Examples

Create fixture comparisons before implementation:

1. Mature category: stable vendors, well-structured docs, and public pricing pages.
2. Emerging AI category: inconsistent terminology and vague feature claims.
3. Integration category: many feature synonyms and integration-directory evidence.
4. Security category: compliance pages, SOC claims, and plan-specific controls.
5. Localized packaging category: visible differences by country, city, currency, or device.

Each fixture should include:

- Input comparison brief
- Raw SERP snippets
- Fetched page excerpts
- Expected feature matrix
- Expected source inventory
- Disallowed claims
- Acceptable confidence ranges
- Expected manual review flags

## Launch Criteria

The MVP is ready for first users when:

- 20-brief benchmark completes without crashes.
- Cell accuracy is at least 85%.
- Source validity is at least 95%.
- Unsupported safety is at least 98%.
- Median review time is under 30 minutes per matrix.
- Cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
