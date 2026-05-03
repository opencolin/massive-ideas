# Evaluation

Goal: prove Review Mining Bot produces useful, source-backed product insights from public reviews faster than manual review-site and app-store research.

## Test Set

Use 24 review mining briefs:

- 6 mature B2B SaaS products with active G2 and Capterra listings.
- 4 products with mobile apps on Apple App Store and Google Play.
- 4 browser extensions with Chrome Web Store or Firefox Add-ons reviews.
- 4 products with known competitors and strong comparison language in reviews.
- 3 products with sparse or partially blocked review pages.
- 3 products with ambiguous names that require careful source filtering.

For each brief, create a human-labeled benchmark:

- Correct review source URLs
- Expected positive themes
- Expected negative themes
- Known feature requests
- Known irrelevant products or similarly named listings
- Representative public review excerpts
- Human-written insight summary
- Competitor strengths and weaknesses, where applicable

## Metrics

Primary metrics:

- Theme precision: at least 85% of top themes should be human-rated as real, specific, and supported.
- Evidence validity: at least 97% of representative excerpts must map to a source URL, rating/date context when available, and fetched or SERP lineage.
- Source coverage: find at least 80% of benchmarked public source pages for supported platforms.
- Actionability: at least 80% of reviewed reports should contain one or more product, marketing, success, or sales actions judged useful by a domain reviewer.
- Time saved: reduce first-pass public review research from 2-3 hours to under 20 minutes of review.

Secondary metrics:

- Sentiment classification accuracy.
- Topic classification accuracy against human labels.
- Duplicate review rate after deduplication.
- Competitor comparison correctness.
- Recency filter correctness.
- Cost per completed mining run.
- Percentage of pages requiring JS rendering or captcha handling.
- Rate of partial or blocked source pages.

## Manual Review Rubric

Score each report from 1-5:

- Source discovery: Did it find the right G2, Capterra, app-store, and extension-store pages?
- Theme specificity: Are themes concrete enough to guide product or GTM work?
- Evidence quality: Does every theme include inspectable, representative evidence?
- Sentiment accuracy: Does sentiment match the underlying review excerpts?
- Frequency judgment: Are frequent themes actually common in the evidence set?
- Competitor comparison: Are relative strengths and weaknesses grounded in competitor review evidence?
- Concision: Can a stakeholder understand the report in under five minutes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No top theme lacks representative evidence.
- No review excerpt is fabricated or detached from source lineage.
- Product and competitor evidence are clearly separated.
- Low-confidence and partially blocked sources are labeled.

## Automated Checks

Run after every mining report:

- JSON schema validation for `ReviewMiningReport`.
- Every theme must include at least one representative evidence item.
- Every evidence URL must be a valid HTTP(S) URL.
- Theme scores must be integers from 0-100.
- Single-source themes must score no higher than 65.
- SERP-snippet-only themes must score no higher than 35.
- Review dates must fall within the requested date range when the date is available.
- Ratings must include a rating scale before cross-source comparison.
- Source counts in the summary must reconcile with evidence rows.
- Competitor evidence must not be mixed into primary product theme frequency.

## Failure Modes To Track

- Mistaking marketing testimonials for third-party reviews.
- Inventing or over-extending review quotes during summarization.
- Losing source lineage after deduplication.
- Overweighting SERP snippets when fetched review pages are available.
- Treating one viral complaint as a broad theme.
- Merging reviews from similarly named products.
- Missing app-store localization or country-specific listing differences.
- Failing on JS-rendered review pages.
- Producing generic themes like "ease of use" without specific evidence.
- Reporting reviewer identity details that are not needed for the insight.

## Golden Examples

Create fixtures before implementation:

1. B2B review fixture: one product with G2 and Capterra pages, known pros/cons, and competitor mentions.
2. Mobile app fixture: one app with Apple App Store and Google Play reviews where sentiment differs by platform.
3. Extension fixture: one browser extension with Chrome Web Store reviews and recurring reliability complaints.
4. Ambiguous-name fixture: one product name that collides with unrelated products or consumer apps.
5. Sparse-source fixture: one product where only SERP snippets and a few public reviews are available.

Each fixture should include:

- Input mining brief
- Discovery SERP results
- Fetched page metadata
- Extracted review evidence
- Expected top themes
- Expected excluded sources
- Acceptable sentiment labels
- Disallowed claims

## Launch Criteria

The MVP is ready for first users when:

- 24-brief benchmark completes without crashes.
- Top-theme precision is at least 85%.
- Evidence validity is at least 97%.
- Source discovery coverage is at least 80%.
- Duplicate review rate is below 5%.
- Median reviewer time is under 20 minutes per report.
- Batch cost is estimated before each run and recorded after completion.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
