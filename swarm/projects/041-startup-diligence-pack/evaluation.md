# Evaluation

Goal: prove Startup Diligence Pack Generator creates a useful, source-backed first-pass diligence memo faster than manual startup research while keeping unsupported claims visible.

## Test Set

Use 25 startup briefs:

- 5 seed-stage B2B SaaS companies with public pricing or docs.
- 5 AI application startups with fast-changing categories and many lookalike competitors.
- 4 vertical SaaS companies with customer logos, case studies, and industry directories.
- 4 developer-tool companies with docs, GitHub/community signals, and technical positioning.
- 3 marketplace or consumer startups where geo and mobile SERPs change the evidence surface.
- 2 stealthy or sparse-public-signal startups.
- 2 ambiguous company names that collide with unrelated brands or categories.

For each brief, create a human-labeled benchmark:

- Correct company domain and category
- Known competitors and substitutes
- Expected customer, pricing, hiring, funding, and risk signals
- Disallowed claims that lack public evidence
- High-quality source domains
- Known weak or misleading source types
- Human-written diligence summary, risks, and next questions

## Metrics

Primary metrics:

- Source validity: at least 95% of material claims should be supported by cited SERP, fetched page, or verified AI-answer source evidence.
- Correct company resolution: at least 98% of reports should identify the right company domain and avoid same-name collisions.
- Competitor recall: find at least 70% of human-labeled direct competitors when public evidence exists.
- Risk usefulness: at least 85% of reports should include actionable next diligence questions tied to evidence gaps.
- Time saved: reduce first-pass diligence memo creation from 2-4 hours to under 20 minutes of review.

Secondary metrics:

- Precision of customer and traction examples.
- Pricing evidence recall when pricing is publicly available.
- Hiring-signal relevance against human-labeled role categories.
- Freshness of evidence and visible dates.
- Source diversity across company-owned, third-party, review, directory, job, and news sources.
- Geographic relevance for country, city, and device-targeted runs.
- Cost per completed diligence pack.

## Manual Review Rubric

Score each diligence pack from 1-5:

- Company fit: Does the report describe the correct startup, product, and category?
- Evidence quality: Are material claims grounded in credible, inspectable sources?
- Inference discipline: Are assumptions and interpretations clearly separated from evidence?
- Competitive clarity: Does the report identify direct competitors, substitutes, and positioning differences?
- Risk quality: Are risks specific, material, and paired with useful diligence questions?
- Concision: Can a reader understand the opportunity, evidence, gaps, and next steps in under five minutes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No material traction, revenue, funding, customer, or product-performance claim is presented without evidence or caveat.
- Every section has confidence, evidence, and gaps.
- The report avoids false precision and does not imply private diligence was performed.
- Same-name collisions and category ambiguities are resolved or surfaced as risks.

## Automated Checks

Run after every diligence pack build:

- JSON schema validation for the final report.
- Every material finding must include at least one evidence item or be listed as a gap.
- Evidence URLs must be valid HTTP(S) URLs.
- Source domains must reconcile with raw SERP, fetch, and AI-answer records.
- Every AI-answer claim must include fetched-page confirmation or be labeled as chatbot-sourced context.
- Risk items must include severity and a next step.
- Section scores must be integers from 0-100.
- Company-owned-only sections must score no higher than 70.
- SERP-snippet-only sections must score no higher than 65.
- User-note-only claims must be capped at low confidence.
- Exclusion terms must be checked against extracted competitors, sources, and examples.

## Failure Modes To Track

- Confusing the target company with a same-name company.
- Treating founder, customer, funding, or revenue claims from the user's notes as verified facts.
- Overweighting company-owned pages without independent confirmation.
- Presenting stale funding, hiring, or pricing evidence as current.
- Counting marketplace listings, branch pages, or affiliates as unique customer proof.
- Mistaking broad category competitors for direct competitors.
- Letting chatbot answers introduce uncited claims.
- Missing local competitors because country, city, or device targeting was not applied.
- Ignoring negative evidence such as poor reviews, outages, security issues, or abandoned docs.
- Producing a polished memo that hides source gaps.

## Golden Examples

Create fixture briefs before implementation:

1. Public-pricing SaaS: strong company-owned evidence and several direct competitors.
2. Customer-logo startup: named customers exist but some claims require verification.
3. Sparse startup: few public signals, forcing a gap-heavy memo.
4. AI category startup: unstable category language and many adjacent competitors.
5. Ambiguous name: multiple companies share the name and require domain resolution.
6. Geo-sensitive marketplace: country, city, and mobile SERPs reveal different competitors.

Each fixture should include:

- Input diligence brief
- Raw SERP snippets
- Fetched source excerpts
- AI answers with sources
- Expected section classifications
- Expected competitor set
- Disallowed claims
- Acceptable confidence and section-score ranges

## Launch Criteria

The MVP is ready for first users when:

- 25-brief benchmark completes without crashes.
- Source validity is at least 95%.
- Correct company resolution is at least 98%.
- Competitor recall is at least 70% where public evidence exists.
- Median human review time is under 20 minutes per report.
- Every report includes evidence-backed risks and next diligence questions.
- Batch cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
