# What Changed This Week? Category Digest

What Changed This Week? Category Digest turns a market category into a weekly, sourced briefing on new launches, pricing changes, funding, partnerships, regulation, ranking shifts, and AI-answer shifts. It is built for teams that need to know what changed in a category without manually checking Google, vendor sites, news, and chatbot answers every Monday.

The first version is intentionally narrow: monitor one category, one geography, and a fixed competitor/source set over a seven-day window.

## Target User

Primary users:

- Product marketers tracking competitor moves and positioning changes.
- Founders watching an emerging category for new entrants and narrative shifts.
- Sales and partnerships teams looking for weekly market triggers.
- Investors and analysts maintaining a category pulse without a full research team.
- SEO and GEO teams monitoring search and AI-answer visibility changes.

## Core Workflow

1. User defines a category watch:
   - Category name and alternate names
   - Geography and device profile
   - Seed competitors and domains
   - Query intents to monitor
   - Source types to include
   - Exclusions and low-signal topics
2. App estimates run cost with `account_status`.
3. App builds weekly search, fetch, and chatbot-answer probes.
4. Massive MCP runs:
   - `web_search` with Google SERP parsing for category, competitor, launch, pricing, funding, and regulation queries
   - country, city, and device targeting for localized or device-sensitive categories
   - `web_fetch` with JS rendering for vendor pages, changelogs, blogs, pricing pages, docs, review pages, and news articles
   - captcha handling for protected but public pages
   - `ai_chat_completion` to ask category questions and return answers with sources
5. App compares current observations with the previous weekly snapshot.
6. AI classifies and scores meaningful changes.
7. User receives a digest with source-backed change cards, visibility deltas, and recommended follow-up checks.

## MVP Inputs

```json
{
  "category": "AI customer support automation",
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "watch_window_days": 7,
  "seed_companies": [
    { "name": "Intercom", "domain": "intercom.com" },
    { "name": "Zendesk", "domain": "zendesk.com" },
    { "name": "Ada", "domain": "ada.cx" }
  ],
  "query_intents": [
    "best tools",
    "alternatives",
    "pricing",
    "new launch",
    "funding",
    "regulation",
    "implementation concerns"
  ],
  "tracked_pages": [
    "pricing",
    "blog",
    "changelog",
    "docs",
    "integrations",
    "security"
  ],
  "exclusions": ["consumer help desk tutorials", "generic chatbot news"]
}
```

## MVP Output

```json
{
  "category": "AI customer support automation",
  "period": {
    "start": "2026-04-25",
    "end": "2026-05-02"
  },
  "executive_summary": "Three meaningful changes appeared this week: one vendor launched an AI escalation workflow, two comparison pages shifted rankings, and AI answers cited more implementation-risk content than last week.",
  "change_cards": [
    {
      "title": "ExampleVendor launches AI escalation routing",
      "company": "ExampleVendor",
      "change_type": "product_launch",
      "observed_at": "2026-05-01",
      "why_it_matters": "The launch expands the vendor from agent assist into post-resolution workflow automation.",
      "confidence": "high",
      "impact_score": 84,
      "evidence": [
        {
          "source_url": "https://examplevendor.com/changelog/ai-escalation-routing",
          "source_type": "changelog",
          "observed_change": "New changelog entry for AI escalation routing.",
          "fetched_at": "2026-05-02T15:40:00Z"
        }
      ],
      "recommended_follow_up": "Check whether pricing or packaging changed for automation seats."
    }
  ],
  "visibility_deltas": [
    {
      "surface": "google_serp",
      "query": "best AI customer support automation tools",
      "entity": "ExampleVendor",
      "previous_rank": 9,
      "current_rank": 4,
      "delta": 5
    }
  ],
  "ai_answer_deltas": [
    {
      "prompt": "What are the best AI customer support automation platforms?",
      "entity": "ExampleVendor",
      "previous_state": "mentioned_without_source",
      "current_state": "mentioned_with_source",
      "source_url": "https://examplevendor.com/ai-support"
    }
  ],
  "gaps": [
    "No reliable pricing evidence was found for the new AI workflow."
  ]
}
```

## Change Types

Digest cards use a fixed taxonomy:

- `product_launch`: new feature, integration, workflow, platform capability, or public beta.
- `pricing_packaging`: public pricing, plan, usage limit, seat, or packaging change.
- `positioning`: homepage, category, comparison, or messaging change.
- `visibility_shift`: Google rank, source citation, or AI-answer mention changed materially.
- `funding_or_ma`: funding, acquisition, merger, divestiture, or strategic investment.
- `partnership`: new channel, integration, marketplace, or ecosystem announcement.
- `regulation`: relevant rule, deadline, enforcement action, or compliance guidance.
- `hiring_or_org`: leadership, hiring, layoffs, or org signals with market relevance.
- `incident_or_risk`: outage, security issue, legal dispute, or trust signal.

## Scoring

Impact scores are 0-100:

- 25 points: business importance of the change for buyers or competitors.
- 20 points: source quality and directness.
- 15 points: freshness within the configured watch window.
- 15 points: category specificity.
- 15 points: surface breadth across SERP, fetched pages, and AI answers.
- 10 points: novelty compared with the previous snapshot.

Automatic caps:

- Cap at 60 when the only evidence is a chatbot answer.
- Cap at 55 when the source is a single low-authority article.
- Cap at 45 when the event date is unclear.
- Cap at 35 when the change may belong to an excluded category meaning.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
category-change-digest run \
  --watch watch.json \
  --previous snapshots/2026-04-25.json \
  --out snapshots/2026-05-02.json \
  --digest-md digest-2026-05-02.md \
  --changes-csv changes-2026-05-02.csv
```

Minimum viable UI after CLI validation:

- Watch setup form
- Query and source plan preview
- Credit estimate and run status
- Weekly change-card feed
- SERP and AI-answer delta tables
- Evidence drawer for each claim
- Export buttons for JSON, Markdown, and CSV

## Massive MCP Usage

- `account_status`: estimate whether the planned weekly run fits available credits.
- `web_search`: collect Google SERP snapshots for monitored query intents.
- Google SERP parsing: retain rank, title, snippet, URL, query, country, city, and device for delta tracking.
- `web_fetch`: fetch official pages, changelogs, blogs, pricing pages, docs, review sites, news articles, and regulatory pages.
- JS rendering: handle modern vendor pages where pricing, changelogs, or docs render client-side.
- Captcha handling: attempt public page access without bypassing private or gated content.
- Country, city, and device targeting: compare the exact surface the watch is configured to monitor.
- `ai_chat_completion`: ask recurring category questions, require sources, classify changes, summarize digest cards, and explain uncertainty.

## Guardrails

- Never publish a change without at least one inspectable source URL.
- Keep SERP rank movement, fetched-page evidence, and AI-answer citations separate.
- Treat chatbot answers as leads until source-backed or independently confirmed.
- Preserve previous and current observation IDs for every delta.
- Do not infer pricing changes from marketing copy alone.
- Do not scrape private communities, gated reports, personal data, or confidential portals.
- Label uncertainty when a page changed but the business meaning is unclear.
- Prefer fewer, higher-confidence change cards over a noisy digest.
