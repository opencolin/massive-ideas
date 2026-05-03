# Vendor Country Coverage Checker

Vendor Country Coverage Checker researches whether a public vendor appears able to serve a target country based on official documentation, terms, compliance pages, support pages, and pricing or availability pages. It helps procurement, operations, legal intake, revenue, and expansion teams quickly understand whether a vendor is likely viable for a market before deeper review.

This is not legal advice. The product frames every result as public-docs research with citations, confidence, and review flags. It should help teams decide what to verify with counsel, the vendor, or local experts, not replace that verification.

## Target User

Primary users:

- Procurement and vendor management teams checking country availability before outreach.
- Operations teams validating whether a tool can support employees, customers, or data flows in a country.
- Expansion teams screening vendors for market launch readiness.
- Security, privacy, and compliance teams triaging vendor intake questionnaires.
- Sales and partnerships teams checking whether a vendor can support prospects in regulated regions.

## Core Workflow

1. User enters a coverage brief:
   - Vendor name, domain, and optional known docs URLs
   - Target country and optional city
   - Product, plan, or service line to check
   - Coverage dimensions such as service availability, billing, data residency, subprocessors, regulated industry support, sanctions restrictions, tax, support hours, and language
   - Jurisdiction-sensitive exclusions and review concerns
2. App builds a query plan for official public sources first, then reputable secondary sources only when needed.
3. Massive MCP runs:
   - `account_status` to estimate credits and confirm capability access
   - `web_search` with Google SERP parsing for public docs, terms, pricing, compliance, legal, support, country availability, and policy pages
   - country, city, and device targeting to detect localized availability, pricing, and terms pages
   - `web_fetch` with JS rendering for modern docs sites, pricing pages, legal portals, and support centers
   - captcha handling for public pages protected by bot checks
   - `ai_chat_completion` to extract evidence-backed coverage claims and synthesize a conservative answer with sources
4. App normalizes country names, ISO codes, product names, plan names, policy names, and source types.
5. App classifies each coverage dimension as supported, unsupported, restricted, gated, unclear, or not found.
6. User gets a sourced coverage brief with a decision recommendation, confidence, evidence table, and review checklist.

## MVP Inputs

```json
{
  "vendor": {
    "name": "ExamplePay",
    "domain": "examplepay.com",
    "seed_urls": [
      "https://examplepay.com/pricing",
      "https://examplepay.com/legal/terms",
      "https://examplepay.com/legal/privacy"
    ]
  },
  "target_country": {
    "name": "Brazil",
    "iso2": "BR",
    "city": "Sao Paulo"
  },
  "product": "payments API",
  "buyer_context": "US SaaS company selling to Brazilian customers",
  "coverage_dimensions": [
    "country availability",
    "pricing and billing currency",
    "supported payment methods",
    "tax or invoice support",
    "data residency",
    "subprocessors",
    "sanctions or restricted countries",
    "support language and hours"
  ],
  "geo": {
    "country": "br",
    "city": "Sao Paulo",
    "device": "desktop"
  },
  "exclusions": [
    "private contract terms",
    "legal interpretation",
    "non-public customer-only documentation"
  ]
}
```

## MVP Output

```json
{
  "vendor": "ExamplePay",
  "target_country": "Brazil",
  "product": "payments API",
  "generated_at": "2026-05-02T12:00:00Z",
  "not_legal_advice": true,
  "recommendation": "needs_review",
  "summary": "Public docs suggest ExamplePay supports merchants in Brazil for card payments and local billing, but data residency and tax invoice support remain unclear. A vendor confirmation is recommended before procurement approval.",
  "coverage": [
    {
      "dimension": "country availability",
      "status": "supported",
      "confidence": "high",
      "details": "Official availability page lists Brazil as a supported merchant country for the payments API.",
      "evidence": [
        {
          "source_url": "https://examplepay.com/global/availability",
          "source_type": "official_availability",
          "claim": "Brazil is listed as a supported merchant country.",
          "query": "ExamplePay Brazil availability payments API",
          "rank": 1,
          "fetched_at": "2026-05-02T12:00:00Z",
          "geo": { "country": "br", "city": "Sao Paulo", "device": "desktop" }
        }
      ]
    },
    {
      "dimension": "data residency",
      "status": "unclear",
      "confidence": "low",
      "details": "Public privacy and subprocessors pages describe global data transfers but do not state Brazil-specific residency support.",
      "evidence": []
    }
  ],
  "source_inventory": [
    {
      "url": "https://examplepay.com/global/availability",
      "source_type": "official_availability",
      "country_mentions": ["Brazil", "BR"],
      "dimensions_found": ["country availability", "supported payment methods"]
    }
  ],
  "review_checklist": [
    "Ask vendor to confirm Brazil merchant support for the specific product and plan.",
    "Ask whether Brazil data residency is available or required for this use case.",
    "Confirm tax invoice and local billing requirements with internal counsel or tax advisors."
  ],
  "limitations": [
    "Uses public documentation and public search results only.",
    "Does not interpret law or determine regulatory compliance."
  ]
}
```

## Coverage Statuses

- `supported`: official public evidence says the vendor can serve the target country for the requested product or dimension.
- `unsupported`: official public evidence explicitly excludes the target country or dimension.
- `restricted`: service appears available only with limitations, such as excluded industries, sanctions rules, feature gaps, data transfer limits, or reduced functionality.
- `gated`: availability depends on plan, contract, approval, add-on, private beta, sales contact, or account configuration.
- `unclear`: public evidence is mixed, incomplete, stale, or not specific enough for the target use case.
- `not_found`: no relevant public evidence was found after the configured search and fetch budget.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
vendor-country-check run \
  --brief coverage-brief.json \
  --out coverage.json \
  --csv coverage.csv \
  --report-md coverage.md
```

Minimum viable UI after CLI validation:

- Coverage brief setup form
- Vendor source discovery preview
- Credit estimate and run status
- Coverage dimension table with status and confidence filters
- Source drawer for every claim
- Public-docs limitations banner
- Review checklist editor
- Export buttons for Markdown, JSON, and CSV

## Massive MCP Usage

- `account_status`: preflight remaining credits and estimate run cost.
- `web_search`: discover official availability pages, pricing, terms, privacy policies, DPAs, subprocessors, restricted country lists, support pages, help articles, and localized pages.
- Google SERP parsing: preserve query, rank, title, snippet, URL, result type, and source intent for evidence quality.
- Country, city, and device targeting: compare localized vendor pages, pricing pages, terms, and help center behavior from the target country.
- `web_fetch`: fetch official pages with JS rendering, captcha handling, localization, and main-content extraction.
- `ai_chat_completion`: normalize country and product language, extract coverage claims, detect restrictions and gaps, generate the sourced brief, and keep the disclaimer boundary intact.

## Guardrails

- Do not provide legal advice, compliance certification, or a definitive regulatory determination.
- Prefer official vendor sources over third-party summaries.
- Use `unclear` or `not_found` when public evidence is incomplete; do not infer availability from silence.
- Mark plan-gated, contract-gated, region-gated, beta, and sales-contact requirements clearly.
- Keep product-specific availability separate from general corporate presence in a country.
- Preserve source URL, query, rank, fetch timestamp, geo, device, source type, and extracted claim for every evidence item.
- Treat pricing localization, country pages, and terms pages as potentially product-specific and time-sensitive.
- Never use private customer portals, leaked contracts, personal data, or authenticated-only documents as sources.
