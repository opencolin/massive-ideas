# Prototype

## Goal

Build a working public vendor risk monitor that can track 10 to 25 vendors and produce a daily sourced operations and commercial risk digest.

The prototype should prove that Massive MCP can reliably collect dynamic public pages, compare changes over time, enrich with search/news context, and summarize only evidence-backed risks.

## Inputs

Use a simple `vendors.csv` or JSON config:

```json
[
  {
    "vendor": "ExampleVendor",
    "owner": "Procurement",
    "criticality": "high",
    "surfaces": [
      {
        "type": "status",
        "url": "https://status.example.com"
      },
      {
        "type": "pricing",
        "url": "https://example.com/pricing"
      },
      {
        "type": "docs",
        "url": "https://docs.example.com/api"
      }
    ],
    "queries": [
      "ExampleVendor outage",
      "ExampleVendor pricing",
      "ExampleVendor layoffs",
      "ExampleVendor acquisition"
    ],
    "locales": [
      {
        "country": "US",
        "city": "San Francisco",
        "device": "desktop"
      }
    ]
  }
]
```

## Collection Pipeline

1. Load vendor config.
2. Call `account_status` before scheduled runs to confirm account readiness.
3. Fetch each public URL with `web_fetch`.
4. Enable JS rendering for pages that need client-side hydration.
5. Apply country, city, and device targeting when monitoring localized pricing or availability.
6. Store raw response metadata, rendered text, structured page sections, source URL, fetch time, and rendered screenshot reference if available.
7. Run `web_search` for each query and parse Google SERP results for title, URL, snippet, rank, source, and date when available.
8. Store each search result snapshot separately from page snapshots.

## Change Detection

Normalize each captured surface before diffing:

- Remove navigation, cookie banners, common footers, and repetitive legal boilerplate where possible.
- Preserve page headings, tables, dates, incident titles, pricing values, package names, limits, SLA language, and links.
- Convert pricing tables and docs headings into structured records.
- Hash stable sections to identify meaningful changes.

Diff types:

- Added or removed pricing tiers.
- Numeric price, limit, or SLA changes.
- New or resolved incidents.
- New deprecation, retirement, or breaking-change language.
- Changed legal or policy effective dates.
- New search results from credible news, official vendor posts, or customer forums.
- SERP rank changes for queries tied to risk.

## AI Classification

Use `ai_chat_completion` to convert raw diffs into concise risk records:

```json
{
  "vendor": "ExampleVendor",
  "risk_type": "commercial",
  "severity": "medium",
  "confidence": "high",
  "surface": "pricing",
  "summary": "The public pricing page added an annual minimum commitment for the Pro tier.",
  "business_impact": "Renewals may require budget review and negotiation prep.",
  "evidence": [
    {
      "url": "https://example.com/pricing",
      "observed_at": "2026-05-02T09:00:00-07:00",
      "excerpt": "Annual commitment required"
    }
  ],
  "recommended_action": "Flag for procurement owner before renewal."
}
```

Prompt requirements:

- State that the task is public vendor operations and commercial risk monitoring.
- Require citations to collected public evidence.
- Forbid cybersecurity testing conclusions.
- Ask the model to distinguish observed changes from inferred business impact.
- Return structured JSON plus a short human digest.

## Digest Output

Generate `daily-digest.md`:

- Executive summary.
- New high-severity risks.
- Commercial changes.
- Operational/status changes.
- Docs/product continuity changes.
- News and search changes.
- Watchlist items with low confidence.
- No-change vendors.

Example digest item:

```markdown
### ExampleVendor - Commercial Risk - Medium

The pricing page appears to have added a new annual minimum commitment for the Pro tier.

- Evidence: https://example.com/pricing
- Observed: 2026-05-02 09:00 PT
- Confidence: High
- Suggested owner: Procurement
- Recommended action: Add to renewal prep notes and ask vendor rep whether existing contracts are grandfathered.
```

## Minimal Architecture

- `config/vendors.json`: monitored vendors and surfaces.
- `runs/{date}/`: raw snapshots, normalized text, SERP snapshots, and risk records.
- `snapshots/latest/`: latest normalized state per vendor and surface.
- `src/collect.ts`: Massive MCP collection calls.
- `src/normalize.ts`: text and table normalization.
- `src/diff.ts`: meaningful diff detection.
- `src/classify.ts`: AI risk classification.
- `src/digest.ts`: Markdown and JSON output.

## Prototype Milestones

1. Track three vendors across status, pricing, docs, and news queries.
2. Produce normalized snapshots and deterministic diffs.
3. Generate sourced risk records with severity, confidence, and owner.
4. Produce a daily digest suitable for procurement or operations review.
5. Add locale comparison for one pricing page using country/city/device targeting.

