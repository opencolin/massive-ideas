# Evaluation

Goal: prove Onboarding Teardown Generator can produce useful, evidence-backed SaaS onboarding audits without inventing private product behavior or overfitting to generic best-practice advice.

## Test Set

Use 30 benchmark briefs:

- 6 PLG SaaS products with self-serve free trials.
- 5 sales-led SaaS products with demo-first conversion paths.
- 5 developer tools with documentation-heavy onboarding.
- 4 collaboration or productivity tools with strong template galleries.
- 4 vertical SaaS products where persona and use case matter heavily.
- 3 mobile-sensitive signup flows.
- 3 intentionally weak or vague onboarding flows that should receive high-risk scores.

For each brief, create a human-labeled benchmark:

- Target brand, domain, and signup URL.
- Persona, company size, use case, geography, city, and device.
- Parsed Google results for target, category, competitor, docs, and review queries.
- Raw fetched target and competitor pages.
- Human-reviewed onboarding stages and observed form fields.
- Known trust signals, pricing terms, first-action promises, and friction points.
- Expected teardown findings and expected omitted false positives.
- Human-written experiment ideas tied to evidence.

## Metrics

Primary metrics:

- Finding precision: at least 85% of surfaced findings should be human-rated relevant.
- Severe issue recall: catch at least 80% of benchmarked high-severity onboarding problems.
- Evidence validity: at least 95% of findings should cite a valid source URL and observed fact.
- No-private-inference rate: 100% of findings about in-product behavior must be supported by public source evidence.
- Experiment usefulness: at least 80% of experiment backlog items should be rated useful by growth or product reviewers.

Secondary metrics:

- Signup form field extraction accuracy.
- Pricing and trial term extraction accuracy.
- Competitive pattern precision across similar SaaS categories.
- Persona-fit scoring calibration against human reviewers.
- False-positive rate for unavoidable category norms.
- Duplicate finding rate after stage and issue normalization.
- Cost per completed teardown.
- Median reviewer time to understand the top three recommendations.

## Manual Review Rubric

Score each report from 1-5:

- Relevance: Does the teardown match the submitted persona, use case, device, and geography?
- Evidence quality: Are claims traceable to fetched pages, SERPs, or chatbot answers with sources?
- Product judgment: Does the report distinguish real onboarding friction from harmless preference?
- Specificity: Are findings tied to stages such as pricing, signup, form, docs, or product tour?
- Competitive clarity: Are competitor norms summarized without blindly copying them?
- Experiment value: Are recommendations testable and tied to measurable activation or conversion outcomes?
- Restraint: Does the report avoid guessing about private app screens that were not fetched?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-severity finding lacks source evidence.
- No private or gated behavior is asserted without a public source.
- Every experiment maps back to at least one finding.
- Every low-evidence teardown has a visible evidence warning and score cap.

## Automated Checks

Run after every analysis:

- JSON schema validation for briefs, sources, signals, findings, and reports.
- Every finding must include type, severity, stage, recommendation, and evidence.
- Every evidence item must include source type, source URL, and observed fact.
- Source URLs must be valid HTTP(S) and present in raw observations.
- SERP observations must include query, rank, URL, title, country, city, device, and collected-at timestamp.
- Target and competitor domains must be normalized before matching.
- Overall and dimension scores must be integers from 0-100.
- Risk level must match the configured score band.
- High-severity findings require direct target evidence plus either competitor contrast or clear persona impact.
- Reports with fewer than three fetched competitor flows must be capped and labeled low evidence.
- Markdown and CSV exports must render without missing required fields.

## Failure Modes To Track

- Inventing in-product onboarding screens that were not publicly accessible.
- Treating all extra form fields as bad without considering sales qualification or risk.
- Penalizing demo-first products as if every SaaS flow should be PLG.
- Confusing temporary captcha or bot protection with normal user experience.
- Ignoring country, city, or device differences in SERP, pricing, and signup behavior.
- Missing JS-rendered signup forms, product tours, pricing calculators, or embedded scheduling widgets.
- Producing generic CRO advice that is not grounded in source evidence.
- Recommending competitor mimicry instead of persona-specific improvement.
- Overweighting review-site complaints when direct onboarding pages say something different.
- Failing to separate acquisition messaging, signup friction, and activation clarity.

## Golden Examples

Create fixture briefs before implementation:

1. Strong PLG flow: clear first-session promise, low friction, strong docs.
2. Generic trial page: vague value proposition and no setup expectation.
3. Demo-first flow: no self-serve signup, but clear qualification and expectations.
4. Developer tool: docs carry onboarding, signup page is intentionally minimal.
5. Pricing uncertainty: trial terms and cancellation expectations are unclear.
6. Captcha/access friction: public flow is challenge-heavy and should be recorded cautiously.
7. Mobile issue: desktop flow is fine, mobile form or CTA is degraded.
8. Low-evidence collection: target pages fetch, but competitors or docs are unavailable.

Each fixture should include:

- Brief input
- Raw parsed SERP observations
- Raw fetched page excerpts
- Extracted onboarding signals
- Human-labeled teardown findings
- Expected omitted false positives
- Expected experiment backlog
- Acceptable score range

## Launch Criteria

The MVP is ready for first users when:

- 30 benchmark briefs complete without crashes.
- Finding precision is at least 85%.
- Severe issue recall is at least 80%.
- Evidence validity is at least 95%.
- No-private-inference rate is 100%.
- Experiment usefulness is at least 80%.
- Duplicate finding rate is below 5%.
- Median reviewer time is under 10 minutes.
- Every run records planned cost, actual collection counts, skipped URLs, failed fetches, access friction, and export paths.
