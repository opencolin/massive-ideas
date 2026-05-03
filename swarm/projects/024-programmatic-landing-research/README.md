# Programmatic Landing Research Assistant

Programmatic Landing Research Assistant turns a list of landing-page topics into source-backed page briefs: search intent, competitor page patterns, buyer language, proof points, FAQ candidates, and content gaps. It helps SEO, growth, and content teams create many targeted pages without reducing research quality to a generic keyword template.

The first version is intentionally narrow: analyze one site, one audience, and a bounded set of landing-page topics, then produce structured briefs that a human can review before writing or publishing.

## Target User

Primary users:

- Growth teams building location, industry, competitor-alternative, integration, or use-case landing pages.
- SEO leads validating whether programmatic pages have distinct intent and evidence.
- Content strategists turning SERP research into repeatable page outlines.
- Agencies creating source-backed briefs for multiple client landing pages.
- Founders testing whether a set of long-tail pages deserves production investment.

## Core Workflow

1. User enters a landing research brief:
   - Site or product being promoted
   - Page pattern, such as "industry pages" or "competitor alternatives"
   - Target audience
   - Topic rows to research
   - Geography and device targets
   - Known competitors and exclusion rules
2. App expands each topic into buyer-intent, comparison, pain-aware, pricing, local, and FAQ-style queries.
3. Massive MCP runs:
   - `account_status` to estimate whether the batch can complete within the available credit budget
   - `web_search` with Google SERP parsing for each topic and intent
   - country, city, and device targeting for local or mobile-sensitive page sets
   - `web_fetch` with JS rendering for top ranking pages, comparison articles, vendor pages, directories, and forum-style sources
   - captcha handling when SERPs, directories, or competitor pages block normal collection
   - `ai_chat_completion` to classify intent, extract language, summarize page patterns, and generate source-backed briefs
4. App normalizes domains, page types, claims, entities, and repeated SERP patterns.
5. App scores each page topic for intent clarity, differentiation, evidence depth, competition, and production readiness.
6. User gets a batch of landing-page briefs with source lineage, recommended page angles, outline modules, and exportable JSON, CSV, and Markdown.

## MVP Inputs

```json
{
  "site": {
    "name": "Acme Analytics",
    "domain": "acmeanalytics.example"
  },
  "page_pattern": "industry landing pages",
  "audience": "RevOps leaders at B2B SaaS companies",
  "topics": [
    {
      "slug": "revenue-analytics-for-cybersecurity-saas",
      "topic": "revenue analytics for cybersecurity SaaS",
      "industry": "cybersecurity SaaS"
    },
    {
      "slug": "revenue-analytics-for-fintech-saas",
      "topic": "revenue analytics for fintech SaaS",
      "industry": "fintech SaaS"
    }
  ],
  "geo": {
    "country": "us",
    "device": "desktop"
  },
  "known_competitors": ["Clari", "Gong", "InsightSquared"],
  "exclude": ["stock market analytics", "consumer budgeting apps"]
}
```

## MVP Output

```json
{
  "site": "Acme Analytics",
  "page_pattern": "industry landing pages",
  "summary": "Cybersecurity SaaS has clearer pain-aware and comparison intent than fintech SaaS, with repeated language around pipeline inspection, enterprise deal cycles, and board reporting. Fintech SaaS needs a more distinct angle to avoid generic revenue analytics copy.",
  "pages": [
    {
      "slug": "revenue-analytics-for-cybersecurity-saas",
      "topic": "revenue analytics for cybersecurity SaaS",
      "readiness_score": 86,
      "intent_clarity_score": 82,
      "differentiation_score": 78,
      "evidence_score": 91,
      "recommended_angle": "Revenue analytics for cybersecurity SaaS teams managing enterprise pipeline risk, renewal visibility, and board-ready forecasts.",
      "primary_intents": ["commercial", "problem-aware", "comparison"],
      "serp_patterns": [
        {
          "pattern": "Revenue intelligence vendors rank for broad SaaS forecasting terms, but few pages mention cybersecurity-specific sales cycles.",
          "source_urls": ["https://example.com/revenue-intelligence-saas"],
          "queries": ["revenue analytics cybersecurity SaaS"]
        }
      ],
      "buyer_language": [
        "pipeline inspection",
        "enterprise deal risk",
        "renewal visibility",
        "board reporting"
      ],
      "outline_modules": [
        "Hero with industry-specific forecasting pain",
        "Cybersecurity SaaS revenue workflow examples",
        "Competitor and spreadsheet replacement section",
        "FAQ from SERP and answer-engine questions"
      ],
      "content_gaps": [
        "Few ranking pages address long enterprise security review cycles as a revenue forecasting problem."
      ],
      "evidence": [
        {
          "claim": "Top ranking comparison pages discuss revenue intelligence but not cybersecurity SaaS specifically.",
          "source_url": "https://example.com/best-revenue-intelligence-tools",
          "source_type": "serp_result",
          "query": "best revenue analytics tools for SaaS",
          "rank": 4
        }
      ],
      "confidence": "high"
    }
  ]
}
```

## Readiness Scoring

Landing-page readiness scores are 0-100:

- 20 points: search intent clarity across commercial, comparison, problem-aware, pricing, local, and FAQ queries.
- 20 points: evidence depth from SERPs, fetched pages, official vendor pages, directories, and answer-engine sources.
- 15 points: distinct buyer language that can make the page specific rather than templated.
- 15 points: visible content gaps or underserved angles.
- 10 points: competitive difficulty and SERP concentration.
- 10 points: fit with the user's site, product, audience, and exclusions.
- 10 points: source diversity, freshness, and country/city/device consistency.

Automatic caps:

- Cap at 65 when a topic has relevant demand but no distinct landing-page angle.
- Cap at 60 when evidence comes from fewer than three unique domains.
- Cap at 55 when the SERP is dominated by broad category pages that do not match the page pattern.
- Cap at 45 when the topic repeatedly triggers excluded meanings.
- Cap at 40 when the recommended page would be substantially duplicative of another topic in the same batch.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
landing-research analyze \
  --brief landing-brief.json \
  --out landing-research.json \
  --csv pages.csv \
  --report-md landing-research.md
```

Minimum viable UI after CLI validation:

- Landing research brief setup form
- Topic table import and validation
- Query plan and credit estimate preview
- Batch run status by topic and research stage
- Ranked page readiness table
- Page brief detail view with SERP evidence and fetched-page excerpts
- Duplicate-topic and thin-evidence warnings
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: preflight credits before expanding a topic batch.
- `web_search`: collect SERPs for landing-page topics, competitor comparisons, industry terms, use-case phrases, pricing intent, and FAQ questions.
- Google SERP parsing: preserve rank, title, snippet, URL, result type, SERP features, and query metadata.
- Country, city, and device targeting: compare localized or mobile-sensitive landing-page opportunities.
- `web_fetch`: fetch ranking pages, competitor pages, directories, and source pages with JS rendering and captcha handling.
- `ai_chat_completion`: generate query plans, classify intent, extract buyer language, detect page patterns, score readiness, and write source-backed page briefs.

## Guardrails

- Treat SERP visibility as research evidence, not exact search volume.
- Keep every recommendation tied to source URLs, queries, ranks, and fetched timestamps.
- Separate facts found in sources from AI-generated page-angle synthesis.
- Flag pages that are too similar to other topics in the same batch.
- Do not fabricate customer proof, statistics, claims, or product capabilities.
- Avoid collecting personal data or scraping gated communities.
- Preserve country, city, and device target for every observation.
- Mark thin, ambiguous, or duplicated topics as low confidence instead of forcing a brief.
