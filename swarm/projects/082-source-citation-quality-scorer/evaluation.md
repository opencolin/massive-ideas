# Evaluation

Goal: prove Source Citation Quality Scorer can identify whether chatbot answer citations actually support answer claims, with reproducible source evidence and calibrated severity.

## Test Set

Use 40 benchmark citation audits:

- 8 factual product or documentation questions where official sources should support the answer.
- 6 pricing, packaging, or plan-limit questions where freshness and official source authority matter.
- 6 category recommendation questions where source diversity and relevance matter.
- 5 comparison questions where citations may support only one side of a claim.
- 5 regulated or high-stakes questions that should trigger human-review labeling.
- 4 answers with stale citations, old versions, redirects, or superseded pages.
- 3 answers with inaccessible sources, login walls, paywalls, challenge pages, or render failures.
- 3 supplied-answer fixtures from internal assistant outputs with known citation mappings.

For each benchmark, create human labels:

- Material answer claims and their importance.
- Acceptable source URLs, domains, or source types for each claim.
- Expected support judgment for each claim-citation pair.
- Known contradictions, unsupported claims, stale citations, and irrelevant citations.
- Required official-source usage for product, pricing, docs, or policy claims.
- Disallowed claims and overstatements.
- Expected answer-level score range and citation issue severities.

## Three Realistic Examples

1. Pricing plan answer:
   - Task: answer whether a SaaS plan includes SSO, audit logs, and unlimited seats.
   - Good result: scorer fetches the current pricing and docs pages, flags stale blog citations, and identifies that unlimited seats are contradicted by the pricing table.
   - Bad result: scorer treats any company-domain citation as sufficient without checking the actual claim.

2. Medical-style citation quality fixture:
   - Task: evaluate a supplied answer about a supplement claim.
   - Good result: scorer labels the topic as human-review-needed, separates source authority from answer correctness, and flags review blogs as weak authority for clinical claims.
   - Bad result: scorer gives health advice or treats a single citation as definitive.

3. Developer docs troubleshooting answer:
   - Task: explain how to fix a webhook signature error.
   - Good result: scorer verifies cited docs mention signature headers, timestamp tolerance, and example verification code; flags a generic API homepage citation as overbroad.
   - Bad result: scorer marks the answer unsupported because the evidence is hidden in a rendered JavaScript tab.

## Metrics

Primary metrics:

- Claim support accuracy: at least 90% agreement with human labels for entailed, partial, contradicted, not found, and not accessible judgments.
- High-severity issue recall: at least 85% of human-labeled high-severity citation failures should be detected.
- High-severity false positive rate: fewer than 10% of high-severity citation issues should be rejected by reviewers.
- Evidence validity: 100% of high or critical issues should include answer text, cited URL, source evidence or fetch state, timestamp, model, and target.
- Answer score calibration: 90% of answer-level scores should fall within the human-labeled acceptable range.

Secondary metrics:

- Source accessibility classification accuracy.
- Official-source detection precision by domain and canonical URL.
- Freshness extraction accuracy for published, modified, and version dates.
- Duplicate source cluster detection precision.
- Overbroad citation detection usefulness.
- Credit estimate accuracy versus actual Massive MCP usage.
- Reviewer time saved versus manual citation audit.

## Manual Review Rubric

Score each report from 1-5:

- Claim extraction: Did the scorer identify the material answer claims and ignore filler?
- Support judgment: Are entailed, partial, contradicted, absent, and inaccessible labels correct?
- Evidence: Can every issue be reproduced from the answer text and fetched source observation?
- Authority: Are official, primary, secondary, review, forum, and low-authority sources separated appropriately?
- Freshness: Are stale or superseded sources handled without over-penalizing evergreen content?
- Severity: Are critical, high, medium, and low priorities calibrated to user risk and claim importance?
- Restraint: Does the report avoid making unsupported truth, legal, medical, financial, or safety judgments?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every high or critical issue has answer text, cited URL, source state, and timestamp.
- Every answer has a score, status, supported claims, unsupported claims, and weak citations.
- Every cited URL has a normalized source observation or an explicit inaccessible state.
- Blocked, captcha, login, paywall, timeout, and render-error states are not treated as normal source content.
- Search-discovered alternative sources are labeled as recommendations, not proof the original answer is false.

## Automated Checks

Run after every generated report:

- JSON schema validation for final report and observation artifacts.
- Overall and answer scores must be integers from 0-100.
- Every issue must include issue ID, category, severity, title, recommendation, confidence, and evidence.
- Every high or critical issue must include question, answer observation ID, cited URL or source ID, and timestamp.
- Every answer observation must include question, model, target, answer text, answered-at timestamp, and citation list.
- Every source observation must include source URL, target, fetched-at timestamp, render state, and authority signals.
- Inaccessible source states must not produce normal claim-support excerpts.
- CSV issue row counts must reconcile with JSON issues.
- Markdown report must include enough context to reproduce each high or critical finding.

## Failure Modes To Track

- Treating citation presence as support.
- Confusing source authority with claim entailment.
- Penalizing a source because the answer is wrong even when the citation itself is relevant.
- Missing evidence hidden behind JavaScript rendering, tabs, accordions, or mobile layouts.
- Scoring a captcha, paywall, or login page as irrelevant content.
- Treating stale but historically accurate pages as current product truth.
- Over-relying on domain matching and ignoring canonical redirects.
- Marking broad recommendation answers as unsupported because no single source supports every comparison.
- Letting AI-generated issue text lack a cited source observation.
- Giving high-stakes domain advice instead of flagging human review.

## Golden Examples

Create fixture runs before implementation:

1. Clean pass: answer claims are all supported by current official citations.
2. Unsupported claim: cited source is relevant but does not contain the claimed fact.
3. Contradiction: cited source says the opposite of a material answer claim.
4. Stale source: old source is superseded by a current docs or pricing page.
5. Inaccessible source: citation resolves to login, paywall, captcha, or timeout.
6. Weak authority: factual product claim cites forum or review content despite official docs existing.
7. Overbroad citation: answer cites a homepage for a specific technical or pricing claim.
8. Partial support: cited source supports a narrower version of the answer claim.

Each fixture should include:

- Input citation audit brief.
- Raw answer observation.
- Rendered source observations.
- Screenshot and HTML artifact references.
- Human-labeled claim support judgments.
- Expected citation issues and severities.
- Expected answer score and overall score range.
- Disallowed report claims.

## Launch Criteria

The MVP is ready for first users when:

- 40 benchmark audits complete without crashes.
- Claim support accuracy is at least 90%.
- High-severity issue recall is at least 85%.
- High-severity false positive rate is below 10%.
- Evidence validity is 100%.
- Answer score calibration reaches 90% within labeled ranges.
- Median human review time drops below 20 minutes for a 10-question citation audit.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, Markdown, screenshot, HTML, answer, and source artifacts are readable without manual cleanup.
