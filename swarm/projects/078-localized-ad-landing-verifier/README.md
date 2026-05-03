# Localized Ad Landing Page Verifier

Localized Ad Landing Page Verifier checks whether paid-search ads and their landing pages stay consistent across country, city, language, and device targets. It helps growth, performance marketing, and compliance teams catch broken localized promises before spend scales.

The first version is intentionally narrow: verify one brand, one campaign theme, and a bounded set of target geographies and devices, then produce source-backed mismatch reports with URLs, SERP evidence, rendered page observations, and recommended fixes.

## Target User

Primary users:

- Performance marketers running localized Google Ads campaigns.
- Growth teams validating city, state, country, currency, and language promises.
- Agencies auditing client landing-page quality across many geo targets.
- Compliance and legal reviewers checking whether regulated claims vary by market.
- Founders testing whether a campaign can safely expand beyond one launch region.

## Core Workflow

1. User creates a verification brief:
   - Brand, domain, and campaign theme
   - Target queries or ad keywords
   - Expected landing URLs or URL patterns
   - Country, city, language, and device targets
   - Required localized claims, exclusions, and compliance rules
   - Competitor or own-brand ad filters
2. App checks `account_status` to estimate whether the target matrix fits the available credit budget.
3. App runs `web_search` with Google SERP parsing for each query, geography, and device profile.
4. App identifies relevant ads, sitelinks, organic fallbacks, local packs, and SERP features.
5. App uses `web_fetch` with JS rendering, captcha handling, and the same country, city, and device target to load candidate landing pages.
6. App compares ad copy, landing-page content, page availability, pricing/currency, location references, language, offer terms, and required disclosures.
7. App uses `ai_chat_completion` to classify mismatches, summarize evidence, and produce human-reviewable fixes.
8. User receives a localized verification report with severity-ranked issues, source lineage, screenshots or fetch metadata where available, and exportable JSON, Markdown, and CSV.

## MVP Inputs

```json
{
  "brand": {
    "name": "Acme Solar",
    "domain": "acmesolar.example"
  },
  "campaign": {
    "name": "Residential solar installation",
    "queries": [
      "solar panel installation near me",
      "best residential solar installers",
      "solar installation cost"
    ],
    "expected_landing_patterns": [
      "https://www.acmesolar.example/*"
    ]
  },
  "targets": [
    {
      "country": "us",
      "city": "Austin",
      "language": "en",
      "device": "mobile",
      "expected_currency": "USD"
    },
    {
      "country": "us",
      "city": "Phoenix",
      "language": "en",
      "device": "desktop",
      "expected_currency": "USD"
    }
  ],
  "rules": {
    "required_claims": [
      "local installation availability",
      "financing disclosure near offer"
    ],
    "prohibited_claims": [
      "free solar without qualifying language",
      "guaranteed government rebate"
    ],
    "must_match": [
      "city",
      "state",
      "currency",
      "offer_terms",
      "phone_number_region"
    ]
  },
  "competitor_filters": ["Sunrun", "Tesla Solar"],
  "max_searches": 24,
  "max_fetches": 60
}
```

## MVP Output

```json
{
  "brand": "Acme Solar",
  "campaign": "Residential solar installation",
  "summary": "Austin mobile ads consistently route to localized pages, but Phoenix desktop results include a generic national page with no Arizona availability language and an unsupported rebate claim.",
  "verification_score": 72,
  "target_results": [
    {
      "target": {
        "country": "us",
        "city": "Phoenix",
        "language": "en",
        "device": "desktop"
      },
      "score": 58,
      "ads_found": 3,
      "landing_pages_checked": 3,
      "issues": [
        {
          "severity": "high",
          "issue_type": "localized_claim_mismatch",
          "ad_claim": "Phoenix solar rebates available now",
          "landing_observation": "Landing page mentions national tax credits but no Phoenix or Arizona rebate terms.",
          "recommended_fix": "Route Phoenix ads to an Arizona page or remove the Phoenix rebate claim until eligibility language is present.",
          "evidence": [
            {
              "source_type": "serp_ad",
              "query": "solar installation cost",
              "rank": 1,
              "ad_url": "https://www.acmesolar.example/solar-offer",
              "observed_text": "Phoenix solar rebates available now"
            },
            {
              "source_type": "rendered_landing_page",
              "url": "https://www.acmesolar.example/solar-offer",
              "observed_text": "Federal solar tax credit information is shown, with no Arizona rebate terms."
            }
          ]
        }
      ]
    }
  ],
  "global_warnings": [
    "Two SERPs returned competitor ads above the brand ad for mobile Austin queries."
  ]
}
```

