# Travel Price Comparison by Country and City

Travel Price Comparison by Country and City compares public travel prices across localized search results, OTA pages, airline or hotel direct pages, and city-specific inventory pages. It helps travelers, travel operators, and pricing analysts answer: "What does this trip, stay, or attraction cost when searched from different countries, cities, and devices?"

The product is evidence-first. Every price is tied to the query, country, city, device, rendered page, final URL, timestamp, currency, and source text that produced it.

## Target Users

- Travelers checking whether flights, hotels, tours, car rentals, or attraction tickets vary by search location.
- Travel agencies and metasearch teams auditing localized offers and availability.
- Revenue and market analysts comparing destination pricing by origin market.
- Relocation, conference, and events teams estimating travel costs for multiple cities.
- Consumer advocates monitoring price transparency and regional surcharges.

## Core Workflow

1. User defines a comparison request:
   - Travel category: flight, hotel, rental car, attraction, package, or local transport
   - Origin country and city, destination country and city, dates, party size, and preferences
   - Searcher countries, searcher cities, devices, language, and currency expectations
   - Preferred source domains and excluded marketplaces
2. App checks available quota and feature access with `account_status`.
3. App discovers relevant public sources with `web_search` and Google SERP parsing for each searcher profile.
4. App fetches selected source pages with `web_fetch`, JavaScript rendering, captcha handling, and country/city/device targeting.
5. App uses `ai_chat_completion` to extract normalized prices, fees, availability, cancellation terms, and source-backed caveats.
6. User receives a comparison matrix, lowest credible price by market, observed spreads, evidence links, and warnings.

## MVP Inputs

```json
{
  "trip": {
    "category": "hotel",
    "destination": { "city": "Tokyo", "country": "jp" },
    "dates": { "check_in": "2026-09-14", "check_out": "2026-09-18" },
    "party": { "adults": 2, "children": 0 },
    "preferences": ["4 star", "central", "free cancellation"]
  },
  "searcher_profiles": [
    { "country": "us", "city": "San Francisco", "device": "desktop", "currency": "USD" },
    { "country": "gb", "city": "London", "device": "mobile", "currency": "GBP" },
    { "country": "sg", "city": "Singapore", "device": "desktop", "currency": "SGD" }
  ],
  "sources": {
    "include_domains": ["booking.com", "expedia.com", "hotels.com"],
    "exclude_domains": ["coupon-sites.example"],
    "max_results_per_profile": 8
  }
}
```

## MVP Output

```json
{
  "run_id": "travel-price-comparison-2026-05-02",
  "trip_summary": "Tokyo hotel stay, Sep 14-18 2026, 2 adults",
  "best_observed_offer": {
    "searcher_profile": { "country": "sg", "city": "Singapore", "device": "desktop" },
    "provider": "ExampleHotels",
    "property_or_product": "Example Central Tokyo",
    "total_price": { "amount": 732.4, "currency": "SGD" },
    "normalized_total_usd": 548.1,
    "fees_included": true,
    "evidence_url": "https://example.com/tokyo-hotels"
  },
  "comparison_rows": [
    {
      "searcher_profile": { "country": "us", "city": "San Francisco", "device": "desktop" },
      "provider": "ExampleHotels",
      "property_or_product": "Example Central Tokyo",
      "listed_price": { "amount": 589, "currency": "USD" },
      "normalized_total_usd": 589,
      "availability": "available",
      "fees": "taxes included; resort fee not found",
      "cancellation": "free cancellation before Sep 8",
      "confidence": "high",
      "observed_at": "2026-05-02T17:00:00Z",
      "source_url": "https://example.com/tokyo-hotels"
    }
  ],
  "spread": {
    "highest_usd": 612.8,
    "lowest_usd": 548.1,
    "difference_usd": 64.7,
    "difference_percent": 11.8
  },
  "warnings": [
    "Currency conversion used run-time FX rates supplied by the user or configured provider.",
    "Some providers may personalize prices based on cookies, loyalty status, or inventory changes."
  ]
}
```

## Massive MCP Usage

- `account_status`: preflight quota, feature availability, and expected cost for source discovery and rendered fetches.
- `web_search`: discover public travel result pages, direct provider pages, OTA pages, attraction pages, and city-specific price snippets.
- Google SERP parsing: capture localized result ordering, snippets, visible prices, ads-like units, and market-specific landing pages.
- `web_fetch`: fetch public pages with JavaScript rendering, captcha handling, and country/city/device targeting.
- `ai_chat_completion`: normalize price facts, classify fees and cancellation terms, compare offers, and produce source-backed summaries.

## Guardrails

- Never claim a city or country price difference without comparable query parameters and source evidence.
- Separate displayed currency from normalized comparison currency.
- Mark confidence low when price requires login, loyalty membership, hidden filters, checkout-only fees, or unstable availability.
- Preserve targeting metadata: searcher country, city, device, language, timestamp, final URL, render status, and captcha result.
- Do not bypass private access, use credentials, make bookings, submit payment details, or scrape account-only inventory.
- Treat travel availability as volatile; show observation time and avoid implying prices are guaranteed.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown reports:

```bash
travel-price-compare run \
  --config comparison.json \
  --out offers.json \
  --csv offers.csv \
  --report-md report.md
```

Minimum viable UI after CLI validation:

- Trip and destination setup form
- Searcher country, city, device, language, and currency controls
- Provider/domain inclusion and exclusion controls
- Comparison matrix by source and searcher profile
- Evidence drawer with SERP snippets, rendered text, source URLs, and fetch metadata
- Warnings for low confidence, missing fees, captcha friction, or inconsistent availability
