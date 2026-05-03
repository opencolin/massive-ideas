# Evaluation

Goal: prove AI Brand Visibility Tracker measures brand presence in AI answers and search results with reproducible evidence, useful competitive context, and careful handling of unsupported claims.

## Test Set

Use 60 benchmark prompt and query groups across 12 brands:

- 10 category recommendation prompts where the tracked brand should appear.
- 8 comparison prompts naming the brand and two competitors.
- 8 alternative or replacement prompts where competitors often appear.
- 6 local-market prompts across at least three countries or languages.
- 6 mobile-versus-desktop query groups where SERP layout may differ.
- 5 branded prompts checking product description, positioning, pricing, or availability.
- 5 prompts that should produce no brand mention unless sources justify it.
- 4 prompts where AI answers cite third-party review or listicle pages.
- 4 prompts with stale or inaccurate claims in source pages.
- 4 prompts whose citations trigger captcha, rendering failures, or blocked fetches.

For each benchmark, create human labels:

- Prompt or search query, category, buyer intent, expected market, language, and device.
- Tracked brand, aliases, owned domains, and competitor names.
- Whether the brand is mentioned in the answer.
- Whether the brand is cited and whether the citation is brand-owned, competitor-owned, or third-party.
- Brand answer position relative to competitors.
- Sentiment and positioning accuracy.
- Factual claims that are accurate, inaccurate, unsupported, or unclear.
- Source URLs that support or contradict the answer.
- Expected SERP rank and snippet mentions for the tracked brand and competitors.
- Required confidence cap when sources are missing, inaccessible, stale, or unsupported.

## Metrics

Primary metrics:

- Mention detection accuracy: at least 98% agreement with human labels for brand and alias mentions.
- Citation classification accuracy: at least 97% agreement for brand-owned, competitor-owned, third-party, and unknown sources.
- Answer position accuracy: at least 95% agreement when answers present ranked or ordered recommendations.
- Competitor detection accuracy: at least 97% agreement for named competitors and aliases.
- Claim accuracy classification: at least 90% agreement on accurate, inaccurate, unsupported, and unclear claims.
- Evidence validity: 100% of reported observations include prompt or query, market, device, timestamp, answer or SERP text, and source URL when present.
- Confidence calibration: at least 95% of unsupported, uncited, blocked, or ambiguous observations are capped below high confidence.
- Report reproducibility: 100% of summary metrics reconcile with underlying observation rows.

Secondary metrics:

- SERP mention and rank extraction accuracy.
- Source fetch success rate by market and device.
- Captcha and blocked-source classification accuracy.
- Language and locale handling quality.
- Trend stability across repeated runs with the same prompt pack.
- Reviewer usefulness score for gap recommendations.
- Time saved versus manual prompt testing, SERP checks, and spreadsheet scoring.

## Manual Review Rubric

Score each generated report from 1-5:

- Targeting: Are prompt pack, query, country, city, language, and device explicit?
- Mention accuracy: Are brand and competitor mentions captured without false positives?
- Citation quality: Are source URLs preserved and correctly classified?
- Claim review: Are factual statements tied to approved claims or fetched source evidence?
- Competitive context: Does the report show who appeared instead of the brand and why that matters?
- SERP context: Are search result observations separated from chatbot answer observations?
- Confidence: Are unsupported answers, missing citations, stale pages, captcha pages, and vague recommendations handled conservatively?
- Actionability: Are recommended source-content fixes specific enough for marketing or SEO teams?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-confidence score lacks answer text or SERP evidence.
- No claim is marked accurate without approved facts or source support.
- Every citation in the summary exists in the citation table.
- Competitor share-of-answer totals reconcile with prompt-run observations.
- Search visibility metrics are clearly separated from chatbot answer metrics.
- Recommendations do not propose spam, deception, or manipulation.

## Automated Checks

Run after every visibility report:

- JSON schema validation for config, answer runs, citations, SERP observations, classifications, and report summaries.
- Every answer run must include brand, prompt pack, prompt, market, device, timestamp, answer text, and raw response reference.
- Every citation must include URL, source type, fetch status, and final URL when fetched.
- Every SERP observation must include query, market, device, result URL, result type, captured timestamp, and rank when available.
- Every classification must include mention flag, citation flag, sentiment, confidence, and rationale.
- Summary rates must equal the underlying row counts within rounding tolerance.
- Brand aliases must not create duplicate mention counts in the same answer.
- A high-confidence `brand_cited` finding must have at least one accessible or explicitly returned source URL.
- A high-confidence claim accuracy finding must cite approved claims or fetched source evidence.
- Captcha, blocked, empty render, and fetch failure statuses must appear as confidence caveats.
- Markdown summaries must not introduce brands, claims, or recommendations absent from JSON.
- CSV row counts must reconcile with JSON observation counts.

## Failure Modes To Track

- Counting a competitor-owned citation as a brand citation because the snippet names the tracked brand.
- Treating a generic category mention as a brand recommendation.
- Missing aliases, product names, acquired company names, or common abbreviations.
- Double-counting the same brand mention across answer text and citation title.
- Reporting unsupported AI claims as facts.
- Treating no-citation answers as equally reliable as sourced answers.
- Blending SERP rank metrics with chatbot answer position metrics.
- Ignoring country, city, language, or device variation.
- Treating blocked or captcha-protected sources as negative evidence.
- Overstating trend changes caused by nondeterministic answer wording.
- Recommending manipulative content tactics instead of legitimate source improvements.

## Golden Examples

Create fixture runs before implementation:

1. Clear category win: brand appears first, is cited by an official page, and claims match approved facts.
2. Competitor dominance: brand omitted while two competitors are recommended and cited.
3. Bad citation: answer mentions the brand but cites only a competitor comparison page.
4. Unsupported claim: answer says the brand has a feature not present in approved claims or fetched sources.
5. Stale source: cited third-party page contains outdated pricing or product positioning.
6. Local variation: brand appears in US English prompts but not German prompts.
7. SERP mismatch: brand ranks well in Google organic results but is absent from chatbot recommendations.
8. Captcha source: answer cites a source that cannot be fetched and must lower confidence.

Each fixture should include:

- Input config with brands, competitors, markets, devices, prompts, and queries.
- Raw chatbot response with citations.
- Raw Google SERP records.
- Fetched source metadata and rendered text.
- Human labels for mentions, citations, ranks, sentiment, and claims.
- Expected summary metrics.
- Confidence caps and disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 60 benchmark prompt and query groups complete with no schema failures.
- Mention detection accuracy is at least 98%.
- Citation classification accuracy is at least 97%.
- Claim accuracy classification agreement is at least 90%.
- Evidence validity is 100%.
- Summary metrics reconcile with observation rows in every fixture.
- Reviewer average score is at least 4.
- Median review time for a 5-brand, 30-prompt, 3-market scan is under 45 minutes.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
