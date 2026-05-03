# Evaluation

Goal: prove Website Intent Classifier reliably prioritizes accounts that show public evidence of needing the seller's offer, without hallucinating need or over-scoring generic websites.

## Test Set

Use 100 domains across at least three seller ICPs:

- 30 known strong-fit companies with visible need signals.
- 25 plausible companies where fit is real but urgency is uncertain.
- 25 poor-fit companies that should be down-ranked.
- 10 edge cases with sparse, JS-heavy, or region-specific websites.
- 10 confusing cases with similarly named companies, agencies, marketplaces, or stale content.

For each domain, create a human benchmark:

- ICP fit: yes, partial, no.
- Need signal: strong, weak, none.
- Urgency: current, stale, absent.
- Best evidence URLs.
- Disqualifiers, if any.
- Acceptable outreach or research angle.

## Metrics

Primary metrics:

- Precision at top 20: at least 16 of the top 20 should be human-rated strong or plausible.
- Evidence validity: at least 95% of factual claims in final briefs should be supported by cited sources.
- Disqualifier precision: at least 90% of major disqualifiers should cap the score below 40.
- Need-signal usefulness: at least 75% of high-tier accounts should have a human-rated strong need signal.
- Review speed: reduce account research review time to under 60 seconds per domain.

Secondary metrics:

- Recall of known strong-fit accounts in the top 40.
- Confidence calibration across high, medium, and low confidence outputs.
- Cost per classified domain.
- JS rendering recovery rate for pages that are blank without rendering.
- Official source coverage per domain.

## Manual Review Rubric

Score each account from 1-5:

- Fit accuracy: Does the account match the seller's ICP?
- Need accuracy: Does the evidence actually imply the offer may be relevant?
- Urgency quality: Is "why now" timely, specific, and commercially meaningful?
- Evidence quality: Are citations official, fresh, and sufficient?
- Actionability: Could a seller use the recommended angle without sounding generic?

An account brief is MVP-acceptable when:

- Average reviewer score is at least 4.
- No unsupported factual claim appears in `need_summary`, `why_now`, or `recommended_angle`.
- Every high-tier result includes at least two independent evidence items.
- Any listed disqualifier is source-backed.

## Automated Checks

Run after every batch:

- JSON schema validation for every intent brief.
- `intent_score` must be an integer from 0-100.
- High tier requires score >= 75.
- Medium tier requires score 50-74.
- Low tier requires score < 50.
- Every `need_summary` must have at least one supporting evidence URL.
- Every high-tier result must have at least one official-domain evidence URL.
- Major disqualifiers must cap score at 40.
- No official fetched source must cap score at 60.
- Evidence URLs must be unique valid HTTP(S) URLs.
- Source snippets must come from fetched page text or parsed SERP output.

## Failure Modes To Track

- Mistaking generic marketing copy for urgent need.
- Over-scoring companies because they are large, funded, or well-designed.
- Missing intent signals hidden behind JavaScript rendering.
- Confusing similarly named companies across search results.
- Treating old blog posts or stale job listings as current urgency.
- Using SERP snippets when fetched official pages contradict them.
- Drafting an outreach angle that is plausible but unsupported.
- Down-ranking a good account because localized pages differ by country or device.

## Golden Fixtures

Create fixture cases before implementation:

1. High intent: public docs, customer integrations, recent changelog, and relevant hiring.
2. Medium intent: strong ICP fit but only generic or stale need signals.
3. Low intent: company matches a major disqualifier.
4. Sparse site: official source is minimal, but search results reveal enough to classify with low confidence.
5. Name collision: SERP contains another company with similar name and stronger signals.

Each fixture should include input ICP, domain, fetched source excerpts, parsed SERP snippets, expected score range, expected tier, required evidence URLs, and prohibited claims.

## Launch Criteria

The MVP is ready for first users when:

- 100-domain benchmark completes without crashes.
- Top 20 precision is at least 80%.
- Evidence validity is at least 95%.
- Median review time is under 60 seconds per domain.
- Batch cost estimate is shown before a run.
- High-tier outputs have clear source-backed reasons and usable recommended angles.
- CSV export imports cleanly into a normal sales workflow.

