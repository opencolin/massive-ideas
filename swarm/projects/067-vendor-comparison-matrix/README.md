# Vendor Comparison Matrix Builder

Vendor Comparison Matrix Builder turns public vendor websites, docs, pricing pages, review pages, and search results into a sourced decision matrix for B2B software evaluation. It helps operators, procurement teams, founders, consultants, and RevOps leaders compare vendors on capabilities, pricing, trust, fit, and risk without manually stitching together dozens of browser tabs.

The first version is deliberately practical: a user provides a buying scenario, vendors, and scoring criteria; the app produces an evidence-backed matrix with weighted scores, citations, confidence, and review flags.

## Target User

Primary users:

- Procurement and operations teams creating vendor shortlists.
- RevOps, GTM, and IT leaders comparing SaaS tools.
- Founders evaluating infrastructure, growth, and AI vendors.
- Consultants preparing client recommendation decks.
- Product marketers monitoring competitive positioning.
- Analysts converting public vendor research into structured diligence.

## Core Workflow

1. User enters a comparison brief:
   - Category, use case, and buying context
   - Vendors, domains, and optional seed URLs
   - Criteria groups and weights
   - Geography, city, and device context
   - Output format and scoring preferences
   - Deal-breakers, exclusions, and claims to avoid
2. App checks Massive MCP access and estimates credits.
3. App plans evidence discovery across official and third-party sources.
4. Massive MCP runs:
   - `account_status` to confirm credits and feature availability
   - `web_search` with Google SERP parsing for pricing, docs, reviews, security pages, and alternatives pages
   - `web_fetch` with JS rendering for pricing tables, dynamic docs, integration directories, and public trust pages
   - captcha handling when vendor or review pages require browser-like access
   - country, city, and device targeting for localized pricing, availability, compliance, and page variants
   - `ai_chat_completion` to extract claims, normalize criteria, score cells, summarize tradeoffs, and draft the final recommendation
5. App ranks and deduplicates sources by vendor, evidence type, freshness, and authority.
6. App fills a weighted matrix with scores, rationale, citations, and confidence.
7. User receives Markdown, CSV, JSON, and deck-ready summary outputs.

## MVP Inputs

```json
{
  "category": "customer data platforms for B2B SaaS",
  "buyer_context": "Series B SaaS company with 40-person GTM team",
  "vendors": [
    { "name": "ExampleCDP", "domain": "examplecdp.com" },
    { "name": "Northstar Data", "domain": "northstardata.example" },
    { "name": "SignalHub", "domain": "signalhub.example" }
  ],
  "criteria": [
    {
      "group": "Capabilities",
      "items": [
        { "name": "warehouse-native sync", "weight": 0.16 },
        { "name": "identity resolution", "weight": 0.12 },
        { "name": "reverse ETL destinations", "weight": 0.12 }
      ]
    },
    {
      "group": "Commercial fit",
      "items": [
        { "name": "transparent pricing", "weight": 0.12 },
        { "name": "startup-friendly packaging", "weight": 0.08 }
      ]
    },
    {
      "group": "Trust and operations",
      "items": [
        { "name": "SOC 2 evidence", "weight": 0.12 },
        { "name": "implementation support", "weight": 0.10 },
        { "name": "public uptime or status page", "weight": 0.08 }
      ]
    }
  ],
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "scoring": {
    "scale": 5,
    "unknown_policy": "penalize_lightly",
    "prefer_official_sources": true
  },
  "deal_breakers": ["no SOC 2 evidence", "no Salesforce destination"],
  "exclusions": ["private discounts", "unverified review snippets"]
}
```

## MVP Output

```json
{
  "category": "customer data platforms for B2B SaaS",
  "generated_at": "2026-05-02T12:00:00Z",
  "recommendation": "ExampleCDP leads on implementation support and public trust evidence. SignalHub is strongest on warehouse-native capabilities but needs manual pricing confirmation.",
  "rankings": [
    {
      "vendor": "ExampleCDP",
      "weighted_score": 4.18,
      "confidence": "high",
      "best_for": "Teams that value documented implementation support and clear security evidence.",
      "risks": ["Pricing depth is limited on public pages."]
    }
  ],
  "matrix": [
    {
      "criteria_group": "Capabilities",
      "criterion": "warehouse-native sync",
      "weight": 0.16,
      "vendors": {
        "ExampleCDP": {
          "score": 4,
          "status": "strong",
          "rationale": "Docs describe warehouse sync patterns and supported destinations.",
          "confidence": "high",
          "evidence": [
            {
              "source_url": "https://examplecdp.com/docs/warehouse-sync",
              "source_type": "official_docs",
              "claim": "Warehouse sync is documented with supported destination coverage.",
              "fetched_at": "2026-05-02T12:00:00Z"
            }
          ]
        }
      }
    }
  ],
  "source_inventory": [
    {
      "vendor": "ExampleCDP",
      "url": "https://examplecdp.com/docs/warehouse-sync",
      "source_type": "official_docs",
      "criteria_supported": ["warehouse-native sync"]
    }
  ],
  "review_notes": [
    "Confirm SignalHub pricing with sales because public pricing evidence was incomplete."
  ]
}
```

## Cell Statuses

- `strong`: public evidence clearly supports a strong fit for the criterion.
- `adequate`: evidence supports the criterion, but with limits, narrower scope, or missing depth.
- `weak`: evidence suggests limited fit or a material gap.
- `unknown`: public evidence was not strong enough to score confidently.
- `deal_breaker`: evidence indicates the vendor fails a required criterion.
- `conflict`: official, third-party, or regional evidence disagrees and needs review.

## First Build

Ship as a CLI that writes Markdown, CSV, and JSON:

```bash
vendor-matrix build \
  --brief vendor-comparison.json \
  --out vendor-comparison.output.json \
  --csv vendor-comparison.matrix.csv \
  --markdown vendor-comparison.md
```

Minimum viable UI after CLI validation:

- Brief builder with vendor, criterion, weight, and deal-breaker controls
- Credit estimate and source discovery preview
- Run status grouped by vendor and source type
- Weighted matrix with filters for confidence, source type, and status
- Source drawer for every cell
- Review queue for unknown, conflict, and deal-breaker cells
- Export buttons for Markdown, CSV, JSON, and recommendation summary

## Massive MCP Usage

- `account_status`: preflight credits and feature access.
- `web_search`: discover official pages, pricing pages, docs, security pages, review pages, partner directories, and alternatives pages.
- Google SERP parsing: preserve query, rank, snippet, URL, and source intent for evidence scoring.
- `web_fetch`: fetch JS-rendered pricing tables, docs, review pages, app marketplaces, and trust centers.
- Captcha handling: recover public pages that block normal scripted fetches.
- Country, city, and device targeting: identify local packaging, compliance wording, price display, and page variants.
- `ai_chat_completion`: normalize criteria, extract claims, score cells, explain tradeoffs, identify conflicts, and generate buyer-ready summaries.

## Guardrails

- Do not score a vendor above unknown without inspectable public evidence.
- Separate official vendor evidence from review sites, analyst pages, and third-party comparisons.
- Do not treat missing public evidence as proof of weakness unless the criterion explicitly depends on public availability.
- Preserve URL, query, rank, fetch timestamp, geo, device, source type, and confidence for every cited claim.
- Flag conflicts between pricing pages, docs, review pages, and regional variants.
- Mark public evidence gaps separately from product gaps.
- Keep weighted recommendations explainable enough for a human buyer to challenge each score.
