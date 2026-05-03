# Category Landscape Builder

Category Landscape Builder turns a market category prompt into a sourced landscape of vendors, themes, comparison pages, search demand, and AI-answer positioning. It combines Google SERPs with AI chatbot answers so a founder, marketer, investor, or product strategist can understand how a category is represented across search and answer engines.

The first version is intentionally narrow: build an evidence-backed category map for one market, one geography, and a bounded set of query intents.

## Target User

Primary users:

- Founders validating category language before positioning work.
- Product marketers mapping competitors, alternatives, and buyer questions.
- Investors or analysts building a quick market landscape.
- SEO and GEO teams comparing Google rankings with AI-answer citations.

## Core Workflow

1. User enters a category brief:
   - Category name
   - Buyer persona
   - Geography
   - Seed companies or known competitors
   - Query intents to explore
   - Excluded verticals or unrelated meanings
2. App generates search and answer prompts across category, alternatives, best-of, pricing, use-case, and problem-aware intents.
3. Massive MCP runs:
   - `web_search` with Google SERP parsing for each query
   - country, city, and device targeting where results are local or persona-sensitive
   - `web_fetch` with JS rendering for ranking pages, vendor pages, review pages, and comparison pages
   - captcha handling when SERP-linked pages block normal browsing
   - `ai_chat_completion` to ask chatbot-style category questions and return answers with sources
4. App deduplicates vendors, source domains, category terms, and cited pages.
5. AI extracts a structured landscape with evidence, confidence, and gaps.
6. User gets a ranked category map, source graph, and exportable brief.

## MVP Inputs

```json
{
  "category": "AI sales call coaching software",
  "buyer": "VP Sales at B2B SaaS companies",
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "seed_companies": ["Gong", "Clari", "Avoma"],
  "intents": [
    "best tools",
    "alternatives",
    "pricing",
    "use cases",
    "implementation concerns",
    "buyer questions"
  ],
  "exclusions": ["consumer language learning", "sports coaching"]
}
```

## MVP Output

```json
{
  "category": "AI sales call coaching software",
  "landscape_summary": "The category is framed around sales productivity, rep coaching, call intelligence, and revenue intelligence. Google SERPs emphasize vendor comparison and listicle pages, while AI answers cite vendor pages, review sites, and product education pages.",
  "vendors": [
    {
      "name": "ExampleVendor",
      "domain": "examplevendor.com",
      "positioning": "AI call review and manager coaching workflows for revenue teams.",
      "serp_presence_score": 82,
      "ai_answer_presence_score": 67,
      "evidence": [
        {
          "claim": "Appears in best-tools SERP results.",
          "source_url": "https://example.com/best-ai-sales-coaching-tools",
          "source_type": "serp_result"
        },
        {
          "claim": "Cited in AI answer for sales call coaching alternatives.",
          "source_url": "https://examplevendor.com/sales-call-coaching",
          "source_type": "ai_answer_source"
        }
      ],
      "confidence": "medium"
    }
  ],
  "themes": [
    "AI scorecards",
    "manager coaching workflows",
    "CRM integration",
    "conversation intelligence",
    "rep onboarding"
  ],
  "source_domains": [
    {
      "domain": "g2.com",
      "role": "review/comparison",
      "serp_mentions": 6,
      "ai_answer_citations": 2
    }
  ],
  "gaps": [
    "Few sources explain implementation effort or data-retention concerns."
  ]
}
```

## Landscape Scoring

Vendor scores are 0-100:

- 30 points: Google SERP visibility across query intents and result positions.
- 25 points: AI-answer visibility, including direct mentions and cited sources.
- 20 points: Source quality, favoring official pages, reputable review sites, analyst pages, and recent comparison content.
- 15 points: Positioning clarity, based on repeated category language and buyer-use-case specificity.
- 10 points: Evidence freshness and geographic relevance.

Automatic caps:

- Cap at 60 when a vendor appears only in AI answers with no fetched source.
- Cap at 55 when a vendor appears only once across all SERPs and answers.
- Cap at 40 when evidence is ambiguous or the vendor may belong to an excluded meaning.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
category-landscape build \
  --brief category.json \
  --out landscape.json \
  --csv vendors.csv \
  --brief-md landscape.md
```

Minimum viable UI after CLI validation:

- Category setup form
- Query plan preview
- Run status with credit estimate
- Vendor landscape table
- Source-domain and citation view
- Theme and gap summary
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: estimate available credits before generating a query plan.
- `web_search`: collect Google SERP results for category, alternative, comparison, pricing, and problem-aware queries.
- Google SERP parsing: preserve rank, title, snippet, URL, and query intent for scoring.
- `web_fetch`: fetch result pages and vendor pages with JS rendering and captcha handling.
- country, city, and device targeting: compare localized category surfaces when needed.
- `ai_chat_completion`: ask category questions, request source-grounded answers, extract vendors, normalize themes, and produce the final landscape.

## Guardrails

- Never treat a chatbot mention as evidence unless it includes a source or is independently confirmed by fetched pages.
- Keep Google SERP facts separate from AI-answer facts.
- Preserve query, rank, and fetched URL for every claim.
- Show missing data and confidence, especially for emerging categories.
- Do not scrape private communities, gated reports, or personal contact data.
- Avoid declaring a category winner; report visibility, positioning, and evidence quality.
