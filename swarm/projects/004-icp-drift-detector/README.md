# ICP Drift Detector

Detect when a target-account list is drifting away from the profile of the company's best customers.

## Problem

Revenue teams often define an ideal customer profile once, then keep importing leads from conferences, inbound forms, enrichment vendors, and outbound lists. Over time, the active account universe can drift toward smaller companies, weaker buying signals, irrelevant geographies, or categories that look similar on paper but convert poorly.

This MVP compares target accounts against a reference set of best customers and produces a ranked drift report with evidence.

## Target User

- Growth and revenue operations teams managing account-based marketing lists.
- Sales leaders reviewing territory quality.
- Founders validating whether a new lead source matches their best customers.

## Inputs

- `best_customers.csv`: canonical accounts that represent the current ICP.
- `target_accounts.csv`: accounts to test for drift.
- Optional configuration:
  - expected countries or cities
  - preferred company-size ranges
  - required keywords or excluded categories
  - source labels such as `webinar`, `apollo`, `inbound`, or `partner`

Minimum CSV columns:

```csv
account_name,domain,country,city,employee_count,industry,source
```

## How Massive MCP Helps

Massive MCP is used to enrich and verify accounts beyond static CSV fields:

- `web_fetch`: fetch company homepages, about pages, pricing pages, and careers pages with JS rendering when needed.
- `web_search`: discover recent company descriptions, funding, job posts, and category pages.
- Google SERP parsing: extract short snippets and source URLs for account evidence.
- country, city, and device targeting: validate localized pages and region-specific positioning.
- captcha handling: improve success rate on protected company and directory pages.
- `ai_chat_completion`: summarize discovered evidence into normalized ICP traits with citations.
- `account_status`: monitor enrichment capacity and degraded account-fetch states.

## MVP Output

For each target account:

- `fit_score`: 0-100 similarity score against best customers.
- `drift_flags`: concise reasons such as `too_small`, `wrong_geo`, `category_mismatch`, `low_buying_signal`.
- `evidence`: source-backed snippets used for classification.
- `recommended_action`: `keep`, `review`, or `remove`.

For the whole list:

- drift score by source
- top dimensions causing drift
- representative examples
- recommended ICP rule updates

## First Build

1. Load best customers and target accounts from CSV.
2. Enrich domains using Massive MCP.
3. Normalize traits:
   - company category
   - target buyer
   - geography
   - company size
   - maturity signals
   - hiring or growth signals
4. Build a baseline profile from best customers.
5. Score target accounts against the baseline.
6. Export `drift_report.csv` and `drift_summary.md`.

## Non-Goals

- Replacing CRM scoring.
- Predicting closed-won probability from private CRM history.
- Fully automated lead removal.
- Deep technographic enrichment without explicit data access.

## Success Criteria

- A revenue operator can upload two CSVs and understand which lead sources are degrading list quality.
- Every low-fit recommendation includes at least one cited public source or clearly states that enrichment was unavailable.
- The MVP can process 250 target accounts in a batch and produce a useful report within one working session.

