# Evaluation

Goal: prove the automated research notebook helps users preserve evidence, judge confidence, and produce audit-ready findings without losing source provenance.

## Test Set

Use 40 notebook scenarios:

- 6 market trend notebooks with fast-changing evidence.
- 5 competitor or vendor notebooks requiring entity disambiguation.
- 5 product, pricing, or packaging notebooks with rendered pages.
- 5 buyer-behavior notebooks relying on surveys, reviews, and case studies.
- 4 policy, regulatory, or risk notebooks where authoritative sources matter.
- 4 local research notebooks using country, city, and device targeting.
- 4 sparse-evidence notebooks where the right result is mostly gaps.
- 4 contradiction-heavy notebooks with conflicting sources.
- 3 adversarial notebooks that try to force unsupported conclusions.

For each scenario, create a human-labeled benchmark:

- Intended research question, scope, entities, geography, and time window.
- Required source types and known high-quality domains.
- Known weak, stale, syndicated, or irrelevant sources.
- Snippets that should be retained.
- Claims that should be accepted, downgraded, rejected, or marked unknown.
- Confidence caps and contradiction notes.
- Expected gaps and next research steps.

## Metrics

Primary metrics:

- Source provenance completeness: 100% of snippets and claims link back to source records.
- Citation validity: at least 95% of claim citations support the attached claim.
- Confidence calibration: at least 90% agreement with reviewer confidence labels.
- Unsupported-claim handling: 100% of unsupported claims are rejected, downgraded, or marked unknown.
- Evidence recall: at least 85% of benchmark-important snippets are captured.
- Notebook usefulness: at least 85% of reviewed notebooks receive a score of 4 or 5.

Secondary metrics:

- Correct source-quality classification.
- Correct use of country, city, and device targeting.
- Freshness against the requested time window.
- Ability to detect stale, weak, or vendor-only evidence.
- Duplicate source and duplicate snippet suppression.
- Contradiction and gap detection accuracy.
- Cost per notebook expansion by quick, standard, and deep modes.
- Export completeness for Markdown, JSONL, and CSV.

## Manual Review Rubric

Score each notebook from 1-5:

- Scope fit: Does the notebook stay focused on the research question?
- Source quality: Are credible and inspectable sources prioritized?
- Snippet quality: Are saved snippets concise, relevant, and traceable?
- Claim quality: Do claims follow from the snippets without overstatement?
- Confidence quality: Are confidence notes useful and appropriately cautious?
- Gap handling: Are unknowns, contradictions, and weak areas visible?
- Reviewability: Can a human quickly audit why a finding exists?

A notebook is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every snippet links to a source.
- Every accepted claim links to one or more snippets.
- Unsupported claims are not accepted.
- Source records preserve URL, query, rank, source type, region, device, and timestamp.
- Chatbot-derived leads are verified against fetched sources or clearly labeled.
- Exported Markdown and JSONL contain the same source and claim graph.

## Automated Checks

Run after every notebook expansion:

- Validate notebook, source, snippet, claim, gap, and run records against JSON schemas.
- Every snippet has a valid source ID.
- Every accepted claim has at least one valid snippet ID.
- Every source URL is a valid HTTP(S) URL.
- Excluded domains do not appear in source records or citations.
- SERP records include query, rank, country, city, and device.
- Fetched records include fetch timestamp, status, rendering settings, and source URL.
- Confidence values are only `high`, `medium`, `low`, or `unknown`.
- Snippet-only claims are capped at low confidence.
- Company-owned-only claims are capped at medium confidence unless corroborated.
- Stale sources are marked stale or capped when outside the requested time window.
- AI-answer-only claims are labeled as leads, not accepted findings.
- Markdown export includes every accepted claim and source inventory entry.

## Failure Modes To Track

- Losing the query, rank, timestamp, geography, or device that produced a source.
- Saving long page dumps instead of concise evidence snippets.
- Accepting claims that are only loosely related to the cited snippets.
- Treating chatbot answers as verified evidence.
- Overweighting vendor-owned sources.
- Missing important evidence because JavaScript rendering or captcha handling was skipped.
- Confusing same-name companies, products, places, or acronyms.
- Marking stale pages as current evidence.
- Hiding contradictions by merging them into a smooth summary.
- Producing a notebook that is too noisy for a human to review.

## Golden Examples

Create fixture notebooks before implementation:

1. Market trend: fresh AI category with vendor claims and independent news.
2. Competitor research: several similarly named vendors and products.
3. Pricing research: dynamic pricing pages and stale third-party summaries.
4. Buyer behavior: reviews, surveys, and anecdotal customer stories.
5. Policy risk: authoritative government sources and commentary.
6. Local research: city-specific SERPs and mobile page variants.
7. Sparse evidence: public web evidence cannot answer the question fully.
8. Contradiction: credible sources disagree on adoption, timing, or definitions.

Each fixture should include:

- Input notebook request.
- Expected search and fetch plan.
- Raw SERP snippets.
- Fetched page excerpts.
- Sourced AI-answer leads.
- Expected source-quality labels.
- Required snippets and rejected snippets.
- Accepted, downgraded, and rejected claims.
- Confidence notes and caps.
- Expected gaps.

## Launch Criteria

The MVP is ready for first users when:

- 40-scenario benchmark completes without crashes.
- Source provenance completeness reaches 100%.
- Citation validity is at least 95%.
- Confidence calibration is at least 90%.
- Unsupported-claim handling reaches 100%.
- Evidence recall is at least 85%.
- Median human review time for a standard notebook is under 10 minutes.
- Quick, standard, and deep modes log estimated and actual Massive MCP credit usage.
- Markdown, JSONL, and CSV exports are complete and readable.
