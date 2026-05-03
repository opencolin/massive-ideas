# Pricing Page Change Detector

Pricing Page Change Detector monitors competitor pricing pages for plan, packaging, discount, trial, seat-limit, usage-limit, and compliance-related changes. It helps sales, product marketing, RevOps, and founders catch commercially important pricing moves without manually checking a long list of pages every week.

The first version is intentionally narrow: track known pricing, plans, and packaging URLs for a competitor set, fetch rendered pages on a schedule, compare them to stored snapshots, and produce source-backed alerts for meaningful changes.

## Target User

Primary users:

- Product marketers tracking competitor packaging and positioning.
- Sales leaders who need fresh objection handling when competitors change plans.
- RevOps teams maintaining battlecards, quote guidance, and deal desk notes.
- Founders watching whether adjacent products move upmarket or downmarket.
- Agencies or consultants monitoring pricing pages across a category.

## Core Workflow

1. User submits a monitoring brief:
   - Owned company and category
   - Competitor names and pricing URLs
   - Geography, city, and device targets
   - Change sensitivity and excluded sections
   - Alert destinations and review cadence
2. App checks run feasibility and credit budget with `account_status`.
3. App uses `web_fetch` with JS rendering, captcha handling, country/city/device targeting, and stable viewport settings to capture each pricing page.
4. App extracts visible pricing facts, plan cards, feature rows, discount copy, trial terms, CTA text, FAQ answers, and page metadata.
5. App compares the current observation to the previous canonical snapshot.
6. App uses `ai_chat_completion` to classify the business meaning of each change and write a concise alert with source-backed evidence.
7. User receives a report with changed facts, unchanged pages, uncertain pages, screenshots or excerpts, confidence, and recommended follow-up.

## MVP Inputs

```json
{
  "owned_company": {
    "name": "Acme Analytics",
    "domain": "acmeanalytics.example",
    "category": "product analytics"
  },
  "competitors": [
    {
      "name": "MetricFlow",
      "domain": "metricflow.example",
      "pricing_urls": [
        "https://metricflow.example/pricing",
        "https://metricflow.example/plans"
      ]
    },
    {
      "name": "DashPilot",
      "domain": "dashpilot.example",
      "pricing_urls": ["https://dashpilot.example/pricing"]
    }
  ],
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "cadence": "weekly",
  "sensitivity": "commercial_only",
  "exclude_selectors_or_text": [
    "footer",
    "copyright",
    "last updated",
    "cookie banner"
  ],
  "alert_thresholds": {
    "price_change_percent": 5,
    "feature_change_severity": "medium",
    "notify_on_trial_change": true
  }
}
```

## MVP Output

```json
{
  "run_id": "pricing-run-2026-05-02",
  "summary": "MetricFlow raised Pro annual pricing from $49 to $59 per seat and moved SSO from Business to Enterprise. DashPilot pricing was unchanged.",
  "changes": [
    {
      "competitor": "MetricFlow",
      "url": "https://metricflow.example/pricing",
      "change_type": "price_increase",
      "severity": "high",
      "confidence": "high",
      "observed_at": "2026-05-02T16:20:00Z",
      "before": {
        "plan": "Pro",
        "billing_period": "annual",
        "price": "$49",
        "unit": "seat/month"
      },
      "after": {
        "plan": "Pro",
        "billing_period": "annual",
        "price": "$59",
        "unit": "seat/month"
      },
      "evidence": [
        {
          "source_type": "web_fetch",
          "url": "https://metricflow.example/pricing",
          "fetched_at": "2026-05-02T16:20:00Z",
          "excerpt": "Pro $59 per seat/month billed annually"
        },
        {
          "source_type": "snapshot_diff",
          "previous_snapshot_id": "pricing-run-2026-04-25",
          "current_snapshot_id": "pricing-run-2026-05-02",
          "field": "plans.Pro.annual_price"
        }
      ],
      "recommended_follow_up": "Update battlecards and check whether open Pro evaluations need revised ROI guidance."
    }
  ],
  "unchanged": [
    {
      "competitor": "DashPilot",
      "url": "https://dashpilot.example/pricing",
      "confidence": "high"
    }
  ],
  "warnings": []
}
```

## Change Types

The detector separates cosmetic edits from commercial changes:

- `price_increase` and `price_decrease`
- `new_plan`, `removed_plan`, and `renamed_plan`
- `billing_period_change`
- `free_trial_change`
- `discount_or_promo_change`
- `usage_limit_change`
- `seat_limit_change`
- `feature_gating_change`
- `enterprise_contact_sales_change`
- `cta_or_positioning_change`
- `currency_or_region_variant`
- `cosmetic_or_uncertain_change`

## Scoring

Severity scores are 0-100:

- 25 points: direct price, billing, or discount change.
- 20 points: plan availability, plan name, or tier structure change.
- 20 points: feature gating, usage limits, or seat limits changed.
- 15 points: sales motion changed, such as contact-sales gates or trial removal.
- 10 points: regional or device-specific pricing variance.
- 10 points: evidence confidence from rendered fetches, stable snapshots, and extracted facts.

Automatic caps:

- Cap at 65 when the page could not be rendered with the requested geo or device target.
- Cap at 60 when only raw text changed but structured pricing facts are unchanged.
- Cap at 55 when a modal, cookie banner, or personalization block may have affected the observation.
- Cap at 50 when the change appears only on one retry.
- Cap at 40 when the change is cosmetic, footer-only, or unrelated to pricing.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
pricing-change-detector run \
  --brief pricing-monitor-brief.json \
  --snapshot-dir snapshots \
  --out pricing-change-report.json \
  --report-md pricing-change-report.md \
  --changes-csv pricing-changes.csv
```

Minimum viable UI after CLI validation:

- Competitor and pricing URL setup form
- Geo, city, device, cadence, and sensitivity controls
- Credit estimate preview
- Snapshot history by competitor and URL
- Diff viewer for plan cards and feature tables
- Alert feed with evidence drawers
- Export buttons for JSON, CSV, and Markdown
