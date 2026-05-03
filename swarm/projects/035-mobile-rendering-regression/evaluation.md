# Evaluation

Goal: prove Mobile Rendering Regression Checker catches meaningful mobile render breakage with traceable evidence while avoiding noisy alerts from normal dynamic content.

## Test Set

Use 40 benchmark page-device cases:

- 8 marketing homepages with responsive hero, navigation, and CTA checks.
- 6 pricing pages with cards, toggles, forms, and sticky elements.
- 6 blog or SEO landing pages with lazy-loaded images and CMS modules.
- 5 signup or demo pages with client-rendered forms.
- 5 ecommerce listing or product pages with overlays and image galleries.
- 4 local pages with city-specific copy, consent flows, and region redirects.
- 3 pages behind common bot or captcha challenges.
- 3 intentionally broken fixtures with known mobile overflow, missing CTAs, and hydration failures.

For each case, create a human-labeled benchmark:

- URL, country, city, and device profile.
- Accepted baseline observation.
- Current observation with injected or known regression.
- Required text, selectors, links, and forms.
- Ignore rules for dynamic areas.
- Expected regression findings.
- Expected omitted false positives.
- Expected severity and health score range.

## Metrics

Primary metrics:

- Regression precision: at least 90% of surfaced findings should be human-rated real issues.
- Critical regression recall: catch at least 95% of missing CTA, broken form, status change, and severe overflow cases.
- Evidence validity: at least 98% of findings should include current snapshot ID, URL, device, and concrete observation.
- Device targeting accuracy: 100% of observations should preserve the requested device ID.
- Baseline matching accuracy: at least 99% of comparisons should use the correct URL-device-geo baseline.

Secondary metrics:

- False-positive rate on dynamic content covered by ignore rules.
- Accuracy of required selector presence and visibility checks.
- Accuracy of required text detection after JS rendering.
- Resource failure spike detection precision.
- Overlay classification quality.
- Score calibration against human severity labels.
- Cost per completed page-device check.
- Median runtime per page-device check.

## Manual Review Rubric

Score each report from 1-5:

- Relevance: Are findings about mobile rendering rather than generic content changes?
- Evidence quality: Can the reviewer inspect the URL, device, snapshot ID, and observed condition?
- Severity judgment: Are missing conversion elements and broken forms prioritized over cosmetic drift?
- Noise control: Are dynamic ads, timestamps, personalization, and chat widgets ignored when configured?
- Actionability: Does the recommendation point to a likely breakpoint, hydration, resource, or overlay cause?
- Baseline discipline: Does the report avoid comparing across devices, geographies, or environments?
- Concision: Can a release owner understand pass/fail status in under five minutes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No critical finding lacks a current snapshot ID.
- No finding cites an ignored selector or ignored text pattern as the sole evidence.
- Required selector failures are separated from lower-risk content similarity changes.
- Every failed page-device result includes one or more concrete findings.

## Automated Checks

Run after every analysis:

- JSON schema validation for briefs, observations, findings, and reports.
- Every page-device pair must have exactly one current observation or an explicit fetch failure.
- Every comparison must include URL, final URL, device, country, city, collected-at timestamp, and status code.
- Baseline and current observations must match on URL key, device ID, country, city, and environment.
- Health score must be an integer from 0-100.
- Overall status must be `fail` when any critical or high regression exists.
- Required selectors must be evaluated and recorded even when absent.
- Viewport overflow must be computed from rendered viewport width and scroll width.
- Ignore rules must be applied before content similarity scoring.
- Markdown and CSV exports must include page label, URL, device, status, severity, finding type, and snapshot IDs.

## Failure Modes To Track

- Comparing current mobile renders against desktop or wrong-city baselines.
- Alerting on normal personalization, timestamps, ads, or chat widgets.
- Missing hidden-but-present CTAs because selector presence is treated as sufficient.
- Missing page-level failure when client-side routing returns a shell with little content.
- Treating captcha, consent, or bot challenge pages as successful app renders.
- Overweighting visual drift when required content and conversion elements still work.
- Failing to catch fixed-width modules that create horizontal overflow.
- Misclassifying redirects to login, locale, or error pages as normal.
- Producing model-written recommendations without deterministic evidence.
- Losing source traceability when exports are generated.

## Golden Examples

Create fixture briefs before implementation:

1. Missing mobile CTA: selector exists in baseline but disappears after a responsive breakpoint change.
2. Hidden CTA: selector exists but is covered by a sticky banner.
3. Horizontal overflow: pricing table exceeds viewport on iPhone profile.
4. Hydration failure: server text appears, but client-rendered form never loads.
5. Region redirect: city-targeted fetch redirects to a different locale page.
6. Captcha challenge: fetch succeeds technically but rendered content is a challenge page.
7. Ignored dynamic module: chat widget changes position and text but should not alert.
8. Baseline capture: no baseline exists, so the run performs presence checks and stores snapshots.
9. Resource spike: CSS or JS failures increase and cause layout degradation.
10. Low-risk copy drift: body copy changes but required elements remain present.

Each fixture should include:

- Brief input
- Baseline observation JSON
- Current observation JSON
- Raw fetched metadata and rendered markdown excerpts
- Human-labeled findings
- Expected omitted false positives
- Expected health score range
- Expected report status

## Launch Criteria

The MVP is ready for first users when:

- 40 benchmark page-device cases complete without crashes.
- Regression precision is at least 90%.
- Critical regression recall is at least 95%.
- Evidence validity is at least 98%.
- Baseline matching accuracy is at least 99%.
- False-positive rate for ignored dynamic content is below 5%.
- Median page-device check completes within the target product SLA.
- Every run records planned cost, actual fetch count, skipped URLs, fetch failures, baseline IDs, current snapshot IDs, and export paths.
