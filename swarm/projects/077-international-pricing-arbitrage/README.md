# International Pricing Arbitrage Tracker

Idea 77 is an international pricing arbitrage tracker for teams that need to compare what the same product, subscription, fare, or digital service costs across countries, cities, currencies, languages, and devices. It uses Massive MCP to fetch localized storefronts and search results, normalize observed prices, and surface markets where pricing gaps may create revenue, procurement, or competitive opportunities.

The product is evidence-first. Every arbitrage signal links back to rendered page evidence, search result context, market targeting, device targeting, exchange-rate assumptions supplied by the user, and the extraction prompt result that produced the finding.

## Problem

Global pricing is messy. Vendors show different currencies, taxes, fees, bundles, trial offers, local discounts, and checkout rules depending on shopper location, browser device, language, and search entry point. Teams trying to understand whether a product is cheaper in one market than another usually rely on manual VPN checks, screenshots, spreadsheets, and stale exchange-rate math.

This tracker makes international price comparison repeatable. It gathers country-specific and city-specific evidence, extracts normalized price facts, compares markets on a common basis, and flags likely arbitrage opportunities or pricing inconsistencies for human review.

## Target Users

- Procurement teams checking whether software or marketplace goods are cheaper through local purchasing paths.
- Ecommerce, travel, and subscription operators monitoring regional price parity.
- Competitive intelligence teams studying global packaging and discount strategy.
- Finance and revenue teams auditing tax, fee, and FX-adjusted price dispersion.
- Consumer research and deal-monitoring teams looking for reproducible cross-border price gaps.

## Core Workflow

1. User enters products, vendor domains, target markets, currencies, devices, and comparison rules.
2. App checks `account_status` to estimate crawl volume, rendering cost, and run feasibility.
3. App uses `web_search` with Google SERP parsing to discover localized product pages, country storefronts, pricing pages, and regional offer snippets.
4. App uses `web_fetch` with JavaScript rendering, captcha handling, and country/city/device targeting to capture the pages buyers actually see.
5. App uses `ai_chat_completion` to extract price, currency, billing basis, fees, taxes, discounts, eligibility language, stock or availability, and evidence snippets.
6. App converts extracted prices using user-provided FX rates or a configured rate table, then compares like-for-like offers across markets.
7. User receives an arbitrage dashboard, CSV export, and source-backed brief that separates exact price gaps from policy or fulfillment caveats.

## MVP Inputs

```json
{
  "workspace": "Global Procurement Team",
  "rate_table": {
    "base_currency": "USD",
    "rates_as_of": "2026-05-02",
    "rates": {
      "USD": 1.0,
      "EUR": 1.07,
      "GBP": 1.25,
      "JPY": 0.0064
    }
  },
  "targets": [
    {
      "name": "Example SaaS Pro Plan",
      "vendor": "ExampleSaaS",
      "domain": "example-saas.com",
      "known_urls": ["https://example-saas.com/pricing"],
      "search_queries": ["ExampleSaaS pricing pro plan"],
      "markets": [
        { "country": "us", "city": "New York", "expected_currency": "USD" },
        { "country": "gb", "city": "London", "expected_currency": "GBP" },
        { "country": "de", "city": "Berlin", "expected_currency": "EUR" },
        { "country": "jp", "city": "Tokyo", "expected_currency": "JPY" }
      ],
      "devices": ["desktop", "mobile"],
      "comparison_unit": "seat_month",
      "minimum_gap_percent": 12
    }
  ]
}
```

## MVP Output

```json
{
  "target": "Example SaaS Pro Plan",
  "generated_at": "2026-05-02T19:30:00Z",
  "base_currency": "USD",
  "best_market": {
    "country": "jp",
    "city": "Tokyo",
    "device": "desktop",
    "observed_price": { "amount": 1800, "currency": "JPY", "unit": "seat_month" },
    "normalized_price": { "amount": 11.52, "currency": "USD" },
    "evidence_url": "https://example-saas.com/jp/pricing"
  },
  "reference_market": {
    "country": "us",
    "city": "New York",
    "device": "desktop",
    "observed_price": { "amount": 19, "currency": "USD", "unit": "seat_month" },
    "normalized_price": { "amount": 19.0, "currency": "USD" }
  },
  "arbitrage_gap_percent": 39.4,
  "confidence": "medium",
  "caveats": [
    "Japanese page says the plan is available only for accounts billed in Japan.",
    "Tax inclusion differs between markets and needs reviewer confirmation."
  ],
  "summary": "The Tokyo desktop price appears 39.4% lower than the New York desktop price after user-supplied FX normalization, but local billing eligibility may limit practical arbitrage."
}
```

## Arbitrage Signals

- `regional_price_gap`: normalized price difference exceeds the target threshold.
- `device_price_gap`: mobile and desktop show materially different offers in the same market.
- `search_offer_gap`: Google result snippet advertises a price or discount not visible on the fetched page.
- `currency_mismatch`: page country and displayed currency do not align with expectations.
- `tax_fee_caveat`: VAT, sales tax, shipping, service fees, duties, or checkout fees may alter the effective price.
- `eligibility_caveat`: page mentions local billing, residency, address, payment, shipping, or account-region requirements.
- `bundle_mismatch`: plans look similar but include different seats, limits, features, quantities, or terms.
- `availability_caveat`: product is out of stock, waitlisted, blocked, or quote-only in one or more markets.

## Massive MCP Fit

- `web_search`: discover localized URLs, country storefronts, regional offer snippets, coupon pages, and comparison pages.
- Google SERP parsing: capture snippet-visible prices, dates, sitelinks, and local pages that global navigation hides.
- `web_fetch`: fetch JavaScript-heavy pricing pages, ecommerce pages, travel pages, and checkout-adjacent pages.
- Country, city, and device targeting: reproduce what buyers see in each market and detect mobile-only price variation.
- Captcha handling: classify bot challenges separately from missing prices or availability failures.
- `ai_chat_completion`: extract structured price facts, normalize plan/package terms, classify caveats, and generate sourced summaries.
- `account_status`: keep large market sweeps quota-aware before scheduled runs.

## Guardrails

- Do not advise users to evade laws, taxes, licensing restrictions, regional terms, export controls, or payment rules.
- Treat arbitrage as a research signal, not an instruction to transact.
- Never compare prices without preserving market, city, device, timestamp, final URL, rendered status, and evidence text.
- Separate observed prices from normalized prices and from user-supplied FX assumptions.
- Mark confidence low when price depends on personalization, login state, hidden checkout steps, cookies, or dynamic inventory.
- Flag taxes, shipping, duties, service fees, bundles, contract terms, and eligibility restrictions before ranking an opportunity as actionable.

## First Build

Ship a CLI that produces JSON, CSV, and Markdown reports:

```bash
pricing-arbitrage run \
  --config targets.json \
  --rates rates.json \
  --out report.json \
  --csv opportunities.csv
```

Minimum viable UI after CLI validation:

- Target setup form
- Market x device price matrix
- FX-normalized arbitrage leaderboard
- Evidence drawer with fetched page and SERP context
- Caveat and confidence filters
- Exportable procurement or pricing brief
