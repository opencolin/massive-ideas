# Evaluation

Goal: prove Regional Demand Analyzer produces a useful, source-backed regional prioritization faster than manual localized SERP review.

## Test Set

Use 24 category-region runs:

- 6 local service categories with strong city variation.
- 5 B2B services where national vendors and local providers both appear.
- 4 consumer marketplace categories with local supply-demand differences.
- 4 categories with ambiguous meanings or job-search contamination.
- 3 categories that vary meaningfully by mobile versus desktop SERPs.
- 2 sparse categories where the correct answer may be "insufficient evidence."

For each run, create a human-labeled benchmark:

- Candidate regions and expected relative attractiveness
- Relevant and irrelevant SERP result examples
- Known competitors or local alternatives
- Expected local language and buyer phrases
- SERP features that should matter, such as maps, ads, local packs, or directories
- Exclusions and ambiguous meanings
- Human-written regional recommendation summary

## Metrics

Primary metrics:

- Regional ranking usefulness: at least 80% of top-ranked regions should be human-rated as plausible launch, content, or campaign priorities.
- Evidence validity: at least 95% of claims should be backed by SERP, fetched-page, or AI-summary source lineage.
- Relevance precision: at least 85% of top 10 SERP-derived evidence items per region should match the requested category and buyer intent.
- Time saved: reduce first-pass regional SERP review from 3-6 hours to under 30 minutes of review.

Secondary metrics:

- Correct identification of low-evidence regions.
- Commercial intent classification accuracy.
- Local competitor extraction precision.
- Local phrase and topic coverage against human labels.
- Duplicate domain and competitor normalization rate.
- Agreement between automated confidence labels and reviewer confidence.
- Cost per completed regional comparison.

## Manual Review Rubric

Score each report from 1-5:

- Regional prioritization: Are the highest-ranked regions reasonable given the evidence?
- Evidence quality: Are claims supported by inspectable sources with query and rank lineage?
- Intent separation: Does the report distinguish commercial, comparison, pricing, local, and informational intent?
- Locality: Does it capture actual regional differences rather than generic national category language?
- Competitor visibility: Are visible local and national competitors identified accurately?
- Actionability: Are recommendations specific enough to guide landing pages, paid search, sales focus, or partner research?
- Restraint: Does it avoid pretending SERP visibility is exact search volume or market size?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every top-ranked region has at least five relevant evidence items or is explicitly marked low confidence.
- No unsupported market-size, revenue, or search-volume claims appear.
- Country, city, and device targets are visible in the final report.
- Google SERP facts and AI-generated synthesis are clearly distinguishable in the evidence trail.

## Automated Checks

Run after every regional analysis:

- JSON schema validation for the final report.
- All scores must be integers from 0-100.
- Every evidence item must include region target, query, URL, and source type.
- Result URLs must be valid HTTP(S) URLs.
- Each top region must include at least three unique source domains unless confidence is low.
- Demand score must be capped when relevant SERP evidence is sparse.
- Regions dominated by excluded meanings must score below 40 or be omitted.
- Localized observations must not be merged across city, country, or device targets.
- CSV and Markdown exports must reconcile with JSON region scores.

## Failure Modes To Track

- Treating SERP ranking as direct search volume.
- Overweighting local directories that rank broadly but provide thin evidence.
- Missing mobile-only local packs or map-heavy result patterns.
- Collapsing national and city-specific evidence into one generic recommendation.
- Including job listings, definitions, or unrelated services as demand evidence.
- Failing to normalize franchises, local offices, and parent brands.
- Penalizing attractive low-competition regions because there are fewer strong pages.
- Letting AI synthesis invent regional claims without source lineage.
- Ignoring region-specific language that appears in snippets but not page titles.

## Golden Examples

Create fixture runs before implementation:

1. Local service category: clear city-to-city variation, local packs, and directory results.
2. B2B service category: national brands plus city-specific boutique providers.
3. Ambiguous category: SERPs contain buyer intent, jobs, and unrelated meanings.
4. Mobile-sensitive category: mobile SERP includes stronger local pack and near-me behavior than desktop.
5. Sparse category: few relevant results and a correct low-confidence recommendation.

Each fixture should include:

- Input demand brief
- Raw SERP snippets by region, query, and device
- Fetched source excerpts
- Human relevance labels
- Expected regional score bands
- Expected visible competitors
- Expected local language
- Disallowed claims

## Launch Criteria

The MVP is ready for first users when:

- 24-run benchmark completes without crashes.
- Regional ranking usefulness is at least 80%.
- Evidence validity is at least 95%.
- Top evidence relevance precision is at least 85%.
- Median human review time is under 30 minutes per report.
- Duplicate competitor rate is below 5%.
- Batch credit cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
