# Evaluation

Goal: prove the YC Lead Enricher saves research time while producing trustworthy, useful outreach angles.

## Test Set

Use 50 YC companies:

- 20 known strong ICP matches
- 15 plausible but uncertain matches
- 10 known poor matches
- 5 edge cases with sparse public data

For each company, create a human-labeled benchmark:

- ICP match: yes, partial, no
- Trigger present: strong, weak, none
- Best evidence URL
- Acceptable intro angle
- Disqualifier, if any

## Metrics

Primary metrics:

- Precision at top 10: at least 8 of the top 10 should be human-rated strong or plausible.
- Evidence validity: at least 95% of factual claims in final briefs should be supported by cited sources.
- Trigger usefulness: at least 70% of high-score leads should have a human-rated strong buying trigger.
- Time saved: reduce manual research time from roughly 8-12 minutes per company to under 90 seconds of review.

Secondary metrics:

- Recall of known good accounts in top 25.
- Calibration: high-confidence outputs should be more accurate than medium and low confidence outputs.
- Disqualifier handling: poor-fit companies should score below 50.
- Cost per enriched company.

## Manual Review Rubric

Score each lead brief from 1-5:

- Fit accuracy: Does the company actually match the ICP?
- Trigger quality: Is the buying trigger timely and commercially relevant?
- Intro specificity: Could a seller use the angle without sounding generic?
- Evidence quality: Are cited sources official, recent, and sufficient?
- Concision: Can the lead be understood in under 30 seconds?

A lead is MVP-acceptable when:

- Average score is at least 4 across reviewers.
- No unsupported factual claim appears in the trigger or intro angle.
- The next action is concrete and appropriate.

## Automated Checks

Run after every batch:

- JSON schema validation for every lead brief.
- Fit score must be integer 0-100.
- High tier requires score >= 75.
- Medium tier requires score 50-74.
- Low tier requires score < 50.
- Every non-empty buying trigger must have at least one evidence URL.
- Companies with disqualifier evidence cannot score above 50.
- Companies with no official source cannot score above 60.
- Evidence URLs must be unique and valid HTTP(S) URLs.

## Failure Modes To Track

- Hallucinated trigger based on generic website language.
- Over-scoring companies with impressive funding but weak ICP fit.
- Missing YC companies that use unusual domains or stealth landing pages.
- Treating old blog posts as current buying intent.
- Intro angle that is accurate but too broad to be useful.
- SERP snippets contradict fetched page content.

## Golden Examples

Create a small fixture file with three examples before implementation:

1. Strong fit: developer-facing B2B SaaS with public docs, recent enterprise launch, and engineering hiring.
2. Medium fit: B2B company with relevant buyer but weak or stale trigger.
3. Poor fit: consumer company or agency that matches a disqualifier.

Each fixture should include input company data, source excerpts, expected score range, expected tier, and unacceptable claims.

## Launch Criteria

The MVP is ready for first users when:

- 50-company benchmark completes without crashes.
- Top 10 precision is at least 80%.
- Evidence validity is at least 95%.
- Median review time is under 90 seconds per company.
- Batch cost is known and shown before a run.
- Output CSV can be imported into the user's sales workflow without manual cleanup.

