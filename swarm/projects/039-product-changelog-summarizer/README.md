# Product Changelog Summarizer

Product Changelog Summarizer monitors competitor release notes, docs updates, pricing pages, app-store notes, and help-center announcements, then turns messy product-change evidence into a concise competitive digest.

The first version is intentionally narrow: given a list of competitors and watched product areas, it discovers recent official changelog sources, fetches rendered pages, extracts dated changes, classifies product impact, and produces a source-backed summary for product marketing, sales enablement, and product strategy teams.

## Target User

Primary users:

- Product marketers tracking competitor launches and positioning shifts.
- PMs watching adjacent products for roadmap signals.
- Sales enablement teams that need fresh battlecard updates.
- Competitive intelligence teams replacing manual changelog review.
- Agency or analyst teams monitoring many SaaS categories at once.

## Core Workflow

1. User defines a monitoring brief:
   - Competitor names, domains, and optional known changelog URLs
   - Product areas, feature themes, and buyer segments to watch
   - Date window, geography, device, and language preferences
   - Output style, severity thresholds, and delivery cadence
2. App checks `account_status` and estimates credits for source discovery plus page fetches.
3. Massive MCP runs:
   - `web_search` and Google SERP parsing to discover official changelog, release-note, docs, blog, pricing, and help-center pages
   - `web_fetch` with JavaScript rendering for changelog pages, app pages, docs pages, and dynamic release feeds
   - Country, city, and device targeting when release visibility, pricing, or app-store copy varies by market
   - Captcha handling for help centers, community pages, or docs portals with bot protection
   - `ai_chat_completion` to extract, classify, deduplicate, and summarize changes with source references
4. App normalizes each observed change by competitor, source, date, product area, change type, audience, evidence URL, and confidence.
5. App groups changes into competitor narratives and category-level themes.
6. User receives an executive digest, detailed change table, evidence links, and JSON/CSV/Markdown exports.

## MVP Inputs

```json
{
  "workspace": {
    "name": "Acme Competitive Intel",
    "category": "Customer support platforms"
  },
  "competitors": [
    {
      "name": "Northstar Support",
      "domain": "northstarsupport.example",
      "known_sources": [
        "https://northstarsupport.example/changelog",
        "https://docs.northstarsupport.example/release-notes"
      ]
    },
    {
      "name": "Helio Desk",
      "domain": "heliodesk.example",
      "known_sources": []
    }
  ],
  "watchlist": {
    "product_areas": ["ai agents", "workflow automation", "reporting", "pricing"],
    "buyer_segments": ["enterprise support", "success operations"],
    "keywords": ["copilot", "automation", "sla", "analytics", "seat", "usage-based"]
  },
  "window": {
    "start_date": "2026-04-01",
    "end_date": "2026-05-01"
  },
  "targets": [
    {
      "country": "us",
      "city": "San Francisco",
      "language": "en-US",
      "device": "desktop"
    }
  ],
  "output": {
    "digest_style": "executive",
    "minimum_impact": "medium",
    "include_low_confidence": false
  }
}
```

## MVP Output

```json
{
  "workspace": {
    "name": "Acme Competitive Intel",
    "category": "Customer support platforms"
  },
  "summary": "Northstar Support accelerated AI-agent releases in April, while Helio Desk focused on reporting and admin controls. The most actionable sales signal is Northstar's new autonomous escalation workflow for enterprise support teams.",
  "period": {
    "start_date": "2026-04-01",
    "end_date": "2026-05-01"
  },
  "competitors": [
    {
      "name": "Northstar Support",
      "change_count": 6,
      "highest_impact": "high",
      "narrative": "Northstar is positioning around autonomous support operations, with multiple releases tied to AI triage, workflow routing, and SLA governance.",
      "notable_changes": [
        {
          "title": "Autonomous escalation workflow released",
          "date": "2026-04-18",
          "change_type": "feature_launch",
          "product_area": "ai agents",
          "impact": "high",
          "audience": "enterprise support",
          "summary": "Northstar added AI-driven escalation routing that can create workflow actions from ticket sentiment and SLA risk.",
          "evidence_ids": ["obs_northstar_changelog_2026_04_18"],
          "source_urls": ["https://northstarsupport.example/changelog"]
        }
      ]
    }
  ],
  "themes": [
    {
      "theme": "AI support automation is moving from assistive suggestions to policy-driven workflow execution.",
      "competitors": ["Northstar Support"],
      "supporting_change_ids": ["chg_001", "chg_003"],
      "confidence": "high"
    }
  ],
  "recommended_actions": [
    {
      "team": "sales_enablement",
      "action": "Update battlecards for AI escalation claims and prepare objection handling for autonomous routing.",
      "evidence_ids": ["obs_northstar_changelog_2026_04_18"]
    }
  ]
}
```

## Change Taxonomy

Each extracted change is classified as:

- `feature_launch`: net-new product capability.
- `feature_expansion`: broader availability, supported markets, integrations, or limits.
- `ai_capability`: AI model, agent, automation, generation, summarization, or assistant behavior.
- `pricing_packaging`: plan, usage, limit, trial, add-on, or SKU change.
- `integration`: app marketplace, API, webhook, partner, or connector release.
- `admin_security`: permissions, compliance, audit, SSO, SCIM, data controls, or governance.
- `ux_quality`: usability, accessibility, mobile, performance, or reliability improvement.
- `deprecation`: removed, renamed, sunset, or migrated capability.
- `docs_only`: documentation update without clear product behavior change.
- `unclear`: evidence is insufficient or conflicting.

## Impact Scoring

Impact scores are `low`, `medium`, `high`, or `critical`:

- Critical: materially changes market positioning, pricing model, compliance posture, or core workflow ownership.
- High: strong sales, roadmap, or messaging relevance for a watched segment or product area.
- Medium: meaningful product improvement but limited immediate competitive consequence.
- Low: minor UI polish, bug fix, docs-only update, or narrow availability.

Automatic caps:

- Cap at medium when the only evidence is an undated page without corroborating source text.
- Cap at low when the change is docs-only and no product behavior change is visible.
- Cap at medium when the page date falls outside the requested window but appears in a recent SERP result.
- Mark as unclear when source text conflicts across official pages.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
product-changelog-summarizer run \
  --brief changelog-brief.json \
  --out changelog-summary.json \
  --csv changelog-changes.csv \
  --report-md changelog-digest.md
```

Minimum viable UI after CLI validation:

- Competitor and source manager
- Watchlist editor for product areas, segments, and keywords
- Date-window and market targeting controls
- Credit estimate preview
- Run status by competitor and source
- Change table with filters for impact, type, product area, and confidence
- Competitor narrative cards
- Evidence drawer with rendered text, source URL, and fetch timestamp
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate and confirm available credits before monitoring runs.
- `web_search`: discover official release notes, changelogs, docs updates, pricing announcements, app-store listings, and help-center posts.
- Google SERP parsing: identify recent dated results and canonical official pages while avoiding scraper mirrors.
- `web_fetch`: render JavaScript-heavy changelogs, docs portals, and release feeds.
- Country, city, language, and device targeting: detect localized pricing, regional launch availability, and mobile-specific release copy.
- Captcha handling: keep source collection resilient for protected docs, communities, and help centers.
- `ai_chat_completion`: extract structured changes, deduplicate overlapping announcements, classify impact, and generate source-backed digest language.
