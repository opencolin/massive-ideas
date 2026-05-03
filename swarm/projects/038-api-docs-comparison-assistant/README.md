# API Docs Comparison Assistant

API Docs Comparison Assistant compares public API documentation across vendors, versions, or products and produces a sourced technical diff. It helps developer relations, solutions engineers, platform teams, and buyers understand how APIs differ without manually reading every docs page.

The first version is intentionally narrow: compare two to five public API documentation sites for one use case, with every endpoint, auth, SDK, schema, rate-limit, and webhook claim tied to source evidence.

## Target User

Primary users:

- Developer relations teams maintaining migration guides and competitive docs.
- Solutions engineers answering API-fit questions during technical sales.
- Platform teams evaluating third-party API replacements.
- Product managers tracking competitor API surface area.
- Technical writers keeping public comparison and compatibility pages current.

## Core Workflow

1. User enters a comparison brief:
   - API category or use case
   - Vendors, products, versions, and documentation URLs
   - Capabilities to compare, such as endpoints, auth, pagination, webhooks, SDKs, limits, and error models
   - Geography, city, and device context when docs or pricing are localized
   - Output format and intended audience
   - Claims to avoid, such as private beta features or customer-only docs
2. App plans documentation discovery queries for each vendor and capability.
3. Massive MCP runs:
   - `account_status` to check credits and estimate run cost
   - `web_search` with Google SERP parsing to find API references, guides, changelogs, SDK docs, pricing pages, and migration guides
   - `web_fetch` with JS rendering for interactive API references and docs frameworks
   - captcha handling when public docs are protected by bot checks
   - country, city, and device targeting for localized availability, pricing, or compliance details
   - `ai_chat_completion` to extract normalized API facts and generate the comparison with sources
4. App normalizes vendors, docs URLs, versions, endpoint paths, HTTP methods, auth schemes, SDK names, and evidence.
5. AI fills a comparison matrix with exact, equivalent, partial, absent, unknown, deprecated, and gated statuses.
6. User gets Markdown, JSON, and CSV outputs with citations, confidence, migration notes, and review flags.

## MVP Inputs

```json
{
  "category": "transactional email APIs",
  "audience": "platform engineering team",
  "apis": [
    {
      "name": "ExampleMail",
      "domain": "examplemail.com",
      "docs_url": "https://docs.examplemail.com/api",
      "version": "v3"
    },
    {
      "name": "SampleSend",
      "domain": "samplesend.com",
      "docs_url": "https://developers.samplesend.com/reference",
      "version": "2026-01"
    }
  ],
  "capabilities": [
    "send email endpoint",
    "batch send",
    "API key auth",
    "OAuth",
    "webhooks",
    "event types",
    "rate limits",
    "official Node SDK",
    "idempotency keys"
  ],
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "exclusions": ["private beta APIs", "customer-only documentation"]
}
```

## MVP Output

```json
{
  "category": "transactional email APIs",
  "generated_at": "2026-05-02T12:00:00Z",
  "summary": "Both APIs support single-message sending, API key auth, webhooks, and Node SDKs. ExampleMail has explicit idempotency key documentation, while SampleSend requires manual review because the public docs only mention retry behavior.",
  "comparison": [
    {
      "capability": "idempotency keys",
      "normalized_capability": "idempotent request support",
      "apis": {
        "ExampleMail": {
          "status": "exact",
          "details": "Docs describe an Idempotency-Key header for send requests.",
          "confidence": "high",
          "evidence": [
            {
              "source_url": "https://docs.examplemail.com/api/idempotency",
              "source_type": "api_reference",
              "claim": "Send requests accept an Idempotency-Key header.",
              "fetched_at": "2026-05-02T12:00:00Z"
            }
          ]
        },
        "SampleSend": {
          "status": "unknown",
          "details": "Retry guidance exists, but no public idempotency key support was found.",
          "confidence": "low",
          "evidence": []
        }
      }
    }
  ],
  "source_inventory": [
    {
      "api": "ExampleMail",
      "url": "https://docs.examplemail.com/api/idempotency",
      "source_type": "api_reference",
      "capabilities_found": ["idempotency keys"]
    }
  ],
  "migration_notes": [
    "Verify SampleSend idempotency behavior before migrating retry-sensitive send flows."
  ],
  "review_notes": [
    "SampleSend retry documentation may imply server-side deduplication but does not prove it."
  ]
}
```

## Comparison Statuses

- `exact`: public evidence shows the API supports the requested capability directly.
- `equivalent`: public evidence shows a materially similar capability with different naming or shape.
- `partial`: public evidence supports only part of the requested capability.
- `absent`: public evidence explicitly states the capability is unavailable or unsupported.
- `deprecated`: capability exists but is deprecated, version-limited, or replaced.
- `gated`: capability depends on plan, account approval, region, add-on, or access program.
- `unknown`: public evidence is not strong enough to make a claim.

## First Build

Ship as a CLI that writes Markdown, JSON, and CSV:

```bash
api-docs-compare build \
  --brief comparison.json \
  --out comparison.json \
  --csv comparison.csv \
  --markdown comparison.md
```

Minimum viable UI after CLI validation:

- Comparison setup form
- Source discovery preview
- Run status with credit estimate
- Capability matrix with confidence filters
- Source drawer for every comparison cell
- Endpoint and schema diff views
- Migration notes panel
- Export buttons for Markdown, JSON, and CSV

## Massive MCP Usage

- `account_status`: preflight available credits and feature access before a run.
- `web_search`: discover public API references, developer docs, SDK docs, changelogs, migration guides, status pages, pricing pages, and help articles.
- Google SERP parsing: preserve query, rank, title, snippet, URL, and intent for source selection.
- `web_fetch`: fetch docs with JS rendering, captcha handling, and location/device targeting.
- Country, city, and device targeting: detect localized documentation, availability, pricing, compliance, or region-specific endpoints.
- `ai_chat_completion`: normalize API concepts, extract evidence-backed claims, classify capability status, summarize migration impact, and produce final outputs.

## Guardrails

- Never mark a capability as present without public evidence.
- Use `unknown`, not `absent`, when a capability is merely missing from discovered pages.
- Separate official documentation from third-party tutorials, generated SDK references, and blog posts.
- Preserve source URL, query, rank, fetch timestamp, geo, device, docs version, and confidence for every claim.
- Mark deprecated, beta, preview, region-limited, account-gated, and plan-gated capabilities clearly.
- Do not compare private customer-only docs, leaked specs, or authenticated dashboard-only API pages.
