# Evaluation

Goal: prove International Pricing Arbitrage Tracker finds real cross-market pricing gaps with reproducible evidence while avoiding unsafe or misleading purchase advice.

## Test Set

Use 50 benchmark targets:

- 10 SaaS pricing pages with country-specific currencies or localized plan pages.
- 8 ecommerce product pages with shipping, tax, stock, or marketplace seller variation.
- 6 travel or ticketing pages where city/device targeting changes displayed offers.
- 6 digital subscription products with app, web, or regional plan differences.
- 5 hardware or electronics products with VAT-inclusive versus tax-exclusive prices.
- 5 marketplaces with local coupons, regional stores, or country selectors.
- 4 targets with quote-only or login-gated pricing that should not produce strong arbitrage claims.
- 3 targets with SERP-visible discounts that are not confirmed on page fetch.
- 3 targets protected by captcha, bot challenges, or JavaScript rendering complexity.

For each benchmark, create human labels:

- Target name, vendor domain, canonical product or plan.
- Comparable unit, billing period, package quantity, and required exclusions.
- Countries, cities, devices, and expected currencies.
- Human-observed price, tax treatment, fee treatment, discount, and availability.
- Whether the offer is actually comparable across markets.
- Eligibility caveats such as local address, payment method, shipping region, billing entity, account country, or reseller restriction.
- Expected arbitrage gap after the supplied FX rate table.
- Source URLs and rendered evidence that should support or disqualify each claim.

## Metrics

Primary metrics:

- Price extraction accuracy: at least 97% of visible prices should match human labels.
- Currency accuracy: at least 99% of extracted currencies should match rendered evidence.
- Comparable-unit accuracy: at least 95% agreement on billing period, quantity, seat basis, or package terms.
- Arbitrage recall: at least 90% of human-labeled high-gap opportunities should be found.
- Arbitrage precision: at least 90% of high or medium opportunities should remain valid after review.
- Caveat recall: at least 95% of material eligibility, tax, fee, availability, and bundle caveats should be flagged.
- Evidence validity: 100% of reported opportunities should include source URL, market, city, device, timestamp, and evidence text.
- FX auditability: 100% of normalized prices should cite the exact user-supplied rate table and date.

Secondary metrics:

- Correct separation of desktop, mobile, city, and country observations.
- Correct classification of SERP-only versus fetched-page evidence.
- Captcha and bot-protection detection rate.
- JavaScript rendering success rate.
- Duplicate product or plan resolution accuracy.
- Time saved versus manual VPN and spreadsheet review.
- Reviewer usefulness score for the generated Markdown brief.

## Manual Review Rubric

Score each report from 1-5:

- Targeting: Are country, city, device, and language settings explicit and separate?
- Price accuracy: Do observed prices and currencies match the rendered evidence?
- Comparability: Are units, bundles, billing periods, and availability handled correctly?
- Normalization: Is FX math transparent and based only on the supplied rate table?
- Caveats: Are taxes, fees, eligibility limits, account-region rules, shipping limits, and quote-only cases called out?
- Evidence quality: Can a reviewer reproduce every claim from source URLs and captured text?
- Restraint: Does the report avoid telling users to bypass regional rules or make unsupported purchase recommendations?
- Actionability: Are high-confidence opportunities easy to triage by target, market, gap, and caveat?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-confidence opportunity relies only on SERP text.
- Every opportunity has at least two comparable market observations.
- Every normalized price cites the FX rate used.
- Every caveat that could invalidate practical arbitrage is visible in the opportunity row.
- No report recommends evading taxes, regional terms, licensing, or fulfillment restrictions.

## Automated Checks

Run after every arbitrage report:

- JSON schema validation for targets, observations, opportunities, rate table, and evidence references.
- Every observation must include target, market country, device, timestamp, source type, source URL, confidence, and raw text.
- Every normalized price must include amount, base currency, source currency, FX rate, and `rates_as_of`.
- Every opportunity must include best observation, reference observation, gap percent, confidence, caveats, and evidence URLs.
- Opportunity gap math must reconcile with normalized amounts within rounding tolerance.
- Units and billing periods must match before an opportunity can be high confidence.
- SERP-only observations cannot produce high-confidence arbitrage opportunities.
- Quote-only, unavailable, or login-gated prices must cap confidence below high.
- Tax and fee uncertainty must appear as a caveat when either market omits clear treatment.
- CSV row counts must reconcile with JSON opportunity counts.
- Markdown summaries must not contain opportunities absent from JSON.

## Failure Modes To Track

- Comparing monthly prices to annual prices without conversion.
- Comparing bundles with different seat counts, feature limits, product quantities, or contract terms.
- Treating VAT-inclusive and tax-exclusive prices as equivalent.
- Ignoring shipping, duties, resort fees, service fees, payment fees, or marketplace seller differences.
- Reporting personalized, cached, cookie-influenced, or login-only pricing as general market pricing.
- Confusing search snippet prices with current fetched-page prices.
- Missing mobile-only discounts or mobile-only checkout caveats.
- Treating captcha pages, country blocks, or empty JavaScript renders as no-price evidence.
- Overstating practical arbitrage when local billing, local payment, local address, or shipping restrictions apply.
- Recomputing normalized prices with live FX rates that differ from the report's supplied rate table.

## Golden Examples

Create fixture runs before implementation:

1. Clean SaaS gap: same monthly plan, clear currencies, no material caveats, high-confidence opportunity.
2. VAT mismatch: lower apparent EU price becomes non-comparable until VAT treatment is labeled.
3. Bundle mismatch: lower price includes fewer seats or lower usage limits and should be capped.
4. SERP stale offer: search snippet advertises discount but fetched page does not confirm it.
5. Mobile-only offer: mobile page displays a lower regional promotional price.
6. Quote-only market: one country has contact-sales pricing and should not produce a numeric gap.
7. Local eligibility caveat: lower price requires local billing address or domestic payment method.
8. Captcha block: rendered challenge prevents extraction and should be classified separately.

Each fixture should include:

- Input target config and rate table.
- Raw SERP result records.
- Rendered page observations and fetch metadata.
- Human labels for price, currency, unit, tax, fee, availability, and caveats.
- Expected opportunity list and confidence caps.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 50-target benchmark completes with no schema failures.
- Price extraction accuracy is at least 97%.
- Currency accuracy is at least 99%.
- Arbitrage precision is at least 90% for high and medium opportunities.
- Material caveat recall is at least 95%.
- Evidence validity is 100%.
- All normalized prices are tied to the supplied FX rate table.
- Median review time for a 20-target, 8-market scan is under 60 minutes.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
