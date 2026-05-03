# Evaluation

Goal: prove Prompt-to-Research-Report Agent can turn broad user prompts into accurate, readable, cited reports while making weak evidence, uncertainty, and unsupported claims visible.

## Test Set

Use 40 research prompts:

- 6 market trend prompts with fast-changing evidence and mixed source quality.
- 6 competitor or vendor landscape prompts requiring entity disambiguation.
- 5 customer or buyer-behavior prompts where proof often appears in case studies and surveys.
- 5 product or pricing research prompts requiring rendered pages and recent updates.
- 4 policy, regulatory, or risk prompts where authoritative sources matter.
- 4 local or geo-sensitive prompts using country, city, and device targeting.
- 4 ambiguous prompts with same-name brands, acronyms, products, or categories.
- 3 sparse-evidence prompts where the correct output should be gap-heavy.
- 3 intentionally adversarial prompts that ask for unsupported conclusions.

For each prompt, create a human-labeled benchmark:

- Intended topic, entities, geography, time window, and audience.
- Required subquestions and acceptable report structure.
- High-quality source domains and source types.
- Known weak, stale, syndicated, or irrelevant sources.
- Claims that must be cited.
- Claims that are unsupported and should be removed or caveated.
- Known contradictions and ambiguity traps.
- Reference answer, unknowns, and suggested next research.

## Metrics

Primary metrics:

- Prompt resolution: at least 95% of reports correctly infer the intended topic, scope, geography, and audience or ask for clarification.
- Source validity: at least 95% of material claims cite evidence that exists in the source inventory.
- Citation precision: at least 90% of citations directly support the claim they are attached to.
- Unsupported-claim handling: 100% of unsupported material claims are removed, downgraded, or moved to unknowns.
- Report usefulness: at least 85% of reports receive a reviewer score of 4 or 5.
- Review speed: median human review time is under 15 minutes for a standard-depth report.

Secondary metrics:

- Coverage of required subquestions.
- Source diversity across primary, news, authoritative, industry, company-owned, and customer evidence.
- Freshness against requested time windows.
- Recall of important recent events, product changes, pricing changes, or policy changes.
- Accuracy of contradiction and caveat detection.
- Correct use of country, city, and device targeting.
- Cost per report by quick, standard, and deep modes.
- Export completeness for Markdown, JSON, and CSV.

## Manual Review Rubric

Score each report from 1-5:

- Scope fit: Does it answer the user's actual prompt and constraints?
- Research plan quality: Are subquestions and searches appropriate for the prompt?
- Evidence quality: Are cited sources credible and inspectable?
- Citation quality: Do citations support the exact sentence or bullet they attach to?
- Synthesis quality: Does the report explain what the evidence means without overstating it?
- Uncertainty handling: Are weak evidence, contradictions, and unknowns easy to see?
- Readability: Can a reviewer understand the answer and next steps quickly?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No material claim appears without a citation or caveat.
- Every required subquestion is answered or explicitly marked unresolved.
- Source inventory includes URL, query, rank, source type, geography, device, and timestamp.
- Chatbot-sourced answers are verified against fetched pages or clearly labeled.
- Ambiguity and same-name risks are resolved or surfaced.

## Automated Checks

Run after every report build:

- Validate request, report, source inventory, and claim graph against JSON schema.
- Every material claim has at least one citation ID or appears in unknowns.
- Citation IDs resolve to source records.
- Source URLs are valid HTTP(S) URLs.
- Excluded domains do not appear in citations or source inventory.
- Fetched pages include fetch timestamp, status, and rendering settings.
- SERP records include query, rank, country, city, and device.
- Confidence values are only `high`, `medium`, or `low`.
- Snippet-only claims are capped at low confidence.
- Company-owned-only claims are capped at medium confidence unless corroborated.
- Stale sources are capped or marked stale when outside the requested time window.
- AI-answer-only claims are either fetched and verified or labeled as chatbot context.
- Markdown export contains all citations present in JSON.

## Failure Modes To Track

- Producing a confident report from a vague prompt without clarifying or surfacing assumptions.
- Attaching citations that mention the topic but do not support the claim.
- Treating Google snippets as equivalent to fetched-page evidence.
- Allowing chatbot answers to introduce uncited claims.
- Confusing same-name companies, products, locations, or acronyms.
- Overweighting vendor-owned pages without independent corroboration.
- Missing important evidence because JavaScript rendering, captcha handling, or mobile targeting was skipped.
- Presenting stale pricing, product, policy, or market evidence as current.
- Hiding contradictions in a smooth summary.
- Returning a generic essay instead of a prompt-specific report.
- Dropping source metadata needed to audit the result.

## Golden Examples

Create fixture prompts before implementation:

1. Market trend: fast-moving AI category with fresh news and vendor claims.
2. Vendor landscape: overlapping competitors and same-category alternatives.
3. Pricing research: dynamic pricing pages and stale third-party pages.
4. Buyer behavior: surveys, case studies, and weak anecdotal evidence.
5. Policy risk: authoritative government pages plus commentary.
6. Local research: different SERPs by city and mobile device.
7. Ambiguous acronym: multiple entities share the same term.
8. Sparse evidence: public web evidence cannot answer the prompt fully.

Each fixture should include:

- Input request.
- Expected research plan.
- Raw SERP snippets.
- Fetched page excerpts.
- AI answers with sources.
- Expected source-quality labels.
- Required claims and citations.
- Disallowed claims.
- Confidence caps.
- Human-written reference report.

## Launch Criteria

The MVP is ready for first users when:

- 40-prompt benchmark completes without crashes.
- Prompt resolution is at least 95%.
- Source validity is at least 95%.
- Citation precision is at least 90%.
- Unsupported-claim handling reaches 100%.
- Median standard report review time is under 15 minutes.
- Quick, standard, and deep modes log estimated and actual Massive MCP credit usage.
- Markdown, JSON, and CSV exports are complete and readable.
