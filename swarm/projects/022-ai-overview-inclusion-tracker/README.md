# AI Overview Inclusion Tracker

AI Overview Inclusion Tracker monitors whether your brand, competitors, and priority sources appear in Google AI Overview-style results and chatbot answers for the commercial queries that matter. It turns answer-engine visibility into a repeatable report with citations, share of answer, competitor comparisons, and concrete content actions.

The first version is intentionally narrow: track one brand against a small competitor set across a defined query list, then report inclusion, citations, sentiment, position, and missing-source opportunities.

## Target User

Primary users:

- SEO and content teams measuring answer-engine visibility beyond blue-link rankings.
- Product marketers comparing how AI summaries describe their brand versus competitors.
- Growth teams monitoring category, comparison, and problem-aware queries.
- Agencies reporting AI Overview inclusion trends to clients.
- Founders validating whether their category positioning is visible in AI-generated answers.

## Core Workflow

1. User enters an inclusion-tracking brief:
   - Brand name and domain
   - Competitor names and domains
   - Priority query groups
   - Target country, city, and device
   - Required sources, preferred pages, and exclusion rules
2. App expands the brief into Google queries and grounded chatbot prompts across category, comparison, alternatives, pricing, use case, and problem-aware intent.
3. Massive MCP runs:
   - `account_status` to preflight credits, rendering, and captcha support
   - `web_search` with Google SERP parsing to capture AI Overview presence, organic competitors, citations, and SERP features
   - country, city, and device targeting to compare localized answer inclusion
   - `web_fetch` with JS rendering for cited pages, brand pages, competitor pages, and ranking articles
   - captcha handling for blocked SERPs or source pages
   - `ai_chat_completion` to ask answer-engine style questions with sources and compare answer inclusion outside Google
4. App normalizes brand mentions, domains, citations, answer snippets, sentiment, and rank context.
5. App scores brand visibility against competitors by query group and market.
6. User gets an inclusion dashboard export with evidence, trends, and recommended page/source improvements.

## MVP Inputs

```json
{
  "brand": {
    "name": "Acme Analytics",
    "domain": "acmeanalytics.com"
  },
  "competitors": [
    { "name": "Northstar BI", "domain": "northstarbi.com" },
    { "name": "MetricFlow", "domain": "metricflow.io" }
  ],
  "queries": [
    {
      "group": "category",
      "intent": "commercial",
      "query": "best product analytics tools for B2B SaaS"
    },
    {
      "group": "alternatives",
      "intent": "comparison",
      "query": "Northstar BI alternatives"
    },
    {
      "group": "problem",
      "intent": "problem-aware",
      "query": "how to find product activation bottlenecks"
    }
  ],
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "preferred_sources": [
    "acmeanalytics.com/compare",
    "acmeanalytics.com/product-analytics"
  ],
  "exclude": ["jobs", "stock ticker", "unrelated company named Acme"]
}
```

## MVP Output

```json
{
  "brand": "Acme Analytics",
  "domain": "acmeanalytics.com",
  "summary": "Acme Analytics appears in 2 of 9 tracked AI-style answers and is cited once, while Northstar BI appears in 5 answers and owns more third-party comparison citations. Acme's strongest opportunity is to improve source eligibility for alternatives and problem-aware queries.",
  "run": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop",
    "checked_at": "2026-05-02T16:00:00Z"
  },
  "scorecard": {
    "brand_inclusion_rate": 0.22,
    "brand_citation_rate": 0.11,
    "competitor_inclusion_rate": 0.56,
    "average_sentiment": "neutral_positive",
    "visibility_score": 48
  },
  "query_results": [
    {
      "query": "best product analytics tools for B2B SaaS",
      "group": "category",
      "intent": "commercial",
      "ai_overview_present": true,
      "brand_mentioned": true,
      "brand_cited": false,
      "mentioned_competitors": ["Northstar BI", "MetricFlow"],
      "cited_domains": ["example.com", "northstarbi.com"],
      "answer_position": "middle",
      "sentiment": "neutral_positive",
      "evidence": [
        {
          "claim": "Brand appears in the AI Overview answer but is not one of the cited sources.",
          "source_url": "https://www.google.com/search?q=best+product+analytics+tools+for+B2B+SaaS",
          "source_type": "google_serp",
          "query": "best product analytics tools for B2B SaaS",
          "serp_feature": "ai_overview"
        }
      ],
      "recommended_action": "Create or refresh a comparison page that directly answers B2B SaaS product analytics buying criteria and earns third-party citations."
    }
  ],
  "competitor_share": [
    {
      "name": "Northstar BI",
      "mentions": 5,
      "citations": 3,
      "top_cited_pages": ["https://northstarbi.com/compare"]
    }
  ],
  "source_opportunities": [
    {
      "source_domain": "example.com",
      "reason": "Frequently cited comparison source that omits Acme Analytics.",
      "queries": ["best product analytics tools for B2B SaaS"]
    }
  ]
}
```

## Inclusion Scoring

Visibility scores are 0-100:

- 25 points: brand mention rate across tracked AI Overview and AI-answer results.
- 20 points: citation rate for owned pages and preferred sources.
- 15 points: inclusion in high-commercial-intent query groups.
- 15 points: competitor-relative share of answer.
- 10 points: answer placement, wording prominence, and sentiment.
- 10 points: source quality, freshness, and citation diversity.
- 5 points: localization consistency across country, city, and device targets.

Automatic caps:

- Cap at 65 when the brand is mentioned but never cited.
- Cap at 55 when inclusion appears only in chatbot answers and not Google SERPs.
- Cap at 50 when citations point only to weak directories or copied listicles.
- Cap at 40 when the answer includes an incorrect product category or ambiguous entity match.
- Cap at 30 when no tracked result has an AI Overview or sourced AI answer.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
ai-overview-track run \
  --brief inclusion-brief.json \
  --out inclusion-results.json \
  --csv query-results.csv \
  --report-md inclusion-report.md
```

Minimum viable UI after CLI validation:

- Brand, competitor, and query setup form
- Query plan preview with estimated credit use
- Run status by query group and geography
- Inclusion scorecard with brand versus competitor comparison
- Query-level evidence table
- Cited source and source-opportunity view
- Trend view for repeated runs
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: estimate credits and verify available SERP, rendering, captcha, and chatbot-source support.
- `web_search`: collect Google results with SERP feature parsing, including AI Overview presence, citations, organic ranks, and related questions.
- Google SERP parsing: preserve query, location, device, result type, cited URLs, answer text snippets, and rank context.
- Country, city, and device targeting: compare inclusion across regions and desktop/mobile experiences.
- `web_fetch`: fetch cited pages, owned pages, competitor pages, and ranking articles with JS rendering and captcha handling.
- `ai_chat_completion`: ask grounded answer questions with sources to compare broader answer-engine inclusion against Google.

## Guardrails

- Treat AI Overview observations as volatile snapshots, not permanent rankings.
- Preserve query, location, device, answer text, cited URLs, and fetched-at timestamps for every claim.
- Separate Google AI Overview evidence from chatbot answer evidence.
- Do not infer search volume from inclusion frequency.
- Do not scrape logged-in, gated, private, or personal data.
- Flag ambiguous brand names and require domain-level confirmation before scoring.
- Label missing AI Overview results clearly instead of treating them as brand failures.
