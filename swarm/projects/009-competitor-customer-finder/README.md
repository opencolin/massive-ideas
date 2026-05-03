# Competitor Customer Finder

MVP for finding likely customers of a competitor by mining public case studies, review pages, partner directories, marketplace listings, integration pages, testimonial pages, and implementation stories.

The product is intentionally narrow: given one competitor and an ideal customer profile, return a source-grounded list of named accounts that appear to use, evaluate, integrate with, or publicly discuss that competitor.

## Target User

B2B sales teams, founders, RevOps teams, and competitive intelligence analysts who need credible target account lists without manually searching customer logos, review sites, app marketplaces, agency case studies, and integration directories.

## Core Workflow

1. User enters a competitor:
   - Company name
   - Domain
   - Product category
   - Known review profiles or marketplace pages, if available
2. User enters account filters:
   - Target industry
   - Company size range
   - Geography
   - Excluded segments
   - Signal types to prioritize
3. Finder gathers public signals using Massive MCP:
   - `web_search` for case studies, testimonials, customer pages, review pages, integrations, partner listings, and marketplace entries
   - Google SERP parsing for queries such as `"competitor" "case study"`, `"competitor" "customer"`, and `"competitor" "integration"`
   - `web_fetch` with JS rendering for dynamic review, marketplace, app directory, and integration pages
   - Captcha handling for sources that block normal browsing
   - Country, city, and device targeting when review pages or SERPs vary by region
4. `ai_chat_completion` extracts named accounts, classifies the relationship, scores confidence, and cites evidence.
5. User gets a ranked account list with source links, signal type, confidence, and suggested competitive outreach angle.

## MVP Inputs

```json
{
  "competitor": {
    "name": "ExampleCRM",
    "domain": "examplecrm.com",
    "category": "sales engagement platform",
    "known_sources": [
      "https://examplecrm.com/customers",
      "https://www.g2.com/products/examplecrm/reviews"
    ]
  },
  "filters": {
    "target_industries": ["B2B SaaS", "financial services"],
    "company_size": "50-1000 employees",
    "geo": "United States",
    "exclude": ["agencies", "solo consultants"],
    "priority_signals": ["case_study", "review", "integration"]
  }
}
```

## MVP Output

```json
{
  "competitor": "ExampleCRM",
  "accounts": [
    {
      "company": "Acme Software",
      "domain": "acme.example",
      "relationship": "customer",
      "signal_type": "case_study",
      "confidence": "high",
      "fit_score": 86,
      "evidence": [
        {
          "claim": "Acme Software is featured as an ExampleCRM customer in a case study.",
          "source_url": "https://examplecrm.com/customers/acme-software",
          "source_type": "case_study"
        }
      ],
      "competitive_angle": "Ask whether the sales team has outgrown the workflow described in the case study and lead with migration support.",
      "next_action": "Add to competitive displacement sequence."
    }
  ]
}
```

## Source Types

- Official competitor customer pages and logo walls
- Competitor case studies and testimonial pages
- Review pages with named reviewers or company metadata
- App marketplaces and integration directories
- Partner, agency, and implementation consultant case studies
- Customer blog posts mentioning the competitor
- Public procurement pages, help docs, or status pages that name the competitor

## Scoring Rubric

Fit score is 0-100:

- 35 points: Evidence strength, including official case studies, named reviews, or multiple independent mentions.
- 25 points: ICP fit, including industry, size, geography, and business model.
- 20 points: Relationship clarity, distinguishing customer, evaluator, integration partner, consultant, reseller, and ambiguous mention.
- 10 points: Freshness, preferring signals from the last 18 months.
- 10 points: Outreach usefulness, including a specific competitive angle and plausible buyer context.

Automatic caps:

- Cap at 70 when the relationship is inferred but not directly stated.
- Cap at 60 when only one weak third-party source is available.
- Cap at 50 when the company matches an exclusion.
- Cap at 40 when the source mentions the competitor but not actual usage, evaluation, or integration.

## First Build

Ship as a CLI and local CSV/JSON generator before building a UI:

```bash
competitor-customer-finder find \
  --competitor competitor.json \
  --filters filters.json \
  --out accounts.csv \
  --json accounts.json
```

Minimum viable screens after CLI validation:

- Competitor setup form
- Source discovery preview
- Enrichment job status
- Ranked account table
- Account detail drawer with evidence and competitive angle

## Massive MCP Usage

- `account_status`: preflight available credits and JS rendering access before large runs.
- `web_search`: discover candidate sources across Google SERPs, review sites, marketplaces, and integration directories.
- `web_fetch`: fetch dynamic customer, review, marketplace, and partner pages with JS rendering and captcha handling.
- `ai_chat_completion`: extract structured accounts, normalize company names, classify relationship type, score confidence, and draft source-grounded outreach angles.

## Guardrails

- Never label a company as a customer unless the evidence supports customer, user, buyer, or implementation language.
- Keep relationship labels separate from inference.
- Cite every account-level claim.
- Do not collect personal reviewer contact data.
- Respect robots, gated pages, and source terms.
- Show ambiguity when the source only proves integration compatibility, partnership, or evaluation.
