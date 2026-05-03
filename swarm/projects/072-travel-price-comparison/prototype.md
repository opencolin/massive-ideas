# Prototype

## Prototype Goal

Build a lightweight travel price comparison runner that accepts one travel intent, searches from multiple country/city/device profiles, verifies public prices on rendered pages, and outputs a normalized, source-backed comparison table.

The prototype should prove that Massive MCP can observe meaningful public price differences without accounts, payment flows, private inventory, or unsupported claims.

## User Flow

1. User enters a travel comparison request for a hotel, flight, rental car, attraction, package, or local transport product.
2. User selects searcher profiles: country, city, device, language, and preferred currency.
3. System estimates fetch/search cost with `account_status`.
4. System runs localized `web_search` queries and parses Google SERP results for candidate sources.
5. System fetches top candidate pages with `web_fetch`, JavaScript rendering, captcha handling, and matching targeting profiles.
6. System extracts price facts with `ai_chat_completion`.
7. System normalizes prices into a comparison currency, groups comparable offers, and flags caveats.
8. System emits JSON, CSV, and Markdown reports with evidence links and confidence labels.

## Data Model

```ts
type TravelCategory = "flight" | "hotel" | "rental_car" | "attraction" | "package" | "local_transport";

type SearcherProfile = {
  country: string;
  city: string;
  device: "desktop" | "mobile";
  language?: string;
  expected_currency?: string;
};

type TravelIntent = {
  category: TravelCategory;
  origin?: { city: string; country: string };
  destination: { city: string; country: string };
  dates: {
    depart?: string;
    return?: string;
    check_in?: string;
    check_out?: string;
    pickup?: string;
    dropoff?: string;
    visit_date?: string;
  };
  party: {
    adults: number;
    children?: number;
    rooms?: number;
  };
  preferences: string[];
};

type SourceCandidate = {
  searcher_profile: SearcherProfile;
  query: string;
  rank: number;
  title: string;
  url: string;
  snippet?: string;
  serp_price_text?: string;
  source_type: "ota" | "direct_provider" | "metasearch" | "attraction" | "transport" | "unknown";
};

type FetchContext = {
  country: string;
  city: string;
  device: "desktop" | "mobile";
  fetched_at: string;
  final_url: string;
  status_code: number;
  rendered: boolean;
  captcha_status?: "none" | "solved" | "blocked";
};

type TravelOffer = {
  searcher_profile: SearcherProfile;
  source_url: string;
  provider: string;
  product_name: string;
  category: TravelCategory;
  listed_price?: { amount: number; currency: string };
  normalized_total?: { amount: number; currency: string; fx_rate_source: string };
  taxes_fees_status: "included" | "excluded" | "partial" | "unknown";
  availability: "available" | "sold_out" | "unknown";
  cancellation_or_refund?: string;
  comparable_key: string;
  raw_price_text: string;
  confidence: "high" | "medium" | "low";
  context: FetchContext;
  warnings: string[];
};
```

## Pipeline

```ts
async function compareTravelPrices(request) {
  const status = await massive.account_status();
  const estimatedOps =
    request.searcher_profiles.length *
    request.sources.max_results_per_profile *
    2;

  if (!status.ok || status.remaining_credits < estimatedOps) {
    throw new Error("Insufficient Massive MCP credits for travel comparison run");
  }

  const candidates = [];
  for (const profile of request.searcher_profiles) {
    candidates.push(...await discoverSources(request.intent, profile, request.sources));
  }

  const offers = [];
  for (const candidate of rankAndDedupeCandidates(candidates)) {
    const page = await fetchTravelPage(candidate);
    offers.push(...await extractOffers(request.intent, candidate, page));
  }

  return buildComparisonReport(groupComparableOffers(offers));
}
```

## Source Discovery

Use localized queries that include the destination, travel dates, party size, category, and source constraints.

