# Regional Ecommerce Availability Checker

Regional Ecommerce Availability Checker audits whether ecommerce products are actually discoverable, purchasable, and correctly represented across countries, cities, and devices. It is built for marketplace operators, DTC brands, retail media teams, and ecommerce agencies that need to know where products appear in stock, where they are blocked, and where regional search or PDP messaging disagrees with checkout reality.

The first version is a batch checker: give it products, storefronts or marketplaces, and a geography matrix, then receive a source-backed availability report with stock state, regional restrictions, price/currency signals, delivery promises, and evidence.

## Target User

Primary users:

- Ecommerce growth teams monitoring international product availability.
- Retail operations teams validating regional inventory, pickup, and delivery promises.
- Marketplace sellers checking offer visibility across countries and cities.
- Brands policing unauthorized regional listings, out-of-stock pages, or stale reseller offers.
- Agencies auditing Shopify, Amazon, Walmart, Instacart, Target, grocery, pharmacy, travel retail, and local delivery experiences.

## Core Workflow

1. User creates an availability brief:
   - Product names, SKUs, GTINs, URLs, marketplace IDs, or search queries
   - Storefront or marketplace domains to check
   - Country, city, postal-code, language, and device targets
   - Expected availability, price band, currency, delivery method, and seller constraints
   - Competitors or substitutes to monitor when the target is unavailable
2. App calls `account_status` to estimate credits and confirm the run can complete.
3. Massive MCP collects evidence with:
   - `web_fetch` with JS rendering for product detail pages, store selectors, inventory widgets, and delivery modals
   - country, city, and device targeting to simulate regional browsing contexts
   - captcha handling for protected ecommerce and marketplace pages
   - `web_search` and Google SERP parsing to discover regional product pages, shopping results, and official availability pages
4. App normalizes product availability, price, currency, seller, fulfillment mode, pickup/delivery promise, restriction reason, and evidence.
5. App uses deterministic matching plus `ai_chat_completion` to classify ambiguous product variants, regional restriction language, and seller substitutions with sources.
6. User receives a report with market-level availability scores, product-state tables, blocked-region alerts, stale-listing warnings, screenshots or rendered text evidence, and JSON/CSV/Markdown exports.

## MVP Inputs

```json
{
  "account": {
    "name": "Northstar Gear",
    "domains": ["northstargear.example", "marketplace.example"]
  },
  "products": [
    {
      "label": "Travel Pack Black 35L",
      "sku": "TP-35-BLK",
      "gtin": "00012345678905",
      "canonical_url": "https://northstargear.example/products/travel-pack-black-35l",
      "search_terms": ["Northstar Travel Pack 35L black", "TP-35-BLK"],
      "accepted_variants": ["black", "35L"]
    }
  ],
  "targets": [
    {
      "country": "us",
      "city": "Seattle",
      "postal_code": "98101",
      "language": "en-US",
      "device": "desktop",
      "expected_currency": "USD"
    },
    {
      "country": "ca",
      "city": "Toronto",
      "postal_code": "M5V 2T6",
      "language": "en-CA",
      "device": "mobile",
      "expected_currency": "CAD"
    }
  ],
  "checks": {
    "fetch_canonical_urls": true,
    "search_for_regional_pages": true,
    "verify_add_to_cart_boundary": true,
    "watch_competitor_substitutes": true
  },
  "expectations": {
    "must_be_available": ["us:Seattle"],
    "allowed_unavailable_regions": ["ca:Toronto"],
    "price_band": { "min": 120, "max": 180 },
    "required_fulfillment_modes": ["ship"],
    "allowed_sellers": ["Northstar Gear", "Northstar Official Store"]
  },
  "competitors": [
    {
      "label": "Summit Trail Pack",
      "search_terms": ["Summit Trail Pack 35L"]
    }
  ]
}
```

## MVP Output

