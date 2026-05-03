# Evaluation

Goal: prove Multi-Model Answer Comparison reliably captures answer differences, citations, brand visibility, and evidence gaps across ChatGPT, Gemini, Perplexity, and Copilot-style answers.

## Test Set

Use 40 prompt-target runs across at least two collection dates:

- 8 B2B software recommendation prompts where vendors are commonly listed.
- 6 comparison prompts with known competitor sets.
- 5 definition prompts where category framing matters.
- 5 buying-criteria prompts where recommendations may be indirect.
- 4 pricing prompts where stale or unsupported claims are common.
- 4 local intent prompts tested across city and device targets.
- 4 emerging category prompts where source freshness matters.
- 4 ambiguous prompts where models may choose different meanings.

For each benchmark, create human-labeled references:

- Whether each model returned an answer, citations, or a blocked/partial result.
- Cited source URLs and domains visible in the answer.
- Owned-domain and competitor-domain flags.
- Brands mentioned and explicitly recommended.
- Recommendation rank and sentiment.
- Supported, unsupported, stale, or contradicted claims.
- Consensus claims across models.
- Meaningful disagreements across models.
- Human-written summary of citation and visibility gaps.

## Metrics

Primary metrics:

- Answer collection completion: at least 95% of unblocked model-prompt-target attempts produce a stored observation.
- Citation capture accuracy: at least 90% of visible cited URLs captured and normalized.
- Brand mention precision: at least 95% of extracted brand mentions are correct.
- Recommendation detection F1: at least 0.85 against human labels.
- Disagreement precision: at least 85% of high and medium disagreements should be human-rated meaningful.
- Evidence validity: 100% of report claims about sources, recommendations, and gaps must trace to model output, SERP context, or fetched pages.

Secondary metrics:

- Source freshness classification accuracy.
- Owned-domain citation detection accuracy.
- Competitor recommendation count accuracy.
- Consensus claim agreement with human judgment.
- Correct handling of blocked, source-less, or partial model responses.
- Location and device divergence detection.
- Credit cost per model-prompt-target pair.
- False high-severity alert rate per scheduled run.

## Manual Review Rubric

Score each report from 1-5:

- Capture fidelity: Did the app correctly preserve answers, citations, and model-target metadata?
- Evidence lineage: Can every claim be traced to model, prompt, target, timestamp, URL, and fetch status?
- Comparison usefulness: Are consensus and disagreement sections actionable for marketing, SEO, or competitive intelligence?
- Recommendation accuracy: Are recommended brands, ranks, and sentiment extracted correctly?
- Citation quality: Are owned, competitor, stale, blocked, and third-party sources classified correctly?
- Localization discipline: Are country, city, mobile, and desktop observations kept distinct?
- Alert restraint: Does the report avoid noisy alerts for harmless wording differences?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-severity alert is unsupported by evidence.
- Blocked or partial model responses are clearly labeled.
- Model answer facts are distinguishable from fetched source facts and AI synthesis.
- Like-for-like comparisons use the same prompt, country, city, and device.
- The report does not claim objective market truth from a model answer alone.

## Automated Checks

Run after every comparison run:

- JSON schema validation for briefs, answers, sources, comparisons, and reports.
- Every answer has run ID, model, prompt, target, collected-at timestamp, and collection status.
- Every cited source has a valid HTTP(S) URL and normalized domain.
- Every extracted claim is supported by a source URL or labeled as uncited, contradicted, or unverified.
- Every comparison includes the same prompt and target key across all included models.
- Scores are integers from 0-100.
- Blocked model responses cannot trigger absence or removal alerts.
- Owned and competitor domains are normalized before comparisons.
- Markdown, CSV, and JSON exports reconcile on answer counts, source counts, and alert counts.
- Snapshot storage is append-only and does not overwrite historical observations.

## Failure Modes To Track

- Treating a blocked model response as a missing brand mention or lost citation.
- Dropping citations from answer engines that expose sources in a separate metadata structure.
- Merging mobile, desktop, city, or country observations into one comparison.
- Overstating small wording differences as substantive disagreement.
- Missing recommendations that are phrased indirectly.
- Counting neutral mentions as recommendations.
- Misclassifying resellers, review sites, or integration partners as competitors.
- Letting AI synthesis invent consensus claims that no model actually made.
- Ignoring stale cited sources that drive current recommendations.
- Failing to compare model citations with Google SERP-visible sources.

## Golden Examples

Create fixture runs before implementation:

1. Four-model consensus: all models recommend the same top two brands and cite overlapping sources.
2. Source-aware split: Perplexity and Copilot cite current sources while ChatGPT and Gemini provide uncited broad advice.
3. Competitor dominance: three models recommend a competitor and none cite the owned domain.
4. Owned visibility: one owned guide is cited by two models and appears in Google SERP context.
5. Stale pricing claim: one model repeats outdated pricing from an old source.
6. Local divergence: mobile results mention local providers while desktop answers stay national.
7. Blocked response: one model collection is blocked and must not lower visibility scores.
8. Ambiguous prompt: models answer different interpretations and the report flags ambiguity instead of false disagreement.

Each fixture should include:

- Input comparison brief
- Raw model answer payloads
- Raw citation metadata
- Google SERP context
- Fetched source excerpts and dates
- Human labels for recommendations, citations, sentiment, freshness, and claims
- Expected comparison objects and severity bands
- Disallowed claims

## Launch Criteria

The MVP is ready for first users when:

- 40 benchmark prompt-target runs complete without crashes.
- Citation capture accuracy is at least 90%.
- Brand mention precision is at least 95%.
- Recommendation detection F1 is at least 0.85.
- High and medium disagreement precision is at least 85%.
- False high-severity alert rate is below 5%.
- Every report claim has source lineage.
- Median review time is under 20 minutes per topic report.
- Credit estimate is shown before each run and actual usage is recorded after.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
