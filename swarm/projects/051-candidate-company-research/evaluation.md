# Evaluation

Goal: prove Candidate Company Research Assistant helps candidates prepare faster and ask better questions while keeping public evidence, interpretation, and uncertainty clearly separated.

## Test Set

Use 30 candidate research briefs:

- 5 large public companies with extensive investor, news, salary, and interview data.
- 5 venture-backed startups with recent funding, hiring, and product updates.
- 5 companies with mixed employee-review signals and role-specific culture concerns.
- 4 remote-first or hybrid companies where geography changes job and compensation context.
- 4 companies with ambiguous names or multiple similarly named subsidiaries.
- 3 companies with recent layoffs, pivots, lawsuits, outages, or leadership changes.
- 2 sparse-signal private companies with limited public information.
- 2 job postings that are stale, duplicated, or hosted on third-party boards.

For each brief, create a human-labeled benchmark:

- Correct company domain, identity, and role posting
- Expected official sources and high-quality third-party sources
- Known company health, product, hiring, culture, compensation, and risk signals
- Disallowed claims that lack source support
- Expected interview questions for the role and candidate priorities
- Human-written candidate brief and red-flag assessment

## Metrics

Primary metrics:

- Source validity: at least 95% of material claims should be supported by cited SERP, fetched page, or verified AI-answer source evidence.
- Correct company resolution: at least 98% of briefs should identify the right company and avoid same-name collisions.
- Role relevance: at least 85% of candidate takeaways should be specific to the supplied role, seniority, location, or priorities.
- Red-flag usefulness: at least 85% of briefs should include actionable questions tied to evidence gaps or negative signals.
- Time saved: reduce candidate prep from 60-90 minutes of manual research to under 10 minutes of review.

Secondary metrics:

- Recency of news, funding, layoffs, hiring, and compensation evidence.
- Recall of job-posting responsibilities and requirements.
- Precision of culture themes when based on review data.
- Salary range usefulness and caveat quality.
- Diversity across official, news, job-board, review, salary, investor, documentation, and social proof sources.
- Geographic relevance for country, city, and device-targeted searches.
- Cost per completed candidate brief.

## Manual Review Rubric

Score each brief from 1-5:

- Company identity: Does the report describe the correct company, domain, and role?
- Evidence quality: Are material claims grounded in credible, inspectable sources?
- Candidate usefulness: Does the brief translate evidence into practical interview or decision guidance?
- Role specificity: Are takeaways tailored to the role, function, seniority, location, and priorities?
- Inference discipline: Are facts, interpretation, and unknowns clearly separated?
- Risk handling: Are red flags specific, fair, and paired with questions the candidate can ask?
- Concision: Can a candidate understand the opportunity, concerns, and next steps in under five minutes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No material company-health, salary, culture, layoff, funding, or employee-experience claim is presented without evidence or caveat.
- Every section has confidence, evidence, and gaps.
- Anonymous reviews are summarized as themes, not treated as definitive facts.
- Same-name collisions and stale job postings are resolved or surfaced as risks.

## Automated Checks

Run after every brief build:

- JSON schema validation for the final report.
- Every material finding must include at least one evidence item or be listed as a gap.
- Evidence URLs must be valid HTTP(S) URLs.
- Source domains must reconcile with raw SERP, fetch, and AI-answer records.
- Every AI-answer claim must include fetched-page confirmation or be labeled as chatbot-sourced context.
- Red flags must include severity, evidence, and a candidate question.
- Section scores must be integers from 0-100.
- Anonymous-review-only culture sections must score no higher than 65.
- Chatbot-only sections must score no higher than 50.
- Salary-estimate-only compensation sections must score no higher than 60.
- Job-posting claims must cite the provided posting or a discovered active posting.
- Stale sources older than 24 months must be flagged unless they are evergreen official pages.

## Failure Modes To Track

- Confusing the target company with another company that shares the same name.
- Treating anonymous reviews, salary estimates, or interview anecdotes as verified facts.
- Presenting stale job postings as active opportunities.
- Missing recent layoffs, leadership changes, lawsuits, outages, or funding events.
- Overweighting company-owned culture claims without third-party context.
- Producing generic interview questions that ignore the role and candidate priorities.
- Failing to distinguish local office culture from company-wide culture.
- Letting chatbot answers introduce uncited claims.
- Providing compensation guidance without location, level, or source caveats.
- Making career decisions for the candidate instead of surfacing evidence and questions.

## Golden Examples

Create fixture briefs before implementation:

1. Public company role: strong filings, job posting, news, compensation, and interview evidence.
2. Venture-backed startup: visible funding and hiring signals but limited salary data.
3. Mixed-culture company: conflicting official and employee-review evidence.
4. Ambiguous name: multiple companies share the name and require domain resolution.
5. Stale posting: a third-party job listing remains indexed after the role is removed.
6. Geo-sensitive role: local salary ranges, office reviews, and remote policies differ by city.

Each fixture should include:

- Input candidate research brief
- Raw SERP snippets
- Fetched source excerpts
- AI answers with sources
- Expected section classifications
- Expected red flags and interview questions
- Disallowed claims
- Acceptable confidence and section-score ranges

## Launch Criteria

The MVP is ready for first users when:

- 30-brief benchmark completes without crashes.
- Source validity is at least 95%.
- Correct company resolution is at least 98%.
- Role relevance is at least 85%.
- Median human review time is under 10 minutes per brief.
- Every brief includes source-backed interview questions and red flags.
- Batch cost is estimated before each run and recorded after completion.
- Markdown and JSON exports are readable without manual cleanup.