```json
{
  "account": {
    "name": "Northstar Gear",
    "domains": ["northstargear.example", "marketplace.example"]
  },
  "summary": "Travel Pack Black 35L is available for Seattle desktop with ship-to-home, but Toronto mobile sees a region-blocked PDP and Google surfaces a stale marketplace listing that claims in-stock CAD pricing.",
  "overall_availability_score": 68,
  "markets": [
    {
      "country": "ca",
      "city": "Toronto",
      "postal_code": "M5V 2T6",
      "device": "mobile",
      "availability_score": 42,
      "status": "restricted",
      "products": [
        {
          "sku": "TP-35-BLK",
          "matched_product": "Travel Pack Black 35L",
          "availability_state": "region_blocked",
          "observed_price": 169,
          "observed_currency": "CAD",
          "seller": "Northstar Official Store",
          "fulfillment_modes": [],
          "restriction_reason": "Ships to US addresses only",
          "evidence_ids": ["obs_ca_toronto_mobile_pdp_001"],
          "confidence": "high"
        }
      ],
      "alerts": [
        {
          "type": "stale_serp_listing",
          "severity": "high",
          "message": "Google result claims in-stock CAD pricing while the rendered PDP blocks Toronto delivery.",
          "evidence_ids": ["obs_ca_toronto_mobile_serp_002", "obs_ca_toronto_mobile_pdp_001"]
        }
      ]
    }
  ]
}
```

## Availability Dimensions

Each observation preserves:

- Product identifier, URL or search query, variant attributes, and match confidence.
- Country, city, postal code, language, device, and collection timestamp.
- Page type: SERP, product detail page, marketplace offer, store selector, cart boundary, policy page, or competitor listing.
- Availability state: in stock, low stock, preorder, backorder, out of stock, region blocked, seller unavailable, pickup only, delivery unavailable, login required, age gated, or unknown.
- Price, currency, taxes or fees when visible, seller, marketplace badge, fulfillment mode, delivery promise, pickup location, and quantity limits.
- Restriction text, page URL, rendered text or screenshot evidence, raw parsed payload lineage, and confidence.

## Scoring

Availability scores are 0-100:

- 25 points: target product is discoverable from regional search or known URLs.
- 20 points: product is in stock or has an explicit valid purchase path.
- 15 points: price, currency, seller, and variant match expectations.
- 15 points: shipping, delivery, or pickup promises are available for the target location.
- 10 points: SERP and rendered PDP claims agree.
- 10 points: competitor or substitute context is captured when the target is unavailable.
- 5 points: evidence completeness and low ambiguity.

Automatic caps:

- Cap at 75 when the product is visible but cannot reach an add-to-cart or store-selection boundary.
- Cap at 65 when availability depends on a third-party seller outside the allowed seller list.
- Cap at 55 when the product match is variant-ambiguous.
- Cap at 45 when SERP snippets claim availability but the rendered PDP contradicts them.
- Cap at 35 when the product is not discoverable and only a manually supplied URL can be checked.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
regional-availability-checker run \
  --brief availability-brief.json \
  --out availability-report.json \
  --csv availability-observations.csv \
  --report-md availability-report.md
```

Minimum viable UI after CLI validation:

- Product and SKU setup form
- Storefront and marketplace domain manager
- Country, city, postal-code, language, and device matrix
- Expected price, currency, seller, and fulfillment controls
- Credit estimate preview
- Run progress by product and market
- Availability heatmap
- Product-state evidence table
- Restriction and stale-listing alert view
- JSON, CSV, and Markdown exports

## Massive MCP Usage

- `account_status`: estimate and confirm credits before regional product checks.
- `web_fetch`: render PDPs, inventory widgets, delivery selectors, cart boundaries, marketplace offers, and policy pages with JavaScript enabled.
- Country, city, and device targeting: simulate local product discovery and availability states.
- Captcha handling: keep ecommerce and marketplace collection resilient.
- `web_search`: discover regional product URLs, shopping results, reseller pages, store availability pages, and policy contradictions.
- Google SERP parsing: preserve product snippets, prices, seller names, shopping modules, organic ranks, and source lineage.
- `ai_chat_completion`: classify ambiguous variants, interpret restriction language, summarize market gaps, and generate recommendations with observation citations.

## Guardrails

- Treat availability as point-in-time evidence, not a durable inventory guarantee.
- Keep SERP claims separate from rendered product-page and cart-boundary evidence.
- Never count a competitor or reseller listing as owned availability unless the seller is allowed.
- Preserve city, postal-code, country, device, and timestamp on every claim.
- Flag login walls, captchas, store selectors, and age gates as collection states rather than silently treating them as unavailable.
- Do not submit orders, payment details, or irreversible checkout actions.
