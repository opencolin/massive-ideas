# Evaluation

Goal: prove Portfolio Company Competitive Alerts finds meaningful public competitive signals for portfolio companies, ranks alert severity usefully, and avoids noisy or speculative alerts that would waste founder or investor attention.

## Test Set

Use 36 monitoring runs:

- 6 runs with direct competitor product launches or major feature releases.
- 5 runs with pricing, packaging, free-trial, CTA, or enterprise/contact-sales changes.
- 5 runs with new comparison, alternatives, buyer-intent, or category landing pages.
- 4 runs with SERP rank movement across tracked keywords, countries, cities, or devices.
- 4 runs with AI/chatbot answer inclusion or source-citation changes.
- 3 runs with docs, API, SDK, marketplace, or integration updates.
- 3 runs with geo-specific pages or regional availability changes.
- 2 runs with newly emerging competitors discovered repeatedly through SERP results.
- 2 runs with JavaScript-rendered competitor pages requiring browser rendering or waiting.
- 2 runs with corporate noise, jobs pages, support pages, stale pages, or cosmetic edits that should be suppressed.

For each run, create a human-labeled benchmark:

- Portfolio name, company, company domain, category, competitor set, geo, device, and monitoring time.
- Search queries, SERP positions, titles, URLs, snippets, and visible dates.
- Fetched URLs, final URLs, page titles, excerpts, fetch status, render warnings, and content hashes.
- Expected retained alerts and expected suppressed observations.
- Expected signal type, severity band, confidence, and score drivers.
- Expected duplicate groups across pages, queries, AI answers, and fetched sources.
- Expected warnings for single-source, inferred date, blocked fetch, stale result, geo ambiguity, or weak relevance.
- Disallowed claims about revenue, customer migration, churn, adoption, private strategy, roadmap, or investment impact.

## Metrics

Primary metrics:

- Alert precision: at least 90% of medium or high severity alerts should be real competitive events relevant to the portfolio company.
- High-impact recall: at least 85% of human-labeled high-severity competitive events should be detected.
- Evidence validity: at least 95% of emitted alerts should include source type, URL, observed time, geo, device, excerpt or snippet, confidence, and source lineage.
- Noise suppression: fewer than 8% of high-severity alerts should come from jobs pages, support-only pages, generic press boilerplate, legal pages, status pages, or cosmetic edits.
- Severity usefulness: at least 80% of human reviewers should agree high-severity alerts deserve founder or portfolio-team attention.

Secondary metrics:

- Signal-type classification accuracy.
- Competitor-to-portfolio-company matching accuracy.
- SERP parsing accuracy for title, URL, snippet, rank, result type, country, city, and device.
- AI answer source reconciliation accuracy.
- Publish-date, first-seen, and lookback-window accuracy.
- Duplicate collapse rate across repeated SERP results and fetched URLs.
- JS-rendered page recovery rate.
- Geo and device separation accuracy.
- Credit estimate accuracy before execution.
- JSON, CSV, Markdown, and event-stream output reconciliation.

## Manual Review Rubric

Score each report from 1-5:

- Relevance: Are alerts tied to a specific portfolio company, competitor, topic, and business context?
- Evidence quality: Can every alert be verified from source URLs, excerpts, SERP rows, AI answer sources, or fetch metadata?
- Severity clarity: Are high, medium, and low alerts proportional to novelty, commercial intent, visibility, and confidence?
- Noise control: Does the report suppress jobs, support, boilerplate, stale pages, and cosmetic updates?
- Actionability: Does each alert explain why it matters and what the portfolio company should do next?
- Uncertainty handling: Are single-source, inferred-date, blocked, stale, and geo-specific signals marked clearly?
- Readability: Can a portfolio team understand the week's competitive movement without opening every source?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every high-severity alert includes at least two evidence items or a visible single-source warning.
- Every recommendation is grounded in observed public evidence.
- No high-severity alert is based solely on a chatbot answer without fetched or independently verified sources.
- Noise categories are absent from high-severity alerts.
- Observed facts, inferred interpretation, and suggested response are separated.

