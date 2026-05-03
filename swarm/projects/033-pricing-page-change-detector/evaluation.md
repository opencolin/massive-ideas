# Evaluation

Goal: prove Pricing Page Change Detector catches commercially meaningful pricing and packaging changes with reliable evidence, while suppressing cosmetic churn, personalization artifacts, and unstable rendered-page noise.

## Test Set

Use 30 monitoring runs:

- 6 runs with direct price increases or decreases across monthly and annual billing toggles.
- 5 runs with feature gating changes between plan tiers.
- 4 runs with new, removed, or renamed plans.
- 3 runs with free trial, credit-card, discount, or promotional copy changes.
- 3 runs with usage limits, seat limits, overage terms, or add-on packaging changes.
- 3 runs with country, city, currency, or device-specific pricing variants.
- 2 runs with JavaScript-rendered pricing cards that require wait and interaction handling.
- 2 runs with captcha, cookie banners, modals, or personalization blocks.
- 2 runs with cosmetic-only copy edits that should not trigger commercial alerts.

For each run, create a human-labeled benchmark:

- Competitor, URL, country, city, device, and fetch time
- Previous and current rendered text excerpts
- Previous and current structured pricing facts
- Expected changed fields and unchanged fields
- Expected change type, severity, and confidence
- Expected exclusions for footer, legal, navigation, cookie, and generic copy edits
- Expected warning when rendering, targeting, or extraction is incomplete
- Disallowed claims about revenue, customer migration, or competitor intent

## Metrics

Primary metrics:

- Commercial-change precision: at least 90% of reported medium or high alerts should be real pricing, packaging, trial, discount, CTA, or limit changes.
- Commercial-change recall: at least 85% of human-labeled high-impact pricing changes should be detected.
- Evidence validity: at least 95% of alerts should include URL, fetch time, geo/device target, before value, after value, and source excerpt or snapshot diff.
- Noise control: fewer than 10% of high-severity alerts should be caused by cosmetic copy, cookie banners, footer changes, or unstable personalization.
- Review time: reduce weekly competitor pricing review from 1-2 hours to under 10 minutes for a 10-competitor set.

Secondary metrics:

- Price extraction accuracy across currencies, billing periods, seat units, and contact-sales plans.
- Plan matching accuracy when names change slightly.
- Feature-gating diff accuracy across plan tables.
- Trial and discount extraction accuracy.
- Geo and device separation accuracy.
- Captcha and JS-rendered page recovery rate.
- Credit estimate accuracy before execution.
- Markdown, JSON, and CSV export reconciliation.

## Manual Review Rubric

Score each monitoring report from 1-5:

- Signal quality: Does it highlight changes a GTM team would actually care about?
- Evidence quality: Can every alert be verified from source excerpts, rendered fetches, and snapshot diffs?
- Precision: Does it avoid alerts for footer, cookie, navigation, legal, and generic copy changes?
- Completeness: Does it capture price, plan, feature, trial, discount, limit, and CTA changes?
- Uncertainty handling: Does it clearly mark rendering issues, personalization risk, and low-confidence extraction?
- Strategic usefulness: Are follow-up recommendations practical without overclaiming?
- Readability: Can a reviewer understand what changed without opening every pricing page?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every high-severity alert includes before and after values.
- Every alert includes URL, observed time, country, device, and at least one evidence excerpt.
- Raw-text-only changes are labeled low confidence unless supported by structured facts.
- Cosmetic-only changes are absent from high-severity alerts.
- Recommendations are visibly separated from observed facts.

## Automated Checks

Run after every monitoring report:

- JSON schema validation for briefs, snapshots, diffs, and reports.
- Every snapshot must include URL, final URL when available, competitor, geo, device, fetch status, hashes, and extracted facts.
- Every change must include change type, severity, confidence, observed time, URL, and evidence.
- High-severity price changes must include normalized before and after amounts or a warning explaining why normalization failed.
- Plan names must be normalized before diffing.
- Currency, billing period, and unit must not be merged across countries or devices.
- Duplicate alerts for the same competitor, URL, plan, field, and value must collapse into one alert.
- Pages with render failures cannot produce high-confidence alerts.
- Alerts from cookie, footer, legal, navigation, newsletter, or modal-only content must be suppressed or marked cosmetic.
- JSON, CSV, and Markdown outputs must reconcile on competitor, URL, change type, severity, and confidence.
- No report may include fabricated revenue impact, customer impact, or private strategic intent.

## Failure Modes To Track

- Treating an annual/monthly toggle default as a price change.
- Merging localized prices into a single global alert.
- Missing changes hidden behind tabs, accordions, sliders, or plan toggles.
- Treating "Contact sales" as zero, null, or unchanged when a published price is removed.
- Over-alerting on A/B tests, cookie banners, modals, or personalized content.
- Failing to match renamed plans to prior tiers.
- Missing feature gating changes inside dense comparison tables.
- Reporting raw text diffs without structured pricing evidence.
- Losing source lineage between an extracted fact and its page excerpt.
- Letting AI recommendations imply revenue impact or competitor strategy from public pricing changes.

## Golden Examples

Create fixture runs before implementation:

1. Price increase: Pro annual price rises from $49 to $59 per seat/month.
2. Price decrease: Starter monthly price drops and annual discount changes.
3. Contact-sales gate: Enterprise keeps its name but loses a published price.
4. Feature gate: SSO moves from Business to Enterprise.
5. Plan restructure: Team plan becomes Growth and gains a seat minimum.
6. Trial change: 14-day trial becomes 7-day trial and now requires a credit card.
7. Regional variant: US pricing changes while UK pricing is unchanged.
8. Toggle trap: default billing period changes from monthly to annual but underlying prices are unchanged.
9. Cosmetic trap: hero copy changes with no commercial pricing fact changes.
10. Render trap: pricing table is hidden until JS completes and a modal is dismissed.

Each fixture should include:

- Input monitoring brief
- Previous snapshot
- Current rendered fetch output
- Structured pricing facts before and after
- Human-labeled changed and unchanged fields
- Expected severity score band
- Expected alert confidence
- Expected warnings
- Disallowed claims and recommendations

## Launch Criteria

The MVP is ready for first users when:

- 30-run benchmark completes without crashes.
- Commercial-change precision is at least 90%.
- High-impact recall is at least 85%.
- Evidence validity is at least 95%.
- High-severity noise is below 10%.
- Median reviewer time is under 10 minutes for a 10-competitor report.
- Geo, currency, and device variants are stored and reported separately.
- Snapshot-to-report reconciliation passes automatically.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
