# Apartment Listing Risk Scorer

Idea 93 is a public apartment listing enrichment and quality-risk scorer. Given a rental listing URL or pasted listing text, it uses Massive MCP to gather public page evidence, compare the listing against market and source signals, and return a renter-friendly report with quality flags, missing details, price context, and scam-risk indicators.

The product is framed around public listing quality and risk signals. It does not investigate private people, infer sensitive traits, identify landlords personally, or encourage confrontation. It helps renters decide whether a listing is complete, consistent, source-backed, and worth further verification through normal rental channels.

## Problem

Rental shoppers often make decisions from sparse, duplicated, or fast-changing listings. A listing can look appealing while hiding common risk signals: copied photos, inconsistent addresses, below-market pricing, pressure language, missing fees, dead property links, or claims that cannot be corroborated on public sources.

Apartment Listing Risk Scorer gives renters and housing teams a structured second look. It enriches a public listing with public web evidence, separates observed facts from uncertainty, and highlights practical next steps such as confirming licensing, touring through the platform, checking official property pages, or asking for fee details.

## Target Users

- Renters comparing apartment listings across marketplaces.
- Relocation teams helping employees screen public rental options.
- Student housing offices educating renters about listing quality.
- Housing nonprofits triaging public listings before referring clients.
- Marketplace trust and safety teams reviewing public listing patterns.
- Property managers checking whether their own public listings are clear and consistent.

## Core Workflow

1. User submits a listing URL, listing text, or a batch of public listing URLs.
2. User chooses country, city, device, and risk sensitivity.
3. App checks `account_status` and estimates fetch, search, and chat cost.
4. `web_fetch` loads the listing page with JavaScript rendering and captcha handling when needed.
5. `ai_chat_completion` extracts structured listing facts: address or area, rent, bedrooms, fees, contact method, availability, photos, amenities, claims, and pressure language.
6. `web_search` runs targeted searches for the address, building name, copied listing text, image captions, platform duplicates, and market rent context.
7. `web_fetch` gathers public corroborating pages such as official property pages, marketplace duplicates, city or building pages, review pages, and current comparable listings.
8. `ai_chat_completion` compares extracted facts against public evidence and produces a quality score, risk score, evidence table, missing-info checklist, and renter-safe next steps.

## MVP Inputs

```json
{
  "listing": {
    "url": "https://example-rentals.com/listing/123",
    "pasted_text": null,
    "claimed_city": "Austin",
    "claimed_country": "us"
  },
  "geo": {
    "country": "us",
    "city": "Austin",
    "device": "desktop"
  },
  "risk_policy": {
    "sensitivity": "medium",
    "market_rent_radius_miles": 3,
    "max_comparable_listings": 12,
    "include_review_sites": true,
    "include_official_property_sites": true,
    "include_marketplace_duplicates": true
  },
  "output": {
    "include_source_log": true,
    "include_search_log": true,
    "include_renter_checklist": true
  }
}
```

## MVP Output

```json
{
  "run_id": "apartment-listing-risk-2026-05-02",
  "listing_url": "https://example-rentals.com/listing/123",
  "summary": "The listing has useful unit details, but several quality gaps need verification: rent appears unusually low for nearby public comparables, the contact flow asks to leave the platform, and the same text appears on multiple domains with different prices.",
  "scores": {
    "listing_quality": 58,
    "scam_risk": 72,
    "confidence": "medium",
    "needs_human_review": true
  },
  "extracted_listing": {
    "claimed_address": "123 Example Ave, Austin, TX",
    "rent": 1350,
    "bedrooms": 2,
    "bathrooms": 1,
    "availability": "immediate",
    "contact_method": "external email",
    "fees_disclosed": ["deposit"],
    "missing_fields": ["application fee", "pet fee", "lease term", "tour process"]
  },
  "risk_signals": [
    {
      "signal": "below_market_rent",
      "severity": "high",
      "explanation": "Nearby public comparables for similar bedroom count appear materially higher.",
      "evidence_urls": ["https://example.com/comparable-a"],
      "confidence": "medium"
    },
    {
      "signal": "duplicate_text_with_variants",
      "severity": "medium",
      "explanation": "Similar listing text appears on multiple public pages with different rent or contact details.",
      "evidence_urls": ["https://example.com/duplicate"],
      "confidence": "medium"
    }
  ],
  "positive_signals": [
    {
      "signal": "official_property_match",
      "explanation": "A public property page appears to match the building name and address.",
      "evidence_urls": ["https://example-property.com/floorplans"],
      "confidence": "high"
    }
  ],
  "market_context": {
    "comparable_count": 9,
    "median_public_comparable_rent": 2050,
    "rent_position": "well_below_comparable_range",
    "caveat": "Comparables are public web listings, not a verified appraisal."
  },
  "renter_checklist": [
    "Confirm the unit through the official property website or leasing office.",
    "Do not send money before a verified tour, signed lease, and normal platform process.",
    "Ask for all fees, lease term, refund policy, and application process in writing."
  ]
}
```

## Signal Categories

- Listing completeness: missing fees, lease terms, availability, floorplan, address, photos, or tour process.
- Consistency: rent, address, unit details, contact method, and availability match across public pages.
- Source corroboration: official property page, reputable marketplace listing, building page, or city/public records where appropriate.
- Price context: listing rent compared with public comparable listings in the same city or neighborhood.
- Duplicate detection: copied text, repeated photos, or materially similar listings across unrelated domains.
- Contact and payment risk: off-platform contact pressure, wire or crypto requests, urgency language, or requests before normal verification.
- Page quality: newly created domains, broken links, sparse page content, unrendered data, or captcha/blocked pages.
- Review context: public review themes about property management or building quality, summarized carefully with citations.

## Massive MCP Fit

- `account_status`: quota preflight and batch-size planning.
- `web_fetch`: fetch listing pages, official property pages, review pages, marketplace duplicates, and comparable listings.
- JavaScript rendering: handle modern rental marketplaces, dynamic floorplan pages, and client-rendered availability widgets.
- Captcha handling: recover public listing pages and marketplace pages when allowed, while labeling unresolved blocks.
- `web_search`: search addresses, building names, quoted listing text, phone or email fragments when present on public pages, and comparable listings.
- Google SERP parsing: preserve rank, snippet, URL, query wording, and location/device context for source lineage.
- Country, city, and device targeting: compare local market results and mobile marketplace variants.
- `ai_chat_completion`: extract listing facts, classify quality signals, compare public evidence, summarize caveats, and generate renter-safe next steps.

## Guardrails

- Analyze public listings and public pages only.
- Do not identify, profile, or investigate private individuals.
- Do not infer protected or sensitive attributes about renters, landlords, neighbors, or property staff.
- Do not accuse a person or company of fraud; report quality and risk signals with evidence and uncertainty.
- Do not encourage doxxing, harassment, or off-platform confrontation.
- Keep every high-risk flag tied to source evidence or mark it as unresolved.
- Present price context as public-web comparison, not a certified valuation.
- Recommend normal renter safety steps: verify through official channels, tour when possible, use written agreements, and avoid pre-verification payments.
