# Evaluation

Goal: prove Regional Ecommerce Availability Checker produces accurate, source-backed product availability reports faster and more consistently than manual VPN, incognito, store-selector, and marketplace checks.

## Test Set

Use 45 benchmark regional availability runs:

- 8 DTC storefronts with country-specific stock, currency, or shipping restrictions.
- 7 marketplaces where seller, variant, and offer-box ownership change by region.
- 6 grocery, pharmacy, or local delivery products with city or postal-code availability.
- 5 electronics or apparel products where color, size, bundle, and model variants are easy to confuse.
- 5 SERP-vs-PDP contradiction cases where snippets show stale prices or in-stock labels.
- 4 pickup-only or store-inventory cases with location selectors.
- 4 mobile-specific cases where inventory widgets or app banners change behavior.
- 3 age-gated, login-gated, captcha-protected, or compliance-restricted products.
- 3 competitor-substitute cases where the target is unavailable but alternatives are visible.

For each benchmark, create human labels:

- Product identity, SKU, GTIN, variant attributes, allowed sellers, and excluded lookalikes.
- Country, city, postal code, language, device, and timestamp.
- Expected product availability state by target.
- Expected price, currency, seller, fulfillment modes, and delivery or pickup promise.
- SERP snippets or shopping modules that should be considered stale or contradictory.
- Restriction text that explains unavailability.
- Competitors or substitutes that should be reported.
- Expected confidence labels and major alerts.

## Metrics

Primary metrics:

- Availability-state accuracy: at least 93% of product-market states match human review.
- Product match precision: at least 96% of confirmed matches are the intended SKU, GTIN, or accepted variant.
- Seller classification accuracy: at least 94% of owned, allowed reseller, unauthorized seller, and competitor classifications match labels.
- SERP contradiction accuracy: at least 90% of stale or contradictory SERP alerts are valid.
- Evidence validity: 100% of final claims include product, region, device, timestamp, source type, and observation ID.
- Time saved: reduce a 20-product by 10-region audit to under 30 minutes of human review.

Secondary metrics:

- Correct price and currency extraction.
- Correct delivery, pickup, backorder, preorder, and region-blocked classification.
- Correct handling of postal-code inventory selectors.
- Correct separation of owned storefront, marketplace, reseller, competitor, and SERP evidence.
- Correct low-confidence handling for login walls, captcha blocks, age gates, and ambiguous variants.
- Credit estimate accuracy versus actual Massive MCP usage.
- Recommendation usefulness against reviewer scores.

## Manual Review Rubric

Score each report from 1-5:

- Product matching: Is the reported product the exact intended SKU or accepted variant?
- Regional fidelity: Are country, city, postal code, language, device, and timestamp preserved on every claim?
- Availability accuracy: Does the report correctly distinguish in stock, out of stock, restricted, pickup-only, delivery-unavailable, preorder, backorder, and unknown states?
- Evidence quality: Can every availability, seller, price, currency, and fulfillment claim be traced to SERP, rendered page, or cart-boundary evidence?
- Contradiction handling: Does the report separate stale SERP claims from rendered PDP or cart evidence?
- Marketplace clarity: Are sellers, resellers, competitors, and unauthorized offers labeled without overclaiming ownership?
- Actionability: Are alerts specific enough for ecommerce operations, merchandising, marketplace, or SEO teams to fix?
- Restraint: Does the report avoid claiming durable inventory, revenue loss, or conversion impact from a point-in-time check?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No required product-market pair has an unsupported availability claim.
- Every market has confidence, timestamp, and evidence IDs.
- SERP, PDP, store selector, marketplace offer, and cart-boundary evidence remain separate.
- Ambiguous variants, login walls, age gates, and collection blocks are flagged instead of forced into confident states.

## Automated Checks

Run after every generated report:

- JSON schema validation for brief, observations, markets, alerts, and final report.
- All availability scores must be integers from 0-100.
- Every observation must include `observation_id`, product label, country, city, device, page type, timestamp, availability state, and confidence.
- Every final product summary must cite one or more evidence IDs.
- Price values must include currency when reported.
- Cart-boundary observations must confirm no order or payment submission occurred.
- SERP observations must not be treated as final purchase eligibility without rendered page or cart-boundary corroboration when available.
- Marketplace seller and fulfillment fields must be explicit or null, never inferred silently.
- Competitor observations must not count toward target product availability.
- CSV row counts must reconcile with JSON observation and alert counts.
- Markdown report tables must include confidence and evidence references.

## Failure Modes To Track

- Counting stale SERP snippets as current product availability.
- Matching the wrong size, color, bundle, model year, pack count, or regional product.
- Treating a reseller listing as owned availability.
- Missing postal-code-specific inventory restrictions.
- Confusing pickup-only availability with shippable availability.
- Treating login, captcha, or age-gated pages as out of stock.
- Merging mobile and desktop observations for the same region.
- Ignoring city-level delivery restrictions inside a country-level page.
- Letting AI summaries cite no observation IDs.
- Overstating revenue, demand, or conversion impact from availability evidence alone.

## Golden Examples

Create fixture runs before implementation:

1. Clear available path: owned PDP is in stock, expected currency is shown, and add-to-cart boundary is reachable.
2. Region-blocked PDP: product page loads but shipping or purchasing is explicitly blocked for the target location.
3. Stale SERP listing: search result claims in stock while rendered PDP says out of stock.
4. Wrong variant: SERP or marketplace result matches the family but not the target size or color.
5. Unauthorized seller: target product is available only through a seller outside the allowed list.
6. Pickup-only market: product is available at local stores but cannot be shipped.
7. Marketplace offer shift: offer-box seller changes between two countries or devices.
8. Collection blocked: captcha, login, or age gate prevents confident availability classification.
9. Competitor substitute: target is unavailable while a monitored substitute is discoverable and in stock.

Each fixture should include:

- Input availability brief.
- Raw parsed SERP observations.
- Rendered PDP, marketplace, store-selector, and cart-boundary evidence.
- Human labels for product, seller, variant, and availability state.
- Expected alerts and confidence labels.
- Expected availability scores or score ranges.
- Claims that must not appear in the final report.

## Launch Criteria

The MVP is ready for first users when:

- 45-run benchmark completes without crashes.
- Availability-state accuracy is at least 93%.
- Product match precision is at least 96%.
- Seller classification accuracy is at least 94%.
- SERP contradiction accuracy is at least 90%.
- Evidence validity is 100%.
- Median human review time is under 30 minutes for a 20-product by 10-region audit.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