## Automated Checks

Run after every monitoring report:

- JSON schema validation for briefs, observations, alerts, suppression records, and reports.
- Every observation must include portfolio company, domain, URL, source type, observed time, geo, device, confidence, and warnings.
- Every alert must include alert ID, company, signal type, severity, severity score, confidence, evidence, and recommended follow-up.
- Evidence items must preserve source type, URL, observed time, country, device, and either excerpt, snippet, query, rank, or fetch metadata.
- Alerts outside the lookback window must be suppressed unless explicitly marked as historical context.
- Duplicate URLs, canonical URLs, repeated SERP rows, and AI answer citations must collapse into one evidence group.
- Competitor domains must not be assigned to the wrong portfolio company without a warning.
- AI answer inclusion cannot produce high confidence unless at least one cited source is fetched or independently verified.
- Pages with render failures cannot produce high-severity alerts unless corroborated by search or another fetched source.
- Jobs pages, support-only pages, status pages, legal pages, and generic press boilerplate must be suppressed or labeled noise.
- Geo-specific and device-specific findings must not be merged into global findings without evidence.
- JSON, CSV, Markdown, and event-stream outputs must reconcile on alert ID, company, competitor, signal type, severity, confidence, and source URL.
- No output may include fabricated revenue impact, adoption numbers, churn, customer migration, private roadmap, investor intent, or competitive intent.

## Failure Modes To Track

- Treating competitor hiring as proof of product launch or market entry.
- Treating generic press releases as competitive movement without page-level product evidence.
- Overweighting one SERP rank movement without source freshness or competitive relevance.
- Creating duplicate alerts for the same page found through search, fetch, and AI answer sources.
- Missing changes hidden behind JavaScript tabs, accordions, pricing toggles, modals, or region selectors.
- Misclassifying support documentation edits as major product releases.
- Assigning one company's competitor signal to another portfolio company in the same category.
- Merging mobile, desktop, city, or country-specific signals into one global alert.
- Allowing chatbot answer text to become an alert without source verification.
- Letting AI recommendations imply customer loss, adoption impact, revenue impact, or private strategy beyond public evidence.

## Golden Examples

Create fixture runs before implementation:

1. Product launch: a direct competitor publishes a new product page and launch post.
2. Pricing change: a competitor changes plan names, trial terms, or contact-sales packaging.
3. Comparison attack: a competitor creates a "vs portfolio company" or "alternatives" page.
4. SERP gain: a competitor enters the top 10 for a tracked buyer-intent query.
5. AI answer inclusion: a competitor becomes cited in a sourced answer for a tracked category question.
6. Docs signal: an API changelog and docs page indicate a new integration.
7. Regional signal: a competitor launches localized pages in one country but not another.
8. Emerging competitor: an unknown domain appears across several tracked category SERPs.
9. Render trap: pricing or product content appears only after JavaScript loads and a modal is dismissed.
10. Noise trap: jobs, support, status, legal, and boilerplate pages appear fresh but should not alert.

Each fixture should include:

- Input portfolio watchlist.
- Search results, fetched pages, and AI answer source outputs.
- Human-labeled observations.
- Expected retained alerts and suppressed observations.
- Expected severity band, confidence, and warning labels.
- Expected evidence groups and duplicate collapse behavior.
- Disallowed recommendations and claims.

## Launch Criteria

The MVP is ready for first users when:

- 36-run benchmark completes without crashes.
- Alert precision is at least 90%.
- High-impact recall is at least 85%.
- Evidence validity is at least 95%.
- High-severity noise is below 8%.
- Severity usefulness agreement is at least 80%.
- AI answer alerts require source verification.
- Geo, date, source type, and device variants are stored and reported separately.
- Snapshot-to-report reconciliation passes automatically.
- JSON, CSV, Markdown, and event-stream outputs are readable without manual cleanup.
