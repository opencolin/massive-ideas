# Evaluation

Goal: prove the Competitor Customer Finder can produce a credible, source-grounded account list faster than manual competitive research.

## Test Set

Use 10 competitors across B2B software categories:

- 3 competitors with rich public case study libraries
- 3 competitors with strong review or marketplace presence
- 2 competitors with integration-heavy ecosystems
- 2 competitors with sparse or noisy public data

For each competitor, create a human-labeled benchmark:

- Known customer accounts
- Known non-customer mentions
- Ambiguous integration or partner accounts
- Best available evidence URL
- Target ICP fit
- Unacceptable relationship label, if any

## Metrics

Primary metrics:

- Precision at top 25: at least 85% of top-ranked accounts should have valid evidence for the assigned relationship.
- Customer-label precision: at least 95% of accounts labeled `customer` should be supported by direct customer, user, buyer, or implementation evidence.
- Evidence validity: at least 95% of factual claims should be supported by cited sources.
- Time saved: reduce manual research time from roughly 20-30 minutes per competitor to under 5 minutes of review.

Secondary metrics:

- Recall against known customer lists.
- Relationship calibration across customer, evaluator, integration partner, service partner, and ambiguous labels.
- Duplicate rate after normalization.
- Cost per competitor and cost per valid account.
- Freshness distribution of discovered sources.

## Manual Review Rubric

Score each discovered account from 1-5:

- Relationship accuracy: Does the label match the evidence?
- Evidence quality: Is the source direct, public, and specific?
- ICP fit: Does the account match the requested segment?
- Competitive angle: Could a seller use it without sounding generic?
- Deduping quality: Are subsidiaries, name variants, and domains handled correctly?

An account is MVP-acceptable when:

- Relationship accuracy is at least 4.
- Evidence quality is at least 4.
- The account has at least one cited source URL.
- The competitive angle is grounded in the cited signal.

## Automated Checks

Run after every batch:

- JSON schema validation for every account.
- Fit score must be integer 0-100.
- Confidence must be high, medium, or low.
- Relationship must use the approved enum.
- Every account must have at least one evidence URL.
- Customer-labeled accounts must include direct usage, customer, buyer, review, or implementation language.
- Ambiguous accounts cannot score above 70.
- Excluded segments cannot score above 50.
- Evidence URLs must be unique valid HTTP(S) URLs.
- Duplicate company names must be merged before export.

## Failure Modes To Track

- Treating a generic integration listing as proof of customer status.
- Extracting reviewer employers from stale or anonymous review data with too much confidence.
- Confusing agencies, consultants, and implementation partners with end customers.
- Overweighting competitor-owned logo walls without enough account detail.
- Missing customers hidden behind JS-rendered marketplace pages.
- Hallucinating domains for companies with common names.
- Producing outreach angles that imply private knowledge not present in the evidence.

## Golden Examples

Create a fixture file with five examples before implementation:

1. High-confidence customer from an official case study.
2. High-confidence user from a named third-party review.
3. Medium-confidence evaluator from a procurement or comparison page.
4. Integration partner that should not be labeled as a customer.
5. Ambiguous mention that should score below 40.

Each fixture should include source excerpts, expected relationship label, expected score range, expected confidence, and unacceptable claims.

## Launch Criteria

The MVP is ready for first users when:

- 10-competitor benchmark completes without crashes.
- Top 25 precision is at least 85%.
- Customer-label precision is at least 95%.
- Evidence validity is at least 95%.
- Median review time is under 5 minutes per competitor.
- Batch cost is estimated before a run.
- Output CSV imports cleanly into the user's CRM or sales workflow.
