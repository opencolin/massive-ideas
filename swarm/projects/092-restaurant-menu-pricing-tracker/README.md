# Restaurant Menu Pricing Tracker

Restaurant Menu Pricing Tracker monitors public menus and delivery marketplace listings to track item availability, menu structure, and price movement by city. It helps restaurant operators, investors, franchise teams, and local-market analysts answer questions like "Are burger prices rising faster in Austin or Denver?" and "Which fast-casual chains changed lunch combo pricing this week?"

The first version focuses on a small panel of restaurant brands, cities, and representative menu items. It uses Massive MCP to discover menu URLs, fetch JS-rendered menu pages, handle captcha or blocking states, compare local device/city views, and summarize observed changes with sourced evidence.

## Target User

Primary users:

- Restaurant operators watching competitor menu and pricing changes.
- Franchise teams comparing local menu consistency across territories.
- Food delivery and marketplace teams tracking city-level offer dynamics.
- Investors and analysts building alternative data around food inflation and restaurant pricing power.
- Local SEO and growth teams validating which menu pages appear in city-specific search results.

## Core Workflow

1. User creates a tracking panel:
   - Restaurant brands or domains
   - Cities and countries
   - Device profile, usually mobile for consumer menu experiences
   - Menu categories and canonical item names
   - Scan frequency and alert threshold
2. App calls `account_status` to estimate run cost and available credits.
3. Massive MCP discovers and validates source pages:
   - `web_search` for city-specific official menus, marketplace pages, and Google SERP local results
   - `web_fetch` for official menu pages with JS rendering, captcha handling, and city/device targeting
   - Optional fetches for delivery marketplaces or store locator pages
4. App extracts structured menu items, prices, modifiers, availability, and source evidence.
5. App normalizes comparable items across restaurants and cities.
6. App stores snapshots and compares the latest run against prior observations.
7. App generates city, brand, and item-level change reports with citations.

## MVP Inputs

```json
{
  "panel_name": "Fast casual burgers - western cities",
  "restaurants": [
    {
      "brand": "Shake Shack",
      "domains": ["shakeshack.com"],
      "seed_queries": ["Shake Shack menu prices {city}"]
    },
    {
      "brand": "Five Guys",
      "domains": ["fiveguys.com"],
      "seed_queries": ["Five Guys menu prices {city}"]
    }
  ],
  "markets": [
    {
      "country": "us",
      "city": "Austin",
      "device": "mobile"
    },
    {
      "country": "us",
      "city": "Denver",
      "device": "mobile"
    }
  ],
  "tracked_items": ["single burger", "fries", "chicken sandwich", "milkshake"],
  "fetch_options": {
    "render_js": true,
    "handle_captcha": true,
    "extract_main_content": true
  },
  "alert_rules": {
    "price_change_pct": 5,
    "new_item": true,
    "removed_item": true
  }
}
```

## MVP Output

```json
{
  "run_id": "menu-prices-2026-05-02-burgers-west",
  "panel_name": "Fast casual burgers - western cities",
  "created_at": "2026-05-02T16:30:00Z",
  "summary": "Austin showed two tracked item price changes across the panel, while Denver was mostly unchanged. Shake Shack's fries increased in Austin and Five Guys had one unavailable milkshake listing.",
  "market_reports": [
    {
      "market_key": "us:austin:mobile",
      "restaurants_checked": 2,
      "menu_sources": 5,
      "items_extracted": 42,
      "price_changes": [
        {
          "brand": "Shake Shack",
          "item": "fries",
          "previous_price": 4.49,
          "current_price": 4.79,
          "change_pct": 6.7,
          "source_url": "https://www.shakeshack.com/menu",
          "confidence": "medium"
        }
      ],
      "availability_changes": [
        {
          "brand": "Five Guys",
          "item": "milkshake",
          "status": "unavailable",
          "source_url": "https://www.fiveguys.com/menu",
          "confidence": "low"
        }
      ]
    }
  ],
  "alerts": [
    {
      "severity": "medium",
      "market_key": "us:austin:mobile",
      "message": "Shake Shack fries crossed the 5% price-change threshold.",
      "evidence_urls": ["https://www.shakeshack.com/menu"]
    }
  ]
}
```

## Tracking Dimensions

Each snapshot preserves:

- Restaurant brand, source URL, final URL, source type, and fetch timestamp.
- Country, city, and device used for every fetch and search request.
- Render mode, captcha status, redirect status, and extraction confidence.
- Menu category, raw item name, normalized item name, description, price, currency, modifiers, sizes, calories when present, and availability.
- Search result rank, title, URL, domain, snippet, and SERP feature when discovery uses Google parsing.
- Change reason, old value, new value, percent change, and evidence URL for every alert.
- Source lineage showing whether an observation came from official pages, search snippets, marketplace pages, or chatbot synthesis.

## First Build

Ship as a small CLI plus JSON report generator:

```bash
menu-pricing-tracker scan \
  --panel fixtures/burger-west.json \
  --out reports/latest.json
```

Minimum viable UI:

- Panel setup form for brands, cities, devices, tracked items, and alert thresholds.
- Account status and estimated-credit panel before scans.
- Source discovery table with official, marketplace, and local SERP candidates.
- Per-city menu snapshot table with item normalization confidence.
- Price and availability change feed grouped by city and brand.
- Evidence drawer showing raw fetched excerpts, SERP snippets, and extraction notes.
- JSON and CSV exports for downstream analysis.

## Massive MCP Usage

- `account_status`: estimate scan cost and block scans that would exceed available credits.
- `web_search`: discover official menu pages, city-specific menu pages, marketplace listings, and local Google SERP features.
- `web_fetch`: fetch menu pages with JS rendering, captcha handling, country/city/device targeting, final URL tracking, and structured text extraction.
- `ai_chat_completion`: normalize messy menu item names, classify menu categories, summarize changes, and produce sourced analyst notes.
- Chatbot answers with sources: create city-level explanations only when backed by preserved fetch or search URLs.

## Guardrails

- Keep official, marketplace, and search-snippet evidence separate.
- Do not treat delivery-marketplace prices as official restaurant prices without labeling source type.
- Mark taxes, fees, discounts, delivery markups, bundles, and limited-time offers separately from base menu price.
- Preserve raw item names and raw prices before normalization.
- Label blocked, captcha, stale, redirected, location-mismatched, and partial extractions clearly.
- Avoid alerting on price changes when the item match confidence is low.
- Store every target country, city, device, URL, timestamp, and request option used for reproducibility.
