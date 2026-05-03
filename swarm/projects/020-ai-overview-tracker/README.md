# AI Overview Tracker

AI Overview Tracker monitors how Google summarizes a category over time, what sources it cites, which brands or concepts appear, and how the answer changes across location, device, and query intent. It helps SEO, content, product marketing, and competitive intelligence teams understand whether Google is framing a market in their favor or drifting toward a competitor narrative.

The first version is intentionally narrow: track one category with a stable query set, capture Google AI Overview presence and cited sources on a schedule, and produce a change report with evidence.

## Target User

Primary users:

- SEO teams tracking AI Overview visibility and source inclusion.
- Content teams deciding which topics and pages need refreshes.
- Product marketers monitoring category narratives and competitor mentions.
- Agencies reporting how Google explains client categories over time.
- Founders watching emerging categories where definitions change quickly.

## Core Workflow

1. User defines a tracking brief:
   - Category or market
   - Query set and query intents
   - Target countries, cities, and devices
   - Owned domains, competitors, and source domains to watch
   - Terms, claims, or topics that matter
   - Schedule and alert thresholds
2. App checks `account_status` and estimates cost for the scheduled run.
3. Massive MCP runs:
   - `web_search` with Google SERP parsing for each query, location, and device
   - country, city, and device targeting to capture localized AI Overview differences
   - `web_fetch` with JS rendering for AI Overview cited pages, ranking pages, and owned pages
   - captcha handling when Google or cited pages challenge collection
   - `ai_chat_completion` to extract themes, claims, entities, source roles, and narrative changes with citations
4. App stores each observation as a timestamped snapshot.
5. App compares the latest snapshot with prior snapshots.
6. User receives a source-backed trend report and alerts for meaningful changes.

## MVP Inputs

```json
{
  "category": "customer support automation",
  "queries": [
    {
      "query": "what is customer support automation",
      "intent": "definition",
      "priority": "high"
    },
    {
      "query": "best customer support automation software",
      "intent": "comparison",
      "priority": "high"
    },
    {
      "query": "customer support automation benefits",
      "intent": "problem-aware",
      "priority": "medium"
    }
  ],
  "targets": [
    { "country": "us", "city": "San Francisco", "device": "desktop" },
    { "country": "us", "city": "New York", "device": "mobile" }
  ],
  "owned_domains": ["example.com"],
  "competitors": ["Zendesk", "Intercom", "Freshdesk"],
  "watch_terms": ["AI agent", "deflection", "self-service", "live chat"],
  "schedule": "weekly",
  "alert_thresholds": {
    "ai_overview_appears": true,
    "owned_domain_removed": true,
    "competitor_mentions_added": 2,
    "summary_similarity_below": 0.72
  }
}
```

## MVP Output

```json
{
  "category": "customer support automation",
  "run_id": "aio-2026-05-02-us",
  "summary": "AI Overviews appeared for 5 of 6 tracked query-target pairs. Google now emphasizes AI agents and self-service workflows more than ticket routing. Zendesk and Intercom are cited in comparison-oriented answers, while the owned domain was not cited this run.",
  "observations": [
    {
      "query": "what is customer support automation",
      "intent": "definition",
      "target": { "country": "us", "city": "San Francisco", "device": "desktop" },
      "ai_overview_present": true,
      "summary_excerpt": "Customer support automation uses software, workflows, and AI to resolve or route customer requests with less manual effort.",
      "cited_sources": [
        {
          "url": "https://example-source.com/support-automation-guide",
          "domain": "example-source.com",
          "title": "Customer Support Automation Guide",
          "source_role": "definition",
          "owned": false,
          "competitor": false
        }
      ],
      "mentioned_entities": ["AI agents", "knowledge base", "ticket routing"],
      "mentioned_competitors": ["Zendesk"],
      "watch_terms_present": ["AI agent", "self-service"],
      "narrative_score": 82,
      "confidence": "high"
    }
  ],
  "changes": [
    {
      "change_type": "theme_shift",
      "severity": "medium",
      "query": "what is customer support automation",
      "target_key": "us:san-francisco:desktop",
      "before": "Ticket routing and macros were the dominant explanation.",
      "after": "AI agents and self-service are now dominant.",
      "evidence_urls": ["https://example-source.com/support-automation-guide"]
    }
  ],
  "alerts": [
    {
      "alert_type": "owned_domain_absent",
      "severity": "high",
      "message": "No owned domains were cited in AI Overviews for high-priority queries."
    }
  ]
}
```

## Tracking Dimensions

Each snapshot preserves:

- Query text, intent, priority, and generated query group.
- Country, city, device, and collection timestamp.
- AI Overview presence, answer text excerpt, cited sources, and SERP feature metadata.
- Organic result set, local packs, ads, and other visible Google modules.
- Source domains, owned-domain flags, competitor flags, and first-seen timestamps.
- Extracted claims, entities, watch terms, and competitor mentions.
- Similarity scores against previous snapshots and baseline category narratives.

## Change Scoring

Changes are scored 0-100 by severity:

- 25 points: AI Overview presence changed for a high-priority query.
- 20 points: cited source set changed, especially owned or competitor domains.
- 15 points: category definition or dominant theme shifted.
- 15 points: competitor mentions were added, removed, or repositioned.
- 10 points: watch terms appeared or disappeared.
- 10 points: source quality changed, such as forums replacing authoritative guides.
- 5 points: localized or device-specific divergence appeared.

Automatic severity rules:

- High severity when an owned domain disappears from a high-priority AI Overview.
- High severity when a competitor becomes cited across multiple query intents.
- Medium severity when answer wording changes but cited sources remain stable.
- Low severity when only organic ranks move and the AI Overview is unchanged.
- Informational when no AI Overview appears and the SERP otherwise stays stable.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
ai-overview-tracker run \
  --brief tracking-brief.json \
  --history-dir snapshots \
  --out latest-aio-report.json \
  --csv aio-sources.csv \
  --report-md aio-change-report.md
```

Minimum viable UI after CLI validation:

- Tracking brief setup form
- Query, target, and schedule editor
- Credit estimate preview
- Run status by query and target
- AI Overview presence matrix
- Source citation timeline
- Narrative and competitor mention diff view
- Alerts table with severity and evidence
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate and confirm available credits before scheduled or manual runs.
- `web_search`: capture Google SERPs and AI Overview-bearing result pages for each query-target pair.
- Google SERP parsing: preserve AI Overview presence, cited URLs, organic results, ranks, snippets, and SERP features.
- Country, city, and device targeting: compare how AI Overviews vary by market and surface.
- `web_fetch`: fetch cited sources and ranking pages with JS rendering and captcha handling for source verification.
- `ai_chat_completion`: extract claims, themes, entities, source roles, competitor mentions, and source-backed narrative changes.

## Guardrails

- Treat AI Overview text as volatile observation, not a stable Google endorsement.
- Store short excerpts and structured claims, not large copied answer text.
- Keep AI Overview facts, organic SERP facts, fetched source facts, and AI-generated synthesis separate.
- Preserve URL, query, target, rank, and timestamp lineage for every claim.
- Do not infer traffic, revenue, or conversion impact from citation presence alone.
- Label missing or blocked observations instead of treating them as removals.
- Compare like-for-like targets only; never merge mobile, desktop, city, and country observations.
- Avoid automated scraping of gated pages, private communities, or personal data.
