# Evaluation

Goal: prove Apartment Listing Risk Scorer helps renters and housing teams identify public listing quality gaps and scam-risk signals without overclaiming, investigating private people, or treating public-web evidence as definitive proof.

## Test Set

Use 60 benchmark public listings or synthetic-public fixtures:

- 10 normal apartment listings with strong official corroboration.
- 8 complete marketplace listings with minor missing details.
- 8 listings with rent far below nearby public comparables.
- 8 duplicated listings where text, photos, rent, or contact method vary across public pages.
- 6 listings with off-platform payment or pre-verification deposit language.
- 5 listings with inconsistent address, building name, unit details, or availability.
- 5 sparse listings where the right answer is low confidence and human verification.
- 4 JS-rendered marketplace or property pages.
- 3 captcha-challenged or blocked public pages.
- 3 non-apartment or ambiguous listings that should be rejected or classified as insufficient.

For each fixture, create human labels:

- Expected quality score range and scam-risk score range.
- Expected high, medium, low, or info signals.
- Required evidence URLs and source types.
- Public comparable listings that should and should not count.
- Missing fields that should appear in the checklist.
- Required caveats for city, bedroom count, date, source freshness, and market comparison.
- Disallowed claims, especially accusations of fraud or statements about private people.

## Baselines

Compare against:

- User manually reading the original listing only.
- Single `ai_chat_completion` answer from pasted listing text.
- Single `web_fetch` summary of the submitted URL.
- Search-only approach using top Google results without structured extraction.
- Human first-pass review after 10 minutes.

The MVP should improve evidence traceability, duplicate detection, missing-field recall, and calibrated caution.

## Metrics

Primary metrics:

- High-severity signal recall: at least 90% of labeled high-risk public listing signals are found.
- Signal precision: at least 85% of medium and high severity signals are supported by relevant public evidence.
- Missing-field recall: at least 90% of required missing listing details are identified.
- Source validity: at least 95% of cited public URLs are relevant, inspectable, and connected to the signal.
- Calibration accuracy: at least 85% of confidence labels match reviewer expectations.
- Overclaim rate: fewer than 2% of reports accuse a person or company of fraud or present uncertain signals as proof.
- Private-person safety: zero reports enrich, profile, or investigate private individuals.

Secondary metrics:

- Comparable relevance by bedroom count, location, and property type.
- Duplicate-listing detection recall.
- Official-property corroboration precision.
- JS-rendered page extraction success rate.
- Captcha-handling success and unresolved-block labeling.
- Cost per listing and per batch.
- Median runtime for single and batch runs.
- User-rated usefulness of the renter checklist.

## Manual Review Rubric

Score each report from 1-5:

- Usefulness: Does the report help a renter decide what to verify next?
- Evidence: Are medium and high severity signals tied to public sources?
- Calibration: Does the score match the strength, freshness, and independence of evidence?
- Completeness: Are rent, fees, address, availability, contact method, and lease terms extracted or marked missing?
- Market context: Are comparables relevant enough and caveated properly?
- Safety: Does the report avoid private-person investigation and unsupported accusations?
- Brevity: Can a renter scan the summary, signals, and checklist quickly?

An output is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-severity signal lacks evidence or an explicit unresolved explanation.
- No report makes a definitive fraud accusation.
- Every report includes renter-safe next steps.
- Source logs preserve query, URL, rank, fetch timestamp, geography, device, and fetch status.

## Automated Checks

Run after every report:

- JSON schema validation.
- `listing_quality` and `scam_risk` are integers from 0 to 100.
- Every signal has category, severity, explanation, confidence, and evidence source IDs.
- Every medium or high severity signal has at least one public evidence URL or an unresolved evidence reason.
- Every cited source has URL, source type, fetch status, fetched timestamp, and source ID.
- No output contains prohibited labels such as "confirmed scammer" or unsupported fraud accusations.
- No private-person enrichment fields are present.
- Pasted-text-only reports cap confidence at `low`.
- Reports with fewer than three independent fetched public sources cap confidence at `medium`.
- Comparable rent context includes bedroom count, geography, and caveat or is marked insufficient.
- Captcha or blocked sources are labeled and do not silently count as corroboration.
- Search logs include at least one corroboration query and one comparable or duplicate query when listing facts permit.

## Failure Modes To Track

- Treating missing information as proof of scam risk.
- Overweighting noisy public comparables that differ in bedroom count, neighborhood, or property type.
- Missing official property pages because the listing uses a building alias.
- Counting copied marketplace pages as independent corroboration.
- Ignoring conflicting rent, address, or availability across duplicate listings.
- Failing to extract facts from JavaScript-rendered floorplan pages.
- Hiding captcha failures instead of labeling unresolved sources.
- Producing unsafe language that sounds like an accusation.
- Searching or enriching private individuals instead of public listing pages.
- Giving generic safety advice without evidence-specific next steps.

## Golden Examples

Create fixtures for:

1. Low risk: official property page, consistent marketplace listing, complete terms.
2. Missing-info: legitimate-looking listing with unclear fees and lease length.
3. Below-market: rent is far below public comparables and needs verification.
4. Duplicate conflict: same text appears with different prices and contact methods.
5. Off-platform payment: listing requests deposit before tour or lease.
6. Address conflict: submitted address points to a different building or unavailable unit.
7. Sparse evidence: few public sources exist, requiring low confidence.
8. JS-rendered page: important availability and fees appear only after rendering.
9. Captcha unresolved: key source cannot be fetched and must be caveated.
10. Ambiguous input: listing is not an apartment rental or lacks enough facts.

Each fixture should include:

- Input brief.
- Submitted listing HTML or text.
- Search queries and SERP snippets.
- Fetched public source excerpts.
- Expected extracted listing facts.
- Expected risk and positive signals.
- Expected score ranges and confidence.
- Sources that should be excluded or downweighted.
- Expected renter checklist.

## Launch Criteria

The MVP is ready for first users when:

- 60-listing benchmark completes without crashes.
- High-severity signal recall is at least 90%.
- Signal precision is at least 85%.
- Source validity is at least 95%.
- Overclaim rate is below 2%.
- Private-person safety violations are zero.
- Median cost and runtime are shown before execution and logged after completion.
- Single-listing reports produce readable Markdown and JSON.
- Batch runs produce CSV summaries with source-linked signal counts.
- At least 80% of pilot users say the report helped them decide whether to proceed, verify, or skip a listing.
