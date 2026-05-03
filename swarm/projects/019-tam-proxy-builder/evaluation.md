# Evaluation

Goal: prove TAM Proxy Builder creates a useful, source-backed market-size proxy faster than manual company-count, job-post, and search-demand research.

## Test Set

Use 20 market briefs:

- 5 mature B2B software categories with known buyer populations.
- 4 vertical SaaS wedges where company counts are available through directories.
- 4 service-business markets with strong local SERP variation.
- 3 emerging AI categories with unclear category language.
- 2 markets where hiring demand is the strongest proxy.
- 2 ambiguous markets with obvious false positives and exclusion rules.

For each brief, create a human-labeled benchmark:

- Relevant company types and excluded company types
- Expected company-count range
- Expected hiring-signal keywords and false-positive roles
- Expected search-intent clusters
- High-quality source domains
- Known weak or misleading source types
- Human-written TAM proxy range and assumptions

## Metrics

Primary metrics:

- Account-range accuracy: generated mid estimate should fall within the human-labeled acceptable range for at least 75% of benchmark briefs.
- Source validity: at least 95% of material claims should be supported by cited SERP, fetched page, or AI-answer source evidence.
- Signal separation: 100% of reports should keep company-count, hiring-demand, and search-demand evidence distinguishable.
- Assumption clarity: at least 90% of reviewed reports should state attach-rate, ACV, and confidence assumptions clearly enough for a user to edit them.
- Time saved: reduce first-pass TAM proxy research from 3-6 hours to under 30 minutes of review.

Secondary metrics:

- Precision of included company examples.
- Recall of known major directory or association sources.
- Hiring-signal relevance against human-labeled role keywords.
- Search-intent quality against human-labeled keyword clusters.
- Duplicate company rate after domain and brand normalization.
- Geographic relevance for country and city-targeted runs.
- Cost per completed TAM proxy build.

## Manual Review Rubric

Score each TAM proxy report from 1-5:

- ICP fit: Does the report size the requested buyer population rather than a broader adjacent market?
- Evidence quality: Are company-count, hiring, and search claims grounded in credible, inspectable sources?
- Assumption quality: Are attach rate, ACV, and conversion from signals to TAM ranges reasonable and visible?
- False-positive handling: Does the report exclude unrelated industries, job roles, or alternate meanings?
- Sensitivity usefulness: Can a user adjust the estimate without rebuilding the whole model?
- Concision: Can a reader understand the estimate, confidence, and gaps in under five minutes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No material TAM estimate lacks evidence or an explicit assumption.
- The estimate is presented as a range, not a false-precision point value.
- Company-count, hiring-demand, and search-demand signals are not blended into a single unsupported score.
- Known exclusions are either removed or called out as residual risk.

## Automated Checks

Run after every TAM proxy build:

- JSON schema validation for the final report.
- TAM account and revenue estimates must be non-negative ranges where low <= mid <= high.
- Evidence URLs must be valid HTTP(S) URLs.
- Every signal must include at least one evidence item or be marked as a gap.
- Every material assumption must include a rationale.
- Evidence score must be an integer from 0-100.
- Search-only reports must score no higher than 70.
- Company-count-only reports must score no higher than 65.
- AI-answer-only claims must be excluded unless independently confirmed or clearly labeled as sourced chatbot context.
- Source-domain counts must reconcile with raw SERP, fetch, and AI-answer records.
- Exclusion terms must be checked against extracted company examples and job posts.

## Failure Modes To Track

- Presenting proxy estimates as definitive TAM.
- Treating search-result counts as exact company counts.
- Counting duplicate directory pages, branch locations, or franchise pages as separate accounts without labeling the assumption.
- Overweighting job-board pages that aggregate stale or duplicated postings.
- Mistaking generic role demand for product-specific pain.
- Using commercial SERP density as paid keyword volume without calibration.
- Letting chatbot answers introduce uncited market-size claims.
- Missing local-market variation because country, city, or device targeting was not applied.
- Including false positives from adjacent industries or ambiguous category terms.
- Producing a precise revenue estimate without sensitivity ranges.

## Golden Examples

Create fixture briefs before implementation:

1. Directory-backed vertical: a market where industry directories expose many relevant accounts.
2. Hiring-heavy market: a category where job posts reveal operational pain better than search demand.
3. Search-heavy category: a mature commercial category with rich SERPs but imperfect company counts.
4. Emerging AI wedge: a market with sparse company-count data and unstable category language.
5. Ambiguous phrase: a term with at least two unrelated meanings and clear exclusion rules.

Each fixture should include:

- Input TAM brief
- Raw SERP snippets
- Fetched source excerpts
- AI answers with sources
- Expected signal classifications
- Expected account and revenue ranges
- Disallowed claims
- Acceptable evidence-score range

## Launch Criteria

The MVP is ready for first users when:

- 20-brief benchmark completes without crashes.
- Account-range accuracy is at least 75%.
- Source validity is at least 95%.
- Median review time is under 30 minutes per report.
- Duplicate account/example rate is below 8%.
- Every report includes editable assumptions and sensitivity ranges.
- Batch cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
