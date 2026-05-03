# Evaluation

Goal: prove Programmatic Landing Research Assistant creates useful, source-backed landing-page briefs faster than manual SERP and competitor review, while avoiding duplicate, thin, or unsupported page recommendations.

## Test Set

Use 30 landing-page research runs:

- 6 industry page batches where topics should have distinct buyer language.
- 5 location page batches with country, city, and mobile sensitivity.
- 5 competitor-alternative page batches with crowded comparison SERPs.
- 4 integration page batches where official docs and marketplace pages matter.
- 4 use-case page batches where intent may be problem-aware rather than transactional.
- 3 ambiguous batches that trigger excluded meanings or irrelevant SERPs.
- 3 thin batches where the correct answer may be "do not create this page yet."

For each run, create a human-labeled benchmark:

- Topic list and expected keep, merge, or reject decisions
- Relevant and irrelevant SERP result examples
- Expected primary search intents by topic
- Competitor, directory, comparison, and official-source examples
- Buyer-language phrases that should appear in briefs
- Content gaps and page-angle opportunities
- Disallowed claims, especially unsupported product proof or market statistics
- Human-written reference brief for at least three topics

## Metrics

Primary metrics:

- Page recommendation usefulness: at least 80% of high-readiness topics should be human-rated as plausible pages to brief, write, or test.
- Evidence validity: at least 95% of claims should be backed by SERP, fetched-page, or AI-answer source lineage.
- Relevance precision: at least 85% of top evidence items per topic should match the requested page pattern, audience, and intent.
- Duplicate control: at least 90% of near-duplicate topics should be flagged for merge or lower readiness.
- Time saved: reduce first-pass landing-page research from 45-90 minutes per page to under 10 minutes of review per page.

Secondary metrics:

- Intent classification accuracy across commercial, comparison, pricing, local, FAQ, and problem-aware queries.
- Buyer-language extraction coverage against human labels.
- Content-gap precision against reviewer judgments.
- Correct low-confidence labeling for thin or ambiguous topics.
- Competitor and domain normalization precision.
- Agreement between automated readiness bands and reviewer readiness bands.
- Batch credit estimate accuracy before execution.

## Manual Review Rubric

Score each page brief from 1-5:

- Intent clarity: Does the brief identify what the searcher is trying to accomplish?
- Evidence quality: Are claims supported by inspectable sources with query and rank lineage?
- Specificity: Does the page angle avoid generic template language?
- Differentiation: Does the brief explain why this page should exist separately from nearby topics?
- Competitive awareness: Does it capture ranking page patterns and competitor approaches accurately?
- Actionability: Could a writer or growth marketer produce a useful page from the outline?
- Restraint: Does it avoid unsupported traffic, revenue, customer, or product-performance claims?

A page brief is MVP-acceptable when:

- Average reviewer score is at least 4.
- The brief has at least five relevant evidence items or is explicitly low confidence.
- Every content gap and SERP pattern includes source lineage.
- Topic, geography, device, query, and rank are visible for SERP-derived claims.
- AI synthesis is clearly distinguishable from sourced facts.
- Duplicate or thin topics are flagged rather than dressed up as ready pages.

## Automated Checks

Run after every landing research batch:

- JSON schema validation for the final report.
- All scores must be integers from 0-100.
- Every evidence item must include topic slug, URL, source type, and either query/rank or fetched-page metadata.
- Result URLs must be valid HTTP(S) URLs.
- Each high-readiness topic must include at least three unique source domains.
- Readiness score must be capped when evidence is sparse, ambiguous, or duplicative.
- Topics dominated by excluded meanings must score below 45 or be rejected.
- Country, city, and device observations must not be merged silently.
- Markdown, CSV, and JSON exports must reconcile on topic slug, scores, confidence, and warnings.
- No final brief may include fabricated statistics, customer names, or product claims not present in supplied input or sources.

## Failure Modes To Track

- Producing a page brief because a topic exists in the spreadsheet, not because evidence supports it.
- Treating broad category SERPs as proof of a specific programmatic landing-page angle.
- Failing to merge topics that would create near-identical pages.
- Overweighting directories or comparison pages that mention a term only once.
- Missing device-specific local packs or city-sensitive SERP changes.
- Confusing informational FAQ intent with commercial landing-page readiness.
- Letting AI synthesis invent proof points, customer claims, or statistics.
- Pulling competitor messaging into the recommended angle without distinguishing it from the user's positioning.
- Ignoring exclusions and ambiguous meanings.
- Hiding low confidence behind polished outline modules.

## Golden Examples

Create fixture runs before implementation:

1. Industry pages: several topics have distinct language and two should be merged.
2. Location pages: mobile SERPs show local packs that desktop SERPs underrepresent.
3. Competitor alternatives: SERPs include strong comparison pages, ads, and official vendor pages.
4. Integration pages: official docs, marketplace listings, and support pages all matter.
5. Ambiguous topic batch: excluded meanings dominate some topics.
6. Thin topic batch: few relevant results and a correct low-readiness recommendation.

Each fixture should include:

- Input landing research brief
- Raw SERP snippets by topic, query, geography, and device
- Fetched source excerpts
- Human relevance labels
- Expected readiness score bands
- Expected keep, merge, or reject decisions
- Expected buyer language and FAQ candidates
- Disallowed claims and disallowed page angles

## Launch Criteria

The MVP is ready for first users when:

- 30-run benchmark completes without crashes.
- Page recommendation usefulness is at least 80%.
- Evidence validity is at least 95%.
- Top evidence relevance precision is at least 85%.
- Duplicate control is at least 90%.
- Median reviewer time is under 10 minutes per page brief.
- High-readiness false-positive rate is below 15%.
- Batch credit cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
