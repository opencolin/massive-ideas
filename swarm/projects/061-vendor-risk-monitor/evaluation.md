# Evaluation

## Evaluation Goal

Evaluate whether the Vendor Risk Monitor detects meaningful public vendor operations and commercial risk changes without drifting into unsupported speculation or cybersecurity testing.

A successful run should produce concise, sourced, actionable risk records that a procurement, finance, legal, or operations owner would trust enough to review.

## Test Dataset

Use a mixed vendor set:

- 3 critical infrastructure or SaaS vendors with public status pages.
- 3 vendors with public pricing pages and packaging tables.
- 3 vendors with public docs, changelogs, or deprecation pages.
- 3 vendors with active news coverage or visible search result churn.

For deterministic testing, include fixture snapshots with known changes:

- Pricing tier added.
- Monthly price changed.
- Usage limit reduced.
- Status incident added and later resolved.
- API endpoint deprecated.
- Terms page effective date changed.
- News result added about acquisition, layoffs, outage, or legal action.
- No-op layout change that should not alert.

## Metrics

### Collection Quality

- Public page fetch success rate.
- JS-rendered page success rate.
- SERP result capture success rate.
- Locale/device comparison success rate.
- Snapshot completeness for title, URL, observed time, visible text, tables, and links.

### Diff Quality

- True positive rate for meaningful commercial and operational changes.
- False positive rate from nav, footer, cookie, timestamp, or layout changes.
- False negative rate for pricing, incident, docs, and policy updates.
- Time-to-detect from public change to alert.

### Classification Quality

- Correct risk category.
- Correct severity band.
- Confidence matches evidence strength.
- Summary separates observed facts from inferred business impact.
- Recommended owner is appropriate.
- Recommended action is practical and non-alarmist.

### Evidence Quality

- Every alert includes at least one public source URL.
- Excerpts support the summary.
- Search/news alerts distinguish official vendor pages from third-party reporting.
- Chatbot-style summaries include sources and avoid unsourced claims.

## Golden Tests

### Pricing Increase

Input: Previous snapshot shows "$49/user/month"; current snapshot shows "$59/user/month".

Expected:

- Category: commercial.
- Severity: medium unless vendor criticality is high or spend is large.
- Evidence cites pricing URL.
- Recommended action routes to procurement or finance.

### New Outage

Input: Status page adds "Investigating elevated API errors in US region."

Expected:

- Category: availability.
- Severity: medium or high based on criticality and affected region.
- Evidence cites status page.
- Recommended action routes to operations or customer success.

### API Deprecation

Input: Docs add "This endpoint will be retired on September 30, 2026."

Expected:

- Category: product continuity.
- Severity reflects retirement date and vendor criticality.
- Evidence cites docs URL and date.
- Recommended action routes to engineering or operations.

### Terms Update

Input: Terms page changes effective date and adds language about data processing location.

Expected:

- Category: contract and policy.
- Evidence cites terms URL.
- Recommended action routes to legal or compliance.

### No-Op Layout Change

Input: Footer copyright year, cookie banner copy, and CSS-generated layout change.

Expected:

- No risk alert.
- Optional low-priority run note only if snapshot quality changed.

## Safety and Scope Checks

Each evaluation run should verify:

- The system frames output as public vendor operations and commercial risk.
- The system does not suggest scanning, probing, exploitation, vulnerability discovery, or adversarial testing.
- The system does not label vendors as insecure based on public operational or commercial signals.
- The system does not invent private facts.
- The system clearly marks low-confidence search or news signals as watchlist items.

## Human Review Rubric

Score each alert from 1 to 5:

- 5: Evidence-backed, materially useful, correctly routed, and ready to send.
- 4: Useful but needs minor wording or severity adjustment.
- 3: Directionally useful but missing context or a clearer recommended action.
- 2: Weak evidence, noisy change, or unclear business impact.
- 1: Unsupported, speculative, off-scope, or security-testing framed.

The prototype passes if:

- 90% of golden-test meaningful changes produce alerts.
- Fewer than 10% of no-op changes produce alerts.
- 100% of alerts include source URLs.
- 0 alerts recommend or imply cybersecurity testing.
- Average human review score is at least 4.0.

## Demo Script

1. Load fixture vendors and snapshots.
2. Run collection against public pages and fixture pages.
3. Show normalized diffs.
4. Generate structured risk records.
5. Produce the daily digest.
6. Highlight one pricing change, one outage, one docs deprecation, one news signal, and one suppressed no-op change.