## Issue Taxonomy

- `ad_to_page_offer_mismatch`: ad offer, discount, trial, or promotion is absent or materially different on the landing page.
- `localized_claim_mismatch`: city, state, country, service area, inventory, availability, or regulation claim does not match the target.
- `currency_or_pricing_mismatch`: ad and landing page show different currency, price, tax, shipping, or financing assumptions.
- `language_mismatch`: target language, ad language, and landing-page language are inconsistent.
- `device_experience_failure`: mobile or desktop rendering hides the CTA, breaks forms, blocks content, or changes required terms.
- `unapproved_claim`: ad or landing page uses a prohibited claim from the brief.
- `missing_required_disclosure`: required qualifying language, eligibility, legal, or financing disclosure is absent.
- `wrong_destination`: ad routes outside expected domains, to a generic page, or to a competitor/intermediary page.
- `availability_gap`: ad promises a product, service, appointment, or local office that the page does not support.
- `tracking_or_redirect_risk`: redirect chains, URL parameters, or cloaking-like behavior change destination by target.

## Scoring

Verification scores are 0-100:

- 20 points: ad-to-landing message match for offer, CTA, and primary claim.
- 15 points: local fit across city, region, language, currency, availability, and phone or office details.
- 15 points: landing page accessibility with JS rendering, redirects, captcha handling, and page-status checks.
- 15 points: required disclosure and prohibited-claim compliance.
- 10 points: device-specific usability and above-the-fold CTA visibility.
- 10 points: SERP coverage across intended queries and ad positions.
- 10 points: evidence quality, source diversity, and timestamped target metadata.
- 5 points: clean exportability and reviewer-ready issue summaries.

Automatic caps:

- Cap at 70 when no paid ad is found for more than half of high-priority query-target pairs.
- Cap at 65 when landing pages cannot be rendered reliably for the target device.
- Cap at 60 when redirects obscure the final destination or change by geography without explanation.
- Cap at 55 when required compliance rules cannot be evaluated from fetched content.
- Cap at 45 when a high-severity prohibited claim appears in any live ad or landing page.
- Cap at 40 when ads route to the wrong domain or unsupported market.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
localized-ad-verifier run \
  --brief ad-verification-brief.json \
  --out verification-report.json \
  --report-md verification-report.md \
  --csv issues.csv
```

Minimum viable UI after CLI validation:

- Verification brief setup form
- Query and geo-device target matrix preview
- Credit estimate and target coverage warning
- Live run status by query, target, SERP, and landing fetch
- Severity-ranked issue table
- Target detail view with ad evidence and rendered landing observations
- Rule configuration for required and prohibited claims
- Exports for JSON, Markdown, and CSV

## Massive MCP Usage

- `account_status`: preflight available credits against query-target-fetch budget.
- `web_search`: run targeted Google SERPs for configured queries, countries, cities, languages, and devices.
- Google SERP parsing: preserve ad rank, title, display URL, sitelinks, snippets, organic fallbacks, local packs, and SERP feature metadata.
- Country, city, and device targeting: reproduce the localized ad and landing experience for each campaign target.
- `web_fetch`: render landing pages with JavaScript, follow redirects, capture page text, and handle captcha challenges where supported.
- `ai_chat_completion`: classify ad claims, extract landing-page facts, detect mismatches, assign severity, and generate source-backed recommendations.

## Guardrails

- Treat SERP observations as point-in-time evidence, not proof of campaign configuration.
- Preserve query, target, device, rank, URL, redirect chain, and fetch timestamp for every issue.
- Separate observed ad and landing-page text from AI-generated diagnosis.
- Never fabricate policy conclusions, legal advice, rebate eligibility, prices, or product availability.
- Flag uncertain compliance checks for human review instead of forcing a pass or fail.
- Do not submit forms, create accounts, accept legal terms, or use personal data.
- Avoid competitor scraping beyond public SERP and landing-page evidence needed for comparison.
- Keep target metadata attached to every observation so localized findings are not merged incorrectly.
