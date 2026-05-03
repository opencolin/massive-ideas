# Evaluation

Goal: prove Category Landscape Builder creates a useful, source-backed view of a market category faster than manual SERP and chatbot research.

## Test Set

Use 20 categories:

- 6 mature B2B software categories with known vendor sets.
- 5 emerging AI categories with unstable language.
- 4 local or geography-sensitive service categories.
- 3 categories with ambiguous meanings.
- 2 intentionally narrow categories with sparse public information.

For each category, create a human-labeled benchmark:

- Known relevant vendors
- Known irrelevant vendors
- Expected category themes
- High-quality source domains
- Ambiguous terms or excluded meanings
- Human-written short landscape summary

## Metrics

Primary metrics:

- Vendor precision: at least 85% of top 10 vendors should be human-rated relevant.
- Source validity: at least 95% of factual claims should be supported by cited SERP, fetched page, or AI-answer source evidence.
- Surface comparison usefulness: at least 80% of reviewed reports should correctly identify meaningful Google-only, AI-only, and shared visibility patterns.
- Time saved: reduce first-pass category research from 2-4 hours to under 20 minutes of review.

Secondary metrics:

- Recall of known vendors in top 25.
- Theme coverage against human-labeled expected themes.
- Confidence calibration across high, medium, and low confidence vendors.
- Geographic relevance for city or country-targeted categories.
- Cost per completed category run.
- Duplicate vendor rate after domain and brand normalization.

## Manual Review Rubric

Score each landscape from 1-5:

- Vendor relevance: Are listed vendors actually part of the category?
- Coverage: Does the landscape include the obvious major players and useful challengers?
- Theme quality: Do themes reflect real buyer language and category positioning?
- Evidence quality: Are claims grounded in credible, recent, and inspectable sources?
- SERP/AI comparison: Does the report make a useful distinction between Google rankings and AI-answer citations?
- Concision: Can a reader understand the category shape in under five minutes?

A landscape is MVP-acceptable when:

- Average reviewer score is at least 4.
- No top 10 vendor is unsupported by evidence.
- The report clearly labels inference and low-confidence claims.
- Google SERP and AI-answer observations are not blended together as if they were the same source.

## Automated Checks

Run after every category build:

- JSON schema validation for the final landscape.
- Vendor scores must be integers from 0-100.
- Evidence URLs must be valid HTTP(S) URLs and unique per vendor.
- Every top 10 vendor must have at least two evidence items or one high-quality official source.
- AI-answer-only vendors must score no higher than 60 unless independently confirmed by fetched sources.
- Vendors matching exclusions must score below 40 or be omitted.
- Source-domain counts must reconcile with raw SERP and AI-answer records.
- Every fetched claim must retain query, rank, or prompt lineage where applicable.

## Failure Modes To Track

- Treating SEO listicle mentions as proof that a vendor truly belongs in the category.
- Overweighting chatbot answers that cite weak or circular sources.
- Missing vendors because the category uses multiple names.
- Merging distinct companies with similar brand names.
- Including vendors from excluded alternate meanings.
- Letting stale SERP pages dominate emerging category analysis.
- Losing rank, query, or citation lineage during synthesis.
- Producing generic themes that could fit any software category.

## Golden Examples

Create fixture categories before implementation:

1. Mature category: includes a stable vendor set, strong review sites, and many comparison pages.
2. Emerging AI category: includes inconsistent terminology and strong AI-answer variance.
3. Ambiguous category: includes one phrase with at least two unrelated meanings and clear exclusions.
4. Local category: includes city-targeted SERPs where geography materially changes results.

Each fixture should include:

- Input category brief
- Raw SERP snippets
- AI answers with sources
- Fetched source excerpts
- Expected top vendors
- Expected themes
- Disallowed claims
- Acceptable score ranges

## Launch Criteria

The MVP is ready for first users when:

- 20-category benchmark completes without crashes.
- Top 10 vendor precision is at least 85%.
- Source validity is at least 95%.
- Median review time is under 20 minutes per category.
- Duplicate vendor rate is below 5%.
- Batch cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
