# Evaluation

Goal: prove City Landing Page QA finds material city-page defects and unsupported local recommendations faster than manual review, while preserving source lineage for every issue.

## Test Set

Use 35 city landing-page QA runs:

- 8 local service page batches with phone, service area, and emergency-intent requirements.
- 6 marketplace city pages where inventory, coverage, or provider counts vary by city.
- 5 SaaS city or regional pages where localization may be thin but commercial intent differs.
- 5 multi-device batches where mobile SERPs or page rendering differ from desktop.
- 4 international city batches with language, hreflang, currency, or region-name differences.
- 4 duplicate-heavy batches where the correct recommendation is to merge, rewrite, or hold pages.
- 3 blocked or technical-defect batches with noindex, wrong canonical, render failures, or geo gates.

For each run, create a human-labeled benchmark:

- City URL list and expected publish, fix, hold, or reject decision
- Page fetch observations and expected technical issues
- Relevant and irrelevant local SERP examples
- Expected local intent by query and device
- Expected city-specific proof, offer, phone, and availability checks
- Known sibling-page duplicates or boilerplate modules
- Disallowed claims such as fake rankings, reviews, certifications, or service coverage
- Human-written reference QA findings for at least five city pages

## Metrics

Primary metrics:

- Defect recall: find at least 85% of human-labeled critical and high-severity issues.
- Defect precision: at least 85% of reported critical and high-severity issues should be accepted by reviewers.
- Evidence validity: at least 95% of issues should include fetch, SERP, or expectation lineage.
- Decision usefulness: at least 80% agreement with human publish, fix, hold, or reject labels.
- Time saved: reduce first-pass city page QA from 20-45 minutes per page to under 6 minutes of review per page.

Secondary metrics:

- Local intent classification accuracy by city, query, and device.
- Phone, address, city-name, canonical, schema, and noindex extraction accuracy.
- Duplicate-page detection precision after normalizing city variables.
- Correct handling of mobile-specific local packs and page rendering differences.
- Unsupported-claim detection against supplied brand rules and fetched evidence.
- Credit estimate accuracy before batch execution.
- Export consistency across JSON, CSV, Markdown, and evidence artifacts.

## Manual Review Rubric

Score each city page result from 1-5:

- Local accuracy: Does the page target the requested city, region, country, language, and device correctly?
- Intent match: Does the page answer the dominant local SERP intent?
- Evidence quality: Are findings backed by inspectable fetch or SERP evidence?
- Technical readiness: Are canonical, indexability, schema, rendering, and internal links healthy?
- Distinctiveness: Is the page meaningfully different from sibling city pages?
- Conversion readiness: Are CTAs, phone numbers, forms, offers, and availability appropriate for the city?
- Restraint: Does the report avoid inventing proof, rankings, service coverage, or local claims?

A city page result is MVP-acceptable when:

- Average reviewer score is at least 4.
- Critical and high issues include evidence IDs and reproduction context.
- SERP-derived findings include query, rank, geography, device, and source URL.
- AI recommendations are distinguishable from observed page facts.
- Duplicate, thin, blocked, or wrong-city pages receive capped scores.
- Publish decisions are conservative when evidence is sparse.

## Automated Checks

Run after every QA batch:

- JSON schema validation for the final report.
- All scores must be integers from 0-100.
- Every issue must include severity, category, title, evidence ID, recommendation, and confidence.
- Every SERP pattern must include at least one query and one source URL.
- Result URLs must be valid HTTP(S) URLs.
- City, country, device, and fetched timestamp must be present on every observation.
- High-readiness pages must have no critical issues and at least two city-specific evidence signals.
- Wrong-city content, missing local proof, heavy duplication, sparse evidence, noindex, and bad canonical conditions must trigger score caps.
- JSON, CSV, and Markdown exports must reconcile on page ID, city, score, status, severity, and issue title.
- No final report may include fabricated reviews, rankings, certifications, addresses, statistics, or service claims.

## Failure Modes To Track

- Marking a city page publishable because the template renders, while local proof is missing.
- Missing wrong-city phone numbers, addresses, neighborhoods, or offers.
- Treating generic service SERPs as proof that the local page matches city intent.
- Over-flagging legitimate template reuse when only boilerplate modules match.
- Under-flagging duplicate pages after obvious city-token replacement.
- Ignoring mobile-only local packs, sticky CTAs, broken forms, or hidden content.
- Letting AI recommendations invent local claims or competitor comparisons.
- Failing to distinguish noindex from canonical-to-parent defects.
- Merging observations from different cities, countries, languages, or devices.
- Producing polished reports without enough fetch or SERP evidence.

## Golden Examples

Create fixture runs before implementation:

1. Local service pages: several pages have wrong phone numbers and city-specific emergency intent.
2. Marketplace city pages: some cities have enough inventory and others should not be published.
3. SaaS regional pages: SERPs support only regional pages, not every city slug.
4. Mobile-different batch: mobile page hides local proof and SERP shows a local pack.
5. International batch: hreflang, language, and region naming errors appear.
6. Duplicate-heavy batch: city-token replacement creates near-identical pages.
7. Technical-defect batch: noindex, canonical, redirect, and JS rendering defects appear.

Each fixture should include:

- Input city QA brief
- Raw rendered page extracts by city and device
- Raw SERP snippets by query, city, country, and device
- Extracted schema and metadata
- Human issue labels with severity and category
- Expected readiness score bands
- Expected publish, fix, hold, or reject decisions
- Expected duplicate clusters
- Disallowed claims and disallowed recommendations

## Launch Criteria

The MVP is ready for first users when:

- 35-run benchmark completes without crashes.
- Critical and high defect recall is at least 85%.
- Critical and high defect precision is at least 85%.
- Evidence validity is at least 95%.
- Publish, fix, hold, or reject agreement is at least 80%.
- Median reviewer time is under 6 minutes per page.
- High-readiness false-positive rate is below 12%.
- Batch credit cost is estimated before each run and recorded after completion.
- Markdown, JSON, CSV, and evidence exports are readable without manual cleanup.
