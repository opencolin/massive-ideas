# M&A Target Scanner

M&A Target Scanner finds credible acquisition targets inside a narrow niche, enriches each company with public signals, and ranks targets by strategic fit, buyer relevance, and evidence quality.

The first version is intentionally narrow: given an acquirer thesis and a niche, produce a sourced short list of private or small public companies that appear active, relevant, and plausibly acquirable enough for human diligence.

## Target User

Primary users:

- Corporate development teams building an initial target universe for a thesis.
- Private equity associates screening fragmented vertical software, services, or data markets.
- Search funders and independent sponsors looking for niche acquisition candidates.
- Strategy teams mapping build, buy, or partner options in an adjacent category.
- Investment bankers preparing buyer-specific market scans.

## Core Workflow

1. User defines a target scan brief:
   - Acquirer or buyer thesis
   - Niche, category, or vertical
   - Geography, company size, and business model constraints
   - Must-have capabilities and exclusion rules
   - Strategic rationale such as product adjacency, customer overlap, geography, or consolidation
2. App checks `account_status` and estimates collection cost.
3. Massive MCP runs:
   - `web_search` with Google SERP parsing for niche vendors, directories, review sites, rankings, funding news, founder interviews, partner pages, and local business results
   - country, city, and device targeting for local or region-specific niches
   - `web_fetch` with JavaScript rendering and captcha handling for company sites, app directories, profile pages, marketplaces, and news articles
   - `ai_chat_completion` to ask sourced market questions, extract candidate companies, normalize records, and explain fit
4. App deduplicates candidates by brand, domain, parent company, and product line.
5. App enriches each candidate with public signals such as positioning, customers, geography, product surface, ownership clues, growth signals, and contact paths.
6. User gets a ranked acquisition-target list with source evidence, confidence, disqualifiers, and exportable JSON, CSV, and Markdown.

## MVP Inputs

```json
{
  "buyer": {
    "name": "Acme Payments",
    "domain": "acmepayments.example",
    "thesis": "Acquire workflow software companies that already serve independent automotive repair shops and could attach payments."
  },
  "niche": "automotive repair shop management software",
  "geo": {
    "country": "us",
    "city": "Denver",
    "device": "desktop"
  },
  "target_profile": {
    "business_models": ["SaaS", "vertical software"],
    "company_stage": ["bootstrapped", "lower-middle-market", "founder-led"],
    "customer_type": "independent and regional auto repair operators",
    "must_have": ["scheduling", "estimates", "invoicing", "shop workflow"],
    "exclude": ["consumer marketplaces", "generic accounting tools", "franchise-only services"]
  },
  "max_targets": 50
}
```

## MVP Output

```json
{
  "niche": "automotive repair shop management software",
  "buyer": "Acme Payments",
  "scan_summary": "The niche contains a mix of long-running shop management systems, newer cloud platforms, and adjacent inspection or customer-communication tools. The highest-fit targets expose invoicing or payment-adjacent workflows and sell directly to independent repair operators.",
  "targets": [
    {
      "name": "Example ShopOS",
      "domain": "exampleshopos.com",
      "target_score": 86,
      "fit_type": "core_platform",
      "strategic_rationale": "Owns shop scheduling, estimates, and invoice workflows where Acme Payments could attach embedded payments.",
      "business_model": "SaaS",
      "geo_fit": "US-focused",
      "ownership_signal": "founder-led inferred from leadership page",
      "traction_signals": ["customer logos", "partner directory presence", "recent product updates"],
      "risks": ["No public employee or revenue estimate found"],
      "evidence": [
        {
          "claim": "Official site positions the product as repair shop management software with estimates and invoicing.",
          "source_url": "https://exampleshopos.com/features",
          "source_type": "fetched_page"
        },
        {
          "claim": "Appears in Google results for auto repair shop management software.",
          "source_url": "https://exampledirectory.com/auto-repair-software",
          "source_type": "serp_result",
          "query": "auto repair shop management software",
          "rank": 4
        }
      ],
      "confidence": "high"
    }
  ],
  "segments": [
    {
      "name": "Core shop management platforms",
      "description": "Systems of record for schedules, repair orders, estimates, invoices, and reporting.",
      "targets": ["Example ShopOS"]
    }
  ],
  "watchlist": [
    {
      "name": "Adjacent Inspection Tool",
      "reason": "Strong customer overlap but narrower product surface than the core acquisition thesis."
    }
  ],
  "source_domains": [
    {
      "domain": "exampledirectory.com",
      "role": "directory",
      "mentions": 8
    }
  ]
}
```

## Target Scoring

Target scores are 0-100:

- 25 points: Niche relevance and fit to required product capabilities.
- 20 points: Strategic fit to the buyer thesis.
- 15 points: Evidence strength from official pages, directories, review pages, news, and sourced AI answers.
- 15 points: Acquisition plausibility signals such as founder-led, bootstrapped, small team, limited funding, or fragmented ownership.
- 10 points: Traction signals such as customer proof, partner ecosystem, job posts, product updates, or recurring search visibility.
- 10 points: Geography and customer-profile fit.
- 5 points: Contactability through public leadership, contact, or partnership paths.

Automatic caps:

- Cap at 70 when the company is strategically relevant but only adjacent to the requested niche.
- Cap at 60 when the candidate appears only in sourced chatbot answers and has no fetched confirmation.
- Cap at 55 when the company looks too large, public, or recently acquired for the target profile.
- Cap at 45 when ownership, product, or geography evidence conflicts with the brief.
- Cap at 35 when the company matches an exclusion rule.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
ma-target-scanner run \
  --brief target-scan.json \
  --out reports/targets.json \
  --csv reports/targets.csv \
  --report-md reports/target-scan.md
```

Minimum viable UI after CLI validation:

- Buyer thesis and niche setup form
- Search plan preview with estimated credits
- Run status by query, AI answer, and fetch stage
- Ranked target table with segment, score, fit type, and confidence
- Target detail drawer with source evidence and risks
- Filters for geography, business model, fit type, and disqualifiers
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: preflight credits and confirm rendering, captcha handling, and search availability.
- `web_search`: discover companies from niche queries, directories, comparison pages, partner pages, review sites, industry lists, and news.
- Google SERP parsing: preserve query, rank, title, snippet, URL, domain, and SERP feature metadata.
- Country, city, and device targeting: localize searches for regional niches and buyer markets.
- `web_fetch`: verify candidate pages, render JavaScript-heavy sites, handle captchas, and extract product, customer, leadership, and contact evidence.
- `ai_chat_completion`: ask sourced niche-market questions, normalize candidate companies, infer strategic fit, identify risks, and synthesize target rationales.

## Guardrails

- Do not imply a company is for sale; label only public acquisition-plausibility signals.
- Do not scrape private contact data, gated databases, or non-public ownership information.
- Separate confirmed evidence from inference, especially ownership and company-size signals.
- Preserve query, rank, prompt, and URL lineage for every target-level claim.
- Keep direct acquisition targets separate from partners, resellers, agencies, and adjacent tools.
- Show disqualifiers rather than silently hiding borderline companies when they may help diligence.
