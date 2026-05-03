# Support Article Freshness Checker

Idea 66 is a support article freshness checker for customer support, product operations, docs, and success teams. It uses Massive MCP to discover public help center articles, fetch rendered article pages, compare claims against current public product surfaces, and produce a prioritized list of stale, risky, or low-confidence support content.

The checker does not access private tickets, customer data, authenticated admin portals, or internal knowledge bases unless a future user explicitly connects approved sources. The first version focuses on public help centers, public docs, marketing pages, pricing pages, changelogs, and search results.

## Problem

Support articles age quietly. Screenshots drift, plan names change, navigation labels move, limits and prices get updated, product features sunset, and old workaround language keeps ranking in search. Teams usually discover stale content only after customer confusion, support escalations, or a launch retro.

This tool turns freshness review into a repeatable scan. It finds articles, extracts date and claim signals, verifies source pages where possible, and creates a review queue with evidence instead of asking humans to manually audit hundreds of pages.

## Target Users

- Support operations teams maintaining help centers.
- Product support specialists reviewing articles before and after launches.
- Documentation teams looking for stale procedural content.
- Customer success teams reducing avoidable confusion in onboarding.
- Growth and SEO teams protecting high-traffic support articles from outdated answers.

## Core Workflow

1. User enters a help center domain, optional sitemap URL, and product source domains.
2. App checks `account_status` and estimates fetch/search volume.
3. App uses `web_search` and Google SERP parsing to discover indexed support articles, including orphaned pages.
4. App uses `web_fetch` with JavaScript rendering to collect article body text, title, headings, breadcrumbs, visible dates, links, screenshots or image alt text where available, canonical URL, status code, and rendered metadata.
5. App optionally fetches source-of-truth pages such as pricing, release notes, public docs, API docs, plan comparison pages, and product pages.
6. App uses `ai_chat_completion` to extract claims, classify freshness risk, compare against fetched sources, and produce source-backed review notes.
7. User receives a prioritized freshness report with stale article candidates, evidence, recommended owner, and review actions.

## MVP Inputs

```json
{
  "workspace": {
    "name": "Acme Support",
    "help_center_url": "https://help.example.com",
    "product_domains": ["https://www.example.com", "https://docs.example.com"]
  },
  "crawl": {
    "max_articles": 250,
    "allowed_paths": ["/articles", "/hc/en-us"],
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "source_pages": [
    "https://www.example.com/pricing",
    "https://docs.example.com/changelog",
    "https://docs.example.com/api/rate-limits"
  ],
  "freshness_rules": {
    "stale_after_days_without_update": 180,
    "flag_missing_visible_date": true,
    "flag_dead_links": true,
    "flag_plan_or_price_claims": true,
    "flag_ui_navigation_steps": true,
    "flag_versioned_product_names": true
  },
  "priority_terms": ["billing", "cancel", "SSO", "API", "Enterprise", "rate limit"]
}
```

## MVP Output

```json
{
  "workspace": "Acme Support",
  "generated_at": "2026-05-02T18:45:00Z",
  "summary": "37 articles were reviewed. Six need human review, including two high-priority articles with pricing or plan claims that conflict with current public pages.",
  "overall_status": "review_needed",
  "articles": [
    {
      "url": "https://help.example.com/articles/api-rate-limits",
      "title": "API rate limits by plan",
      "freshness_status": "likely_stale",
      "severity": "high",
      "score": 42,
      "signals": [
        {
          "type": "conflicting_claim",
          "claim": "Pro accounts receive 5,000 API calls per hour.",
          "current_source_observation": "Current API docs list Pro accounts at 10,000 calls per hour.",
          "source_url": "https://docs.example.com/api/rate-limits"
        },
        {
          "type": "old_visible_date",
          "observed_date": "2025-06-14",
          "age_days": 322
        }
      ],
      "recommended_action": "Update rate limit table and verify plan names against current API docs.",
      "evidence": {
        "status_code": 200,
        "canonical_url": "https://help.example.com/articles/api-rate-limits",
        "article_fetch_url": "https://help.example.com/articles/api-rate-limits",
        "source_fetch_urls": ["https://docs.example.com/api/rate-limits"]
      }
    }
  ]
}
```

## Freshness Signals

- `old_visible_date`: article has not been visibly updated within the configured window.
- `missing_visible_date`: no last-updated, reviewed, or published date appears in rendered content.
- `dead_or_redirected_link`: article links to a 404, error page, unexpected redirect, or outdated destination.
- `conflicting_claim`: article claim conflicts with fetched source-of-truth pages.
- `obsolete_product_name`: article references retired plan, feature, integration, or UI label.
- `dated_ui_steps`: procedural steps mention navigation labels or screens no longer reflected in current docs or product pages.
- `unsupported_version_reference`: article targets a deprecated API, SDK, platform version, or policy.
- `search_snippet_mismatch`: Google result title or snippet promises content the rendered article no longer contains.
- `thin_or_empty_render`: rendered article body is missing, blocked, or much thinner than expected.

## Scoring

Each article receives a 0-100 freshness score:

- 25 points: visible update/review date is recent or intentionally versioned.
- 20 points: high-risk claims align with fetched source pages.
- 15 points: article links resolve without unexpected errors.
- 15 points: article renders complete body content with stable title and canonical URL.
- 10 points: product, plan, API, and UI labels appear current.
- 10 points: search result metadata matches rendered content.
- 5 points: evidence quality is strong enough for confident review.

Automatic caps:

- Cap at 80 when no source-of-truth pages are available for claim comparison.
- Cap at 70 when JS rendering fails but static HTML is usable.
- Cap at 65 when no visible article date exists.
- Cap at 50 when high-risk claims cannot be verified.
- Cap at 40 when the article returns a non-2xx status or renders an empty body.

## Massive MCP Fit

- `web_search`: discover indexed help center articles, stale snippets, orphaned content, and public source-of-truth pages.
- Google SERP parsing: compare search result titles and snippets against rendered article content.
- `web_fetch`: retrieve help center articles and source pages with JavaScript rendering.
- Country, city, and device targeting: catch localized article variants, consent overlays, region-specific pricing, and mobile-only rendering issues.
- Captcha handling: separate access or challenge problems from article freshness issues.
- `ai_chat_completion`: extract article claims, compare evidence, classify freshness risk, and generate review notes with sources.
- `account_status`: estimate quota before scanning large help centers.

## Guardrails

- Only scan public pages or explicitly authorized sources.
- Do not infer correctness from private product state, customer tickets, or authenticated content.
- Require a source URL for every contradiction claim.
- Label uncertain comparisons as review-needed instead of stale.
- Preserve article URLs, fetched source URLs, dates, and rendered evidence for human review.
- Avoid giving legal, medical, financial, or contractual advice when support articles touch regulated topics.

