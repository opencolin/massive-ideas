# Evaluation

## Evaluation Goal

Measure whether the ICP Drift Detector helps revenue teams find low-fit target accounts faster than manual spreadsheet review while preserving source-backed explanations.

## Test Dataset

Create a 100-account seed dataset:

- 20 best customers from the true ICP.
- 40 strong target accounts similar to best customers.
- 25 questionable accounts with one major mismatch.
- 15 obvious drift accounts from unrelated categories, geographies, or company sizes.

Each account should have a human label:

- `fit`
- `review`
- `drift`

Each label should include a short rationale so disagreements can be audited.

## Metrics

- Precision on `drift`: percentage of accounts marked `remove` that humans agree are drift.
- Recall on `drift`: percentage of human-labeled drift accounts caught by the detector.
- Review burden: percentage of accounts routed to `review`.
- Evidence coverage: percentage of scored accounts with at least one cited source.
- Source drift detection: whether intentionally noisy sources are ranked as worse than clean sources.

## Acceptance Targets

For an MVP:

- Drift precision >= 80%.
- Drift recall >= 65%.
- Evidence coverage >= 90% for accounts with reachable websites or SERP results.
- Review burden <= 35%.
- Batch of 250 accounts completes without manual intervention except captcha or unavailable pages.

## Qualitative Review

Have two revenue operators inspect:

- top 20 lowest-scoring accounts
- top 10 accounts marked `review`
- source-level drift summary
- suggested ICP rule updates

Ask:

1. Would you remove, suppress, or deprioritize these accounts?
2. Are the explanations specific enough to trust?
3. Did the report reveal a lead source issue you would have missed?
4. Which flags are noisy or misleading?

## Failure Modes

- Public web copy is vague and causes generic category labels.
- Company size estimates are stale or inconsistent across sources.
- A best-customer set is too small or internally inconsistent.
- New ICP expansion is incorrectly treated as drift.
- SERP snippets overrepresent old positioning after a company pivots.

## Mitigations

- Add `insufficient_evidence` instead of penalizing unknowns.
- Require user-editable ICP overrides for geography, size, and excluded categories.
- Show baseline distributions before scoring so users can catch bad reference data.
- Track score deltas by source and by scoring dimension, not just final account score.
- Keep citations attached to every extracted trait.

## Experiment Plan

1. Run the detector on the labeled 100-account dataset.
2. Tune only scoring thresholds and flag weights.
3. Freeze thresholds.
4. Run on a new 100-account validation set.
5. Compare against manual review time and agreement.

## Launch Readiness

The prototype is ready for a pilot when:

- CSV import/export works reliably.
- Massive MCP enrichment failures are visible and recoverable.
- Reports include citations and source-level summaries.
- Users can override baseline rules before final export.
- Evaluation on the validation set meets the acceptance targets.

