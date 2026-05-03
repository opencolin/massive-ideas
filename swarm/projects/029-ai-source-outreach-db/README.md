# AI Source Outreach DB

AI Source Outreach DB discovers the domains, authors, publishers, listicles, docs, and community pages that AI answers cite for a category, then turns those citations into an outreach database. It helps SEO, content, partnerships, and founder-led growth teams prioritize the sources most likely to influence AI-generated recommendations.

The first version is intentionally narrow: run a defined prompt and query set across Google AI-style SERPs and sourced chatbot answers, extract cited sources, enrich reachable contacts, and rank outreach opportunities by citation influence.

## Target User

Primary users:

- SEO teams building source inclusion and digital PR campaigns.
- Content marketers looking for third-party pages that shape AI answers.
- Partnership teams identifying blogs, directories, review sites, and analysts to engage.
- Founders in emerging categories who need to know who AI systems trust.
- Agencies building recurring AI visibility and source outreach reports for clients.

## Core Workflow

1. User defines an outreach brief:
   - Category, product, and buyer persona
   - Prompt set, Google query set, and intents
   - Target countries, cities, and devices
   - Owned domains, competitors, and blocked domains
   - Outreach goals such as mention, citation, correction, partnership, or content update
2. App checks `account_status` and estimates collection cost.
3. Massive MCP runs:
   - `web_search` with Google SERP parsing for AI Overview and organic source discovery
   - country, city, and device targeting to capture market-specific source sets
   - `ai_chat_completion` for sourced answers that expose cited URLs
   - `web_fetch` with JS rendering and captcha handling to verify cited pages and extract contact paths
4. App normalizes citations into source records.
5. App scores each source by citation frequency, answer role, authority signals, competitor exposure, and contactability.
6. User exports a CRM-ready outreach database with evidence and suggested pitch angle.

## MVP Inputs

```json
{
  "category": "AI meeting notes",
  "product": {
    "name": "Acme Notes",
    "domain": "acmenotes.example"
  },
  "queries": [
    {
      "query": "best AI meeting notes tools",
      "intent": "comparison",
      "priority": "high"
    },
    {
      "query": "AI meeting notes for sales calls",
      "intent": "use_case",
      "priority": "medium"
    }
  ],
  "chat_prompts": [
    {
      "prompt": "What are the best AI meeting notes tools for customer-facing teams? Cite sources.",
      "intent": "recommendation",
      "priority": "high"
    }
  ],
  "targets": [
    { "country": "us", "city": "San Francisco", "device": "desktop" },
    { "country": "gb", "city": "London", "device": "mobile" }
  ],
  "competitors": [
    { "name": "Fireflies.ai", "domain": "fireflies.ai" },
    { "name": "Fathom", "domain": "fathom.video" }
  ],
  "blocked_domains": ["acmenotes.example"],
  "max_sources": 100,
  "outreach_goal": "earn inclusion in third-party recommendation pages"
}
```

## MVP Output

```json
{
  "category": "AI meeting notes",
  "run_id": "source-db-2026-05-02-ai-meeting-notes",
  "summary": "The strongest outreach opportunities are comparison listicles and workflow blogs cited by both Google AI-style results and sourced chatbot answers. Competitors appear on 14 cited pages where Acme Notes is absent.",
  "source_records": [
    {
      "domain": "exampleblog.com",
      "url": "https://exampleblog.com/best-ai-meeting-notes",
      "title": "Best AI Meeting Notes Apps",
      "source_type": "third_party_listicle",
      "citation_count": 5,
      "cited_in": ["google_ai_overview", "chatbot_answer"],
      "intents": ["comparison", "recommendation"],
      "competitors_mentioned": ["Fireflies.ai", "Fathom"],
      "owned_product_mentioned": false,
      "contact_paths": [
        {
          "type": "editorial_contact_page",
          "url": "https://exampleblog.com/contact",
          "confidence": "medium"
        }
      ],
      "outreach_priority": 91,
      "pitch_angle": "Request inclusion in the listicle section for customer-facing sales teams, citing Acme Notes' CRM workflow and call-summary features.",
      "evidence_urls": [
        "https://exampleblog.com/best-ai-meeting-notes"
      ]
    }
  ],
  "exports": {
    "json": "reports/source-db.json",
    "csv": "reports/source-db.csv",
    "markdown": "reports/source-outreach-plan.md"
  }
}
```

## Source Dimensions

Each source record preserves:

- Query or prompt, intent, priority, target, and collection timestamp.
- Citation surface: Google AI Overview, organic SERP, sourced chatbot answer, or fetched page.
- URL, canonical URL, domain, title, author, publisher, and page type.
- Citation count, first-seen timestamp, and repeated appearances across targets.
- Whether the owned product, competitors, or category terms appear on the page.
- Contact paths such as editorial page, author page, generic contact form, media kit, or social profile.
- Outreach priority, pitch angle, evidence URLs, and confidence.

## Outreach Scoring

Sources are scored 0-100:

- 25 points: cited across multiple AI answer surfaces.
- 20 points: appears for high-priority commercial or recommendation intents.
- 15 points: mentions competitors while omitting the owned product.
- 15 points: page is editable or editorially maintained, such as listicles, guides, directories, or analyst pages.
- 10 points: reachable contact path exists.
- 10 points: source has strong topical relevance and recurring category language.
- 5 points: source appears across multiple locations or devices.

Automatic caps:

- Maximum 60 when no contact path is found.
- Maximum 50 when the source is a social thread or forum discussion.
- Maximum 40 when the page is stale, blocked, or no longer fetchable.
- Maximum 30 when the citation is only organic SERP visibility, not an AI answer citation.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
ai-source-outreach-db run \
  --brief outreach-brief.json \
  --out reports/source-db.json \
  --csv reports/source-db.csv \
  --report-md reports/source-outreach-plan.md
```

Minimum viable UI after CLI validation:

- Brief setup form
- Prompt, query, target, and competitor editor
- Credit estimate preview
- Collection status by query, prompt, and target
- Source table with citation surfaces and contactability
- Competitor exposure filters
- Outreach priority board
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate credits before source collection and enrichment.
- `web_search`: capture Google SERPs, AI Overview-style cited URLs, organic ranking pages, and source candidates.
- Google SERP parsing: preserve cited URLs, ranks, snippets, SERP features, and visible source metadata.
- Country, city, and device targeting: identify which sources influence specific markets and surfaces.
- `ai_chat_completion`: collect sourced chatbot answers and extract source roles, claims, competitors, and pitch angles.
- `web_fetch`: verify cited pages, render JavaScript, handle captchas, extract page metadata, and find contact paths.

## Guardrails

- Separate Google SERP evidence, chatbot answer evidence, fetched page evidence, and AI-generated synthesis.
- Do not invent contacts, emails, or authors when source pages do not expose them.
- Treat citation presence as influence evidence, not proof of traffic or conversion impact.
- Preserve query, prompt, target, timestamp, and URL lineage for every outreach recommendation.
- Avoid scraping private, gated, or personal data.
- Label blocked or captcha-limited fetches instead of turning them into negative evidence.
- Keep outreach suggestions factual and specific to the cited page.
