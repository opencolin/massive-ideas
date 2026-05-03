# Feature Comparison Table Generator

Feature Comparison Table Generator turns public documentation, pricing pages, product pages, and comparison pages into a sourced feature matrix for a defined set of vendors. It helps product marketers, sales teams, founders, and analysts build accurate battlecards and buyer-facing comparison tables without manually reading every docs page.

The first version is intentionally narrow: compare a small vendor set for one product category, with every cell grounded in public evidence and labeled by confidence.

## Target User

Primary users:

- Product marketers building competitive pages and battlecards.
- Sales enablement teams answering buyer feature questions.
- Founders validating where their product is differentiated.
- Analysts comparing product capabilities, packaging, and public claims.
- SEO and GEO teams creating evidence-backed alternatives and comparison content.

## Core Workflow

1. User enters a comparison brief:
   - Category or use case
   - Vendors and domains
   - Feature areas to compare
   - Geography, city, and device context
   - Output format and audience
   - Exclusions or claims to avoid
2. App plans source discovery queries for each vendor and feature area.
3. Massive MCP runs:
   - `account_status` to check credits and estimate run cost
   - `web_search` with Google SERP parsing to find docs, pricing pages, help articles, and comparison pages
   - `web_fetch` with JS rendering for public docs, pricing tables, product pages, and feature pages
   - captcha handling when vendor docs or pricing pages block normal browsing
   - country, city, and device targeting for localized packaging, currency, or feature availability
   - `ai_chat_completion` to extract normalized features and generate the final comparison with sources
4. App normalizes vendors, pages, feature names, plans, regions, and evidence.
5. AI fills a feature matrix with supported, unsupported, partial, unknown, and plan-gated statuses.
6. User gets a Markdown, CSV, and JSON comparison table with citations, confidence, and review notes.

## MVP Inputs

```json
{
  "category": "customer support help desk software",
  "audience": "B2B SaaS product marketers",
  "vendors": [
    { "name": "ExampleDesk", "domain": "exampledesk.com" },
    { "name": "SampleSupport", "domain": "samplesupport.com" },
    { "name": "AcmeHelp", "domain": "acmehelp.example" }
  ],
  "features": [
    "AI agent",
    "shared inbox",
    "knowledge base",
    "SLA management",
    "Salesforce integration",
    "SOC 2",
    "usage-based pricing"
  ],
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "plans_to_track": ["free", "starter", "pro", "enterprise"],
  "exclusions": ["private contract terms", "customer-only beta features"]
}
```

## MVP Output

```json
{
  "category": "customer support help desk software",
  "generated_at": "2026-05-02T12:00:00Z",
  "summary": "All three vendors publicly describe shared inbox and knowledge base capabilities. AI agent availability differs by plan and has medium confidence because two vendors use broad AI language without specific automation limits.",
  "comparison": [
    {
      "feature": "AI agent",
      "vendors": {
        "ExampleDesk": {
          "status": "supported",
          "availability": "Pro and Enterprise",
          "notes": "Public pricing page lists AI agent as included on Pro.",
          "confidence": "high",
          "evidence": [
            {
              "source_url": "https://exampledesk.com/pricing",
              "source_type": "pricing_page",
              "claim": "AI agent is included on Pro and Enterprise.",
              "fetched_at": "2026-05-02T12:00:00Z"
            }
          ]
        },
        "SampleSupport": {
          "status": "partial",
          "availability": "Enterprise",
          "notes": "Docs mention AI suggestions, but no autonomous agent workflow was found.",
          "confidence": "medium",
          "evidence": []
        }
      }
    }
  ],
  "source_inventory": [
    {
      "vendor": "ExampleDesk",
      "url": "https://exampledesk.com/pricing",
      "source_type": "pricing_page",
      "features_found": ["AI agent", "shared inbox", "knowledge base"]
    }
  ],
  "review_notes": [
    "Verify SampleSupport AI terminology manually before using in a public claim."
  ]
}
```

## Feature Statuses

- `supported`: public evidence clearly says the vendor offers the feature.
- `unsupported`: public evidence clearly says the feature is unavailable or absent.
- `partial`: public evidence supports a narrower version of the requested feature.
- `plan_gated`: feature exists but is tied to specific public plans, add-ons, limits, or tiers.
- `region_gated`: feature availability depends on country, city, currency, or compliance region.
- `unknown`: public evidence was not strong enough to make a claim.

## First Build

Ship as a CLI that writes Markdown, CSV, and JSON:

```bash
feature-compare build \
  --brief comparison.json \
  --out comparison.json \
  --csv comparison.csv \
  --markdown comparison.md
```

Minimum viable UI after CLI validation:

- Comparison setup form
- Query and source preview
- Run status with credit estimate
- Feature matrix with confidence filters
- Source drawer for every cell
- Review queue for low-confidence claims
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: preflight available credits and feature access before a run.
- `web_search`: discover public docs, pricing pages, feature pages, help articles, security pages, and vendor comparison pages.
- Google SERP parsing: preserve query, rank, title, snippet, URL, and intent for source selection.
- `web_fetch`: fetch public pages with JS rendering, captcha handling, and location/device targeting.
- Country, city, and device targeting: detect localized pricing, currency, region-gated features, or mobile-specific packaging differences.
- `ai_chat_completion`: normalize feature names, extract evidence-backed claims, classify cell status, summarize gaps, and produce the final matrix.

## Guardrails

- Never fill a comparison cell without either evidence or an explicit `unknown` status.
- Separate official vendor evidence from third-party comparison, review, and listicle evidence.
- Do not infer feature parity from vague marketing language.
- Preserve source URL, query, rank, fetch timestamp, geo, device, and extraction confidence for every claim.
- Mark plan-gated, add-on, beta, deprecated, or region-limited features clearly.
- Avoid private account data, gated customer-only pages, and non-public contract terms.
