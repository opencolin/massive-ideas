# Evaluation

Goal: prove Persona Pain-Point Extractor produces a useful, source-backed map of persona-specific frustrations faster than manual forum, review, and support research.

## Test Set

Use 20 persona/problem briefs:

- 5 mature B2B software personas with abundant review and support content.
- 4 emerging AI-tool personas where vocabulary is unstable.
- 4 consumer or prosumer workflow personas with forum-heavy evidence.
- 3 local or region-sensitive personas where geography changes source language.
- 2 ambiguous personas that overlap with excluded topics.
- 2 sparse personas with limited public evidence.

For each brief, create a human-labeled benchmark:

- Expected high-confidence pain points
- Expected irrelevant or excluded complaints
- Persona vocabulary and emotional language
- Known workaround patterns
- Source domains that should be considered high quality
- Human-written summary of the problem space

## Metrics

Primary metrics:

- Pain precision: at least 85% of top 10 pain points should be human-rated relevant to the persona and problem space.
- Source validity: at least 95% of factual claims should be backed by fetched page evidence, SERP lineage, or AI-answer source URLs.
- Persona-fit accuracy: at least 80% of high-fit labels should be confirmed by explicit role, workflow, product, or context evidence.
- Time saved: reduce first-pass persona pain research from 3-6 hours to under 25 minutes of review.

Secondary metrics:

- Recall of benchmark pain points in the top 25.
- Quote usefulness for messaging and discovery-call phrasing.
- Workaround extraction coverage.
- Trigger-event extraction coverage.
- Duplicate pain rate after clustering.
- Cost per completed persona run.
- Geographic relevance for country or city-targeted briefs.

## Manual Review Rubric

Score each pain map from 1-5:

- Persona relevance: Are the pains actually tied to the requested persona?
- Problem relevance: Are extracted pains about the requested workflow or problem space?
- Evidence quality: Are claims grounded in credible, inspectable, and recent sources?
- Quote quality: Do snippets capture real customer language without over-quoting?
- Clustering quality: Are duplicate complaints merged without losing nuance?
- Actionability: Could a founder, PM, marketer, or seller use the output immediately?
- Honesty: Are inferred, sparse, or ambiguous findings labeled clearly?

A pain map is MVP-acceptable when:

- Average reviewer score is at least 4.
- No top 10 pain point lacks source evidence.
- At least 70% of top 10 pain points include a useful first-person or review-style snippet.
- High-confidence persona-fit labels are supported by explicit evidence.
- Exclusions are respected in the final pain list.

## Automated Checks

Run after every extraction:

- JSON schema validation for the final pain map.
- `frequency_score` values must be integers from 0-100.
- Every top 10 pain point must include at least two evidence items or one high-quality first-person source.
- Every evidence item must include a valid HTTP(S) URL and fetch timestamp.
- Verbatim snippets must stay short and include source URLs.
- Claims from AI answers must not appear unless backed by source URLs or fetched pages.
- Pain points matching excluded topics must be omitted or marked low confidence.
- Source-domain counts must reconcile with raw fetched pages.
- Persona-fit labels must include explicit or inferred rationale in source notes.

## Failure Modes To Track

- Treating vendor support documentation as first-person pain.
- Overgeneralizing a single loud complaint into a broad persona pain.
- Extracting product bugs without explaining the underlying workflow pain.
- Losing role, company-size, geography, or device context during synthesis.
- Including complaints from excluded personas or adjacent markets.
- Overweighting review sites that duplicate syndicated content.
- Producing generic pains that could apply to any software buyer.
- Quoting too much text or exposing unnecessary usernames.
- Letting chatbot answers invent pain themes not present in fetched sources.

## Golden Examples

Create fixture briefs before implementation:

1. Mature B2B persona: abundant G2-style reviews, vendor communities, and support docs.
2. Forum-heavy persona: many public posts with informal first-person language.
3. Ambiguous persona: overlapping terms where exclusions are required.
4. Sparse persona: limited public evidence where the correct behavior is low confidence and clear gaps.
5. Local persona: city-targeted SERPs where regional regulations, vendors, or workflows alter the pain profile.

Each fixture should include:

- Input persona brief
- Raw SERP snippets
- AI answers with source URLs
- Fetched source excerpts
- Human-labeled pain points
- Expected language patterns
- Disallowed claims
- Acceptable score ranges

## Launch Criteria

The MVP is ready for first users when:

- 20-brief benchmark completes without crashes.
- Top 10 pain precision is at least 85%.
- Source validity is at least 95%.
- Median human review time is under 25 minutes per persona.
- Duplicate pain rate is below 8%.
- At least 70% of top pain points include useful persona language snippets.
- Batch cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
