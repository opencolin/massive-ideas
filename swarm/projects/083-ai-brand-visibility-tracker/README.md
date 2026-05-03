# AI Brand Visibility Tracker

Idea 83 is an AI brand visibility tracker for marketing, communications, SEO, and competitive intelligence teams that need to know how often their brand appears in AI answers, search summaries, chatbot citations, and source-backed recommendation flows. It uses Massive MCP to run repeatable prompts and searches across markets, devices, and locales, then reports whether the brand is mentioned, cited, ranked, misrepresented, or absent.

The product is evidence-first. Every visibility score links back to the exact prompt or query, Google SERP result, chatbot answer, cited source URL, market targeting, device targeting, timestamp, and extraction rationale that produced it.

## Problem

Customers increasingly discover vendors through AI chatbots, search result answer boxes, and AI-assisted research flows. Traditional rank tracking only shows where a website appears in blue links. It does not show whether an AI answer recommends the brand, whether competitors are cited more often, whether summaries describe the brand accurately, or whether local markets produce different recommendations.

This tracker makes AI visibility measurable. It runs controlled prompts and searches, captures chatbot answers with sources, parses SERPs, fetches cited pages, and turns the results into share-of-answer, citation, sentiment, and claim-accuracy reports.

## Target Users

- Brand and communications teams tracking AI answer presence and reputation.
- SEO teams expanding rank tracking into AI summaries and answer engines.
- Demand generation teams monitoring category prompts and buyer research journeys.
- Competitive intelligence teams comparing brand mentions, citations, and positioning.
- Agencies producing recurring visibility reports for clients across countries and languages.
- Product marketing teams checking whether AI systems understand positioning, features, pricing, and target customers.

## Core Workflow

1. User defines brands, competitors, categories, claims, markets, devices, and prompt/query packs.
2. App checks `account_status` to estimate search, fetch, and chatbot completion volume.
3. App uses `ai_chat_completion` to ask buyer-style questions and capture AI answers with source citations.
4. App uses `web_search` with Google SERP parsing to capture organic rankings, AI-style result modules, snippets, People Also Ask, and competitor/source pages.
5. App uses `web_fetch` with JavaScript rendering, captcha handling, and country/city/device targeting to verify cited sources and brand-owned pages.
6. App uses `ai_chat_completion` again to classify mentions, sentiment, rank position, citation quality, factual claims, and competitor context.
7. User receives a dashboard and evidence-backed report showing AI visibility trends, missed opportunities, risky claims, and source pages worth improving.

## MVP Inputs

```json
{
  "workspace": "Example Marketing Team",
  "brands": [
    {
      "name": "Acme Analytics",
      "domain": "acmeanalytics.example",
      "aliases": ["Acme BI", "Acme Data Platform"],
      "approved_claims": [
        "Acme Analytics is a self-service analytics platform for mid-market SaaS companies.",
        "Acme Analytics supports embedded dashboards and warehouse-native metrics."
      ]
    }
  ],
  "competitors": [
    { "name": "Northstar Metrics", "domain": "northstar.example" },
    { "name": "BrightDash", "domain": "brightdash.example" }
  ],
  "markets": [
    { "country": "us", "city": "San Francisco", "language": "en" },
    { "country": "gb", "city": "London", "language": "en" },
    { "country": "de", "city": "Berlin", "language": "de" }
  ],
  "devices": ["desktop", "mobile"],
  "prompt_packs": [
    {
      "name": "buyer_research",
      "prompts": [
        "What are the best analytics platforms for mid-market SaaS companies?",
        "Compare Acme Analytics with Northstar Metrics and BrightDash.",
        "Which embedded analytics tools should a SaaS product team evaluate?"
      ]
    }
  ],
  "search_queries": [
    "best analytics platforms for SaaS",
    "embedded analytics tools comparison",
    "Acme Analytics alternatives"
  ]
}
```

## MVP Output

