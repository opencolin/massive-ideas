# Evaluation

Goal: prove the Competitor Pricing Tracker reliably detects material pricing differences across countries and devices without inventing unsupported changes.

## Test Set

Use 30 competitor pricing pages:

- 10 simple static pricing pages with visible monthly and annual prices
- 8 JS-rendered pricing pages with toggles, tabs, or plan cards
- 5 localized pricing pages with currency or country-specific copy
- 4 mobile layouts where pricing content differs from desktop
- 3 difficult pages with custom pricing, captcha friction, or image-heavy pricing

For each page, create a human-labeled benchmark:

- Canonical pricing URL
- Expected plans and prices
- Expected currency and billing period
- Expected country/device differences
- Known discounts, trials, or plan limits
- Expected confidence level

## Metrics

Primary metrics:

- Price extraction accuracy: at least 95% of visible prices correctly extracted with currency and billing period.
- Change precision: at least 90% of emitted material changes are human-confirmed.
- Localization coverage: at least 90% of country/device combinations produce a usable snapshot or a clear blocked status.
- Evidence validity: 100% of alerts include source URL, crawl context, and raw extracted text.

Secondary metrics:

- Recall of known plan additions, removals, and price changes.
- False positive rate from cosmetic copy changes.
- Stability across two repeated fetches of the same market and device.
- Median run cost per competitor x market x device snapshot.
- Median time from scheduled run start to alert delivery.

## Manual Review Rubric

Score each detected change from 1-5:

- Accuracy: Did the detected before/after values actually change?
- Materiality: Would a pricing, sales, or marketing team care?
- Context: Does the alert specify country, city, device, billing basis, and page URL?
- Evidence: Is the raw source text sufficient to verify the claim quickly?
- Actionability: Does the summary suggest a concrete next step?

A change is MVP-acceptable when:

- Average reviewer score is at least 4.
- No exact price, plan name, or discount is unsupported by source text.
- The alert can be verified from the linked evidence in under 60 seconds.

## Automated Checks

Run after every monitor batch:

- JSON schema validation for every snapshot and change.
- Price amounts must be numeric when present.
- Currency must be ISO-like or explicitly marked unknown.
- Every snapshot must include country, device, fetched timestamp, final URL, and confidence.
- Every change must compare snapshots with matching competitor, country, city, and device.
- High-confidence price changes require raw text for both previous and current values.
- Delta percent must be present for numeric price changes.
- Alerts for custom quote pages must not invent a numeric amount.

## Failure Modes To Track

- Treating annual/monthly toggle changes as price changes when billing period changed.
- Confusing per-seat, per-month, and flat-rate pricing.
- Extracting crossed-out anchor prices instead of active offer prices.
- Missing pricing hidden behind tabs, accordions, geolocation, or mobile-specific sections.
- Reporting personalized or A/B tested copy as a durable competitor change.
- Losing localized context when final URL redirects to a global page.
- Over-alerting on punctuation, layout, or marketing copy changes.

## Golden Fixtures

Create five fixtures before implementation:

1. Static page with three plans and monthly prices.
2. JS-rendered page where prices appear only after render.
3. Country-localized page with USD, GBP, and EUR variants.
4. Desktop/mobile page with different visible trial messaging.
5. Custom enterprise pricing page where no numeric price should be extracted.

Each fixture should include rendered text excerpts, expected normalized snapshots, expected change output, and unacceptable claims.

## Launch Criteria

The MVP is ready for first users when:

- A 30-page benchmark completes without crashes.
- Price extraction accuracy is at least 95%.
- Material change precision is at least 90%.
- Every alert includes evidence URL and crawl context.
- Repeated same-day runs produce no more than 3% noisy duplicate alerts.
- Estimated credits and actual run cost are shown before and after each run.

