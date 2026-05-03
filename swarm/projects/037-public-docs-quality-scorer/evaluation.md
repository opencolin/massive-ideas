# Evaluation

Goal: prove Public Docs Quality Scorer identifies actionable documentation gaps with reproducible public evidence faster than a manual docs, Google, and chatbot audit.

## Test Set

Use 30 benchmark docs audits:

- 6 API docs with quickstarts, auth guides, endpoint reference, and examples.
- 5 SDK docs with multiple languages, install instructions, and version-specific pages.
- 5 troubleshooting-heavy docs with errors, webhooks, status, or migration content.
- 4 docs sites with stale pages, old changelog links, or version drift.
- 4 docs sites that are strong on-page but weak in Google discoverability.
- 3 docs sites that are visible in Google but poorly cited by chatbot answers.
- 3 JS-heavy docs sites with mobile navigation, client-side search, or rendered sidebar risks.

For each benchmark, create human labels:

- Priority topics and required concepts.
- Expected official pages and acceptable equivalent pages.
- Known missing, stale, weak, or confusing coverage.
- Expected search result rank ranges for official docs.
- Expected chatbot answer required points and acceptable source citations.
- Known mobile navigation or rendered page issues.
- Broken links, blocked states, or challenge pages.
- Disallowed claims that would be speculative or unsupported.

## Three Realistic Examples

1. Payments API quickstart:
   - Task: create a payment, handle idempotency, test in sandbox, receive a webhook.
   - Good result: scorer finds the quickstart, API reference, webhook guide, code examples, and Google result; flags only specific missing or stale pieces.
   - Bad result: scorer reports vague "docs are confusing" issues without source URLs or misses that idempotency is only buried in reference docs.

2. Analytics SDK migration:
   - Task: migrate from SDK v1 to v2 in JavaScript and mobile.
   - Good result: scorer detects version labels, migration guide freshness, language coverage, deprecated API mentions, and broken old links.
   - Bad result: scorer treats old v1 docs as current because they rank well or fails to separate JavaScript from mobile SDK coverage.

3. Webhook troubleshooting:
   - Task: debug failed webhook delivery and replay events.
   - Good result: scorer checks error code docs, retry policy, event payload examples, dashboard replay docs, SERP discoverability, and AI answer source coverage.
   - Bad result: scorer claims the product lacks webhook support when a rendered JS page contains the guide, or reports unsupported runtime behavior claims.

## Metrics

Primary metrics:

- High-severity issue recall: at least 85% of human-labeled high-severity docs gaps should be detected.
- High-severity false positive rate: fewer than 10% of reported high-severity issues should be rejected by reviewers.
- Evidence validity: 100% of issues should include URL or query context, timestamp, category, and page, SERP, or AI answer evidence.
- Topic coverage accuracy: at least 90% of priority topics should be mapped to the correct official pages or marked missing.
- Time saved: reduce a five-topic docs audit from several hours to under 30 minutes of human review.

Secondary metrics:

- Search findability accuracy for expected official-domain rank.
- AI answer coverage accuracy for required points and official source citation.
- Freshness extraction accuracy for last-updated dates and version labels.
- Code example detection accuracy by language and copyability.
- Broken link detection precision.
- Mobile navigation issue usefulness against human reviewer scores.
- Credit estimate accuracy versus actual run cost.

## Manual Review Rubric

Score each report from 1-5:

- Coverage: Were the requested topics, docs pages, queries, devices, and AI questions evaluated?
- Accuracy: Are findings real docs issues rather than subjective preferences?
- Evidence: Can every issue be reproduced from fetched pages, screenshots, SERP results, or chatbot sources?
- Severity: Are critical, high, medium, and low priorities calibrated to developer task impact?
- Specificity: Do recommendations name the page, concept, example, or navigation fix needed?
- Search and AI: Are Google and chatbot observations separated from on-page docs observations?
- Restraint: Does the report avoid claiming product correctness, traffic loss, or conversion impact without evidence?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high or critical issue lacks source-backed evidence.
- Every priority topic has a score, matched pages, strong signals, and weak signals.
- Every fetched page has a target, timestamp, render state, and status.
- Search and AI answer findings cite the original query or question.
- Blocked, captcha, login, cookie-wall, timeout, and render-error states are not scored as normal docs content failures.

## Automated Checks

Run after every generated report:

- JSON schema validation for the final report.
- Overall and topic scores must be integers from 0-100.
- Every issue must include issue ID, category, severity, title, recommendation, confidence, and evidence.
- Every high or critical issue must include a page URL, SERP query, or AI question plus timestamp.
- Every page observation must include source URL, final URL when available, country, device, fetched-at timestamp, and render state.
- Render failures must not produce normal content coverage findings.
- Search findings must include query, target, rank evidence, result title, and result URL.
- AI answer findings must include question, model, cited sources, covered points, and missing points.
- CSV issue row counts must reconcile with JSON issues.
- Markdown report must include enough context to reproduce each high or critical issue.

## Failure Modes To Track

- Treating stale mirrors, old versions, or blog posts as current official docs.
- Missing content hidden behind JS-rendered tabs or client-side navigation.
- Scoring a captcha, login wall, or cookie wall as missing documentation.
- Confusing API reference completeness with task-guide completeness.
- Flagging missing terms when equivalent terminology is used.
- Collapsing desktop and mobile docs navigation into one observation.
- Reporting search ranking issues without preserving query, country, device, and result rank.
- Letting AI-generated findings cite no page, SERP result, or answer source.
- Overstating product defects from documentation gaps.
- Ignoring competitor docs only because they use different information architecture.

## Golden Examples

Create fixture runs before implementation:

1. Clean pass: quickstart, reference, troubleshooting, examples, search, and AI answer coverage all pass.
2. Missing task guide: API reference exists but no guide explains the end-to-end developer task.
3. Stale version drift: Google ranks an old version page above current docs.
4. Weak examples: docs explain concepts but lack copyable code or preferred SDK language examples.
5. Mobile navigation issue: desktop docs expose API reference, but mobile nav hides it.
6. AI answer gap: chatbot answers the user task from unofficial sources and misses required points.
7. Render challenge: docs root returns a challenge page and is classified as partial, not missing content.

Each fixture should include:

- Input docs audit brief.
- Raw rendered page observations.
- Screenshot artifact references.
- SERP result JSON.
- AI answer observation JSON.
- Human labels for expected issues and severities.
- Expected topic scores and overall score.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 30 benchmark audits complete without crashes.
- High-severity issue recall is at least 85%.
- High-severity false positive rate is below 10%.
- Evidence validity is 100%.
- Topic-page mapping accuracy is at least 90%.
- Median human review time is under 30 minutes for a five-topic docs audit.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, Markdown, screenshot, HTML, SERP, and AI answer artifacts are readable without manual cleanup.
