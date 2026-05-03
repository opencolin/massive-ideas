# Evaluation

Goal: prove Used Car Listing Verifier helps buyers and market researchers evaluate public used-car listings more accurately than a single marketplace badge, single search, or generic chatbot answer.

## Test Set

Use 50 benchmark listings:

- 8 straightforward fair-market dealer listings with many close comps.
- 6 overpriced listings with weak or irrelevant "premium" explanations.
- 6 underpriced listings where public evidence suggests stale page, title issue, high mileage, or missing condition data.
- 6 listings with trim, drivetrain, option, or photo-description inconsistencies.
- 5 listings where dealer fees or certification language materially changes the price interpretation.
- 5 sparse-market vehicles where the app should return low confidence or insufficient public data.
- 4 regional cases where city or device targeting changes comparable availability.
- 4 marketplace duplicate cases where the same vehicle appears on several public URLs.
- 3 listings with public accident, rental, fleet, lemon, buyback, or rebuilt-title language.
- 3 private-party marketplace listings where the app must stay inside public listing content and avoid person-focused research.

For each listing, create a human-labeled benchmark:

- Canonical vehicle facts and expected uncertainties.
- Expected market position label and fair-price range.
- Valid comparable listings and excluded non-comparable listings.
- Known duplicate URLs and stale pages.
- Required caveats around title, accident, fees, mileage, location, or condition.
- Claims that should be supported, contradicted, or marked needs-confirmation.
- Disallowed private-investigation behavior.

## Baselines

Compare against:

- Marketplace-provided "good deal" or "fair deal" badge when available.
- Single Google-style search summarized from top results.
- Single `ai_chat_completion` answer from listing text only.
- Human buyer research notes after 15 minutes.
- Direct listing fetch with no comparable-search expansion.

The MVP should win on source traceability, comparable relevance, uncertainty handling, and useful seller questions.

## Metrics

Primary metrics:

- Vehicle fact extraction accuracy: at least 95% for year, make, model, price, and mileage when present.
- Trim and option normalization accuracy: at least 85% on benchmark listings.
- Market position label accuracy: at least 80% against human-labeled ranges.
- Comparable relevance: at least 85% of included comps are high or medium relevance by human review.
- Bad comp exclusion recall: at least 90% of obvious wrong-trim, wrong-year, distant, stale, or duplicate comps are excluded or downweighted.
- Claim-check precision: at least 90% of supported or contradicted claims have cited public evidence.
- Overconfidence rate: fewer than 5% of sparse or conflicting cases receive high confidence.
- Privacy compliance: 100% refusal or redirection for private-person lookup, restricted records, and non-public investigation prompts.

Secondary metrics:

- Source validity and inspectability.
- Median runtime and cost per report.
- JS-rendered listing capture success rate.
- Captcha resolved versus unresolved rate.
- Duplicate listing suppression rate.
- Freshness policy compliance.
- Share of reports with useful buyer questions.
- User-rated clarity of market-price explanation.

## Manual Review Rubric

Score each report from 1-5:

- Listing understanding: Did the app capture the vehicle facts and listing claims correctly?
- Comparable quality: Are the comps close enough to support the price conclusion?
- Price reasoning: Does the fair range explain mileage, trim, location, fees, condition, and scarcity?
- Evidence traceability: Can each claim and comp be traced to URL, query, rank, timestamp, and fetch status?
- Calibration: Does the confidence match source quality and market density?
- Buyer usefulness: Would the questions and caveats help before contacting the seller?
- Privacy boundary: Did the app stay focused on public listing and market research?

An output is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-confidence price label lacks close public comps.
- Every claim check has evidence or a clear missing-evidence explanation.
- Sparse-market cases are visibly caveated.
- Private-person research requests are refused or reframed.

## Automated Checks

Run after every report:

- JSON schema validation.
- Market position is one of the allowed labels.
- Confidence is `high`, `medium`, or `low`.
- Every source has URL or pasted-text marker, source type, fetch timestamp, and fetch status.
- Every cited source appears in the source log.
- Every comp has price, mileage, source URL, match quality, and adjustment notes when publicly available.
- Excluded comps include an exclusion reason.
- Fair-price range is omitted when public data is insufficient.
- Reports with fewer than three valid comps cannot be high confidence.
- Reports with title, accident, or fee uncertainty include buyer questions.
- Source logs mark JS rendering and captcha status.
- Duplicate URLs and duplicate vehicle records are flagged before price scoring.
- Private-investigation prompts trigger refusal or safe reframing.

## Failure Modes To Track

- Averaging prices from vehicles with wrong trim, powertrain, model year, or condition.
- Treating dealer asking prices as completed sale prices.
- Ignoring dealer fees, certification premiums, or warranty differences.
- Missing stale, removed, or duplicate marketplace pages.
- Overweighting national comps when local supply is different.
- Treating seller claims about clean title or accident history as independently verified.
- Failing to fetch JavaScript-rendered listing details.
- Losing evidence lineage after AI normalization.
- Giving legal, mechanical, or safety certainty from incomplete public sources.
- Crossing the boundary from public listing research into private seller investigation.

## Golden Examples

Create fixtures for:

1. Fair-market common sedan with many local comps.
2. Overpriced SUV where trim and mileage do not justify the premium.
3. Underpriced truck with public rebuilt-title language.
4. Luxury vehicle where options materially affect price.
5. EV where battery warranty and trim package matter.
6. Sparse-market enthusiast car with low-confidence result.
7. Duplicate marketplace listing cluster for the same VIN supplied by the user.
8. Stale dealer page that remains indexed but no longer appears active.
9. Mobile-localized marketplace page with different visible fees.
10. Private-party listing prompt that must remain public-content-only.

Each fixture should include:

- Input brief.
- Captured listing source text.
- Search queries and SERP snippets.
- Fetched comparable excerpts.
- Expected normalized vehicle facts.
- Expected included and excluded comps.
- Expected claim checks.
- Expected price label, fair range, confidence, and caveats.
- Expected seller questions.

## Launch Criteria

The MVP is ready for first users when:

- 50-listing benchmark completes without crashes.
- Vehicle fact extraction reaches at least 95% for core fields.
- Market position label accuracy is at least 80%.
- Comparable relevance is at least 85%.
- Claim-check precision is at least 90%.
- Privacy compliance is 100%.
- Median run cost and runtime are shown before execution and recorded after completion.
- JSON and Markdown reports are readable without manual cleanup.
- At least 80% of pilot users say the report improved their confidence about whether to pursue, negotiate, or skip a public listing.
