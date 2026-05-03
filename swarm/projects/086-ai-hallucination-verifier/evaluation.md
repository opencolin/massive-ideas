# Evaluation

Goal: prove AI Hallucination Verifier can identify unsupported, contradicted, partially supported, and not-checkable answer claims against fetched source pages with reproducible evidence.

## Test Set

Use 50 benchmark verification runs:

- 10 clean answers where all material claims are supported by fetched official pages.
- 8 answers with one unsupported but plausible-sounding claim.
- 8 answers with a claim directly contradicted by a source page.
- 6 answers where a source only partially supports an overstated claim.
- 5 answers with stale or superseded pages.
- 5 answers with inaccessible sources, including captcha, login, paywall, timeout, blocked, and empty render states.
- 4 localized answers where source content differs by country, city, or device.
- 4 high-stakes answers involving legal, medical, financial, safety, or compliance topics that should trigger human review.

For each benchmark, store:

- Input verification brief.
- Raw answer text and citation URLs.
- Fetched source observations with timestamp, target, render state, metadata, and text excerpts.
- Human-labeled material claims.
- Expected support judgment for each claim.
- Expected issue categories and severities.
- Expected score range and hallucination risk band.
- Disallowed report behavior, such as declaring a claim false without contradiction evidence.

## Realistic Examples

1. SaaS pricing answer:
   - Task: verify whether an answer correctly states SAML SSO and audit log availability by plan.
   - Good result: verifier flags contradicted plan availability, cites the pricing table excerpt, and suggests a corrected answer.
   - Bad result: verifier treats any official domain citation as support without checking the exact plan limits.

2. Developer documentation answer:
   - Task: verify instructions for validating webhook signatures.
   - Good result: verifier finds rendered tab content for timestamp tolerance and signature header names, then marks only the missing retry behavior claim as not found.
   - Bad result: verifier misses evidence hidden behind JavaScript rendering and calls the whole answer unsupported.

3. Medical-style generated answer:
   - Task: verify supplement efficacy claims against supplied source pages.
   - Good result: verifier labels the claims for human review, separates evidence support from medical advice, and avoids making treatment recommendations.
   - Bad result: verifier gives health guidance or treats a marketing page as definitive clinical evidence.

4. Localized availability answer:
   - Task: verify whether a product is available in Canada and the United States.
   - Good result: verifier fetches with country targeting and reports that the source supports the US claim but not the Canada claim.
   - Bad result: verifier uses only the US page and gives a single global judgment.

## Metrics

Primary metrics:

- Claim judgment accuracy: at least 90% agreement with human labels across supported, partially supported, contradicted, not found, and not checkable.
- Contradiction recall: at least 90% of human-labeled contradicted high-importance claims are detected.
- Unsupported-claim precision: at least 85% of unsupported high or critical issues are accepted by reviewers.
- Evidence completeness: 100% of high and critical issues include answer claim, source URL or inaccessible state, fetched timestamp, target, and evidence excerpt when available.
- Risk calibration: 90% of reports fall within the human-labeled hallucination risk band.

Secondary metrics:

- Material claim extraction precision and recall.
- Source render-state classification accuracy.
- Official-source and weak-authority detection precision.
- Freshness extraction accuracy for published, modified, and version labels.
- Citation-to-claim alignment accuracy.
- Localized source variance detection.
- Credit estimate accuracy versus actual Massive MCP usage.
- Median reviewer time saved compared with manual page-by-page verification.

## Manual Review Rubric

Score each report from 1-5:

- Claim extraction: material checkable claims are captured and filler is ignored.
- Evidence matching: source excerpts actually support or contradict the exact claim judgment.
- Restraint: the verifier uses not found or not checkable when evidence is insufficient.
- Accessibility handling: captcha, login, paywall, timeout, blocked, and empty pages are not treated as normal content.
- Authority handling: official, primary, secondary, forum, review, and unknown sources are separated appropriately.
- Severity calibration: priorities reflect claim importance and decision risk.
- Reproducibility: a reviewer can trace every high or critical issue to answer text and a source observation.

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high or critical issue lacks evidence context.
- No inaccessible source is scored as if its text was fetched.
- High-stakes claims are labeled for human review.
- Suggested corrections are only generated from supported source evidence.
- JSON, CSV, and Markdown outputs agree on issue counts and IDs.

## Automated Checks

Run after every generated report:

- JSON schema validation for verification brief, report, answer observation, source observation, claim judgment, and issue artifacts.
- Overall score must be an integer from 0-100.
- Hallucination risk must match the configured score band.
- Every claim judgment must reference an extracted claim ID.
- Every evidence reference must point to a source observation ID.
- Every high or critical issue must include claim ID, source context, recommendation, severity, confidence, and timestamp.
- Inaccessible render states must not include normal evidence excerpts.
- Human-review-required issues must be emitted for configured high-stakes claim types.
- CSV issue rows must reconcile with JSON issue records.
- Markdown report must include all high and critical issues.

## Failure Modes To Track

- Treating citation presence as evidence support.
- Declaring a claim false when fetched pages merely omit it.
- Missing contradictions because the evidence is in rendered JavaScript content.
- Over-penalizing inaccessible sources as hallucinations instead of not checkable.
- Ignoring country, city, or device-specific source differences.
- Confusing source authority with claim entailment.
- Accepting stale pages for current pricing, policy, or availability claims.
- Extracting too many trivial claims and diluting the score.
- Letting model-written reasoning omit concrete evidence references.
- Giving legal, medical, financial, or safety advice instead of flagging human review.

## Golden Fixtures

Create fixture runs before implementation:

1. Fully supported answer with three claims and two official sources.
2. Unsupported claim absent from all accessible sources.
3. Contradicted claim where the source states the opposite.
4. Partially supported claim where the answer overgeneralizes a narrower source statement.
5. Not-checkable claim because every source is inaccessible.
6. Stale source superseded by a newer official page.
7. Weak-authority claim using a forum or review page for pricing or policy.
8. Missing citation for a high-importance claim.
9. Localized source mismatch between US desktop and Canada mobile targets.
10. High-stakes claim requiring human review even when source support appears plausible.

Each fixture should include:

- Input brief.
- Raw answer observation.
- Rendered source observations.
- Screenshot and HTML artifact references.
- Human-labeled claim list.
- Expected claim judgments.
- Expected issues and severities.
- Expected score range and risk band.
- Disallowed verifier statements.

## Launch Criteria

The MVP is ready for first users when:

- 50 benchmark runs complete without crashes.
- Claim judgment accuracy is at least 90%.
- Contradiction recall is at least 90%.
- Unsupported high-severity issue precision is at least 85%.
- Evidence completeness is 100% for high and critical issues.
- Risk calibration reaches 90% within labeled bands.
- Median reviewer time drops below 10 minutes for a 10-claim answer.
- Credit usage is estimated before every run and recorded after completion.
- JSON, CSV, Markdown, screenshot, HTML, answer, source, claim, and issue artifacts are readable without manual cleanup.
