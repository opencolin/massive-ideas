# Prototype

## Concept

Deal Finder turns a merchant or product query into a source-backed list of public deals. It uses Massive MCP to search the open web, render candidate coupon pages, extract offer claims, and explain how well each claim is supported.

The prototype is verification-first. It does not attempt to apply codes at checkout, enter accounts, bypass restrictions, or make claims from private or protected surfaces.

## Input Contract

```json
{
  "merchant": "Example Store",
  "category": "running shoes",
  "deal_types": ["promo_code", "sale", "free_shipping"],
  "profiles": [
    {
      "country": "us",
      "city": "San Francisco",
      "device": "desktop"
    },
    {
      "country": "us",
      "city": "New York",
      "device": "mobile"
    }
  ],
  "max_candidates": 8,
  "policy": {
    "scope": "public_coupon_deal_verification",
    "disallowed": [
      "checkout_automation",
      "payment_or_access_control_bypass",
      "authenticated_account_access",
      "private_loyalty_or_referral_abuse",
      "rate_limit_evasion"
    ]
  }
}
```

## Candidate Discovery

Search queries are generated conservatively:

- `{merchant} coupon code`
- `{merchant} promo code {month year}`
- `{merchant} sale {category}`
- `{merchant} free shipping`
- `site:{merchant_domain} promo OR coupon OR sale`

For each `web_search` result, preserve:

- result URL and domain
- title and snippet
- visible date or freshness signal
- whether the result is merchant-owned, publisher/editorial, forum/community, or coupon aggregator
- SERP-only offer claims such as "20% off" or "verified today"

## Rendered Fetch Plan

Each selected candidate receives a `web_fetch` call with JavaScript rendering enabled. Merchant-owned promo pages are prioritized, followed by reputable deal/editorial pages, then coupon aggregators.

Fetch observations include:

- final URL after redirects
- rendered page title and canonical URL
- visible coupon code or "no code needed" sale language
- expiration date or freshness text
- exclusions, minimum order value, category limits, and region limits
- whether content differs by country, city, or device profile
- friction state: consent, captcha, paywall, geoblock, unavailable, timeout, or JS render failure

## Verification Model

```ts
type DealQuery = {
  merchant: string;
  category?: string;
  deal_types: Array<"promo_code" | "sale" | "free_shipping" | "student" | "clearance" | "bundle">;
  profiles: RenderProfile[];
  max_candidates: number;
};

type RenderProfile = {
  country?: string;
  city?: string;
  device: "desktop" | "mobile" | "tablet";
};

type SourceEvidence = {
  url: string;
  domain: string;
  source_type: "merchant" | "coupon_aggregator" | "publisher" | "community" | "serp" | "chatbot";
  observed_via: "web_search" | "web_fetch" | "ai_chat_completion";
  profile?: RenderProfile;
  rendered: boolean;
  observed_at: string;
  friction?: "none" | "consent" | "captcha" | "paywall" | "geoblock" | "unavailable" | "timeout" | "render_failure";
  claims: DealClaim[];
};

type DealClaim = {
  deal_type: "promo_code" | "sale" | "free_shipping" | "student" | "clearance" | "bundle";
  code?: string;
  headline: string;
  discount?: string;
  expiration?: string;
  restrictions: string[];
  freshness_signal?: string;
};

type VerifiedDeal = {
  id: string;
  merchant: string;
  status:
    | "verified_public_evidence"
    | "likely_stale"
    | "unsupported_claim"
    | "region_or_device_specific"
    | "blocked"
    | "inconclusive";
  claim: DealClaim;
  confidence: "high" | "medium" | "low";
  supporting_sources: SourceEvidence[];
  conflicting_sources: SourceEvidence[];
  notes: string[];
};
```

## Execution Flow

1. Validate that the request is for public coupon/deal verification.
2. Call `account_status` and estimate the needed `web_search`, `web_fetch`, and `ai_chat_completion` volume.
3. Generate search queries from merchant, category, deal type, date, and public merchant domain when available.
4. Run `web_search` and parse Google results into candidate sources.
5. Rank candidates by source type, freshness, merchant relevance, and claim specificity.
6. Fetch top candidates with JS rendering for the requested profile set.
7. Normalize offer claims from rendered observations and SERP snippets.
8. Compare claims across sources:
   - matching code and current merchant page evidence raises confidence.
   - expired or missing rendered evidence lowers confidence.
   - profile-specific visibility marks region/device specificity.
   - captcha, paywall, geoblock, or unavailable pages mark blocked evidence.
9. Use `ai_chat_completion` to produce a concise, evidence-bounded deal report.
10. Export `deals.json`, `trace.jsonl`, and `report.md`.

## Output Example

```json
{
  "query": {
    "merchant": "Example Store",
    "category": "running shoes"
  },
  "observed_at": "2026-05-02T12:00:00Z",
  "summary": "Found 2 source-backed public deals and 3 unsupported coupon claims.",
  "deals": [
    {
      "id": "deal_001",
      "merchant": "Example Store",
      "status": "verified_public_evidence",
      "confidence": "high",
      "claim": {
        "deal_type": "sale",
        "headline": "Up to 30% off selected running shoes",
        "discount": "up to 30%",
        "restrictions": ["selected styles only"]
      },
      "supporting_sources": [
        {
          "url": "https://www.example.com/sale/running-shoes",
          "domain": "example.com",
          "source_type": "merchant",
          "observed_via": "web_fetch",
          "rendered": true,
          "observed_at": "2026-05-02T12:00:00Z",
          "friction": "none",
          "claims": []
        }
      ],
      "conflicting_sources": [],
      "notes": ["Observed on the merchant-owned rendered page for the US desktop profile."]
    }
  ],
  "blocked_sources": [],
  "unsupported_claims": [
    {
      "headline": "50% off with code SAVE50",
      "reason": "Mentioned in a search snippet but not supported by fetched public pages."
    }
  ]
}
```

## Reference Agent Prompt

```text
You verify public coupons and deals from captured web evidence.
Use only public information available through Massive MCP tool results.
Prefer merchant-owned rendered pages when available.
Do not automate checkout, access accounts, bypass payment or access controls, evade merchant restrictions, or infer that a code works without public evidence.
Treat captcha, consent, paywall, geoblock, unavailable pages, and render failures as evidence states to report honestly.
Separate SERP snippet claims from rendered page observations.
Return concise deal cards with status, confidence, source URLs, and notes.
```

## Artifacts

- `deals.json`: normalized verified deal objects and unsupported claims.
- `trace.jsonl`: one Massive MCP call per line with input summary, output summary, profile, and source URLs.
- `report.md`: shopper/editor friendly summary of best supported deals, stale claims, blocked sources, and caveats.
- `sources.csv`: source URL, domain, source type, profile, friction, extracted claim count, and last observed time.
