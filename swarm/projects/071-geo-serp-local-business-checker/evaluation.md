# Evaluation

Goal: prove Geo SERP Local Business Checker produces accurate, source-backed local visibility reports faster and more consistently than manual incognito, VPN, or location-spoofed Google checks.

## Test Set

Use 40 benchmark geo SERP runs:

- 8 home-service businesses where urgent local intent creates local packs and ads.
- 6 healthcare or wellness businesses with practitioner, clinic, and branch-name ambiguity.
- 6 legal or professional-service businesses with city landing pages.
- 5 restaurant, retail, or hospitality examples where maps, reviews, and directories dominate.
- 5 franchises or multi-location brands with branch-specific names.
- 4 mobile-sensitive near-me categories where desktop and mobile results diverge.
- 3 sparse rural or low-volume city searches.
- 3 ambiguous cases where the correct answer should be low confidence or human review.

For each benchmark, create human labels:

- Target domain, accepted aliases, branch names, and excluded lookalikes.
- Country, city, device, and collection timestamp.
- Keyword list, local intent, and priority.
- Expected target owned organic rank band.
- Expected local pack or maps presence.
- Known competitors and their surfaces.
- Directory or review-site mentions that should not count as owned visibility.
- Expected confidence labels and major recommendations.

## Metrics

Primary metrics:

- Target organic rank accuracy: at least 95% of target owned organic ranks match human-reviewed parsed SERPs within one position.
- Local pack detection accuracy: at least 92% of target local pack and maps detections match human review.
- Competitor displacement accuracy: at least 90% of reported competitor-above-target alerts are valid.
- Match precision: at least 95% of confirmed target matches are true target or accepted branch matches.
- Evidence validity: 100% of rank claims include query, city, country, device, surface, rank, timestamp, and observation ID.
- Time saved: reduce a 25-keyword by 12-geo-target audit to under 25 minutes of human review.

Secondary metrics:

- Correct separation of organic, local pack, maps, ads, AI overview, PAA, and directory surfaces.
- Correct desktop versus mobile comparisons.
- Correct detection of absent target results.
- Alias, DBA, branch, and franchise match precision.
- Directory-as-third-party labeling accuracy.
- Credit estimate accuracy versus actual Massive MCP usage.
- Recommendation usefulness against reviewer scores.

## Manual Review Rubric

Score each report from 1-5:

- Rank accuracy: Are ranks correct by result surface?
- Local targeting: Are city, country, device, and timestamp visible on every claim?
- Business matching: Does the report correctly handle aliases, branch names, franchise names, and directory mentions?
- Competitor context: Are important local competitors surfaced without overcounting directories or review sites?
- Evidence quality: Can every claim be traced to parsed SERP data or fetched-page evidence?
- Actionability: Are recommendations specific to the city, keyword, surface, and likely local SEO fix?
- Restraint: Does the report avoid claiming exact traffic, revenue, or lead impact from rank alone?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-priority keyword has an unsupported rank or absence claim.
- Every city-device pair has confidence and collection timestamp.
- Organic, local pack, maps, ads, and answer surfaces are separated.
- Ambiguous matches are flagged for review instead of counted as confirmed wins.

## Automated Checks

Run after every generated report:

- JSON schema validation for brief, observations, and final report.
- All visibility scores must be integers from 0-100.
- Every observation must include `observation_id`, query, country, city, device, surface, timestamp, and confidence.
- Every rank value must be a positive integer or null when absent.
- Organic rank averages must exclude ads, local pack, maps, AI overview, PAA, and directory mentions.
- Local pack presence rate must only count keywords where local pack data was observed.
- Directory mentions must be labeled third-party unless the target owns the page.
- Desktop and mobile observations must never share the same geo key.
- Alerts must cite one or more evidence observation IDs.
- Markdown tables and CSV exports must reconcile with JSON observation counts.

## Failure Modes To Track

- Counting ads as organic rank.
- Merging local pack rank with organic rank.
- Counting a directory page that mentions the target as an owned ranking.
- Matching the wrong branch of a franchise or multi-location business.
- Missing DBA names, abbreviations, old brand names, or Google Business Profile aliases.
- Treating national pages as city-specific local visibility.
- Ignoring mobile-only or desktop-only SERP differences.
- Letting AI recommendations cite no observation IDs.
- Overstating traffic, revenue, lead volume, or conversion impact.
- Hiding incomplete SERP collection behind a confident summary.

## Golden Examples

Create fixture runs before implementation:

1. Clear target win: target ranks top three organically and appears in local pack.
2. Organic-only visibility: owned page ranks but the business is absent from local pack.
3. Local-pack-only visibility: business listing appears but owned site is absent organically.
4. Competitor displacement: watched competitor appears above target across multiple city-keyword pairs.
5. Directory-heavy SERP: review and directory sites dominate, and target is only mentioned on third-party pages.
6. Ambiguous franchise branch: similar branch names require low confidence or human review.
7. Mobile divergence: mobile local pack differs materially from desktop for the same city and keyword.
8. Sparse geo SERP: few relevant results and correct low-confidence output.

Each fixture should include:

- Input geo SERP brief.
- Raw parsed SERP observations.
- Fetched target, competitor, and directory page excerpts.
- Human labels for target and competitor matches.
- Expected rank bands by surface.
- Expected alerts and confidence labels.
- Expected visibility scores or score ranges.
- Claims that must not appear in the final report.

## Launch Criteria

The MVP is ready for first users when:

- 40-run benchmark completes without crashes.
- Target organic rank accuracy is at least 95%.
- Local pack detection accuracy is at least 92%.
- Competitor displacement accuracy is at least 90%.
- Confirmed target match precision is at least 95%.
- Evidence validity is 100%.
- Median human review time is under 25 minutes for a 25-keyword by 12-geo-target audit.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
