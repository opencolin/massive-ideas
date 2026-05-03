# Evaluation

Goal: prove Localized Ad Landing Page Verifier catches real geo, device, offer, and compliance mismatches in paid-search journeys while keeping findings source-backed, reviewable, and low-noise.

## Test Set

Use 30 verification runs:

- 6 city-localized service campaigns where city, service area, and phone number matching matter.
- 5 multi-country ecommerce campaigns where currency, shipping, availability, and language vary.
- 4 regulated finance or insurance campaigns where disclosures and prohibited claims matter.
- 4 healthcare or education campaigns where eligibility and location language must be qualified.
- 4 mobile-heavy campaigns where sticky CTAs, forms, app banners, or overlays change the experience.
- 3 campaigns with no live brand ad for some query-target pairs.
- 2 redirect-heavy campaigns where tracking URLs and final destinations vary by geography.
- 2 ambiguous or competitor-heavy SERPs where the correct output is mostly coverage warnings.

For each run, create a human-labeled benchmark:

- Brief with brand, campaign, query set, targets, and verification rules
- Raw SERP ad observations by query, country, city, language, and device
- Rendered landing-page text and redirect metadata
- Expected ad-to-page claim matches and mismatches
- Required and prohibited claim labels
- Expected issue types, severity, and confidence
- Expected target score bands
- Disallowed findings where evidence is too thin or speculative

## Metrics

Primary metrics:

- Critical issue recall: at least 90% of human-labeled critical or high-severity mismatches are detected.
- Evidence validity: at least 95% of findings include inspectable SERP or rendered-page source lineage.
- Finding precision: at least 85% of high or critical findings are accepted by human reviewers.
- Localization accuracy: at least 90% of city, country, language, currency, and device observations are attributed to the correct target.
- Review time saved: reduce first-pass localized ad QA from 30-60 minutes per target matrix to under 10 minutes of review.

Secondary metrics:

- Correct classification across the issue taxonomy.
- Accurate detection of absent brand ads and low-coverage target pairs.
- Redirect-chain and wrong-destination detection precision.
- Required disclosure recall.
- Prohibited claim precision.
- Mobile rendering warning usefulness.
- Agreement between automated score bands and reviewer score bands.
- Credit estimate accuracy before execution.

## Manual Review Rubric

Score each target result from 1-5:

- Coverage: Did the verifier inspect the intended query-target-device matrix?
- Evidence quality: Are findings supported by ad copy, URL, rank, target metadata, and rendered landing observations?
- Localization judgment: Are city, country, language, currency, phone, and availability comparisons accurate?
- Severity calibration: Are critical, high, medium, and low findings ranked the way a marketer or compliance reviewer would triage them?
- Actionability: Does each recommendation tell the team what to change without overreaching beyond the evidence?
- Restraint: Does the report avoid inventing campaign settings, policy conclusions, eligibility rules, or business claims?
- Export usefulness: Can JSON, Markdown, and CSV outputs be used by marketing, agency, and compliance reviewers without cleanup?

A target result is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every high or critical issue has at least two evidence items or a clear explanation for single-source evidence.
- Query, rank, target, URL, redirect chain, and fetch timestamp are present where relevant.
- AI-written diagnosis is distinguishable from observed text.
- Missing ads, captcha challenges, render failures, and ambiguous redirects appear as warnings instead of hidden failures.
- Findings are not merged across city, country, language, or device targets.

## Automated Checks

Run after every verification batch:

- JSON schema validation for final report and issue rows.
- Scores must be integers from 0-100.
- Every issue must include severity, issue type, target, recommendation, evidence, and confidence.
- Evidence URLs must be valid HTTP(S) URLs when a URL is present.
- SERP-derived evidence must include query, rank, target, and timestamp.
- Landing-page evidence must include requested URL, final URL, target, and timestamp.
- High or critical findings must include observed ad text, observed landing text, or both.
- Required and prohibited claim checks must be traceable to the brief rules.
- Target observations must not be silently merged across device or city.
- Automatic score caps must fire for no-ad coverage, render failure, redirect risk, wrong destination, and unapproved claims.
- Markdown, JSON, and CSV exports must reconcile on issue ID, severity, issue type, target, and source URLs.

## Failure Modes To Track

- Reporting a mismatch from generic page knowledge instead of observed ad and landing evidence.
- Merging Austin mobile and Austin desktop observations into one finding.
- Treating organic results as paid ads without labeling the fallback.
- Missing localized redirects that change the final URL by country or city.
- Overstating legal or compliance conclusions without user-provided rules.
- Flagging benign copy differences as high-severity offer mismatches.
- Missing mobile-only blockers caused by banners, modals, hidden CTAs, or broken forms.
- Losing original ad copy after following tracking redirects.
- Treating captcha or render failure as a pass.
- Producing polished recommendations when target coverage is too thin.

## Golden Examples

Create fixture runs before implementation:

1. Local services: brand ad mentions a city, landing page routes to a generic national page.
2. Ecommerce: mobile ad shows a sale price in one currency, landing page renders another currency after redirect.
3. Regulated finance: ad uses a prohibited guarantee phrase and landing page lacks qualifying language.
4. Multi-language: Spanish target returns English ad copy and English landing page.
5. Device issue: mobile landing page hides the primary CTA behind an app-install interstitial.
6. Redirect risk: tracking URL sends one city to the correct page and another city to a wrong market.
7. No-ad coverage: SERP has only competitor ads for several priority query-target pairs.
8. Clean campaign: localized ad, landing copy, disclosure, and CTA all match and should produce a high score.

Each fixture should include:

- Input verification brief
- Raw SERP ad snippets by query and target
- Rendered landing text and extracted localized terms
- Redirect chain and final URL
- Human issue labels and severity
- Expected score band
- Expected warnings
- Disallowed speculative findings

## Launch Criteria

The MVP is ready for first users when:

- 30-run benchmark completes without crashes.
- Critical issue recall is at least 90%.
- Evidence validity is at least 95%.
- High and critical finding precision is at least 85%.
- Localization attribution accuracy is at least 90%.
- Median reviewer time is under 10 minutes per target matrix.
- High-severity false-positive rate is below 15%.
- Batch credit cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
