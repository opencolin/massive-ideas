# Sales Trigger Feed

A "why now?" feed for sales teams that turns public events into sourced account triggers. The MVP watches launches, hiring, funding, outages, regulatory changes, and other market signals, then ranks accounts by urgency and explains the best outreach angle.

## Problem

Most outbound teams know which accounts they want, but not when to contact them. Timing signals are scattered across company blogs, changelogs, status pages, job boards, funding announcements, news articles, government sites, and search results. Reps either miss the moment or spend too much time proving that a trigger is real.

This feed gives teams a daily list of accounts with a clear answer to "why now?" backed by sources.

## Target Users

- B2B account executives and SDR teams working named-account lists
- founder-led sales teams that need personalized outreach hooks
- customer success and expansion teams watching install-base change
- RevOps teams building trigger-based territory and campaign workflows

## MVP Outcome

Given a list of target accounts and one or more trigger categories, produce a ranked feed:

| Account | Trigger | Why now | Suggested angle | Urgency | Sources |
| --- | --- | --- | --- | --- | --- |
| Acme Health | regulation | New state privacy rule affects patient data vendors | Lead with compliance readiness and audit workflow | 86 | state rule, trust page, careers page |
| Northstar AI | launch | Shipped enterprise admin features and hiring support engineers | Lead with scaling customer support operations | 79 | changelog, blog, jobs |

Each item should distinguish observed evidence from sales inference.

## Why Massive MCP

Massive MCP is a strong fit because the product depends on current, heterogeneous web evidence.

- `web_search`: discover recent trigger events across Google results, news, company pages, job posts, and regulatory pages.
- Google SERP parsing: keep discovery repeatable with structured titles, snippets, URLs, and ranking context.
- `web_fetch`: fetch source pages, including JS-rendered changelogs, careers pages, status pages, and modern documentation sites.
- Captcha handling: improve resilience for public pages that block simple fetchers.
- Country, city, and device targeting: localize regulation, hiring, expansion, and search result relevance.
- `ai_chat_completion`: classify triggers, extract evidence, infer likely sales angles, and produce concise sourced cards.
- `account_status`: gate scheduled runs and choose fast, standard, or deep collection modes.

## Trigger Types

The MVP should support six trigger classes:

- Launches: product launches, changelog entries, new integrations, pricing pages, public roadmap updates.
- Hiring: role spikes, new departments, first security/legal/data roles, new city hiring.
- Funding: recent rounds, grants, acquisitions, investor announcements, expansion budgets.
- Outages: status incidents, public postmortems, reliability complaints, support interruptions.
- Regulation: new laws, enforcement deadlines, industry requirements, government notices.
- Business change: partnerships, executive hires, market expansion, rebrands, layoffs, procurement signals.

## Core Workflow

1. Ingest account list:
   - company name, website, market, ICP segment, territory owner, optional CRM ID.
2. Build trigger queries per account and category:
   - `{company} launch changelog integration`
   - `{company} careers hiring security data engineer`
   - `{company} outage status postmortem incident`
   - `{industry} regulation deadline {state or country}`
3. Search with recency and location targeting.
4. Fetch selected source pages with JS rendering and captcha handling enabled.
5. Extract structured trigger evidence:
   - trigger type, event date, exact observed fact, affected team, source URL, confidence.
6. Generate sales interpretation:
   - why now, likely buyer pain, suggested outreach angle, disqualifiers.
7. Score and rank:
   - recency, trigger strength, account fit, source confidence, actionability.
8. Export:
   - Markdown feed, JSON records, CSV for CRM import, optional Slack-ready digest.

## MVP Scope

### In Scope

- account-list CSV input
- configurable trigger categories
- search and rendered fetch collection layer
- source-grounded JSON extraction
- simple scoring model
- Markdown, JSON, and CSV feed outputs
- deduplication across repeated sources and syndicated articles
- run log with tool calls, skipped URLs, and extraction confidence

### Out of Scope

- automatic email generation or sending
- direct CRM writeback
- authenticated LinkedIn scraping
- continuous browser UI
- long-term historical trend warehouse
- claims from unsourced LLM knowledge

## Data Model

```json
{
  "account": {
    "name": "Acme Health",
    "website": "https://example.com",
    "market": "US healthcare",
    "owner": "sdr-west"
  },
  "trigger": {
    "type": "regulation",
    "eventDate": "2026-04-28",
    "observedEvidence": "California agency published a new enforcement deadline for patient data handling.",
    "whyNow": "Healthcare vendors serving California customers may need to adjust compliance workflows before the deadline.",
    "suggestedAngle": "Ask whether their team is updating patient-data audit and vendor review processes.",
    "confidence": 0.82
  },
  "score": {
    "urgency": 86,
    "components": {
      "recency": 24,
      "triggerStrength": 22,
      "accountFit": 18,
      "sourceQuality": 14,
      "actionability": 8
    }
  },
  "sources": [
    {
      "url": "https://example.gov/privacy-rule",
      "title": "New patient data enforcement deadline",
      "type": "regulation",
      "fetchedAt": "2026-05-02T15:00:00Z"
    }
  ]
}
```

## Scoring

Default urgency score is 100 points:

- recency: 0-25
- trigger strength: 0-25
- account fit: 0-20
- source quality: 0-15
- actionability: 0-15

Scoring should remain editable by persona. A security seller may upweight outages, compliance, and first-security-hire signals. A devtools seller may upweight launches, engineering hiring, integrations, and infrastructure postmortems.

## CLI Sketch

```bash
trigger-feed run --accounts accounts.csv --config config.security.yaml --days 14
trigger-feed report --run latest --format markdown --out reports/daily-feed.md
trigger-feed export --run latest --format csv --out exports/crm-triggers.csv
```

## Risks

- Trigger events can be stale, duplicated, or syndicated from the same source.
- Outage and regulation signals can be sensitive; wording must stay factual and non-alarmist.
- Hiring signals may reflect evergreen roles rather than urgent buying intent.
- Launches may be minor and not worth outreach.
- Company names can collide with unrelated brands or subsidiaries.
- Some public sources may block crawling or require careful rate limiting.

## Build Plan

1. Build a local CLI with `run`, `report`, and `export` commands.
2. Add Massive MCP adapters for `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.
3. Implement trigger-specific query templates and source selection rules.
4. Add strict JSON extraction with observed evidence, inference, confidence, and citations.
5. Implement deduplication and urgency scoring.
6. Evaluate on a hand-labeled set of 50 account-trigger pairs.