```ts
async function discoverSources(intent, profile, sourceConfig): Promise<SourceCandidate[]> {
  const queries = buildTravelQueries(intent, sourceConfig.include_domains);
  const results = [];

  for (const query of queries) {
    const serp = await massive.web_search({
      query,
      parse_google_serp: true,
      country: profile.country,
      city: profile.city,
      device: profile.device,
      language: profile.language,
      max_results: sourceConfig.max_results_per_profile
    });

    results.push(...serp.results.map((result, index) => ({
      searcher_profile: profile,
      query,
      rank: index + 1,
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      serp_price_text: result.price_text,
      source_type: classifyTravelSource(result.url, result.title)
    })));
  }

  return filterAllowedSources(results, sourceConfig);
}
```

Prioritize first-party providers and reputable OTAs. Downrank coupon pages, SEO listicles, stale blog posts, unavailable products, and sources whose snippets do not match the requested dates or destination.

## Page Fetching

```ts
async function fetchTravelPage(candidate: SourceCandidate) {
  return massive.web_fetch({
    url: candidate.url,
    render_js: true,
    captcha: "auto",
    country: candidate.searcher_profile.country,
    city: candidate.searcher_profile.city,
    device: candidate.searcher_profile.device,
    timeout_ms: 25000,
    extract_main_content: true
  });
}
```

Fetches should not submit payments, log in, create carts, or use saved traveler profiles. If a provider requires interactive checkout to reveal fees, keep the offer but mark fee status as `unknown` or `partial`.

## Extraction Prompt

```ts
async function extractOffers(intent, candidate, page): Promise<TravelOffer[]> {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Extract public travel price offers from rendered page text.",
          "Use only supplied SERP and page content.",
          "Return normalized JSON.",
          "Preserve raw price text for every amount.",
          "Do not invent taxes, fees, availability, cancellation terms, or guarantees.",
          "Mark confidence low when the page needs login, checkout, or hidden filters."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          intent,
          candidate,
          page: {
            final_url: page.final_url,
            title: page.title,
            text: page.text.slice(0, 18000),
            status_code: page.status_code,
            captcha_status: page.captcha_status
          },
          expected_schema: {
            offers: "TravelOffer[]",
            page_warnings: "string[]"
          }
        })
      }
    ]
  });

  return validateTravelOffers(JSON.parse(response.content).offers);
}
```

## Comparison Logic

Comparable offers must match category, destination, dates, party size, and a normalized product key. The product key can be exact property name, flight route plus carrier, rental car class, attraction ticket type, or transport route.

```ts
function groupComparableOffers(offers: TravelOffer[]) {
  const comparable = offers.filter((offer) =>
    offer.availability === "available" &&
    offer.listed_price &&
    offer.confidence !== "low"
  );

  return groupBy(comparable, (offer) => offer.comparable_key);
}

function buildComparisonReport(groups) {
  return Object.entries(groups).map(([key, offers]) => {
    const sorted = offers.sort((a, b) =>
      a.normalized_total.amount - b.normalized_total.amount
    );

    return {
      comparable_key: key,
      best_offer: sorted[0],
      highest_offer: sorted[sorted.length - 1],
      spread_percent: calculateSpreadPercent(sorted),
      offers: sorted,
      warnings: collectGroupWarnings(sorted)
    };
  });
}
```

## Report Format

```text
Travel Price Comparison

Trip: {category and route/destination}
Dates: {date range}
Profiles: {country/city/device list}

Best observed offers
| Product | Lowest | Highest | Spread | Lowest source | Confidence |

All comparable offers
| Profile | Source | Product | Listed price | Normalized total | Fees | Availability | Evidence |

Warnings
{captcha, missing fees, login-only price, mismatch, stale inventory, low confidence}
```

## MVP Implementation Notes

- Store SERP observations and fetched-page observations separately.
- Keep raw displayed currency and normalized comparison currency in different fields.
- Require exact date and party-size evidence where possible.
- Collapse duplicate URLs after canonicalization but preserve profile-specific fetches.
- Run repeat fetches for unexpectedly large spreads before reporting them as high confidence.
- Prefer one comparable category per run in the MVP instead of mixing hotels, flights, cars, and attractions.

## Future Extensions

- FX-rate provider integration and historical exchange-rate snapshots.
- Scheduled price watchlists and threshold alerts.
- Browser-like filter replay for pages where dates and party size require query parameters.
- Destination cost bundle: hotel, flight, transport, attraction, and food estimates by city.
- Price fairness audit mode for recurring country, city, and device comparisons.
