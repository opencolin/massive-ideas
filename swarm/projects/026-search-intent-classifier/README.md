# Search Intent Classifier

Search Intent Classifier turns thousands of raw keywords into reliable intent labels, SERP evidence, and action-ready content buckets. It is built for SEO, content, growth, and marketplace teams that need to decide which keywords deserve landing pages, comparison pages, guides, product pages, local pages, or deprioritization.

The first version is intentionally narrow: classify one keyword batch for one market and device profile, then export scored rows with evidence.

## Target User

Primary users:

- SEO teams cleaning large keyword exports before content planning.
- Content strategists separating informational, commercial, comparison, pricing, local, and navigational demand.
- Growth teams mapping keywords to landing-page templates.
- Agencies producing intent-normalized keyword maps for clients.
- GEO teams comparing Google result intent with chatbot answer intent and cited sources.

## Core Workflow

1. User uploads a keyword list with optional volume, CPC, current rank, and seed category.
2. App checks planned batch size and available credits with `account_status`.
3. App normalizes keywords, removes duplicates, and groups near-identical variants.
4. Massive MCP runs:
   - `web_search` with Google SERP parsing for representative keywords and ambiguous cases
   - country, city, and device targeting for the user's target search surface
   - `web_fetch` with JS rendering for ranking pages when SERP titles and snippets are insufficient
   - captcha handling for public pages that need browser-like access
   - `ai_chat_completion` to classify intent, infer page type, explain uncertainty, and return source-backed JSON
5. App combines lexical signals, SERP result mix, fetched-page evidence, and AI classification.
6. User receives a CSV, JSON, and Markdown summary with labels, confidence, evidence, and recommended action.

## Intent Taxonomy

The MVP uses a fixed taxonomy:

- `informational`: user wants to learn, troubleshoot, compare concepts, or answer a question.
- `commercial`: user is evaluating options but has not named a specific vendor or product.
- `comparison`: user is comparing brands, alternatives, versus pages, or ranked lists.
- `pricing`: user wants cost, plans, discounts, calculators, or quotes.
- `transactional`: user wants to buy, download, sign up, book, or start a trial.
- `local`: user needs location-specific results, providers, stores, availability, or service areas.
- `navigational`: user is looking for a named site, brand, login, docs, or support destination.
- `support`: user likely already uses a product and needs help, setup, errors, docs, or integration guidance.
- `ambiguous`: SERP or wording supports multiple intents and should be reviewed or split.
- `irrelevant`: keyword does not match the project scope or matches an exclusion.

## MVP Inputs

```json
{
  "project": {
    "name": "ExampleCRM keyword map",
    "domain": "examplecrm.com",
    "market": "B2B CRM software"
  },
  "geo": {
    "country": "us",
    "city": "Chicago",
    "device": "desktop"
  },
  "keywords": [
    { "keyword": "best crm for small business", "volume": 5400, "seed_category": "crm" },
    { "keyword": "crm pricing", "volume": 1900, "seed_category": "pricing" },
    { "keyword": "hubspot login", "volume": 33100, "seed_category": "brand" }
  ],
  "allowed_intents": [
    "informational",
    "commercial",
    "comparison",
    "pricing",
    "transactional",
    "local",
    "navigational",
    "support",
    "ambiguous",
    "irrelevant"
  ],
  "exclusions": ["jobs", "stock ticker", "unrelated medical CRM"],
  "sample_serp_for_every_n_keywords": 10,
  "max_serp_results_per_query": 10,
  "max_fetches": 500
}
```

## MVP Output

```json
{
  "project": {
    "name": "ExampleCRM keyword map",
    "domain": "examplecrm.com"
  },
  "generated_at": "2026-05-02T12:00:00Z",
  "summary": "1,248 keywords were classified. Commercial and comparison keywords account for 43% of estimated demand, while 11% were navigational or irrelevant and should not drive net-new content.",
  "keyword_count": 1248,
  "intent_distribution": {
    "commercial": 381,
    "informational": 312,
    "comparison": 159,
    "pricing": 44,
    "transactional": 81,
    "local": 96,
    "navigational": 103,
    "support": 42,
    "ambiguous": 22,
    "irrelevant": 8
  },
  "rows": [
    {
      "keyword": "best crm for small business",
      "primary_intent": "comparison",
      "secondary_intents": ["commercial"],
      "recommended_page_type": "best-of comparison page",
      "funnel_stage": "consideration",
      "confidence": "high",
      "serp_result_mix": {
        "listicles": 5,
        "vendor_pages": 3,
        "review_sites": 2
      },
      "evidence": [
        {
          "source_type": "google_serp",
          "source_url": "https://www.google.com/search?q=best+crm+for+small+business",
          "observed_fact": "Top results are mostly ranked lists and comparison articles."
        }
      ],
      "recommended_action": "Assign to a comparison page cluster, not a generic CRM guide."
    }
  ]
}
```

## Scoring

Confidence is `low`, `medium`, or `high`:

- High: keyword wording and SERP result mix agree, with at least five relevant parsed results.
- Medium: wording and SERP mostly agree, or only one evidence surface is available.
- Low: keyword is short, overloaded, localized, brand-like, or SERP results are mixed.

Automatic downgrades:

- Downgrade to low when the SERP contains fewer than five relevant results.
- Downgrade to low when country, city, or device materially changes the dominant intent.
- Downgrade ambiguous brand terms unless the target brand or competitor list resolves them.
- Mark as `irrelevant` when exclusions match and SERP evidence confirms the mismatch.

## First Build

Ship as a CLI that writes CSV, JSON, and Markdown:

```bash
search-intent-classifier run \
  --brief keyword-intent-brief.json \
  --keywords keywords.csv \
  --out intent-rows.csv \
  --json intent-report.json \
  --summary intent-summary.md
```

Minimum viable UI after CLI validation:

- Keyword upload table
- Geography and device selector
- Credit estimate preview
- Run status by keyword group
- Intent distribution dashboard
- Low-confidence review queue
- Evidence drawer per keyword
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: estimate whether the keyword batch fits available credits.
- `web_search`: collect parsed Google results for sampled, high-value, and ambiguous keywords.
- Google SERP parsing: preserve rank, URL, title, snippet, result type, query, country, city, and device.
- Country, city, and device targeting: detect intent changes caused by local packs, mobile surfaces, or regional terminology.
- `web_fetch`: fetch ranking pages when SERP snippets cannot distinguish page type or funnel stage.
- JS rendering: inspect client-rendered pricing pages, marketplaces, docs, and comparison pages.
- Captcha handling: attempt public page access without using private credentials or gated content.
- `ai_chat_completion`: classify intent, summarize result mix, explain confidence, and produce structured source-backed rows.
