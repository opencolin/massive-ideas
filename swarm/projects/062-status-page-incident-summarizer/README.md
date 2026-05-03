# Status Page Incident Summarizer

Status Page Incident Summarizer monitors public status pages, incident feeds, uptime histories, and support announcements, then turns scattered outage updates into concise reliability briefs for customer-facing and technical teams.

The first version is intentionally narrow: given a list of vendors, public status-page URLs, and business-critical services, it fetches rendered status pages, extracts recent incidents, normalizes timelines, identifies customer impact, and produces source-backed summaries with recommended follow-up.

## Target User

Primary users:

- Customer success teams preparing proactive account updates after vendor incidents.
- SRE and platform teams tracking third-party dependency reliability.
- Procurement and vendor management teams reviewing operational risk.
- Support leaders who need clear timelines for inbound customer questions.
- Founders or operators monitoring outages across a stack of SaaS providers.

## Core Workflow

1. User submits a monitoring brief:
   - Vendor names, domains, and known public status-page URLs
   - Services, regions, and dependency categories to watch
   - Date window, country, city, device, and language preferences
   - Severity thresholds and output style
2. App checks `account_status` and estimates credits for discovery, fetches, and summarization.
3. Massive MCP runs:
   - `web_search` and Google SERP parsing to discover official status pages, incident history pages, and support announcements
   - `web_fetch` with JavaScript rendering for dynamic status dashboards and incident timelines
   - Country, city, and device targeting when status pages or support banners vary by market
   - Captcha handling for protected support portals or vendor community pages
   - `ai_chat_completion` to extract incident timelines, classify impact, deduplicate updates, and generate source-backed summaries
4. App normalizes each incident by vendor, affected component, status, severity, start time, resolution time, duration, impacted region, evidence URL, and confidence.
5. App groups incident updates into vendor-level reliability narratives and cross-vendor dependency themes.
6. User receives an executive summary, incident table, timeline details, evidence links, and JSON/CSV/Markdown exports.

## MVP Inputs

```json
{
  "workspace": {
    "name": "Acme Ops",
    "dependency_stack": "Customer support and data platform"
  },
  "vendors": [
    {
      "name": "Northstar Cloud",
      "domain": "northstarcloud.example",
      "known_status_urls": [
        "https://status.northstarcloud.example",
        "https://northstarcloud.example/status/history"
      ],
      "watched_components": ["api", "webhooks", "us-east", "auth"]
    },
    {
      "name": "Helio Desk",
      "domain": "heliodesk.example",
      "known_status_urls": [],
      "watched_components": ["ticket ingestion", "email delivery", "reporting"]
    }
  ],
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
    "minimum_severity": "minor",
    "include_unresolved": true,
    "digest_style": "customer_success"
  }
}
```

## MVP Output

```json
{
  "workspace": {
    "name": "Acme Ops",
    "dependency_stack": "Customer support and data platform"
  },
  "period": {
    "start_date": "2026-04-01",
    "end_date": "2026-05-01"
  },
  "summary": "Northstar Cloud had one high-impact API incident affecting webhook delivery for 74 minutes. Helio Desk had two minor reporting degradations with no customer-facing ingestion impact.",
  "vendors": [
    {
      "name": "Northstar Cloud",
      "incident_count": 1,
      "highest_severity": "major",
      "total_reported_duration_minutes": 74,
      "narrative": "Northstar's April reliability risk was concentrated in API and webhook delivery, with a resolved regional dependency issue in us-east.",
      "notable_incidents": [
        {
          "id": "inc_northstar_2026_04_18_api",
          "title": "API errors and delayed webhook delivery",
          "status": "resolved",
          "severity": "major",
          "started_at": "2026-04-18T14:05:00Z",
          "resolved_at": "2026-04-18T15:19:00Z",
          "duration_minutes": 74,
          "affected_components": ["api", "webhooks", "us-east"],
          "impact_summary": "Customers saw elevated API error rates and delayed webhook delivery in us-east.",
          "evidence_ids": ["obs_northstar_status_2026_04_18"],
          "source_urls": ["https://status.northstarcloud.example/incidents/abc123"]
        }
      ]
    }
  ],
  "themes": [
    {
      "theme": "Webhook delivery is the highest-risk dependency for customer-facing workflows this month.",
      "vendors": ["Northstar Cloud"],
      "supporting_incident_ids": ["inc_northstar_2026_04_18_api"],
      "confidence": "high"
    }
  ],
  "recommended_actions": [
    {
      "team": "customer_success",
      "action": "Notify accounts that depend on real-time webhooks and include the incident window plus vendor resolution link.",
      "evidence_ids": ["obs_northstar_status_2026_04_18"]
    }
  ]
}
```

## Incident Taxonomy

Each extracted incident is classified as:

- `outage`: service unavailable or hard failure.
- `degradation`: slower, delayed, or partially impaired service.
- `maintenance`: planned maintenance with possible impact.
- `security`: security incident, auth disruption, certificate problem, or access control issue.
- `data_delay`: ingestion, sync, export, analytics, or reporting lag.
- `email_delivery`: email, notification, webhook, or messaging delay.
- `regional`: localized incident or infrastructure-zone issue.
- `third_party_dependency`: upstream provider caused or contributed to impact.
- `resolved_no_impact`: vendor update says no customer impact.
- `unclear`: evidence is insufficient or conflicting.

## Severity Scoring

Severity values are `informational`, `minor`, `major`, and `critical`:

- Critical: widespread production outage, data loss, security exposure, or sustained business-critical workflow failure.
- Major: customer-visible outage or degradation for a watched service, region, or core dependency.
- Minor: short degradation, limited component issue, or delayed non-critical workflow.
- Informational: planned maintenance, postmortem, or no-impact update.

Automatic caps:

- Cap at minor when the only evidence is a status badge without incident details.
- Cap at minor when the incident is planned maintenance and no unexpected impact is reported.
- Cap at major when evidence suggests customer impact but start or resolution times are missing.
- Mark as unclear when status-page text conflicts with support or postmortem language.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
status-incident-summarizer run \
  --brief status-brief.json \
  --out incident-summary.json \
  --csv incidents.csv \
  --report-md incident-brief.md
```

Minimum viable UI after CLI validation:

- Vendor and status-source manager
- Watched component and dependency editor
- Date-window and market targeting controls
- Credit estimate preview
- Run status by vendor and source
- Incident table with filters for severity, status, component, region, and confidence
- Timeline drawer with source excerpts and fetched timestamps
- Vendor reliability narrative cards
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate and confirm available credits before collection runs.
- `web_search`: discover official status pages, history pages, incident reports, postmortems, and support announcements.
- Google SERP parsing: identify canonical vendor-owned status pages while avoiding outage aggregators as primary evidence.
- `web_fetch`: render JavaScript-heavy status dashboards, incident timelines, and component tables.
- Country, city, language, and device targeting: detect regional banners, localized support notices, and mobile-specific status displays.
- Captcha handling: keep collection resilient for protected support portals or community pages.
- `ai_chat_completion`: extract incident timelines, classify severity, deduplicate updates, identify affected components, and generate source-backed digest language.
