# Evaluation

Internet Change Journal should prove that recurring web, page, and SERP scans can produce a reliable weekly record of material public-web changes. Evaluation focuses on snapshot reproducibility, noise suppression, evidence preservation, and useful change summaries.

## Success Criteria

- A user can configure a journal with at least two brands or categories, two URLs, two queries, and one market in under five minutes.
- Every scan calls `account_status` before paid search, fetch, or chat work begins.
- Every page snapshot records target label, requested URL, final URL, country, city, device, render mode, captcha state, timestamp, and extraction confidence.
- Every SERP snapshot records query, country, city, device, rank, title, URL, domain, snippet, and timestamp.
- Weekly comparison only matches snapshots with the same target, source type, country, city, and device unless explicitly configured otherwise.
- Every medium or high severity journal entry includes prior/current evidence or an explanation for missing prior evidence.
- Boilerplate and recurring page noise do not dominate the journal.
- JSON and Markdown exports can be regenerated from saved snapshots.

## Golden Test Fixtures

Use fixed fixtures before live API regression tests:

1. Stable page
   - Target: a page fixture with unchanged title, headings, navigation, and main copy.
   - Expected: no material journal entry above the default threshold.
2. Hero copy change
   - Prior: product page emphasizing "chatbot".
   - Current: same page emphasizing "AI agent" and outcome claims.
   - Expected: one `copy_change` entry with prior and current evidence.
3. Pricing language change
   - Prior: "Contact sales".
   - Current: "Starts at $49 per seat".
   - Expected: one medium or high severity `pricing_language_change`.
4. Navigation change
   - Prior: top navigation contains Product, Pricing, Customers.
   - Current: top navigation adds Solutions and removes Customers.
   - Expected: one `navigation_change` entry if navigation watching is enabled.
5. SERP rank movement
   - Prior: tracked domain ranked 8 for a query.
   - Current: tracked domain ranked 3 for the same query and market.
   - Expected: one `serp_change` entry with old and new ranks.
6. New discovered page
   - Prior: no matching URL.
   - Current: discovered URL from a tracked brand domain.
   - Expected: one `new_page` entry with discovery query and result rank.
7. Blocked page
   - Fetch result: captcha unresolved or blocked.
   - Expected: snapshot status is `blocked` or `partial`; other targets still complete.

## Metrics

Track per run:

- `scan_completion_rate`: percent of scheduled scans that produce a report.
- `snapshot_success_rate`: percent of target-market pairs with complete page snapshots.
- `blocked_or_partial_rate`: percent of fetches marked captcha, blocked, failed, or partial.
- `serp_capture_rate`: percent of configured query-market pairs with ranked SERP snapshots.
- `material_change_count`: number of entries above the configured threshold.
- `noise_suppression_rate`: percent of boilerplate, timestamp, cookie, and footer diffs suppressed.
- `evidence_coverage_rate`: percent of entries with preserved prior and current evidence URLs.
- `classification_agreement_rate`: percent of sampled entries where human reviewers agree with change type and severity.
- `false_positive_rate`: percent of alerts judged immaterial by human review.
- `median_scan_latency_ms`: time from scan start to report completion.

## Quality Rubric

Score each weekly report from 1 to 5:

- 5: Changes are material, concise, well grouped, and fully auditable with prior/current evidence.
- 4: Report is useful with minor missed context or a small amount of harmless noise.
- 3: Report finds real changes, but grouping, severity, or evidence presentation needs work.
- 2: Report over-alerts on boilerplate, misses important page changes, or mixes unlike snapshots.
- 1: Report cannot support a trustworthy weekly change journal.

## Regression Checks

- `account_status` runs before `web_search`, `web_fetch`, and `ai_chat_completion`.
- The same country, city, and device are used across discovery, fetch, and comparison for a market.
- Known URLs are fetched even if search discovery fails.
- Search results preserve query, rank, title, URL, domain, snippet, and result type where available.
- Fetch snapshots preserve requested URL and final URL separately.
- Captcha, blocked, redirected, stale, and partial states are visible in snapshots and reports.
- Raw extracted page text is stored before normalization, hashing, or AI summarization.
- Prior and current snapshots are not compared across different devices or cities by default.
- New, removed, and changed pages are represented as separate change types.
- A failed target does not erase completed snapshots for other targets in the same journal run.
- Exported JSON validates against the `JournalReport`, `PageSnapshot`, and `SerpSnapshot` shapes in `prototype.md`.

## Manual QA Script

1. Create a journal with two competitor product pages, two category queries, US/San Francisco, and desktop plus mobile devices.
2. Confirm account status and credit estimate appear before the scan starts.
3. Run source discovery and confirm known URLs and top SERP candidates are both visible.
4. Run the first scan and confirm page snapshots preserve final URL, render mode, captcha state, timestamp, and extracted sections.
5. Run the second scan against fixtures with one known copy change, one pricing-language change, and one SERP movement.
6. Confirm the weekly timeline shows three entries and suppresses fixture footer/date noise.
7. Open each evidence drawer and verify prior/current source URLs, excerpts, and market/device context.
8. Export JSON and Markdown, then regenerate the Markdown from saved snapshots and confirm the entries match.

## Risks

- Many public pages change small dynamic elements every load, creating noisy diffs.
- JavaScript-heavy pages may render differently by device, location, cookie state, or A/B test bucket.
- Google SERP results can vary by personalization, geography, time, device, and query wording.
- Captcha and bot defenses may cause missing or partial snapshots.
- A page can change meaningfully through images, video, or layout while text remains mostly stable.
- AI summarization can overstate weak evidence if prompts do not force source discipline.
- Weekly cadence may miss short-lived campaigns or announcements.

## Open Questions

- Should the MVP store screenshots in addition to extracted text and SERP records?
- Should users be able to pin a canonical page set and disable discovery after setup?
- How should the app handle A/B test variants across repeated fetches?
- Should severity scoring be global, per journal, or per watch rule?
- Should users be able to mark entries as noise and train future suppression rules?
- Should a daily mode be offered for high-priority brands, or is weekly the only MVP cadence?
