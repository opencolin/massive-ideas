# Investor CRM Enricher

Investor CRM Enricher turns a founder's rough investor list into a source-backed CRM sheet with investor focus areas, founder fit, recent activity, and warm outreach angles. It is built for founders who have names, firms, domains, or exported CRM rows but do not have time to manually research each investor before fundraising.

The MVP is intentionally practical: enrich public investor and firm signals, classify sectors and stages, summarize recent investments or public activity, and produce a ranked export that helps founders prioritize outreach.

## Target User

Primary users:

- Seed to Series B founders preparing an investor pipeline.
- Founder chiefs of staff or operators cleaning an existing CRM.
- Fundraising advisors building shortlists across sectors and geographies.
- Accelerators helping cohorts identify relevant investors.

## Problem

Founder CRM data is usually sparse, stale, and hard to act on. A row may only contain "Jane Lee, Example Ventures" or a firm homepage. Founders need to know:

- Does this investor actually invest in our sector, stage, and region?
- What companies, theses, posts, or announcements show recent activity?
- Is there a specific reason to reach out now?
- Which source supports each claim?

Manual research works but does not scale across 100 to 500 CRM rows. Generic enrichment tools add contact data but often miss investor-specific context and recency.

## MVP Inputs

Required:

- CSV, JSON, or pasted rows with at least one of investor name, firm name, profile URL, firm domain, LinkedIn URL, or portfolio URL.
- Founder company brief: sector, stage, geography, customer type, traction, fundraising target, and exclusions.

Optional:

- Target countries, cities, and device profile for rendered pages.
- Lookback window for recent activity, defaulting to 180 days.
- Existing CRM owner/status fields to preserve in exports.
- Blocklist of firms, competitors, or non-target sectors.

Example input:

```json
{
  "company_brief": {
    "name": "Acme Data",
    "sector": "healthcare data infrastructure",
    "stage": "seed",
    "geo": "United States",
    "customers": "mid-market healthcare providers",
    "raise": "$3M seed"
  },
  "lookback_days": 180,
  "rows": [
    {
      "investor_name": "Jane Lee",
      "firm": "Example Ventures",
      "profile_url": "https://exampleventures.com/team/jane-lee"
    }
  ]
}
```

## MVP Outputs

The MVP returns CSV, JSON, and Markdown notes:

| Field | Description |
| --- | --- |
| `investor_name` | Normalized investor name when available |
| `firm` | Normalized firm name |
| `role` | Partner, principal, angel, scout, platform, or unknown |
| `firm_domain` | Best supported official domain |
| `sectors` | Publicly supported sectors, themes, or thesis areas |
| `stages` | Publicly supported investment stages |
| `geographies` | Publicly supported geographic focus |
| `recent_activity` | Recent investments, posts, announcements, talks, podcasts, or portfolio updates |
| `fit_score` | 0-100 fit against the founder company brief |
| `fit_reasons` | 2-5 concise reasons supporting the score |
| `outreach_angle` | One founder-ready reason to contact this investor |
| `confidence` | `high`, `medium`, or `low` based on source quality |
| `source_urls` | URLs backing the enrichment |
| `source_snippets` | Short evidence excerpts tied to the row |
| `warnings` | Ambiguity, stale evidence, same-name conflicts, or blocked pages |

## Massive MCP Usage

- `account_status`: estimate capacity before fetching and warn when the input list is too large for available quota.
- `web_search`: discover official firm pages, investor profiles, portfolio pages, recent announcements, podcasts, interviews, and Google SERP snippets.
- `web_fetch`: render firm websites, portfolio pages, JavaScript-heavy team pages, news pages, and profile pages.
- `ai_chat_completion`: normalize investors, extract sectors and stages, classify recent activity, score fit, and produce cited outreach angles.

Useful platform features:

- JS rendering for VC websites built with modern frontend frameworks.
- Captcha handling for lightly protected public sites.
- Country/city/device targeting for region-specific search results and firm pages.
- Google SERP parsing to separate official pages from similarly named investors.
- Chatbot answers with sources for evidence-backed summaries.

## Core Workflow

1. Check `account_status` and estimate run size from row count and lookback window.
2. Normalize input rows into candidate investors and firms.
3. For each row, search for official firm, team, portfolio, blog, news, and profile sources.
4. Fetch the highest-confidence public pages with JS rendering enabled.
5. Extract investor role, firm domain, sectors, stages, geography, and portfolio evidence.
6. Search for recent activity within the configured lookback window.
7. Score the row against the founder company brief.
8. Generate a concise outreach angle with supporting sources.
9. Export CRM-ready CSV/JSON and a Markdown shortlist report.

## MVP Scope

In scope:

- Public web sources only.
- Investor, firm, sector, stage, geography, and recent-activity enrichment.
- Evidence-backed fit scoring.
- CSV/JSON/Markdown exports.
- Preservation of original CRM columns.
- Ambiguity warnings for same-name investors or unsupported claims.

Out of scope:

- Private databases, paid contact enrichment, or email guessing.
- Login-protected CRM writeback.
- Fully automated outreach.
- Investment advice or claims about probability of funding.
- Scraping private social feeds or gated communities.

## Example Output Row

```json
{
  "investor_name": "Jane Lee",
  "firm": "Example Ventures",
  "role": "Partner",
  "firm_domain": "exampleventures.com",
  "sectors": ["healthcare infrastructure", "data platforms", "vertical SaaS"],
  "stages": ["seed", "series a"],
  "geographies": ["United States"],
  "recent_activity": [
    {
      "type": "investment_announcement",
      "title": "Example Ventures backs a care coordination data company",
      "observed_date": "2026-03-14",
      "source_url": "https://exampleventures.com/news/care-data-seed"
    }
  ],
  "fit_score": 88,
  "fit_reasons": [
    "Matches seed stage",
    "Public thesis includes healthcare data infrastructure",
    "Recent healthcare data investment indicates active interest"
  ],
  "outreach_angle": "Lead with Acme Data's healthcare-provider data layer and reference the firm's recent care coordination investment.",
  "confidence": "high",
  "source_urls": [
    "https://exampleventures.com/team/jane-lee",
    "https://exampleventures.com/news/care-data-seed"
  ],
  "warnings": []
}
```

## Risks

- Same-name investors can cause false merges unless official firm context is required.
- VC websites often use broad thesis language that can overstate fit.
- Portfolio pages may be stale and announcements may lack investor-level ownership.
- Recent public activity is uneven across firms and may underrepresent active but quiet investors.
- Geographic or stage focus may be implicit rather than explicitly stated.

## Next Build Step

Build a CLI that enriches one CSV and writes an evidence-backed export:

```bash
investor-crm-enrich run \
  --input investors.csv \
  --brief founder-brief.json \
  --lookback-days 180 \
  --country US \
  --device desktop \
  --out enriched-investors.csv
```

Store raw fetches and model outputs in a run directory so users can audit bad matches before any CRM integration is added.
