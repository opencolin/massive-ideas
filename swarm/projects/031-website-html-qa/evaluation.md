# Evaluation

Goal: prove Website Screenshot/HTML QA Bot catches real cross-device and cross-country website defects with reproducible evidence faster than manual browser, VPN, and responsive-mode QA.

## Test Set

Use 40 benchmark URL-target runs:

- 8 SaaS landing or pricing pages with required CTA and metadata expectations.
- 6 ecommerce pages with currency, shipping, product image, and checkout-link checks.
- 6 localized pages across US, UK, EU, and Canada variants.
- 5 mobile-sensitive pages with known navigation, hero, or sticky CTA issues.
- 5 SEO pages where rendered title, H1, canonical, schema, or robots tags matter.
- 4 lead-capture forms with label, button, and validation concerns.
- 3 pages that intentionally trigger cookie walls, bot challenges, or captchas.
- 3 broken or ambiguous pages where the correct result is partial or low confidence.

For each benchmark, create human labels:

- Expected final URL and acceptable redirects.
- Required visible elements and required text.
- Country-specific language, currency, legal, or shipping expectations.
- Expected SEO metadata and indexability state.
- Accessibility basics that should pass or fail.
- Known visual defects, if any.
- Challenge, captcha, blocked, timeout, or cookie-wall state.
- Disallowed findings that would be overreach.

## Metrics

Primary metrics:

- Critical/high issue recall: at least 90% of human-labeled critical and high issues should be detected.
- False positive rate: fewer than 10% of reported high-severity issues should be rejected by reviewers.
- Evidence validity: 100% of issues should include URL, target, timestamp, category, and screenshot or HTML evidence.
- Target separation: 100% of issues should preserve country, city, and device without cross-target leakage.
- Time saved: reduce a 20-URL by 3-target launch QA pass from several hours to under 30 minutes of review.

Secondary metrics:

- Correct render-state classification for captcha, cookie wall, blocked, timeout, and normal page.
- Required-element detection precision by selector hint and visible text.
- Localization mismatch accuracy for currency, language, and regional legal copy.
- SEO metadata extraction accuracy for title, description, canonical, robots, H1, and schema.
- Accessibility basic-check accuracy for alt text, form labels, and button names.
- Screenshot issue usefulness against human reviewer scores.
- Credit estimate accuracy versus actual run cost.

## Manual Review Rubric

Score each report from 1-5:

- Coverage: Were all requested URLs, countries, cities, and devices tested?
- Accuracy: Are findings real defects rather than subjective preferences?
- Evidence: Can every issue be reproduced from screenshot, rendered HTML, text, metadata, or SERP source?
- Severity: Are critical, high, medium, and low priorities calibrated to user impact?
- Localization: Are country-specific failures detected without assuming one market is canonical?
- SEO and accessibility: Are checks factual and kept separate from speculative ranking impact?
- Restraint: Does the report avoid claiming conversion, traffic, or revenue loss without evidence?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No critical issue lacks screenshot or HTML evidence.
- Every URL-target pair has a status, score, timestamp, and render state.
- Challenge and blocked states are classified separately from content defects.
- AI-generated findings cite concrete observation IDs.

## Automated Checks

Run after every QA report:

- JSON schema validation for the final report.
- All scores must be integers from 0-100.
- Every issue must include issue ID, URL, country, device, severity, category, confidence, and evidence.
- Every high or critical issue must include screenshot or HTML artifact reference.
- Every observation must include fetched-at timestamp and render state.
- Captcha, blocked, timeout, and error observations must not produce normal content checks.
- Required-element checks must include selector hint, required text, or extracted visible text evidence.
- SEO findings must be derived from rendered metadata, not AI-only prose.
- Desktop, mobile, and tablet observations must never share the same target key.
- CSV issue row counts must reconcile with JSON issues.
- Markdown report must include enough context to reproduce each high or critical issue.

## Failure Modes To Track

- Mistaking a captcha, challenge, or cookie wall for the intended page.
- Merging country or device variants into one pass/fail result.
- Reporting subjective design preferences as QA defects.
- Missing mobile-only hidden CTAs, clipped text, or broken nav.
- Treating third-party widgets or delayed JS as absent before render completion.
- Flagging expected country-specific copy as inconsistent.
- Confusing canonical URL strategy with redirect errors.
- Letting AI produce issues without DOM, screenshot, metadata, or SERP evidence.
- Overstating SEO rankings, conversion loss, or revenue impact from technical findings.
- Failing to preserve final URL after redirects.

## Golden Examples

Create fixture runs before implementation:

1. Clean pass: all required elements, metadata, localization, and accessibility basics pass.
2. Missing mobile CTA: desktop passes but mobile country target lacks the primary CTA.
3. Localization mismatch: UK page renders US dollars or US legal copy.
4. SEO regression: rendered page has duplicate H1s, missing canonical, or noindex unexpectedly.
5. Visual overlap: screenshot shows hero text or sticky banner covering the main CTA.
6. Challenge page: fetch returns captcha or bot challenge and is classified as partial, not failed content.
7. SERP mismatch: Google result snippet or landing URL differs from rendered page expectations.

Each fixture should include:

- Input QA brief.
- Raw rendered fetch observation.
- Screenshot artifact.
- Rendered HTML excerpt.
- Human labels for expected issues and severities.
- Expected page score.
- Expected confidence labels.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 40-run benchmark completes without crashes.
- Critical/high issue recall is at least 90%.
- High-severity false positive rate is below 10%.
- Evidence validity is 100%.
- Target separation is 100%.
- Median human review time is under 30 minutes for a 20-URL by 3-target QA pass.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, Markdown, screenshot, and HTML artifacts are readable without manual cleanup.
