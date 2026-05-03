# YC Lead Enricher

MVP for turning a YC company URL or batch of company names into an actionable sales lead brief with:

- Fit score
- Buying trigger
- Intro angle
- Evidence links
- Confidence level

The product is intentionally narrow: enrich YC-backed companies for a single seller ICP, then return a ranked lead list that can be reviewed in a spreadsheet or pushed into a CRM.

## Target User

Founder-led sales teams, sales consultants, and agency operators who want to prospect YC companies without manually reading company pages, news, hiring pages, LinkedIn snippets, and founder bios.

## Core Workflow

1. User enters an ICP profile:
   - Product category
   - Best-fit customer traits
   - Disqualifiers
   - Trigger keywords
   - Preferred geography
   - Example good customers
2. User uploads or pastes YC company names, YC URLs, or domains.
3. Enricher gathers public signals using Massive MCP:
   - `web_search` for company, founder, hiring, funding, and product keywords
   - `web_fetch` with JS rendering for company sites, YC pages, pricing pages, careers pages, changelogs, docs, and blogs
   - Google SERP parsing for recent trigger discovery
   - Country/city/device targeting when local SERP differences matter
   - Captcha handling when a source blocks normal browsing
4. `ai_chat_completion` extracts structured facts, scores fit, explains the trigger, and drafts an intro angle with cited evidence.
5. User gets a ranked table and per-company lead brief.

## MVP Inputs

```json
{
  "icp": {
    "seller": "API observability platform",
    "best_fit": [
      "B2B SaaS",
      "developer-facing product",
      "public API or SDK",
      "engineering team hiring backend/platform roles"
    ],
    "disqualifiers": [
      "consumer-only product",
      "pre-launch waitlist with no technical surface",
      "consulting agency"
    ],
    "trigger_keywords": [
      "launch",
      "pricing",
      "SOC 2",
      "API",
      "SDK",
      "hiring platform engineer",
      "enterprise"
    ],
    "geo": "United States"
  },
  "companies": [
    {
      "name": "ExampleCo",
      "domain": "example.com",
      "yc_url": "https://www.ycombinator.com/companies/exampleco"
    }
  ]
}
```

## MVP Output

```json
{
  "company": "ExampleCo",
  "domain": "example.com",
  "fit_score": 82,
  "fit_tier": "high",
  "buying_trigger": "Recently launched an API-heavy enterprise product and is hiring platform engineers.",
  "intro_angle": "Lead with reducing customer-impacting API incidents during the company's enterprise push.",
  "why_now": "The company appears to be moving from early product adoption into larger customer deployments.",
  "evidence": [
    {
      "claim": "Company markets an API and SDK.",
      "source_url": "https://example.com/docs",
      "source_type": "docs"
    },
    {
      "claim": "Hiring backend/platform roles.",
      "source_url": "https://example.com/careers",
      "source_type": "careers"
    }
  ],
  "confidence": "medium",
  "next_action": "Send founder intro email with a specific API reliability observation."
}
```

## Scoring Rubric

Fit score is 0-100:

- 35 points: ICP match, including product type, buyer role, company model, and technical surface.
- 25 points: Buying trigger strength, including launch, funding, hiring, enterprise motion, compliance push, or new market.
- 20 points: Reachability and intro quality, including founder visibility, clear buyer, recent quote, or warm intro path.
- 10 points: Evidence freshness, preferring signals from the last 90 days.
- 10 points: Confidence, based on number and quality of independent sources.

Automatic caps:

- Cap at 60 when no official company source is found.
- Cap at 50 when the company matches a disqualifier.
- Cap at 40 when no buying trigger is found.

## First Build

Ship as a CLI and local JSON/CSV generator before building UI:

```bash
yc-lead-enricher enrich \
  --icp icp.json \
  --companies companies.csv \
  --out leads.csv \
  --json out.json
```

Minimum viable screens after CLI validation:

- ICP setup form
- Company import table
- Enrichment job status
- Ranked leads table
- Lead detail drawer with evidence and suggested intro

## Massive MCP Usage

- `account_status`: preflight available credits and feature access before a batch run.
- `web_search`: find official domains, YC pages, news, funding, hiring, docs, and founder pages.
- `web_fetch`: fetch official pages with JS rendering and captcha handling enabled where necessary.
- `ai_chat_completion`: extract structured company facts and produce fit score, trigger, and intro angle with source-grounded reasoning.

## Guardrails

- Never invent evidence. Every trigger and intro angle must cite at least one fetched or searched source.
- Separate observed facts from model inference.
- Show confidence and missing data.
- Do not scrape private, gated, or personal contact data.
- Keep outreach suggestions relevant to business context, not personal traits.

