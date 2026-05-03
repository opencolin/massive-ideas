# Evaluation

Goal: prove Local SEO Rank Checker produces accurate, source-backed city rank reports faster than manual incognito, VPN, or location-spoofed SERP checks.

## Test Set

Use 30 city-keyword benchmark runs:

- 6 home-service businesses with strong local pack behavior.
- 5 healthcare or wellness businesses where practitioner and clinic names can be ambiguous.
- 5 legal or professional-service businesses with city landing pages.
- 4 restaurant or hospitality examples where maps and review sites dominate.
- 4 franchise or multi-location brands with branch-specific names.
- 3 mobile-sensitive near-me categories.
- 3 sparse or ambiguous cases where the correct answer may be "low confidence."

For each benchmark, create human labels:

- Target domain and accepted business-name aliases.
- City, country, and device target.
- Keywords and intended local intent.
- Expected target organic rank band.
- Expected local pack or maps presence.
- Known competitor ranks or competitor presence.
- SERP result examples that should be excluded.
- Human-written recommendations for major gaps.

## Metrics

Primary metrics:

- Target rank accuracy: at least 95% of target organic ranks should match human-reviewed parsed SERPs within one position.
- Local pack match accuracy: at least 90% of target local pack detections should match human review.
- Competitor win accuracy: at least 90% of reported competitor-above-target cases should be valid.
- Evidence validity: 100% of rank claims should include query, city, device, result type, rank, and source lineage.
- Time saved: reduce a 20-keyword by 10-city rank audit from multiple hours to under 20 minutes of review.

Secondary metrics:

- Correct handling of mobile versus desktop differences.
- Correct separation of organic ranks from ads, maps, and local pack entries.
- Business-name alias precision for GBP and franchise locations.
- Duplicate domain normalization rate.
- Ambiguous match detection rate.
- Recommendation usefulness against human reviewer scores.
- Credit estimate accuracy versus actual run cost.

## Manual Review Rubric

Score each report from 1-5:

- Rank accuracy: Are organic, local pack, maps, and ad observations classified correctly?
- Local targeting: Are country, city, and device settings visible and kept separate?
- Target matching: Does the report correctly identify the target business across domain, GBP alias, and directory mentions?
- Competitor context: Are the most important local competitors surfaced without overcounting directories?
- Evidence quality: Can every rank claim be traced to a parsed SERP or fetched page?
- Actionability: Are recommendations specific to city, keyword, result type, and likely fix?
- Restraint: Does the report avoid implying exact traffic, revenue, or lead volume from rank alone?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-priority keyword has an unsupported rank claim.
- Every city-device pair includes confidence and collection timestamp.
- Organic, local pack, maps, and ads are presented as separate surfaces.
- Ambiguous target matches are flagged instead of counted as confirmed wins.

## Automated Checks

Run after every rank-check report:

- JSON schema validation for the final report.
- All scores must be integers from 0-100.
- Every keyword result must include query, city, country, device, and confidence.
- Every rank value must be a positive integer or null when absent.
- Organic rank averages must exclude ads, local pack entries, and maps results.
- Local pack presence rate must only count keywords where local pack data was observed.
- Target ranks must not be inferred from third-party directory pages unless labeled as third-party visibility.
- Desktop and mobile observations must never share the same location key.
- CSV row counts must reconcile with JSON keyword results.
- Markdown tables must include enough context to audit city, device, query, and result type.

## Failure Modes To Track

- Counting ads as organic rank.
- Treating a directory page that mentions the target as an owned ranking.
- Merging local pack rank with organic rank.
- Overlooking mobile-only local packs.
- Matching the wrong branch of a franchise or multi-location business.
- Missing abbreviations, DBA names, or GBP aliases.
- Counting broad national pages as city-specific visibility.
- Letting AI summaries create recommendations without source observation IDs.
- Overstating traffic, lead volume, or revenue impact from position changes.
- Ignoring exclusions such as jobs, DIY guides, or wholesale product pages.

## Golden Examples

Create fixture runs before implementation:

1. Clear target win: target ranks top three organically and appears in local pack.
2. Organic-only visibility: target ranks organically but is absent from local pack.
3. Local-pack-only visibility: GBP appears but owned site is absent from organic results.
4. Competitor displacement: watched competitor ranks above target across multiple city-keyword pairs.
5. Ambiguous match: directory or branch name could refer to multiple businesses.
6. Mobile divergence: mobile local pack differs materially from desktop SERP.
7. Sparse SERP: few relevant results and correct low-confidence output.

Each fixture should include:

- Input rank brief.
- Raw parsed SERP observations.
- Fetched target and competitor page excerpts.
- Human target-match labels.
- Expected rank bands.
- Expected competitor wins.
- Expected confidence labels.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 30-run benchmark completes without crashes.
- Target rank accuracy is at least 95%.
- Local pack match accuracy is at least 90%.
- Competitor win accuracy is at least 90%.
- Evidence validity is 100%.
- Median human review time is under 20 minutes for a 20-keyword by 10-city audit.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
