# Portfolio Company Competitive Alerts

Portfolio Company Competitive Alerts watches a VC, accelerator, or corporate venture portfolio against direct competitors and category shifts, then sends evidence-backed alerts when competitors launch products, change pricing, gain search visibility, update positioning, or appear in AI/chatbot answers.

The first version is intentionally operator-focused: portfolio teams define companies, competitors, tracked categories, and alert rules; the system runs recurring public-web checks and produces concise alerts with sources, confidence, severity, and suggested follow-up.

## Target User

Primary users:

- Platform teams supporting portfolio companies with competitive intelligence.
- Investors tracking category movement across active portfolio bets.
- Founders who want lightweight alerts without building their own monitoring stack.
- Growth and product marketing advisors watching competitor launches, messaging, and search share.
- Corporate venture teams monitoring strategic threats around portfolio companies.

## Core Workflow

1. User enters a portfolio watchlist:
   - Portfolio company name, domain, category, and market
   - Known competitors and substitute categories
   - Keywords, products, geographies, and device targets
   - Alert cadence and severity thresholds
   - Slack, email, CRM, or digest output preferences
2. App checks Massive MCP `account_status` and estimates credit cost by company, competitor, query count, fetch count, geography, and cadence.
3. Massive MCP collects evidence:
   - `web_search` with Google SERP parsing for competitor launches, category keywords, comparison pages, alternatives pages, pricing changes, and AI answer source discovery
   - country, city, and device targeting to detect geo-specific SERP movement and mobile/desktop differences
   - `web_fetch` with JS rendering for competitor homepages, pricing pages, changelogs, docs, blog posts, comparison pages, and marketplace listings
   - captcha handling for pages that block simple public fetches
   - `ai_chat_completion` for source-backed classification, summarization, severity scoring, and recommended follow-up
4. App normalizes sources into observations with URL, query, rank, fetch timestamp, company, competitor, topic, signal type, and confidence.
5. App compares observations to previous snapshots and suppresses duplicates, stale items, low-relevance noise, jobs pages, and cosmetic updates.
6. User receives real-time alerts and weekly portfolio digests with evidence, impact rationale, and recommended action.

## MVP Inputs

```json
{
  "portfolio": {
    "name": "Seed Fund I",
    "default_geo": {
      "country": "us",
      "city": "San Francisco",
      "device": "desktop"
    }
  },
  "companies": [
    {
      "name": "Acme Security",
      "domain": "acmesecurity.example",
      "category": "SOC 2 automation",
      "competitors": [
        {
          "name": "SecureFrame",
          "domain": "secureframe.example"
        },
        {
          "name": "Vanta",
          "domain": "vanta.example"
        }
      ],
      "tracked_topics": [
        "SOC 2 automation",
        "vendor risk management",
        "security questionnaire automation"
      ],
      "tracked_keywords": [
        "soc 2 automation software",
        "vanta alternatives",
        "secureframe pricing"
      ]
    }
  ],
  "alert_rules": {
    "cadence": "daily",
    "minimum_severity": "medium",
    "include_ai_answers": true,
    "include_pricing": true,
    "include_serp_changes": true,
    "lookback_days": 14
  },
  "exclude": ["jobs", "support login", "status pages", "press boilerplate"]
}
```

## MVP Output

```json
{
  "run_id": "portfolio-alerts-2026-05-02",
  "portfolio": "Seed Fund I",
  "summary": "One high-priority alert and two medium-priority alerts were found across one portfolio company. SecureFrame launched a new comparison page and gained visibility for a tracked alternatives query.",
  "alerts": [
    {
      "portfolio_company": "Acme Security",
      "competitor": "SecureFrame",
      "severity": "high",
      "signal_type": "competitive_launch",
      "topic": "SOC 2 automation",
      "title": "SecureFrame published a new SOC 2 automation comparison page",
      "why_it_matters": "The page targets a tracked buyer-intent query and appears in the top 10 for a defensive alternatives search.",
      "confidence": "high",
      "observed_at": "2026-05-02T17:00:00Z",
      "evidence": [
        {
          "source_type": "web_fetch",
          "url": "https://secureframe.example/soc-2-automation-comparison",
          "fetched_at": "2026-05-02T16:58:00Z",
          "excerpt": "SOC 2 automation comparison for growing security teams"
        },
        {
          "source_type": "serp_result",
          "query": "soc 2 automation software",
          "rank": 8,
          "url": "https://secureframe.example/soc-2-automation-comparison",
          "country": "us",
          "device": "desktop"
        }
      ],
      "recommended_follow_up": "Review Acme's SOC 2 comparison page and add clearer auditor workflow coverage before the competitor page compounds search visibility."
    }
  ],
  "suppressed": [
    {
      "reason": "jobs_page",
      "url": "https://secureframe.example/careers/product-marketing"
    }
  ]
}
```

