# Founder Email Personalizer

MVP for generating concise founder outreach emails grounded in cited public facts. The product turns a company, founder, and seller context into a personalized email draft with visible evidence, confidence, and a claim-by-claim source trail.

The wedge is narrow: help founder-led sales teams write one high-quality first-touch email without manually researching company pages, founder interviews, launch posts, funding news, hiring pages, and recent product updates.

## Target User

Founders, first sales hires, agencies, and boutique consultants who send low-volume, high-relevance outbound emails and need every personalization line to be verifiable.

## Core Workflow

1. User enters seller context:
   - What they sell
   - Ideal buyer
   - Pain points solved
   - Proof points
   - Tone preference
   - Call to action
2. User provides a target:
   - Company name
   - Company domain
   - Founder name or role
   - Optional LinkedIn, X/Twitter, Crunchbase, or news URL
3. Researcher gathers public facts using Massive MCP:
   - `web_search` for founder, company, launch, funding, interview, podcast, hiring, and product signals
   - Google SERP parsing for snippets, dates, sitelinks, People Also Ask, and source ranking
   - `web_fetch` with JS rendering for company sites, blogs, careers pages, changelogs, press pages, and founder-authored posts
   - Country/city/device targeting when results differ by market
   - Captcha handling when public pages block normal fetches
4. `ai_chat_completion` extracts source-grounded facts, classifies relevance, and drafts email variants.
5. User reviews a draft with citation chips attached to each personalization claim.

## MVP Inputs

```json
{
  "seller": {
    "company": "Acme Analytics",
    "offer": "Revenue analytics for founder-led B2B SaaS teams",
    "ideal_buyer": "Technical founders between seed and Series B",
    "pain_points": [
      "manual board reporting",
      "unclear expansion signals",
      "messy CRM and billing data"
    ],
    "proof_points": [
      "cuts monthly reporting prep from 2 days to 2 hours",
      "connects Stripe, Salesforce, HubSpot, and warehouse data"
    ],
    "tone": "warm, concise, peer-to-peer",
    "cta": "ask for 15 minutes next week"
  },
  "target": {
    "company_name": "ExampleCo",
    "domain": "example.com",
    "founder_name": "Sam Lee",
    "founder_role": "CEO",
    "known_urls": [
      "https://example.com/blog/series-a"
    ]
  },
  "research_depth": "standard",
  "country": "US",
  "city": "San Francisco",
  "device": "desktop"
}
```

## MVP Output

```json
{
  "target": {
    "company_name": "ExampleCo",
    "founder_name": "Sam Lee",
    "confidence": "high"
  },
  "public_facts": [
    {
      "fact_id": "f1",
      "claim": "ExampleCo announced a Series A to expand its enterprise analytics product.",
      "source_url": "https://example.com/blog/series-a",
      "source_type": "official_blog",
      "published_at": "2026-03-12",
      "relevance": "funding and go-to-market expansion"
    }
  ],
  "email": {
    "subject": "ExampleCo's enterprise push",
    "body": "Sam - saw ExampleCo's Series A note about expanding the enterprise analytics product. Congrats.\n\nUsually when founder-led teams make that shift, board reporting and expansion visibility start taking more founder time than they should.\n\nAcme helps teams connect Stripe, CRM, and warehouse data so monthly reporting takes hours instead of days.\n\nWorth a quick 15 minutes next week?",
    "citation_map": [
      {
        "text": "Series A note about expanding the enterprise analytics product",
        "fact_id": "f1"
      }
    ]
  },
  "alternates": [
    {
      "angle": "hiring-trigger",
      "subject": "scaling the revenue stack",
      "body": "..."
    }
  ],
  "risk_flags": [],
  "run_log": []
}
```

## Personalization Rubric

Each candidate fact is scored 0-100:

- 30 points: Source quality, preferring official company pages, founder-authored posts, reputable news, podcasts, and primary filings.
- 25 points: Buyer relevance, meaning the fact naturally connects to the seller's value proposition.
- 20 points: Freshness, preferring facts from the last 180 days.
- 15 points: Specificity, favoring concrete launches, quotes, hires, funding, partnerships, customer segments, or product changes.
- 10 points: Founder connection, favoring facts tied to the founder's own words or responsibilities.

Automatic caps:

- Cap at 60 when the fact is from a generic company profile only.
- Cap at 50 when the fact is older than two years and no current corroborating source exists.
- Cap at 40 when the fact cannot be tied to the target company with high confidence.
- Exclude facts that require private, gated, sensitive, or personal contact data.

## First Build

Ship as a CLI and local JSON/Markdown generator before building UI:

```bash
founder-email-personalizer draft \
  --seller seller.json \
  --targets founders.csv \
  --out emails.md \
  --json out.json
```

Minimum viable screens after CLI validation:

- Seller profile setup
- Target import table
- Research progress log
- Evidence review panel
- Email editor with citation chips
- Export to markdown, CSV, or CRM sequence draft

## Massive MCP Usage

- `account_status`: preflight credits and feature access before a batch run.
- `web_search`: discover founder-specific and company-specific public facts.
- `web_fetch`: fetch official pages and article pages with JS rendering, captcha handling, country/city targeting, and device targeting.
- `ai_chat_completion`: extract normalized facts, rank angles, draft email variants, and enforce citation discipline.

## Guardrails

- Never invent a personalization claim. Every factual line in the email must map to a source.
- Separate public facts from sales inferences.
- Prefer business-relevant facts over personal details.
- Do not collect private email addresses, phone numbers, family information, health details, or other sensitive personal data.
- Show stale, ambiguous, blocked, or low-confidence sources in risk flags.
- Keep the final email short enough to read on mobile in under 30 seconds.
