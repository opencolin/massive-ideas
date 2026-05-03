# Used Car Listing Verifier

Idea 96 is a public listing and market research assistant for used cars. Given a vehicle listing URL or pasted listing text, it checks the public claims in the listing against visible marketplace pages, dealer pages, VIN-style public records when supplied by the user, reviewable vehicle history snippets, and comparable active listings. It then explains whether the asking price looks high, fair, or low for the advertised vehicle, trim, mileage, condition, geography, and market context.

The product is not a private investigation tool. It does not identify private sellers, infer hidden personal details, bypass paywalls, or search non-public records. It focuses on the public facts shown in a listing and the public market evidence a careful buyer would review before contacting a seller.

## Problem

Used car listings are full of claims that are easy to misread: trim names, option packages, accident language, rebuilt-title hints, mileage, dealer fees, "below market" badges, stale price drops, and photos that do not match the description. Buyers need a fast way to turn scattered public pages into a grounded research brief.

Used Car Listing Verifier gathers the public evidence, separates listing facts from seller claims, finds comparable vehicles in the same market, and explains the price in plain language with citations.

## Target Users

- Used car shoppers comparing listings before a test drive.
- Marketplace operators improving listing quality and buyer trust.
- Auto lenders and warranty providers checking public listing consistency.
- Dealer groups auditing their own inventory pages for pricing and data errors.
- Consumer advocates building public-market explainers.
- Fleet buyers researching regional used vehicle availability.

## Core Workflow

1. User submits a public listing URL, listing text, or marketplace result page.
2. User optionally adds VIN, ZIP or city, max travel radius, target budget, and must-have features.
3. App checks `account_status` and estimates search, fetch, rendering, and chat cost.
4. Massive MCP uses `web_fetch` with JavaScript rendering and captcha handling to capture the listing page, dealer page, and visible marketplace details.
5. `ai_chat_completion` extracts structured listing claims: year, make, model, trim, mileage, price, location, title language, fees, options, photos, and seller disclaimers.
6. `web_search` finds comparable active listings and public pricing references using country, city, and device targeting.
7. Google SERP parsing preserves rank, snippet, URL, and marketplace diversity for comparable listings.
8. `web_fetch` collects comparable listing details, visible price history, dealer disclaimers, and public vehicle data pages when relevant.
9. `ai_chat_completion` normalizes comps, scores claim consistency, identifies missing or suspicious public signals, and writes a buyer-friendly market-price explanation.

## MVP Inputs

```json
{
  "listing": {
    "url": "https://example-dealer.com/used/Toyota/2022-Toyota-Camry-XSE",
    "pasted_text": null,
    "vin": "OPTIONAL_USER_SUPPLIED_VIN",
    "asking_price_usd": 26995,
    "zip_or_city": "Sacramento, CA"
  },
  "buyer_context": {
    "country": "us",
    "city": "Sacramento",
    "device": "desktop",
    "search_radius_miles": 150,
    "budget_usd": 28000,
    "must_have_features": ["hybrid", "clean title"],
    "avoid": ["rental history", "rebuilt title"]
  },
  "research_policy": {
    "max_comps": 18,
    "freshness_days": 30,
    "include_dealer_pages": true,
    "include_marketplaces": true,
    "include_public_history_snippets": true,
    "exclude_private_person_lookup": true
  },
  "output": {
    "include_source_log": true,
    "include_comp_table": true,
    "include_questions_for_seller": true
  }
}
```

## MVP Output

```json
{
  "run_id": "used-car-listing-verifier-2026-05-02",
  "listing_summary": {
    "vehicle": "2022 Toyota Camry XSE Hybrid",
    "asking_price_usd": 26995,
    "mileage": 41200,
    "location": "Sacramento, CA",
    "seller_type": "dealer",
    "listing_status": "active_public_listing"
  },
  "verdict": {
    "market_position": "slightly_high",
    "confidence": "medium",
    "estimated_fair_range_usd": [24500, 26500],
    "explanation": "The asking price is about 5-10% above the strongest local comps after adjusting for mileage and trim. The listing may still be reasonable if the hybrid trim, options, and condition are confirmed."
  },
  "claim_checks": [
    {
      "claim": "XSE Hybrid trim",
      "status": "supported_by_listing",
      "evidence_urls": ["https://example-dealer.com/used/Toyota/2022-Toyota-Camry-XSE"],
      "notes": "Listing title, description, and photo badges are consistent."
    },
    {
      "claim": "Clean title",
      "status": "needs_confirmation",
      "evidence_urls": [],
      "notes": "The public listing says clean title, but no source fetched in this run independently confirms title status."
    }
  ],
  "market_comps": [
    {
      "vehicle": "2022 Toyota Camry XSE Hybrid",
      "price_usd": 25490,
      "mileage": 43800,
      "distance_miles": 42,
      "source_url": "https://example-marketplace.com/listing/123",
      "match_quality": "high",
      "adjustment_notes": "Same trim, similar mileage, same region."
    }
  ],
  "buyer_questions": [
    "Can the seller provide a current title report or vehicle history report?",
    "Are advertised fees included in the listed price or added at signing?",
    "Can the seller confirm the hybrid battery warranty status?"
  ],
  "source_summary": {
    "listing_sources_fetched": 2,
    "comparable_sources_fetched": 16,
    "js_rendered_pages": 9,
    "captcha_challenges_handled": 1,
    "public_sources_only": true
  }
}
```

## Market Position Labels

- `well_below_market`: price is materially below close comps; flag possible stale listing, hidden condition issue, title issue, or aggressive pricing.
- `slightly_below_market`: price is below similar public comps after reasonable mileage, trim, and location adjustment.
- `fair_market`: price sits within the local comparable range.
- `slightly_high`: price is above close comps but may be explainable by condition, options, warranty, or scarcity.
- `well_above_market`: price is materially above comps without public evidence that explains the premium.
- `insufficient_public_data`: public sources are too sparse, stale, contradictory, or non-comparable.

## Massive MCP Fit

- `account_status`: budget preflight for search, fetch, rendering, captcha, and chat calls.
- `web_fetch`: capture public listing pages, dealer inventory pages, marketplace details, fee disclosures, and visible history snippets.
- JavaScript rendering: handle modern auto marketplaces, dealer inventory widgets, dynamic photo galleries, and hidden-in-tab details.
- Captcha handling: recover public marketplace and dealer pages that challenge automated access while recording unresolved blocks.
- `web_search`: discover comparable active listings, pricing references, dealer duplicates, and public listing mirrors.
- Google SERP parsing: preserve query, rank, snippet, URL, marketplace, city, device, and freshness signals.
- Country, city, and device targeting: compare local availability and detect mobile-only or localized listing variants.
- `ai_chat_completion`: extract vehicle facts, normalize trims and options, cluster comparable listings, explain price drivers, and draft seller questions with source citations.

## Guardrails

- Use only public listing, marketplace, dealer, manufacturer, and user-supplied data.
- Do not identify, profile, or investigate private sellers beyond the public listing content.
- Do not infer personal information, addresses, ownership, finances, or intent.
- Do not bypass paywalls, login-only databases, or restricted vehicle-history systems.
- Treat VIN as user-supplied research context; do not use it to pursue private records.
- Cite every claim check and comparable price.
- Distinguish seller claims from independently supported public evidence.
- Flag stale, removed, duplicated, sponsored, or geographically distant comps.
- Explain uncertainty plainly when title, accident, maintenance, or condition data is missing.
