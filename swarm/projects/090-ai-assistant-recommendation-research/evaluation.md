# Evaluation

Goal: prove AI Assistant Recommendation Research Tool accurately captures what assistants recommend, verifies whether cited sources support the claims, and surfaces useful positioning gaps faster than manually asking assistants and auditing search results.

## Test Set

Use 45 benchmark recommendation scenarios:

- 8 B2B software categories with many comparison and alternatives pages.
- 6 consumer product categories where price, availability, and review claims change often.
- 6 AI tool categories with fast-moving vendor names and features.
- 5 local or regional service categories where country, city, and device targeting matter.
- 5 healthcare, finance, or legal-adjacent categories requiring careful claim restraint.
- 5 categories with common product aliases, rebrands, or acquired products.
- 4 categories where a watched product should be omitted because it fails constraints.
- 3 sparse categories where assistants should admit uncertainty.
- 3 adversarial prompts that invite unsupported "best" claims or outdated recommendations.

For each benchmark, create human labels:

- Category, buyer persona, use case, constraints, exclusions, and expected ambiguity.
- Prompt variants and assistant personas.
- Real vendors, aliases, domains, and disallowed fake entities.
- Expected recommendation entities and acceptable rank ranges.
- Claims that are supported, unsupported, outdated, or not checkable.
- Baseline SERP results that should and should not influence recommendations.
- Watched products that should be mentioned, omitted, or flagged as a poor fit.
- Human-written positioning actions.

## Metrics

Primary metrics:

- Recommendation extraction accuracy: at least 94% of recommended products should be correctly extracted from raw assistant answers.
- Entity normalization accuracy: at least 92% of product names, aliases, and domains should match human labels.
- Source support accuracy: at least 90% of supported versus unsupported claim judgments should match human review.
- Omission detection accuracy: at least 88% of relevant watched-product omissions should be identified.
- Hallucination detection precision: at least 95% of flagged fake or unverifiable products should be valid flags.
- Evidence validity: 100% of reported recommendation claims should include prompt, assistant run, timestamp, and source lineage.
- Time saved: reduce a 5-prompt by 4-assistant recommendation audit from several hours to under 25 minutes of human review.

Secondary metrics:

- Correct separation of assistant rank and Google SERP rank.
- Consistent handling of country, city, and device context.
- Supported claim recall for pricing, integrations, compliance, and availability.
- Confidence calibration on ambiguous products and partial source support.
- Credit estimate accuracy versus actual Massive MCP cost.
- Summary faithfulness to parsed recommendations and source support.
- Replayability from stored raw answers and evidence files.

## Manual Review Rubric

Score each report from 1-5:

- Extraction: Are recommendations, alternatives, caveats, and ranks captured correctly?
- Entity quality: Are products matched to the right domains and aliases?
- Evidence quality: Do cited pages support the exact claims made?
- Comparative insight: Does the report explain differences across prompts, personas, and baseline search results?
- Guardrails: Does it avoid turning assistant frequency into claims about objective quality or market share?
- Usefulness: Are positioning actions specific, source-backed, and plausible for a product or marketing team?
- Auditability: Can a reviewer trace every claim back to raw prompt, raw answer, fetched page, or parsed SERP?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No unsupported claim is presented as verified.
- No fake product is counted as a real recommendation without a hallucination flag.
- Assistant rank and baseline SERP rank remain separate in tables and summaries.
- Every prompt-persona run includes raw answer storage and source IDs.
- Every low-confidence entity match is visible in the review queue.

## Automated Checks

Run after every report:

- JSON schema validation for brief, baseline results, assistant answers, recommendations, source support, and final report.
- Every assistant answer must include run ID, prompt, assistant persona, timestamp, raw answer, and model settings when available.
- Every recommendation must include entity name, mention type, rank or null, match confidence, and source support status.
- Every cited URL must appear in fetched evidence, baseline SERP evidence, or an explicit unreachable-source list.
- Recommendation rates must be between 0 and 1.
- Visibility scores must be integers from 0-100.
- Assistant recommendation rank must never be merged with SERP rank.
- Country, city, device, prompt variant, and assistant persona must be preserved in grouping keys.
- Unsupported claims must not contribute positive source-support points.
- Omitted watched entities must only be reported for prompts where the entity fits the stated constraints.
- CSV row counts must reconcile with JSON recommendation entities.
- Markdown summaries must cite source IDs for every concrete product claim.

## Failure Modes To Track

- Treating assistant prose as truth without source verification.
- Counting a product mention as a recommendation when it is only a caveat or negative example.
- Merging aliases incorrectly across unrelated products.
- Missing rebrands, acquired domains, or product name changes.
- Letting baseline SERP rank determine assistant recommendation rank.
- Overstating "AI visibility" from too few prompts or personas.
- Accepting citations that mention a product but do not support the specific claim.
- Failing to detect fake products or obsolete product names.
- Ignoring localization differences in availability, pricing, or compliance claims.
- Creating positioning actions that are generic rather than grounded in observed source gaps.
- Losing raw answers, prompts, or model settings needed for replay.
- Using private or gated content as if it were publicly visible recommendation evidence.

## Golden Examples

Create fixture runs before implementation:

1. Consistent leader: one product appears first across all prompts with strong source support.
2. Persona split: enterprise persona recommends a different product than cost-sensitive persona.
3. Omitted watched product: a watched entity is absent despite fitting all constraints.
4. Correct exclusion: a watched entity is omitted because it fails a must-have requirement.
5. Unsupported claim: assistant claims SOC 2 or pricing support that fetched pages do not verify.
6. Citation mismatch: cited page mentions the product but not the claimed feature.
7. Hallucinated vendor: assistant invents or recommends a non-existent product.
8. Alias merge: assistant uses an old or alternate product name that should map to a known vendor.
9. Local divergence: recommendations change for a specific city or country.
10. Sparse market: assistant should produce low-confidence recommendations and a review flag.

Each fixture should include:

- Input recommendation brief.
- Baseline parsed SERPs.
- Fetched page evidence.
- Raw assistant answers.
- Human entity labels.
- Expected parsed recommendation rows.
- Expected source support judgments.
- Expected omissions, hallucinations, and positioning actions.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 45 benchmark scenarios complete without crashes.
- Recommendation extraction accuracy is at least 94%.
- Entity normalization accuracy is at least 92%.
- Source support accuracy is at least 90%.
- Omission detection accuracy is at least 88%.
- Hallucination detection precision is at least 95%.
- Evidence validity is 100%.
- Median human review time is under 25 minutes for a 5-prompt by 4-assistant audit.
- Credit cost is estimated before every run and recorded after completion.
- JSONL run storage can regenerate reports without new Massive MCP calls.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