## Alert Types

The MVP supports:

- Product launch or major feature release
- Pricing, packaging, trial, or CTA change
- New comparison, alternatives, or buyer-intent page
- SERP rank gain on tracked keywords
- AI/chatbot answer inclusion or source citation change
- Docs, API, marketplace, or integration update
- Regional availability or localized landing page change
- Positioning shift on homepage, product pages, or category pages
- Category-level competitor emergence from repeated SERP appearances

## Severity Scoring

Severity scores are 0-100:

- 25 points: direct competitive relevance to a portfolio company, tracked topic, or known competitor.
- 20 points: source freshness and confidence from publish dates, first-seen timestamps, fetch evidence, and SERP evidence.
- 15 points: commercial intent, including pricing, alternatives, comparison, demo, trial, or procurement language.
- 15 points: visibility impact from SERP rank, AI answer citation, or repeated source appearances.
- 10 points: novelty versus prior snapshots.
- 10 points: geo, city, or device specificity that affects the portfolio company's market.
- 5 points: corroboration from multiple public source types.

Automatic caps:

- Cap at 75 when the alert has only one source.
- Cap at 70 when dates are inferred rather than observed.
- Cap at 60 when the signal is general category news without direct competitor evidence.
- Cap at 50 when the page is relevant but unchanged from the previous snapshot.
- Cap at 40 for jobs, generic press boilerplate, support-only content, or cosmetic copy changes.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
portfolio-alerts run \
  --brief portfolio-watchlist.json \
  --snapshot-dir snapshots \
  --out alerts.json \
  --report-md alerts.md \
  --csv alerts.csv
```

Minimum viable UI after CLI validation:

- Portfolio watchlist editor
- Company and competitor setup table
- Query plan and credit estimate preview
- Alert inbox with severity, confidence, and owner
- Evidence drawer with fetched pages, SERP ranks, AI answer sources, timestamps, and excerpts
- Weekly portfolio digest
- Suppression rules for noisy URLs and signal types
- Export buttons for JSON, CSV, Markdown, Slack-ready text, and email-ready text

## Massive MCP Usage

- `account_status`: confirm access and estimate recurring monitoring cost before each run.
- `web_search`: discover launches, comparison pages, pricing pages, category changes, AI answer sources, and SERP rank movement.
- Google SERP parsing: preserve query, rank, title, snippet, URL, visible date, result type, country, city, device, and observed time.
- Country, city, and device targeting: identify local competitive pressure and mobile/desktop result differences.
- `web_fetch`: fetch competitor pages, portfolio company pages, pricing pages, docs, changelogs, marketplaces, and category pages with JS rendering.
- Captcha handling: recover public pages that block normal fetching while preserving fetch warnings.
- `ai_chat_completion`: classify signal type, extract evidence, score severity, summarize alerts, produce portfolio digests, and answer "why this matters" with sources.

## Guardrails

- Preserve source lineage for every alert, score driver, and recommendation.
- Separate observed facts from AI interpretation and suggested response.
- Do not infer revenue, churn, customer loss, adoption, private roadmap, or investor intent from public pages.
- Never scrape gated account-only pages, private communities, or personal data.
- Mark uncertain dates, blocked fetches, JS render failures, and single-source alerts.
- Suppress jobs pages, generic press boilerplate, support-only pages, legal pages, status pages, and cosmetic updates unless explicitly requested.
- Treat chatbot answers as leads until their cited sources are fetched or independently verified.
- Keep portfolio company data partitioned so one company's competitor signal does not leak into another company's alert.
