# Competitor Pricing Tracker

Competitor Pricing Tracker monitors competitor pricing pages across countries, cities, and devices, then alerts teams when packaging, currency, discounting, plan limits, or trial offers change.

The product is intentionally evidence-first: every detected price or plan change links back to the captured page, SERP result, rendered text, screenshot metadata, and crawl context that produced it.

## Target User

Pricing, product marketing, growth, and sales enablement teams that need to understand what buyers in different markets actually see before a launch, price test, campaign, or renewal cycle.

## Core Workflow

1. User enters competitors and pages to monitor:
   - Competitor name
   - Domain
   - Pricing URL or discovery query
   - Target countries, cities, devices, and cadence
   - Products, plans, currencies, and keywords to watch
2. Tracker runs a preflight with `account_status` to estimate crawl capacity and cost.
3. Tracker discovers or validates pricing pages using `web_search` with Google SERP parsing.
4. Tracker fetches pages with `web_fetch`, JS rendering, captcha handling, and location/device targeting.
5. `ai_chat_completion` extracts normalized pricing facts and compares them with the previous snapshot.
6. User gets a change feed, country/device comparison table, and source-backed alert summary.

## MVP Inputs

```json
{
  "workspace": "Acme Pricing Team",
  "monitors": [
    {
      "competitor": "ExampleCRM",
      "domain": "example-crm.com",
      "pricing_url": "https://example-crm.com/pricing",
      "markets": [
        { "country": "us", "city": "New York", "currency": "USD" },
        { "country": "gb", "city": "London", "currency": "GBP" },
        { "country": "de", "city": "Berlin", "currency": "EUR" }
      ],
      "devices": ["desktop", "mobile"],
      "cadence": "daily",
      "watch_terms": ["starter", "pro", "enterprise", "free trial", "annual", "seat"]
    }
  ]
}
```

## MVP Output

```json
{
  "competitor": "ExampleCRM",
  "pricing_url": "https://example-crm.com/pricing",
  "snapshot_at": "2026-05-02T12:00:00Z",
  "market": { "country": "gb", "city": "London", "device": "mobile" },
  "changes": [
    {
      "type": "price_change",
      "plan": "Pro",
      "previous": { "amount": 39, "currency": "GBP", "billing_period": "month" },
      "current": { "amount": 45, "currency": "GBP", "billing_period": "month" },
      "delta_percent": 15.4,
      "confidence": "high",
      "evidence_url": "https://example-crm.com/pricing"
    }
  ],
  "current_plans": [
    {
      "name": "Pro",
      "amount": 45,
      "currency": "GBP",
      "billing_period": "month",
      "billing_basis": "per seat",
      "trial": "14 days",
      "notable_limits": ["1,000 contacts", "5 automations"]
    }
  ],
  "summary": "ExampleCRM raised the mobile-visible UK Pro plan from GBP 39 to GBP 45 per seat per month.",
  "recommended_action": "Update UK battlecards and check whether annual discount messaging changed."
}
```

## Massive MCP Usage

- `account_status`: preflight credits, quota, and feature access before scheduled monitor runs.
- `web_search`: discover pricing URLs, localized pricing pages, help docs, changelog mentions, and SERP-visible offers.
- Google SERP parsing: identify localized landing pages, ad-like snippets, and country-specific price messaging.
- `web_fetch`: fetch pricing pages with JS rendering, captcha handling, and country/city/device targeting.
- `ai_chat_completion`: extract plan names, prices, currencies, billing periods, entitlements, discounts, trials, and source-grounded change summaries.

## Guardrails

- Never report a change without a current source and a previous comparable snapshot.
- Separate exact extracted prices from inferred pricing strategy.
- Mark confidence low when pricing is image-only, hidden behind interaction, personalized, or inconsistent across fetches.
- Preserve crawl context: country, city, device, timestamp, final URL, status code, render setting, and captcha result.
- Avoid gated account-only pricing and private customer quote data.

## First Build

Ship as a CLI plus JSON/CSV output before building dashboards:

```bash
pricing-tracker run \
  --config monitors.json \
  --out snapshots.json \
  --changes changes.csv
```

Minimum viable UI after CLI validation:

- Monitor setup form
- Latest run status
- Competitor x market x device pricing matrix
- Change feed with confidence and evidence links
- Snapshot detail view showing extracted facts and raw source references

