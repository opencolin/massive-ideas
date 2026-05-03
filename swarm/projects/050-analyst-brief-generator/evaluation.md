# Evaluation

Goal: prove Analyst Brief Generator produces concise, useful, source-backed briefs faster than manual research while keeping unsupported claims, weak evidence, and contradictions visible.

## Test Set

Use 30 analyst brief requests:

- 5 public-company briefs with strong primary sources and dense news coverage.
- 5 private-company briefs with partial public evidence and same-name collision risk.
- 5 category briefs in fast-moving AI, developer tools, or cybersecurity markets.
- 4 competitor briefs requiring vendor, pricing, positioning, and customer-signal comparison.
- 4 market-event briefs where recency and source freshness matter.
- 3 geo-sensitive briefs where country, city, or mobile SERPs change the evidence surface.
- 2 ambiguous topics that collide with unrelated terms or brands.
- 2 sparse-evidence topics that should produce gap-heavy briefs.

For each request, create a human-labeled benchmark:

- Correct entity, category, geography, and time window.
- Required brief sections and expected source types.
- High-quality source domains and known weak sources.
- Material claims that must be cited.
- Disallowed claims that lack public evidence.
- Known contradictions, stale facts, and same-name traps.
- Human-written brief summary, takeaways, gaps, and next questions.

## Metrics

Primary metrics:

- Source validity: at least 95% of material claims are supported by cited SERP, fetched-page, or verified AI-answer source evidence.
- Citation precision: at least 90% of citations point to sources that directly support the attached claim.
- Correct topic resolution: at least 98% of briefs identify the right company, category, event, or market scope.
- Unsupported-claim handling: 100% of unsupported material claims are removed, downgraded, or moved to gaps.
- Analyst usefulness: at least 85% of briefs receive a reviewer score of 4 or 5 for usefulness.
- Time saved: reduce first-pass brief creation from 1-3 hours to under 15 minutes of review.

Secondary metrics:

- Freshness of sources against the requested time window.
- Source diversity across primary, news, regulatory, review, directory, and market-commentary sources.
- Recall of important recent events and product or pricing changes.
- Precision of competitor and substitute classification.
- Detection of contradictions, stale pages, and regional differences.
- Cost per completed brief by depth mode.
- Export completeness for Markdown, JSON, and CSV source inventory.

## Manual Review Rubric

Score each brief from 1-5:

- Scope fit: Does the brief answer the requested topic, audience, geography, and time window?
- Evidence quality: Are material claims supported by credible, inspectable sources?
- Citation quality: Do citations support the exact claims they are attached to?
- Inference discipline: Are facts, interpretations, and assumptions clearly separated?
- Completeness: Are the required sections covered without padding?
- Gap visibility: Are missing evidence, contradictions, and weak sources easy to see?
- Brevity: Can a reader understand the situation and next questions in under five minutes?

A brief is MVP-acceptable when:

- Average reviewer score is at least 4.
- No material claim is presented without a citation or caveat.
- Every section includes findings, confidence, citations, and gaps.
- Source inventory includes URL, query, rank, type, geography, device, and fetch time.
- Chatbot-sourced claims are verified by fetched pages or clearly labeled as chatbot context.
- Same-name collisions and topic ambiguity are resolved or surfaced as risks.

## Automated Checks

Run after every brief build:

- JSON schema validation for final brief and source inventory.
- Every material claim must include at least one citation ID or be listed as a gap.
- Citation IDs must resolve to source records in the inventory.
- Evidence URLs must be valid HTTP(S) URLs.
- Source domains must reconcile with raw SERP, fetch, and AI-answer records.
- AI-answer claims must include fetched-page confirmation or carry a chatbot-source label.
- Confidence values must be one of `high`, `medium`, or `low`.
- SERP-snippet-only claims must be capped at low confidence.
- Company-owned-only claims must be capped at medium confidence unless independently corroborated.
- Excluded domains must not appear in citations or source inventory.
- Source timestamps must be recorded for every fetched page.
- Markdown export must include all citations that appear in JSON.

## Failure Modes To Track

- Attaching citations that mention a topic but do not support the specific claim.
- Confusing same-name companies, products, markets, or events.
- Treating SERP snippets as full-source evidence.
- Letting chatbot answers introduce uncited or hallucinated claims.
- Overweighting company-owned pages without independent corroboration.
- Presenting stale news, pricing, product, or regulatory evidence as current.
- Missing regional differences because country, city, or device targeting was skipped.
- Producing a polished brief that hides weak evidence.
- Failing to distinguish direct competitors from broad alternatives.
- Ignoring contradictions between sources.
- Dropping source metadata needed for auditability.

## Golden Examples

Create fixture requests before implementation:

1. Public company: many primary and news sources with clear recent product movement.
2. Private company: partial evidence, company-owned claims, and third-party directory data.
3. Fast-moving AI category: many fresh sources and unstable terminology.
4. Competitor comparison: overlapping vendor claims and pricing-page evidence.
5. Market event: high recency pressure and conflicting news reports.
6. Ambiguous topic: multiple entities share the same name.
7. Geo-sensitive topic: localized SERPs and mobile rendering reveal different evidence.
8. Sparse evidence: the correct output should be mostly gaps and next questions.

Each fixture should include:

- Input brief request.
- Raw SERP snippets.
- Fetched page excerpts.
- AI answers with sources.
- Expected source quality labels.
- Expected material claims and required citations.
- Disallowed claims.
- Acceptable confidence caps.
- Human-written reference brief.

## Launch Criteria

The MVP is ready for first users when:

- 30-request benchmark completes without crashes.
- Source validity is at least 95%.
- Citation precision is at least 90%.
- Correct topic resolution is at least 98%.
- Unsupported-claim handling reaches 100%.
- Median human review time is under 15 minutes per brief.
- Markdown, JSON, and CSV exports are complete and readable.
- Estimated and actual Massive MCP credit usage are logged for every run.
