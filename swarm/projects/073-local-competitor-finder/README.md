# Local Competitor Finder

Idea 73 is a local business directory research tool for founders, marketers, agencies, franchise operators, and local sales teams. Given a business category and city, it uses Massive MCP to discover public businesses from Google SERPs and public websites, then returns a cited competitor directory with names, URLs, services, neighborhoods, positioning, and public review or rating snippets when available.

The tool only uses public web pages, public search results, and publicly visible business directory content. It stays focused on local market research and does not attempt to access restricted sources or infer non-public business data.

## Problem

Local competitor research is repetitive and messy. A user searching for "med spas in Phoenix" or "commercial HVAC contractors in Cleveland" has to jump between map-style results, organic SERPs, individual websites, review pages, service pages, and local directories. Important details such as specialty services, neighborhood focus, business positioning, review themes, and source URLs get lost in tabs and spreadsheets.

Local Competitor Finder turns that process into a reproducible research run. It discovers likely businesses, verifies public websites, extracts visible facts, and produces a compact directory that a human can audit through citations.

## Target Users

- Local founders validating a city or category before launch.
- SEO and paid search agencies building local market maps.
- Franchise and multi-location operators researching expansion markets.
- Sales teams building territory-specific prospect lists.
- Consultants preparing competitive landscape briefs for small businesses.

## Core Workflow

1. User enters a business category, city, country, and optional service or neighborhood filters.
2. App checks `account_status` and estimates search and fetch volume.
3. App uses `web_search` with Google SERP parsing, country/city targeting, and desktop or mobile device targeting to find public business results, local directories, review pages, and business websites.
4. App de-duplicates candidates by normalized business name, domain, phone/location hints when public, and canonical URL.
5. App uses `web_fetch` with JavaScript rendering to fetch public websites, service pages, about pages, location pages, and directory pages.
6. App uses `ai_chat_completion` to extract structured business facts, summarize positioning, identify service focus, and attach source citations.
7. User receives a ranked local competitor directory with evidence, confidence, source freshness, and warnings for unsupported or ambiguous facts.

## MVP Inputs

```json
{
  "query": {
    "category": "med spa",
    "city": "Phoenix",
    "region": "Arizona",
    "country": "us",
    "service_terms": ["laser hair removal", "botox", "facials"],
    "neighborhoods": ["Arcadia", "Scottsdale", "Downtown Phoenix"]
  },
  "discovery": {
    "max_serp_results": 80,
    "max_businesses": 40,
    "country": "us",
    "city": "Phoenix",
    "device": "desktop",
    "include_directories": true,
    "include_review_snippets": true
  },
  "output": {
    "min_confidence": "medium",
    "include_positioning_summary": true,
    "include_source_log": true
  }
}
```

## MVP Output

```json
{
  "run_id": "local-competitor-finder-2026-05-02",
  "category": "med spa",
  "city": "Phoenix, Arizona",
  "summary": "Found 32 likely med spa competitors with public web evidence. Twelve emphasize injectables, nine emphasize laser treatments, and six appear positioned around luxury or wellness experiences.",
  "businesses": [
    {
      "name": "Example Aesthetics",
      "website_url": "https://www.exampleaesthetics.com",
      "directory_urls": [
        "https://example-directory.com/biz/example-aesthetics"
      ],
      "neighborhood": "Arcadia",
      "services": ["Botox", "dermal fillers", "laser hair removal", "facials"],
      "positioning": "Premium aesthetics clinic focused on natural-looking injectable results and personalized treatment plans.",
      "review_signal": {
        "rating": "4.8",
        "snippet": "Public search result snippets mention friendly staff and natural-looking results.",
        "source_url": "https://www.google.com/search?q=example+aesthetics+phoenix"
      },
      "confidence": "high",
      "evidence": [
        {
          "claim": "Offers Botox, fillers, and laser hair removal.",
          "source_url": "https://www.exampleaesthetics.com/services",
          "source_type": "business_website"
        },
        {
          "claim": "Located in Arcadia.",
          "source_url": "https://www.exampleaesthetics.com/contact",
          "source_type": "business_website"
        }
      ]
    }
  ],
  "warnings": [
    "Review snippets are limited to publicly visible search or directory snippets and may be incomplete."
  ]
}
```

## Research Signals

- `business_match`: public source indicates the entity provides the requested category in the target city.
- `official_site_found`: candidate has a likely official website or public profile.
- `service_match`: source page lists one or more requested services.
- `neighborhood_detected`: public page or snippet identifies a neighborhood, district, or service area.
- `positioning_signal`: website copy indicates differentiation such as luxury, affordable, emergency, family-owned, eco-friendly, specialized, or same-day service.
- `review_snippet_found`: public SERP or directory snippet includes visible rating, review count, or review theme.
- `multi_source_confirmation`: two or more public sources support the same business identity or service.
- `ambiguous_entity`: name, location, or domain may refer to multiple businesses.
- `stale_or_closed_signal`: public snippet or page suggests the business is closed, moved, rebranded, or inactive.

## Scoring

Each business receives a 0-100 confidence score:

- 25 points: business category match is clear from an official site or reputable directory.
- 20 points: city or service-area match is clear.
- 15 points: official website or high-quality public profile is found.
- 15 points: services can be extracted from visible source pages.
- 10 points: neighborhood or local service area is identifiable.
- 10 points: positioning summary is supported by source text.
- 5 points: public review or rating snippet is available.

Automatic caps:

- Cap at 80 when no official website is found.
- Cap at 75 when only one public source supports the business.
- Cap at 65 when location is metro-area only or neighborhood is ambiguous.
- Cap at 60 when service details are from SERP snippets only.
- Cap at 50 when the business may be closed, rebranded, or outside the target category.

## Massive MCP Fit

- `web_search`: discover local businesses, directory pages, SERP snippets, service pages, and official websites.
- Google SERP parsing: capture titles, snippets, result ranks, public ratings, review counts, and local-result clues when visible.
- `web_fetch`: fetch public business websites, service pages, contact pages, location pages, and rendered directory pages.
- JavaScript rendering: handle modern local business websites and directory experiences.
- Country, city, and device targeting: reproduce localized search results and mobile-specific local pages.
- Captcha handling: label blocked or challenged pages instead of treating them as missing data.
- `ai_chat_completion`: normalize businesses, extract services, summarize positioning, classify neighborhoods, and produce cited briefs.
- `account_status`: keep high-volume city/category scans quota-aware.

## Guardrails

- Use only public pages, public search result data, and publicly visible snippets.
- Stay within public pages, platform terms, and visible local business information.
- Do not collect customer data, employee personal data, hidden contact details, or non-public review content.
- Keep the product focused on market research, directory building, and source-backed competitor summaries.
- Require citations for business identity, service claims, neighborhood, positioning, ratings, review snippets, and closed-status claims.
- Label AI-generated positioning and review summaries as summaries of public evidence, not definitive claims.
