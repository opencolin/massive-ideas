# TAM Proxy Builder

TAM Proxy Builder turns a market hypothesis into a sourced, auditable total addressable market proxy by combining company counts, hiring demand, and search-volume intent signals. It is for cases where a perfect market-size report is unavailable, stale, too expensive, or too broad to guide a specific product wedge.

The first version is intentionally narrow: estimate relative TAM for one ICP, one geography, and one product category using public web evidence that can be inspected and refreshed.

## Target User

Primary users:

- Founders validating whether a specific ICP is large enough for a venture-scale wedge.
- GTM teams prioritizing segments, regions, or verticals before list building.
- Investors pressure-testing market maps and founder-provided TAM claims.
- Product marketers sizing category demand before positioning or SEO investments.

## Core Workflow

1. User enters a TAM brief:
   - Product category or problem
   - Target buyer and ICP filters
   - Geography
   - Company-size bands
   - Hiring-signal keywords
   - Search-demand keywords
   - Exclusions and known false positives
2. App expands the brief into query plans for company discovery, job posts, category pages, directories, and search-intent proxies.
3. Massive MCP runs:
   - `account_status` to estimate available credits before the run
   - `web_search` with Google SERP parsing for company-count, directory, hiring, and search-intent queries
   - country, city, and device targeting for localized markets
   - `web_fetch` with JS rendering for directories, job pages, vendor pages, and market pages
   - captcha handling for pages that block normal browsing
   - `ai_chat_completion` to normalize entities, classify relevance, and synthesize proxy assumptions with sources
4. App deduplicates companies, domains, job postings, source domains, and keyword clusters.
5. AI estimates proxy TAM bands from evidence, weighting company counts, job demand, search demand, and confidence.
6. User gets a ranked TAM proxy model, source trail, assumptions table, and exportable brief.

## MVP Inputs

```json
{
  "market": "AI receptionist software for dental practices",
  "buyer": "multi-location dental practice owners and operations leaders",
  "geo": {
    "country": "us",
    "city": "Austin",
    "device": "desktop"
  },
  "company_filters": {
    "industries": ["dental practice", "dental service organization"],
    "size_bands": ["1-10 locations", "11-50 locations", "51+ locations"],
    "exclude": ["veterinary clinics", "medical billing companies"]
  },
  "hiring_keywords": ["front desk", "patient coordinator", "scheduler", "call center"],
  "search_keywords": ["dental answering service", "AI dental receptionist", "dental appointment scheduling software"],
  "pricing_assumption": {
    "annual_acv_low": 2400,
    "annual_acv_high": 12000
  }
}
```

## MVP Output

```json
{
  "market": "AI receptionist software for dental practices",
  "tam_summary": "The strongest proxy signal is hiring demand for front-desk and scheduling roles across dental practices, supported by directory-visible practice counts and localized search intent around answering services. Search volume appears more service-oriented than AI-specific, so AI-readiness confidence is medium.",
  "tam_proxy": {
    "estimated_accounts_low": 2200,
    "estimated_accounts_mid": 6400,
    "estimated_accounts_high": 11500,
    "annual_revenue_low": 5280000,
    "annual_revenue_mid": 46080000,
    "annual_revenue_high": 138000000,
    "confidence": "medium"
  },
  "signals": [
    {
      "name": "Company count",
      "proxy_value": 6400,
      "weight": 0.45,
      "confidence": "medium",
      "evidence": [
        {
          "claim": "Directory and SERP results show a large set of dental practices matching the target geography and industry.",
          "source_url": "https://example.com/dental-directory",
          "source_type": "fetched_page",
          "query": "site:example.com dental practices Austin",
          "rank": 2
        }
      ]
    },
    {
      "name": "Hiring demand",
      "proxy_value": 0.31,
      "weight": 0.35,
      "confidence": "high",
      "evidence": [
        {
          "claim": "Front-desk and scheduling roles appear repeatedly in job SERPs for the ICP.",
          "source_url": "https://example.com/jobs/front-desk-dental",
          "source_type": "serp_result",
          "query": "dental practice front desk jobs Austin",
          "rank": 4
        }
      ]
    },
    {
      "name": "Search demand",
      "proxy_value": "medium",
      "weight": 0.2,
      "confidence": "medium",
      "evidence": [
        {
          "claim": "Search results cluster around answering services, scheduling software, and AI receptionist terms.",
          "source_url": "https://example.com/dental-answering-service",
          "source_type": "serp_result",
          "query": "AI dental receptionist software",
          "rank": 1
        }
      ]
    }
  ],
  "assumptions": [
    {
      "name": "Attach rate",
      "value": "12-28% of matching accounts",
      "rationale": "Proxy assumes only practices with meaningful call volume, hiring pain, or multi-location complexity are near-term buyers."
    }
  ],
  "gaps": [
    "Public search evidence does not provide exact company counts by location count.",
    "Search-volume proxies need calibration against a paid keyword-volume source before board-level use."
  ]
}
```

## TAM Proxy Scoring

Each TAM estimate includes a 0-100 evidence score:

- 30 points: Relevant company-count coverage from directories, SERPs, maps-like pages, industry associations, review sites, or public lists.
- 25 points: Hiring-demand evidence from job posts, role frequency, repeated pain keywords, and geographic distribution.
- 20 points: Search-demand evidence from SERP density, keyword variety, commercial intent, and category maturity.
- 15 points: ICP fit, exclusion handling, and deduplication quality.
- 10 points: Freshness, source diversity, and country/city/device relevance.

Automatic caps:

- Cap at 70 when search demand is strong but company-count evidence is weak.
- Cap at 65 when company-count evidence is strong but hiring and search signals are absent.
- Cap at 55 when most evidence comes from generic publisher pages rather than inspectable company, job, or directory sources.
- Cap at 40 when the market phrase has unresolved ambiguity or exclusion leakage.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
tam-proxy build \
  --brief tam-brief.json \
  --out tam-proxy.json \
  --csv signals.csv \
  --brief-md tam-proxy.md
```

Minimum viable UI after CLI validation:

- TAM brief setup form
- Query plan preview with credit estimate
- Run status by signal type
- Signal table with evidence and confidence
- TAM model with editable assumptions
- Sensitivity view for attach rate and ACV
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate run cost and confirm credit availability.
- `web_search`: collect Google SERPs for company-count queries, job-post queries, directories, search-intent queries, and market-language discovery.
- Google SERP parsing: preserve query, intent, rank, title, snippet, URL, and visible result type for every signal.
- `web_fetch`: fetch directories, job postings, association pages, company pages, category pages, and high-ranking commercial pages with JS rendering.
- Captcha handling: recover evidence from sources that block basic fetches, especially job boards and directories.
- Country, city, and device targeting: compare local TAM surfaces and mobile-heavy service categories.
- `ai_chat_completion`: classify relevance, extract counts, normalize company names, identify false positives, infer assumptions, and generate the final sourced model.

## Guardrails

- Label all outputs as proxy estimates, not definitive TAM.
- Keep company-count, hiring, and search-demand evidence separate before synthesis.
- Preserve query, rank, prompt, fetched URL, and timestamp for every claim.
- Show assumptions and sensitivity ranges instead of a single precise number.
- Do not scrape private databases, gated reports, personal contact data, or sites disallowed by policy.
- Never treat a chatbot answer as evidence unless it cites sources or is confirmed by fetched pages.
- Make exclusion leakage visible when the market phrase overlaps with unrelated sectors.
