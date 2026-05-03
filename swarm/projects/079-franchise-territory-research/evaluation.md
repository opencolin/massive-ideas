# Evaluation

Goal: prove Franchise Territory Research Assistant produces useful, source-backed territory diligence faster and more consistently than manual city-by-city search, competitor locator checks, and spreadsheet scoring.

## Test Set

Use 40 benchmark territory runs:

- 6 home-services franchises where protected radius and local search demand matter.
- 6 fitness, wellness, or beauty concepts with dense local competitors.
- 6 food or beverage franchises with high site-selection sensitivity.
- 5 education, tutoring, or childcare concepts with school and household-fit proxies.
- 5 healthcare or senior-care franchises with licensing or regulatory signals.
- 4 B2B service concepts where demand is visible through directories and local business density.
- 4 multi-unit expansion cases where existing brand locations create cannibalization risk.
- 4 ambiguous rural or small-market cases where the correct answer should be low confidence or human review.

For each benchmark, create human labels:

- Concept category, customer profile, site criteria, and known brand footprint.
- Candidate territories, ZIPs, cities, counties, and any protected-area rules.
- Direct competitors, substitutes, directories, and excluded lookalikes.
- Expected local demand strength by territory.
- Expected competitor density and key visible competitors.
- Known existing brand-location conflicts.
- Sources that should support or weaken the recommendation.
- Expected confidence labels, risks, and recommended action.

## Metrics

Primary metrics:

- Recommendation agreement: at least 85% of territory priority decisions match expert reviewer labels.
- Competitor detection accuracy: at least 90% of named direct competitors visible in local SERPs or locator pages are captured.
- Protected-overlap risk recall: at least 90% of known overlap or cannibalization risks are flagged.
- Evidence validity: 100% of material claims include observation IDs, source URLs, city, device, and timestamp where applicable.
- Classification precision: at least 95% of confirmed direct-competitor matches are true competitors rather than directories, unrelated businesses, or substitutes.
- Time saved: reduce a 10-territory first-pass review to under 30 minutes of human review.

Secondary metrics:

- Correct separation of demand, direct competition, substitutes, directories, brand footprint, and market-proxy evidence.
- Correct handling of mobile versus desktop local-pack differences.
- Useful identification of high-saturation markets.
- Useful identification of under-evidenced or ambiguous markets.
- Credit estimate accuracy versus actual Massive MCP usage.
- Markdown and CSV export readability for brokers, franchise development teams, and operators.

## Manual Review Rubric

Score each report from 1-5:

- Territory prioritization: Does the ranking match the actual attractiveness of the territories?
- Evidence quality: Can every material claim be traced to SERP or fetched-page sources?
- Competitive context: Are direct competitors, substitutes, and directories separated correctly?
- Territory constraints: Are protected radius, ZIP overlap, and existing brand footprint risks handled conservatively?
- Demand interpretation: Does the report avoid overclaiming from search visibility alone?
- Actionability: Are next steps specific enough for franchise development or broker follow-up?
- Restraint: Does the report avoid legal, demographic, revenue, or unit-economics certainty it cannot support?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No priority territory recommendation lacks citations.
- Every territory has a confidence label and evidence-quality score.
- Competitor and directory evidence are separated.
- Protected-territory ambiguity is flagged instead of hidden.
- Any low-evidence recommendation is marked `human_review` or `watchlist`.

## Automated Checks

Run after every generated report:

- JSON schema validation for brief, observations, scorecards, and final report.
- All scores must be integers from 0-100.
- Every observation must include `observation_id`, territory label, query or source type, city when applicable, source URL, timestamp, and confidence.
- Every recommendation must cite one or more observation IDs.
- Direct competitors must not be counted from generic directory mentions unless the business identity is confirmed.
- Directory, broker, government, economic-development, organic, local-pack, maps, ads, AI overview, and PAA surfaces must remain separate.
- Desktop and mobile observations must not be merged into one source row.
- Existing brand-location matches must include confidence and source type.
- CSV observation counts must reconcile with JSON observation counts.
- Markdown ranked tables must use the same territory scores as JSON.

## Failure Modes To Track

- Overstating franchise performance, revenue, or buyer success from search demand.
- Treating a franchise broker listing as verified franchisor territory availability.
- Counting unrelated same-name businesses as direct competitors.
- Counting directories as direct competitor locations.
- Missing existing brand locations because a locator page requires JS rendering.
- Ignoring ZIP, city, or protected-radius conflicts.
- Combining substitute competition with direct competition without labels.
- Using broad national category content as proof of local demand.
- Letting AI summaries cite no observation IDs.
- Producing confident recommendations from sparse or stale evidence.

## Golden Examples

Create fixture runs before implementation:

1. Clear priority territory: strong local demand, manageable competition, and no known brand overlap.
2. Saturated but attractive territory: strong demand with many competitors and a guarded recommendation.
3. Weak-demand territory: few relevant local results and a deprioritize recommendation.
4. Existing footprint conflict: brand or sister locations likely violate radius or ZIP rules.
5. Directory-heavy market: many directory pages but little verified local competition.
6. Substitute-heavy market: adjacent businesses appear but direct competitors are limited.
7. JS locator case: competitor locations only appear after rendered `web_fetch`.
8. Ambiguous small market: sparse evidence triggers human review.

Each fixture should include:

- Input territory research brief.
- Raw parsed SERP observations.
- Fetched brand, competitor, directory, and market-source excerpts.
- Human labels for competitors, substitutes, directories, and brand locations.
- Expected territory score range.
- Expected recommendation action.
- Expected risks and confidence labels.
- Claims that must not appear in the final report.

## Launch Criteria

The MVP is ready for first users when:

- 40-run benchmark completes without crashes.
- Recommendation agreement is at least 85%.
- Competitor detection accuracy is at least 90%.
- Protected-overlap risk recall is at least 90%.
- Confirmed competitor match precision is at least 95%.
- Evidence validity is 100%.
- Median human review time is under 30 minutes for a 10-territory report.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
