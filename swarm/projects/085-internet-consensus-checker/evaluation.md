# Evaluation

Goal: prove Internet Consensus Checker reliably improves on a single search or single chatbot answer by surfacing agreement, disagreement, source quality, and uncertainty from two independent public-web passes.

## Test Set

Use 40 benchmark questions:

- 8 stable factual questions where strong consensus should be easy to find.
- 6 fast-changing product, pricing, or feature-availability questions.
- 5 legal, policy, or compliance questions where primary sources matter.
- 5 technical questions where docs and release notes may disagree with blogs.
- 4 market-belief questions where evidence is noisy or proxy-based.
- 4 local or regional questions with country, city, or device-specific answers.
- 4 questions with credible public disagreement.
- 4 intentionally ambiguous or underspecified questions that should return weak, conflict, or unknown.

For each question, create a human-labeled benchmark:

- Expected consensus level and confidence range.
- Canonical high-quality sources and source types.
- Known stale, low-quality, duplicated, or misleading sources.
- Expected agreed claims and disputed claims.
- Required caveats for geography, date, scope, product version, or population.
- Disallowed overclaims.
- Follow-up questions a careful researcher should ask.

## Baselines

Compare against:

- Single Google-style search with top results summarized.
- Single `ai_chat_completion` answer with web sources.
- Direct-pass-only version of this app.
- Human researcher first-pass notes after 15 minutes.

The MVP should show measurable gains in conflict detection, caveat quality, and source traceability, even when the final answer is less confident.

## Metrics

Primary metrics:

- Consensus label accuracy: at least 85% match with human labels.
- Conflict recall: at least 90% of benchmark conflicts are detected.
- Source validity: at least 95% of cited sources are relevant and inspectable.
- Claim support: at least 95% of agreed claims have source evidence from both pass types or a clear reason why one pass lacks coverage.
- Overclaim rate: fewer than 5% of reports present a mixed, weak, conflict, or unknown case as settled.
- Caveat quality: at least 85% of required date, region, product-version, and scope caveats are present.

Secondary metrics:

- Query diversity between direct and challenge passes.
- Independent-domain count per report.
- Duplicate and syndicated source suppression rate.
- Freshness policy compliance.
- Primary-source coverage for high-risk questions.
- Correct handling of JS-rendered and captcha-challenged pages.
- Cost per completed check.
- Median runtime.
- User-rated usefulness for deciding whether to trust, reject, or investigate a claim.

## Manual Review Rubric

Score each report from 1-5:

- Answer usefulness: Does the short answer help the user decide what to do next?
- Skepticism: Did the second pass uncover real limits, dissent, stale evidence, or scope issues?
- Evidence quality: Are sources authoritative enough for the question risk level?
- Traceability: Can a reviewer connect every claim to pass, query, rank, URL, and fetch timestamp?
- Calibration: Does confidence match the strength and independence of evidence?
- Caveats: Are geography, date, product version, source type, and uncertainty handled clearly?
- Brevity: Is the report concise enough to read quickly without hiding important disagreement?

An output is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-confidence claim lacks a citation.
- Direct and challenge passes are visible and meaningfully different.
- The report does not collapse credible disagreement into a false consensus.
- Follow-up questions are useful for unresolved or high-risk claims.

## Automated Checks

Run after every report:

- JSON schema validation.
- Consensus score is between 0 and 1.
- Consensus level is one of the allowed labels.
- Every source has URL, source type, pass, query, fetched timestamp, and fetch status.
- Every cited source is from `direct` or `challenge`.
- Every high-confidence agreed claim has at least two independent source domains.
- Every disputed claim has evidence or an explicit unresolved reason.
- Any `conflict` report includes at least two conflicting claims or sources.
- Any `unknown` report includes a coverage explanation.
- Freshness-sensitive reports include source dates or a stale-source warning.
- Query logs for direct and challenge passes are not identical.
- Duplicate domains and syndicated copies are flagged before consensus scoring.

## Failure Modes To Track

- Treating repeated snippets from copied articles as independent consensus.
- Letting the second pass inherit assumptions from the first pass.
- Overweighting SEO pages for technical or legal questions.
- Missing current information because results vary by country, city, or device.
- Failing to fetch JavaScript-rendered docs or pricing pages.
- Hiding credible disagreement inside a polished summary.
- Using stale sources for current product, legal, pricing, or policy claims.
- Producing a cautious but unhelpful answer with no next step.
- Citing sources that mention keywords but do not answer the question.
- Failing to distinguish "public consensus" from "truth."

## Golden Examples

Create fixtures for:

1. Strong consensus: stable factual answer with multiple primary sources.
2. Moderate consensus: same answer, but with date or scope caveats.
3. Mixed consensus: major sources agree on direction but disagree on extent.
4. Conflict: credible official or expert sources disagree.
5. Unknown: public sources are sparse or do not answer the actual question.
6. Stale trap: old blog posts contradict newer official docs.
7. Regional variant: answer changes by country or city.
8. JS-rendered source: important answer appears only after rendered fetch.

Each fixture should include:

- Input brief.
- Direct-pass queries and SERP snippets.
- Challenge-pass queries and SERP snippets.
- Fetched source excerpts.
- Expected extracted claims.
- Expected consensus label, score range, and caveats.
- Sources that should be excluded or downweighted.
- Expected follow-up questions.

## Launch Criteria

The MVP is ready for first users when:

- 40-question benchmark completes without crashes.
- Consensus label accuracy is at least 85%.
- Conflict recall is at least 90%.
- Source validity is at least 95%.
- Overclaim rate is below 5%.
- Median run cost and runtime are shown before execution and recorded after completion.
- Markdown and JSON reports are readable without manual cleanup.
- At least 80% of pilot users say the tool made them more confident about whether to trust, reject, or investigate a public claim.
