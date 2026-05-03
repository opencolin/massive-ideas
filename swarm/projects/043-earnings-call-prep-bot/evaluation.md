# Evaluation

Goal: prove Earnings Call Prep Bot creates useful, conservative, source-backed earnings prep briefs faster than manual research while avoiding unsupported financial claims.

## Test Set

Use 30 public-company briefs:

- 8 large-cap software or internet companies with active product news cycles.
- 5 consumer or marketplace companies where app, pricing, and geography matter.
- 5 industrial, energy, or logistics companies with regulatory and macro context.
- 4 healthcare or biotech companies where filings and regulatory sources are important.
- 4 companies with major recent product launches or packaging changes.
- 4 companies with sparse public product detail where uncertainty should be common.

For each brief, create a human-labeled benchmark:

- company name, ticker, IR URL, earnings period, and call date
- canonical recent earnings materials, filings, transcripts, and company sources
- accepted product and news events during the lookback window
- competitor events that should appear in the brief
- expected risk and question themes
- disallowed claims, especially unsupported revenue, margin, guidance, or stock implications
- source quality labels and publish-date expectations

## Metrics

Primary metrics:

- Fact precision: at least 92% of factual claims are supported by cited sources.
- Theme relevance: at least 85% of top themes are judged relevant to the earnings period.
- Source validity: at least 95% of cited URLs are inspectable and support the attached claim.
- Product recall: at least 80% of benchmark product or packaging events are found.
- News recall: at least 80% of benchmark material news events are found.
- Unsupported finance safety: zero unsupported price target, rating, revenue, margin, or guidance claims.
- Prep time saved: reduce first-pass prep from 2-4 hours to under 25 minutes of review.

Secondary metrics:

- Publish-date extraction accuracy.
- Duplicate or syndicated source rate.
- Correct separation of company, competitor, analyst, and news sources.
- Question-bank usefulness.
- Confidence calibration across high, medium, and low confidence.
- Geo/device sensitivity when product, pricing, or availability varies by region.
- Cost per completed brief.
- Percentage of claims routed to review notes instead of promoted to facts.

## Manual Review Rubric

Score each generated brief from 1-5:

- Relevance: Does the brief focus on likely earnings-call context rather than generic company description?
- Evidence quality: Do claims link to sources that directly support them?
- Product depth: Are recent launches, pricing, packaging, and roadmap hints captured clearly?
- News judgment: Are material news items prioritized over noise and syndicated repeats?
- Competitive usefulness: Does competitor context clarify the narrative without distracting?
- Safety: Are financial implications conservative and clearly sourced?
- Readability: Can a busy reader prepare from the brief quickly?

A brief is MVP-acceptable when:

- Average reviewer score is at least 4.
- No unsupported financial recommendation or forecast appears.
- Every factual claim has at least one source.
- Company primary sources and third-party sources are labeled distinctly.
- Ambiguous or weak claims are visible as review notes.
- The question bank contains at least five specific, source-grounded questions.

## Automated Checks

Run after every brief build:

- JSON schema validation for the final prep pack.
- Every factual claim must include an HTTP(S) source URL.
- Every source record must include source type, fetched timestamp, and URL.
- SERP-discovered sources should preserve query and rank when available.
- Claims with future financial impact language must include explicit source support or be rejected.
- Product timeline items must include a date or be flagged as undated.
- Competitor facts must not be attributed to the target company.
- News, analyst, and third-party sources must not override primary company sources without a conflict note.
- Duplicate URLs and syndicated articles must be deduped or grouped.
- Source publish dates outside the lookback window must be marked as background context.

## Failure Modes To Track

- Turning product-launch language into unsupported revenue impact.
- Missing earnings materials hidden behind JavaScript-rendered IR pages.
- Confusing competitor launches with target-company launches.
- Overweighting syndicated news copies.
- Treating old articles as current because a page was fetched recently.
- Missing localized pricing, availability, or regulatory context.
- Including generic analyst commentary without evidence tied to the quarter.
- Failing to distinguish management commentary from journalist interpretation.
- Losing query, rank, geo, device, or fetch metadata during synthesis.
- Producing a polished brief that is too vague for real call prep.

## Golden Examples

Create fixture briefs before implementation:

1. Software company with multiple AI launches, pricing updates, and active competitors.
2. Consumer company with regional product availability and app-store context.
3. Industrial company with regulation, macro, and customer-contract news.
4. Healthcare company with filings, regulatory milestones, and analyst coverage.
5. Sparse-disclosure company where the correct output includes many low-confidence review notes.

Each fixture should include:

- input brief
- raw SERP snippets
- fetched page excerpts
- expected extracted facts
- expected product timeline
- expected themes and questions
- disallowed claims
- confidence expectations
- final Markdown reference brief

## Launch Criteria

The MVP is ready for first users when:

- 30-brief benchmark completes without crashes.
- Fact precision is at least 92%.
- Source validity is at least 95%.
- Product and news recall are both at least 80%.
- Unsupported finance safety has zero violations.
- Median human review time is under 25 minutes per brief.
- Cost is estimated before each run and recorded after completion.
- Markdown and JSON exports are usable without manual cleanup.
