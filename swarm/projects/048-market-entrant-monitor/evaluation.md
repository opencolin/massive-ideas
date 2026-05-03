# Evaluation

Goal: prove Market Entrant Monitor finds real new entrants and credible expansion signals, ranks them usefully, and avoids confusing content marketing, resellers, agencies, directories, or stale pages with market entry.

## Test Set

Use 35 monitoring runs:

- 6 runs with clear new-company entrants from official product pages, launch posts, or marketplace listings.
- 5 runs with incumbents entering an adjacent category through a new product line or landing page.
- 4 runs with regional entrants visible only under specific country, city, language, or device settings.
- 4 runs with vertical entrants targeting a narrow buyer or workflow inside the broader market.
- 3 runs with funded entrants where funding coverage must be corroborated by product evidence.
- 3 runs with developer-led entrants from docs, APIs, changelogs, GitHub pages, or open-source project launches.
- 3 runs with JavaScript-rendered pages, modals, cookie gates, or captcha-protected pages.
- 3 runs with SERP traps such as stale pages, duplicate syndicated coverage, or directories ranking above original sources.
- 4 runs with agencies, resellers, listicles, job posts, thought leadership, or generic SEO pages that should be suppressed.

For each run, create a human-labeled benchmark:

- Market definition, category keywords, exclusions, known players, country, city, device, language, and fetch time
- Search queries and returned SERP positions
- Source URLs, page titles, observed dates, publication dates, and rendered fetch status
- Expected entrant candidates and expected suppressed candidates
- Expected entrant type, novelty, confidence, and score-impact band
- Expected warnings for stale, undated, blocked, duplicate, snippet-only, or geo-specific evidence
- Disallowed claims about revenue, market share, adoption, private roadmap, customer migration, or competitive intent

## Metrics

Primary metrics:

- Entrant precision: at least 90% of medium or high confidence retained entrants should be real companies or product lines entering the monitored market.
- Entrant recall: at least 85% of human-labeled high-importance entrants should be detected.
- Evidence validity: at least 95% of retained entrants should include company, URL, source type, observed time, excerpt, confidence, and fetch metadata.
- Noise control: fewer than 10% of high-score entrants should be agencies, resellers, job posts, listicles, content-only pages, or stale directory records.
- Ranking usefulness: at least 80% of reviewers should agree the top five entrants belong in the top half of candidates for that run.

Secondary metrics:

- Entrant type classification accuracy.
- Company name, domain, and alias resolution accuracy.
- Publication-date and lookback-window accuracy.
- Duplicate and syndicated source collapse rate.
- Geo, city, language, and device separation accuracy.
- SERP parsing accuracy for title, URL, snippet, rank, and source domain.
- JavaScript-rendered evidence recovery rate.
- Credit estimate accuracy before execution.
- JSON, CSV, Markdown, and snapshot reconciliation.

## Manual Review Rubric

Score each report from 1-5:

- Entrant quality: Does the report surface companies or product lines a market watcher would care about?
- Evidence quality: Can every retained entrant be verified from source URLs, excerpts, and fetch metadata?
- Precision: Does it avoid agencies, resellers, listicles, jobs pages, generic thought leadership, and directory-only claims?
- Completeness: Does it catch new companies, incumbent expansions, regional launches, marketplace entries, and developer-led entrants?
- Ranking clarity: Are score drivers understandable and proportional to the evidence?
- Uncertainty handling: Are stale dates, blocked fetches, duplicate sources, and geo-specific claims clearly marked?
- Readability: Can a reviewer understand who entered the market and why without opening every source?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every high-confidence entrant includes at least one fetched source URL and excerpt.
- Every high-score entrant includes at least two corroborating evidence items or a visible single-source warning.
- Stale, undated, or snippet-only sources are capped and visibly marked.
- Suppressed candidates include a reason that a reviewer can audit.
- Recommendations are separated from observed facts.

## Automated Checks

Run after every monitoring report:

- JSON schema validation for briefs, observations, candidates, and reports.
- Every observation must include URL, source type, observed time, geo, device, fetch status, and excerpt.
- Every retained entrant must include company, entrant type, confidence, entry score, evidence, warnings, and recommended follow-up.
- Medium and high confidence entrants must have fetched page evidence, not SERP snippets alone.
- Candidates outside the lookback window must be suppressed unless explicitly marked historical context.
- Duplicate URLs, syndicated articles, and repeated SERP results must collapse into one evidence group.
- Known incumbent expansions must not be mislabeled as new companies.
- Agencies, resellers, job posts, and content-only pages must be suppressed or low-confidence noise.
- Pages with render failures cannot produce high-confidence entrants.
- Geo-specific entrants must not be promoted to global market entry without source evidence.
- JSON, CSV, and Markdown outputs must reconcile on company, domain, entrant type, score, confidence, and source URL.
- No report may include fabricated revenue impact, customer adoption, market share, strategy, or private-roadmap claims.

## Failure Modes To Track

- Treating a directory listing as market entry without an official page, app listing, docs page, or launch source.
- Counting syndicated articles as independent corroboration.
- Overweighting SEO pages that mention the category but do not describe a product.
- Missing entrants hidden behind JavaScript tabs, app cards, modals, or regional selectors.
- Misreading an old product page as a new launch because it ranks in recent search.
- Merging similarly named companies, products, or subsidiaries.
- Treating agencies, consultants, resellers, affiliates, or BPOs as software entrants.
- Failing to separate regional entry from global entry.
- Letting AI summaries imply traction, revenue, or competitive intent beyond public evidence.
- Losing source lineage between a score driver and the exact page excerpt that supports it.

## Golden Examples

Create fixture runs before implementation:

1. New company: an official launch post and product page announce a category-specific product.
2. Incumbent expansion: a known player creates a new landing page and docs section for the monitored market.
3. Regional entry: a product appears in US SERPs and pages but not UK pages.
4. Vertical entry: a broad platform launches a healthcare, ecommerce, finance, or developer-specific variant.
5. Marketplace entry: a new app listing and company page both describe category functionality.
6. Funded entrant: a funding article names the market, and the product site confirms a real offering.
7. Developer entrant: docs, API pages, and changelog entries show a new developer-facing product.
8. SERP trap: duplicate articles point to the same original launch source.
9. Directory trap: a directory result names the category but has no official source confirmation.
10. Render trap: entrant evidence appears only after JavaScript loads and a modal is dismissed.

Each fixture should include:

- Input market brief
- Search results and fetched pages
- Human-labeled observations
- Expected retained and suppressed candidates
- Expected score-impact band
- Expected confidence
- Expected warnings
- Disallowed recommendations and claims

## Launch Criteria

The MVP is ready for first users when:

- 35-run benchmark completes without crashes.
- Entrant precision is at least 90%.
- High-importance recall is at least 85%.
- Evidence validity is at least 95%.
- High-score noise is below 10%.
- Top-rank usefulness agreement is at least 80%.
- Geo, date, source-type, and entrant-type variants are stored and reported separately.
- Snapshot-to-report reconciliation passes automatically.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
