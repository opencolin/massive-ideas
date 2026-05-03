# Evaluation

Goal: prove Public Company Product Momentum Tracker identifies real product-shipping and product-positioning activity from public sources, ranks companies usefully, and avoids confusing generic corporate publicity with product momentum.

## Test Set

Use 30 monitoring runs:

- 6 runs with clear new product launches from public company websites or newsroom posts.
- 5 runs with major feature releases, product-line expansions, or renamed offerings.
- 4 runs with developer documentation, API, SDK, or changelog activity.
- 3 runs with integrations, marketplaces, partner releases, or ecosystem updates.
- 3 runs with pricing, packaging, trial, or plan changes tied to a product.
- 3 runs with regional product availability or geo-specific product pages.
- 2 runs with JavaScript-rendered pages that require waiting for product content.
- 2 runs with SERP results that include stale, syndicated, or duplicate launch coverage.
- 2 runs with investor relations, hiring, thought leadership, or cosmetic page updates that should be suppressed.

For each run, create a human-labeled benchmark:

- Company, ticker, domain, category, country, city, device, and fetch time
- Search queries and returned SERP positions
- Source URLs, page titles, observed dates, and publication dates when available
- Expected product signals and expected noise exclusions
- Expected signal type, novelty, confidence, and score-impact band
- Expected warnings for stale, undated, blocked, duplicated, or weakly sourced evidence
- Disallowed claims about revenue, adoption, customer migration, private roadmap, or management intent

## Metrics

Primary metrics:

- Signal precision: at least 90% of medium or high confidence signals should be real product launch, feature, docs, integration, marketplace, pricing, or regional expansion evidence.
- Signal recall: at least 85% of human-labeled high-impact product momentum events should be detected.
- Evidence validity: at least 95% of retained signals should include company, ticker, URL, observed time, source type, excerpt, and confidence.
- Noise control: fewer than 10% of high-score signals should come from investor relations, generic thought leadership, jobs pages, support pages, or cosmetic copy edits.
- Ranking usefulness: at least 80% of human reviewers should agree the top three ranked companies belong in the top half of the watchlist for that run.

Secondary metrics:

- Product-name extraction accuracy.
- Publication-date and lookback-window accuracy.
- Duplicate and syndicated coverage collapse rate.
- Geo and device separation accuracy.
- SERP parsing accuracy for title, URL, snippet, rank, and source domain.
- JS-rendered product page recovery rate.
- Credit estimate accuracy before execution.
- Markdown, JSON, and CSV export reconciliation.

## Manual Review Rubric

Score each report from 1-5:

- Signal quality: Does the report surface product activity a strategy, investor, or GTM team would care about?
- Evidence quality: Can every signal be verified from source URLs, excerpts, and fetch metadata?
- Precision: Does it avoid investor relations, hiring, support, generic brand, and cosmetic website changes?
- Completeness: Does it capture launches, features, docs, integrations, pricing, marketplace, and regional signals?
- Ranking clarity: Are score drivers understandable and proportional to the evidence?
- Uncertainty handling: Are weak dates, duplicated sources, blocked fetches, and personalization risks called out?
- Readability: Can a reviewer understand the momentum story without opening every source?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every high-confidence signal includes at least one source URL and excerpt.
- Every high-score company includes at least two independent evidence items or a warning that it is single-source.
- Stale or undated sources are capped and visibly marked.
- Noise categories are absent from high-score signals.
- Recommendations are separated from observed facts.

## Automated Checks

Run after every monitoring report:

- JSON schema validation for briefs, observations, signals, and reports.
- Every observation must include company, ticker, URL, source type, observed time, geo, device, fetch status, and excerpt.
- Every signal must include signal type, title, confidence, score impact, evidence, and warnings.
- Signals outside the lookback window must be suppressed unless explicitly marked historical context.
- Duplicate URLs, syndicated articles, and repeated SERP results must collapse into one evidence group.
- Company domains must not be mixed across similarly named companies or subsidiaries without a warning.
- Pages with render failures cannot produce high-confidence signals.
- Investor relations, earnings calls, jobs pages, outages, legal pages, and support-only changes must be suppressed or labeled noise.
- Geo-specific signals must not be merged into global product momentum without evidence.
- JSON, CSV, and Markdown outputs must reconcile on company, ticker, signal type, score impact, confidence, and source URL.
- No report may include fabricated revenue impact, adoption numbers, competitive intent, or private roadmap claims.

## Failure Modes To Track

- Treating earnings-call commentary as a new product launch without product-source evidence.
- Counting syndicated news copies as independent evidence.
- Overweighting a single search-result rank change.
- Missing product updates hidden behind JavaScript tabs, accordions, modals, or region selectors.
- Misreading old documentation pages as new releases.
- Merging products with similar names across unrelated public companies.
- Treating hiring pages as evidence of product momentum.
- Failing to separate regional launches from global launches.
- Letting AI summaries imply adoption, revenue, or strategy beyond public evidence.
- Losing source lineage between a score driver and the page excerpt that supports it.

## Golden Examples

Create fixture runs before implementation:

1. New product launch: a public company publishes a named product page and announcement.
2. Major feature release: an existing product gains a substantial AI feature and docs page.
3. Developer signal: API documentation and SDK changelog update within the lookback window.
4. Integration signal: a marketplace listing and partner page both mention a new integration.
5. Pricing signal: a product page introduces a new plan or packaging tier.
6. Regional signal: a product launches in the US while UK pages remain unchanged.
7. SERP trap: several duplicate articles point to the same original launch source.
8. Date trap: an old product page appears in search but has no recent update evidence.
9. Corporate-noise trap: investor relations language mentions innovation without product specifics.
10. Render trap: product cards appear only after JavaScript loads and a cookie modal is dismissed.

Each fixture should include:

- Input tracking brief
- Search results and fetched pages
- Human-labeled observations
- Expected retained and suppressed signals
- Expected score-impact band
- Expected confidence
- Expected warnings
- Disallowed recommendations and claims

## Launch Criteria

The MVP is ready for first users when:

- 30-run benchmark completes without crashes.
- Signal precision is at least 90%.
- High-impact recall is at least 85%.
- Evidence validity is at least 95%.
- High-score noise is below 10%.
- Top-rank usefulness agreement is at least 80%.
- Geo, date, and source-type variants are stored and reported separately.
- Snapshot-to-report reconciliation passes automatically.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
