# Evaluation

Goal: prove Signup Flow Auditor can identify meaningful signup, trial, demo, and onboarding friction while keeping every recommendation traceable to public evidence.

## Test Set

Use 25 signup-audit briefs:

- 6 mature B2B SaaS categories with well-known trial and demo paths.
- 5 PLG products where signup is mostly self-serve and activation speed matters.
- 4 sales-led products where demo routing, qualification, and proof are central.
- 4 AI tools with fast-changing pricing, waitlist, and usage-limit language.
- 3 products with localized pricing, compliance, or availability differences.
- 3 difficult cases where signup is gated, captcha-heavy, or only partially public.

For each brief, create a human-labeled benchmark:

- Target and competitor domains.
- Known public signup, demo, pricing, and contact-sales entry points.
- Flow type labels and expected page roles.
- Required and optional fields visible before submission.
- Credit card, trial duration, plan, cancellation, and sales-contact expectations.
- Trust signals near conversion, such as security, integrations, reviews, or privacy claims.
- Known mobile or localized blockers.
- Third-party or AI-answer claims about signup difficulty.
- Human-written priority gap list and recommended experiments.

## Metrics

Primary metrics:

- Gap precision: at least 85% of surfaced gap cards should be human-rated relevant and actionable.
- Critical-gap recall: catch at least 75% of benchmarked high-severity signup friction issues.
- Evidence validity: at least 95% of gap claims should cite a valid public observation and source URL.
- Field extraction accuracy: required and optional field labels should be at least 90% accurate on benchmark pages.
- Entry point recall: find at least 90% of benchmarked public signup, demo, and pricing entry points.

Secondary metrics:

- Flow type classification accuracy.
- Pricing, credit card, and trial-term visibility accuracy.
- Mobile blocker detection precision.
- Localization difference detection precision.
- Duplicate gap-card rate after URL, company, and field normalization.
- Cost per completed competitor audit.
- Human review time per report.
- Confidence calibration across low, medium, and high confidence cards.

## Manual Review Rubric

Score each report from 1-5:

- Relevance: Are the gaps about the configured target, competitors, flow types, geography, and device?
- Actionability: Would the recommendation help a team choose a signup, demo, pricing, or routing experiment?
- Evidence quality: Are cited URLs public, inspectable, and directly connected to the claim?
- Competitive clarity: Is the target compared against like-for-like competitor flow types?
- Friction clarity: Does the report separate fields, steps, pricing clarity, mobile blockers, and trust gaps?
- Safety: Does the audit avoid private actions, account creation, purchases, and legal acceptance?
- Concision: Can a reviewer understand the priority work in under 10 minutes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-severity gap lacks a valid source URL.
- No post-submit claim is made unless public evidence supports it.
- AI-answer-only observations are labeled lower confidence than fetched-page observations.
- Every recommended experiment maps back to at least one gap card.

## Automated Checks

Run after every analysis:

- JSON schema validation for brief, observations, gap cards, and report.
- Every gap card must include gap type, severity, confidence, recommendation, and evidence.
- Every evidence item must include observation ID, source type, source URL, and observed fact.
- Source URLs must be valid HTTP(S) and present in raw observations.
- Flow observations must include company, domain, flow type, URL, page role, fetched-at timestamp, and rendered flag.
- Required and optional field arrays must be present even when empty.
- Target and competitor domains must be normalized before matching.
- Audit score must be an integer from 0-100.
- High-severity gaps require either a target-vs-competitor comparison or repeated evidence across pages.
- AI-answer-only gap cards cannot be high confidence.
- Reports with fewer than two comparable competitor flows must be capped and labeled low evidence.
- Markdown and CSV exports must render without missing required fields.

## Failure Modes To Track

- Treating marketing copy as confirmed post-submit product behavior.
- Counting hidden, optional, or autofill fields as required fields.
- Missing JS-rendered forms, modal signup paths, pricing toggles, or SSO buttons.
- Comparing a demo-request flow against a self-serve trial as if they were identical.
- Overstating friction when a field is only required for enterprise routing.
- Ignoring country, city, currency, language, or compliance differences.
- Misreading cookie banners, chat widgets, or captcha prompts as signup steps.
- Recommending reduced qualification when the configured flow is intentionally sales-led.
- Trusting chatbot answers without cited sources or fetched-page corroboration.
- Producing too many small recommendations instead of a short prioritized experiment list.

## Golden Examples

Create fixture briefs before implementation:

1. Email-first competitor advantage: target requires five fields, competitors require only email.
2. Hidden commitment: target hides credit card or trial terms until after CTA.
3. Demo routing mismatch: target asks generic questions while competitors route by role and company size.
4. Pricing visibility gap: competitors disclose plan context before signup and target does not.
5. Mobile friction: target signup modal is hard to complete on mobile while desktop is acceptable.
6. Localization gap: pricing currency or regional availability differs by country.
7. Trust gap: competitors surface security and integration proof next to conversion CTAs.
8. Low-evidence flow: signup is gated or challenged, requiring cautious scoring.

Each fixture should include:

- Brief input
- Raw parsed SERP observations
- Raw fetched page excerpts and form metadata
- Raw AI answers with sources
- Expected normalized domain and entry point matches
- Expected field extraction output
- Expected gap cards
- Expected omitted candidates
- Acceptable score ranges

## Launch Criteria

The MVP is ready for first users when:

- 25 benchmark briefs complete without crashes.
- Gap precision is at least 85%.
- Critical-gap recall is at least 75%.
- Evidence validity is at least 95%.
- Field extraction accuracy is at least 90%.
- Entry point recall is at least 90%.
- Duplicate gap-card rate is below 5%.
- Median human review time is under 10 minutes.
- Every run records planned cost, actual collection counts, skipped URLs, challenges encountered, and export paths.