```json
{
  "brand": "Acme Analytics",
  "generated_at": "2026-05-02T19:30:00Z",
  "visibility_summary": {
    "prompt_runs": 18,
    "brand_mention_rate": 0.61,
    "brand_citation_rate": 0.28,
    "average_answer_position": 3.2,
    "positive_or_neutral_sentiment_rate": 0.94,
    "claim_accuracy_rate": 0.88,
    "competitor_share_of_answer": {
      "Northstar Metrics": 0.72,
      "BrightDash": 0.56
    }
  },
  "top_gap": {
    "prompt": "Which embedded analytics tools should a SaaS product team evaluate?",
    "market": { "country": "gb", "city": "London", "language": "en" },
    "device": "mobile",
    "finding": "Brand omitted while two competitors were recommended and cited.",
    "recommended_source_action": "Improve or publish a source page that clearly positions embedded analytics for SaaS product teams."
  },
  "risk": {
    "claim": "Answer says Acme Analytics is enterprise-only.",
    "classification": "inaccurate",
    "evidence_url": "https://example-source.test/acme-review",
    "severity": "medium"
  }
}
```

## Visibility Signals

- `brand_mentioned`: answer names the tracked brand or alias.
- `brand_cited`: answer includes a source URL for the brand or a third-party page about the brand.
- `answer_position`: relative order of brand versus competitors in recommendations.
- `share_of_answer`: fraction of prompt runs where the brand appears.
- `share_of_citation`: fraction of cited sources pointing to brand-owned or brand-relevant pages.
- `sentiment`: positive, neutral, mixed, or negative portrayal.
- `claim_accuracy`: whether product, pricing, audience, feature, or availability claims match approved facts or source evidence.
- `competitor_context`: competitors mentioned, cited, ranked above, or framed as better alternatives.
- `source_quality`: whether citations are official, recent, authoritative, third-party, stale, irrelevant, or inaccessible.
- `market_variation`: brand visibility changes by country, city, language, or device.
- `serp_ai_gap`: search results surface competitors or AI-style summaries where chatbot answers omit the brand.

## Massive MCP Fit

- `ai_chat_completion`: run controlled buyer prompts, capture chatbot answers with sources, and classify mentions, sentiment, claims, and competitor positioning.
- `web_search`: parse Google SERPs for category queries, alternative queries, branded queries, snippets, sitelinks, and source pages.
- Google SERP parsing: measure organic source visibility alongside AI answer visibility.
- `web_fetch`: verify cited pages, brand pages, third-party lists, review pages, and JavaScript-heavy content.
- Country, city, and device targeting: compare visibility across local buyer journeys and mobile versus desktop results.
- Captcha handling: classify inaccessible sources separately from true missing evidence.
- `account_status`: make recurring prompt and market sweeps quota-aware before scheduled runs.

## Guardrails

- Treat AI answers as observations, not objective truth.
- Preserve prompt, market, device, answer text, cited sources, timestamps, and extraction outputs for every score.
- Do not fabricate citations or infer source support when the answer does not provide it.
- Separate brand-owned citations from third-party citations.
- Mark confidence low when an answer has no sources, cites inaccessible pages, or gives vague category recommendations.
- Flag misinformation and unsupported claims for human review instead of auto-generating public rebuttals.
- Avoid tactics that manipulate or spam search engines, websites, review pages, or AI systems.

## First Build

Ship a CLI that produces JSON, CSV, and Markdown reports:

```bash
ai-visibility run \
  --config visibility-targets.json \
  --out report.json \
  --csv observations.csv \
  --markdown brief.md
```

Minimum viable UI after CLI validation:

- Brand, competitor, market, and prompt-pack setup
- Share-of-answer trend table
- Prompt x market visibility matrix
- Citation and source quality leaderboard
- Claim accuracy and misinformation review queue
- Evidence drawer with chatbot answer, SERP context, fetched source text, and classifier rationale
- Exportable client or executive brief
