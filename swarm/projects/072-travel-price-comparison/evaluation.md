# Evaluation

## Evaluation Objective

Evaluate whether the travel price comparison prototype can find public travel offers, capture localized prices across countries and cities, normalize comparable offers, and explain observed spreads without inventing unavailable fees or guarantees.

## Success Criteria

- Finds relevant public sources for the requested travel category, destination, dates, and party size.
- Captures rendered page content consistently across selected country, city, and device profiles.
- Extracts visible price, currency, source, availability, and fee status with source evidence.
- Separates displayed price from normalized comparison currency.
- Groups only genuinely comparable offers.
- Flags low-confidence conditions such as login-only prices, checkout-only fees, captcha friction, redirects, stale snippets, or missing date confirmation.
- Produces JSON, CSV, and Markdown output that a reviewer can verify quickly.
- Avoids bookings, payment flows, credential use, private inventory, and claims that a price is guaranteed.

## Test Set

Use 40 travel comparison cases:

- 10 hotel searches across major destination cities with multiple searcher countries.
- 8 flight searches with route, dates, carriers, and fare-class differences.
- 6 rental car searches where taxes and pickup locations vary.
- 6 attraction or tour ticket searches with adult and child pricing.
- 4 city transport searches with localized ticket pages.
- 3 mobile-specific cases where visible price or layout differs from desktop.
- 3 difficult cases with captcha friction, unavailable dates, login-only discounts, or checkout-only fees.

For each case, create a human-labeled benchmark:

- Search intent and exact query parameters.
- Searcher country, city, device, language, and expected currency.
- Accepted source domains and source types.
- Expected comparable product names or product keys.
- Expected visible price range and currency.
- Whether taxes and fees are included, excluded, partial, or unknown.
- Expected confidence level and warnings.

## Metrics

Discovery quality:

- Relevant source recall against human-labeled candidate sources.
- First-page useful SERP result rate.
- Duplicate URL rate after canonicalization.
- Irrelevant source rate for blogs, coupons, unavailable inventory, or wrong dates.

Extraction quality:

- Price extraction accuracy for visible amounts and currencies.
- Availability classification accuracy.
- Taxes and fees status accuracy.
- Cancellation or refund term extraction accuracy where visible.
- Unsupported claim rate for fees, discounts, or guarantees.

Comparison quality:

- Comparable grouping precision: offers grouped together are truly the same travel product and date context.
- Spread calculation accuracy after normalization.
- High-confidence spread precision after repeat fetch validation.
- Rate of false regional difference claims caused by currency conversion, date mismatch, room type mismatch, fare class mismatch, or stale inventory.

Usefulness:

- Median time for a reviewer to verify the best observed offer.
- Human clarity rating for Markdown reports.
- CSV usefulness for analysts.
- Warning usefulness for low-confidence or incomplete results.

Safety:

- Account login attempt count should be zero.
- Payment or booking submission count should be zero.
- Private inventory access count should be zero.
- Unsupported guarantee count should be zero.

## Manual Review Rubric

Score each comparison report from 1-5:

- Relevance: Do sources match the requested category, destination, dates, and party?
- Accuracy: Are visible prices, currencies, and availability extracted correctly?
- Comparability: Are compared offers truly like-for-like?
- Evidence: Can each price be verified from source URL, raw text, and crawl context?
- Caveats: Are missing fees, login-only prices, and volatile availability labeled clearly?
- Actionability: Does the report make it easy to identify the best observed source and next verification step?

An MVP report is acceptable when:

- Average reviewer score is at least 4.
- No exact price or fee claim is unsupported by visible source text.
- Every high-confidence spread can be reproduced with a repeat fetch or clear source evidence.
- A reviewer can verify the top offer in under 90 seconds.

## Automated Checks

Run after every comparison batch:

- JSON schema validation for every source candidate, fetch observation, and extracted offer.
- Every offer must include country, city, device, timestamp, source URL, confidence, and availability.
- Listed prices must include numeric amount and currency when present.
- Normalized totals must include target currency and FX-rate source when present.
- High-confidence offers must include raw price text.
- High-confidence spread rows require matching destination, date, party size, and product key.
- Offers with checkout-only fees cannot claim all fees included.
- Login-only or loyalty-only prices cannot be marked high confidence for public comparison.

## Failure Modes To Track

- Comparing different room types, fare classes, pickup locations, ticket tiers, or date ranges.
- Treating SERP snippet prices as verified page prices without fetch confirmation.
- Confusing per-night, per-stay, per-person, per-room, per-day, and round-trip prices.
- Reporting taxes included when the page only shows a base fare or nightly rate.
- Missing prices hidden behind JavaScript, accordions, map views, mobile layouts, or consent banners.
- Overstating a localized difference that is only currency conversion.
- Losing searcher context after redirecting to a global page.
- Treating unavailable inventory as a valid low price.
- Failing to preserve captcha or blocked-page status.

## Golden Fixtures

Create six fixtures before implementation:

1. Hotel page with total price, nightly price, taxes included, and cancellation text.
2. Flight page with one-way and round-trip fares plus baggage caveat.
3. Rental car page with base rate, taxes, pickup location, and vehicle class.
4. Attraction ticket page with adult and child prices.
5. Localized OTA page showing different currencies for the same hotel stay.
6. Login-only discount page where no public comparable price should be reported as high confidence.

Each fixture should include rendered text excerpts, SERP snippet data, expected normalized offers, expected warnings, and unacceptable claims.

## Launch Criteria

The MVP is ready for first users when:

- A 40-case benchmark completes without crashes.
- Visible price extraction accuracy is at least 92%.
- Comparable grouping precision is at least 90%.
- High-confidence spread precision is at least 90%.
- Every reported offer includes source URL, crawl context, raw price text, and confidence.
- Repeated same-day runs produce stable results or clear volatility warnings.
- Estimated and actual Massive MCP usage is shown before and after each run.
