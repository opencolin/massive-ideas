# Evaluation

Restaurant Menu Pricing Tracker should prove that public menu pages can be scanned repeatedly, normalized into comparable item records, and monitored for city-level price and availability changes. Evaluation focuses on extraction accuracy, source labeling, location targeting, and alert precision.

## Success Criteria

- A user can configure a panel with at least two restaurants, two cities, and four tracked items in under five minutes.
- Every scan calls `account_status` before paid fetch, search, or chat work begins.
- At least one source URL is preserved for every extracted menu item.
- Each fetch records country, city, device, render mode, final URL, captcha state, and timestamp.
- Official, marketplace, search-result, and store-locator sources are labeled separately.
- Price changes are only alerted when the prior and current item match confidence is medium or high.
- City-level reports include restaurant count, source count, extracted item count, price changes, availability changes, and evidence URLs.

## Golden Test Fixtures

Use fixed fixtures before live API regression tests:

1. Official menu page
   - Brand: Shake Shack
   - Query: `Shake Shack menu prices Austin`
   - Target: US, Austin, mobile
   - Expected: official menu source is discovered or accepted from seed URLs; fetched page records JS render and captcha status.
2. Multi-city comparison
   - Brands: two fast-casual chains
   - Targets: US, Austin, mobile and US, Denver, mobile
   - Expected: item records preserve different `market_key` values and reports do not merge prices across cities.
3. Delivery marketplace listing
   - Source type: marketplace
   - Expected: extracted prices are labeled as marketplace evidence and excluded from official-price alerts unless configured.
4. Item rename
   - Prior item: `Cheeseburger`
   - Current item: `Single Cheeseburger`
   - Expected: normalized item match is medium or high only when description, category, and price context support the match.
5. Blocked or captcha page
   - Fetch URL: known protected page
   - Expected: snapshot status is `blocked` or `partial`; scan report still includes completed sources from other restaurants.

## Metrics

Track per scan:

- `scan_completion_rate`: percent of scans that produce at least one market report.
- `source_discovery_success_rate`: percent of restaurant-market pairs with at least one usable source.
- `official_source_rate`: percent of extracted items sourced from official restaurant domains.
- `menu_item_extraction_count`: number of item records extracted by brand and market.
- `price_parse_success_rate`: percent of extracted item records with numeric price and currency.
- `item_match_confidence_distribution`: high, medium, and low match rates for tracked items.
- `alert_precision`: percent of sampled alerts confirmed by source evidence.
- `blocked_fetch_rate`: percent of fetches marked captcha, blocked, failed, or partial.
- `median_scan_latency_ms`: time from scan start to report completion.
- `marketplace_markup_separation_rate`: percent of marketplace prices correctly excluded from official-price comparisons.

## Quality Rubric

Score each scan report from 1 to 5:

- 5: Sources are clearly labeled, menu items are normalized accurately, price changes are evidence-backed, and city-level differences are easy to audit.
- 4: Report is accurate with minor item-matching or categorization gaps that do not affect alerts.
- 3: Report is usable, but several items have low confidence or missing category/detail fields.
- 2: Report mixes source types, over-alerts on weak matches, or loses source URLs for some items.
- 1: Report cannot support reliable menu price comparison.

## Regression Checks

- `account_status` runs before `web_search`, `web_fetch`, and `ai_chat_completion`.
- The same country, city, and device are passed into discovery and fetch calls for a market.
- Search results preserve rank, title, URL, domain, snippet, and SERP feature when available.
- Fetch snapshots preserve requested URL and final URL separately.
- Captcha, blocked, redirected, stale, and partial outputs are visible in the snapshot.
- Raw item name and raw price are never overwritten by normalized values.
- Official and marketplace prices are not merged unless source policy explicitly allows it.
- A failed restaurant source does not erase other completed snapshots in the same market.
- Exported JSON validates against the `ScanReport` and `MenuSnapshot` shapes in `prototype.md`.

## Manual QA Script

1. Create a burger panel with two brands, Austin, Denver, mobile device, and four tracked items.
2. Confirm credit estimate and account status appear before the scan starts.
3. Run source discovery and confirm official menu pages rank ahead of marketplace pages when confidence is higher.
4. Run fetches and confirm render mode, captcha state, final URL, and timestamp are visible per source.
5. Confirm menu item tables show raw name, normalized name, raw price, numeric price, source type, and confidence.
6. Run the scan against a fixture with one known price change and confirm one alert appears.
7. Confirm a low-confidence item match does not trigger a price-change alert.
8. Export JSON and CSV, then verify every item row includes `market_key`, `brand`, `source_url`, and `extraction_confidence`.

## Risks

- Restaurant sites often rely on location pickers, store IDs, embedded ordering providers, or JS-heavy menu widgets.
- Delivery marketplace prices may include markups, promos, fees, or unavailable items that differ from official menu prices.
- Google SERP results vary by time, city, device, and personalization.
- Item names can change without the underlying item changing, causing false positives.
- Menu pages may omit prices until a store is selected.
- Captcha handling and location-specific rendering can make live scans slower or inconsistent.

## Open Questions

- Should the MVP require a specific store location per city or use city-level menu pages where available?
- Should marketplace evidence be used only for availability or also for price tracking with separate alert rules?
- Should item normalization be brand-specific, category-specific, or learned from prior accepted matches?
- Should the scan store screenshots for auditability, or only text evidence to control cost?
- Should users be able to mark an alert as false positive and feed that back into item matching?
