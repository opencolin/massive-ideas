# Evaluation

Goal: prove Vendor Comparison Matrix Builder creates a useful, evidence-backed vendor ranking faster and more reliably than manual web research.

## Test Set

Use 25 comparison briefs:

- 6 mature B2B software categories with strong public docs and pricing.
- 5 emerging AI categories with vague positioning and fast-changing claims.
- 4 operational tooling categories where implementation burden matters.
- 4 security, compliance, or infrastructure categories where evidence quality is critical.
- 3 categories with localized pricing, packaging, or availability differences.
- 2 categories where review-site sentiment conflicts with official claims.
- 1 intentionally sparse category with limited public evidence.

For each brief, create a human-labeled benchmark:

- Vendor list and canonical domains
- Criteria groups, weights, and accepted synonyms
- Expected per-cell status and approximate score range
- Expected deal-breakers and conflicts
- High-quality official and third-party source URLs
- Disallowed inferences
- Notes on ambiguity, localization, review bias, and stale pages

## Metrics

Primary metrics:

- Matrix cell accuracy: at least 85% of evaluated cells match human status labels.
- Score calibration: at least 80% of scores fall within one point of human labels on a 5-point scale.
- Source validity: at least 95% of non-unknown cells include a relevant inspectable source.
- Deal-breaker safety: 100% of deal-breaker labels must have explicit supporting evidence.
- Recommendation usefulness: at least 80% of final recommendations are judged actionable by target buyers.
- Time saved: reduce first-pass vendor matrix creation from 4-8 hours to under 45 minutes of review.

Secondary metrics:

- Criterion normalization accuracy.
- Ranking agreement with human reviewers.
- Official-source coverage per vendor.
- Third-party source overreach rate.
- Conflict detection precision and recall.
- Region/device-specific packaging detection.
- Duplicate source and duplicate vendor rate.
- Cost per completed matrix.
- Percentage of cells marked `unknown`.
- Confidence calibration across high, medium, and low confidence cells.

## Manual Review Rubric

Score each generated comparison from 1-5:

- Buyer relevance: Does the matrix reflect the stated buying context rather than generic vendor claims?
- Cell correctness: Are statuses and scores accurate and appropriately conservative?
- Evidence quality: Do linked sources support the rationale?
- Weighting clarity: Are weighted scores explainable and not overfit to one criterion?
- Risk clarity: Are unknowns, deal-breakers, conflicts, and public evidence gaps easy to see?
- Source separation: Are official, third-party, review, and analyst sources clearly distinguished?
- Readability: Can a buyer reuse the output in a decision memo without heavy cleanup?

A comparison is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-confidence cell lacks supporting evidence.
- No deal-breaker is inferred from silence.
- Official evidence is not overridden by weaker third-party evidence without a conflict note.
- Unknown and conflict cells are easy to filter and review.

## Automated Checks

Run after every matrix build:

- JSON schema validation for the final output.
- Criteria weights sum to 1.0 after normalization.
- Every requested vendor appears in every criterion row.
- Every requested criterion appears exactly once.
- Cell status must be one of the allowed statuses.
- Score must be within the configured scale or null.
- Confidence must be high, medium, or low.
- Non-unknown cells must include at least one valid HTTP(S) evidence URL.
- Evidence URLs must preserve source type, fetched timestamp, query, rank, geo, and device when available.
- Deal-breaker cells must include explicit supporting claim text.
- Conflict cells must cite at least two sources or explain the missing side of the conflict.
- Ranking output must include every vendor exactly once.
- Recommendation must mention at least one strength and one risk for the top-ranked vendor.

## Failure Modes To Track

- Treating absent public evidence as proof that a vendor lacks a capability.
- Overweighting review-site sentiment when official sources are available.
- Giving precise scores for vague marketing claims.
- Missing pricing or packaging details because tables render client-side.
- Failing to detect regional price, currency, compliance, or availability differences.
- Merging materially different criteria because they share similar keywords.
- Letting a single strong criterion dominate the final recommendation without weight justification.
- Losing SERP query, rank, geo, device, or fetch timestamp during synthesis.
- Producing an accurate matrix that is too verbose for an executive decision.

## Golden Examples

Create fixture comparisons before implementation:

1. Mature SaaS category: clear docs, pricing, and security pages.
2. Emerging AI category: vague claims, fast-changing feature names, and limited public proof.
3. Implementation-heavy category: onboarding, integration, and support differences matter.
4. Security category: trust centers, compliance pages, and status-page evidence.
5. Localized packaging category: country-specific pricing or availability differences.
6. Review-conflict category: official claims differ from user sentiment.

Each fixture should include:

- Input vendor comparison brief
- Raw SERP snippets
- Fetched page excerpts
- Expected matrix
- Expected weighted rankings
- Expected source inventory
- Disallowed claims
- Acceptable score ranges
- Expected review flags

## Launch Criteria

The MVP is ready for first users when:

- 25-brief benchmark completes without crashes.
- Matrix cell accuracy is at least 85%.
- Source validity is at least 95%.
- Deal-breaker safety is 100%.
- Median review time is under 45 minutes per matrix.
- Cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
- At least 80% of target users say the recommendation is useful enough to challenge or refine.
