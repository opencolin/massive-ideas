# Prototype

## Prototype Goal

Build a CLI prototype that accepts a help center URL and a small set of source pages, then outputs a JSON and Markdown freshness report. The prototype should prove that Massive MCP can discover public support articles, fetch rendered content, identify stale signals, and produce source-backed review recommendations.

## Command Shape

```bash
support-freshness run \
  --config freshness-config.json \
  --out freshness-report.json \
  --report-md freshness-report.md \
  --csv freshness-review-queue.csv
```

## Config Example

```json
{
  "help_center": {
    "name": "Acme Help Center",
    "base_url": "https://help.example.com",
    "sitemap_url": "https://help.example.com/sitemap.xml"
  },
  "discovery": {
    "max_articles": 50,
    "search_queries": [
      "site:help.example.com billing",
      "site:help.example.com API",
      "site:help.example.com Enterprise"
    ]
  },
  "verification_sources": [
    {
      "label": "Pricing",
      "url": "https://www.example.com/pricing",
      "claim_types": ["plan", "price", "limit"]
    },
    {
      "label": "API limits",
      "url": "https://docs.example.com/api/rate-limits",
      "claim_types": ["api_limit", "plan"]
    },
    {
      "label": "Changelog",
      "url": "https://docs.example.com/changelog",
      "claim_types": ["feature_status", "release_date"]
    }
  ],
  "fetch_options": {
    "render_js": true,
    "country": "us",
    "city": "New York",
    "device": "desktop"
  },
  "thresholds": {
    "stale_after_days": 180,
    "minimum_body_words": 150,
    "high_priority_terms": ["billing", "cancel", "SSO", "API", "Enterprise"]
  }
}
```

## Pipeline

1. Load config and call `account_status` to estimate available scan budget.
2. Discover article URLs from sitemap when available.
3. Use `web_search` queries to find indexed articles not present in sitemap and collect Google titles/snippets.
4. Deduplicate URLs by canonical path.
5. Fetch article pages with `web_fetch` using JavaScript rendering, selected country/city, and device profile.
6. Extract title, canonical URL, headings, breadcrumbs, article body, visible dates, links, image alt text, status code, and rendered metadata.
7. Fetch verification source pages with the same render settings.
8. Ask `ai_chat_completion` to extract structured claims from each article:

```json
{
  "claims": [
    {
      "text": "Enterprise customers can enable SSO from Settings > Security.",
      "type": "ui_step",
      "risk": "medium",
      "evidence_text": "Go to Settings > Security and turn on SSO."
    }
  ],
  "visible_dates": [
    {
      "label": "Last updated",
      "value": "2025-08-10"
    }
  ]
}
```

9. Ask `ai_chat_completion` to compare high-risk claims against fetched source pages and return only source-backed conflicts or uncertainty.
10. Score each article and write JSON, Markdown, and CSV outputs.

## Data Model

### Article Observation

```json
{
  "url": "https://help.example.com/articles/sso-setup",
  "canonical_url": "https://help.example.com/articles/sso-setup",
  "title": "Set up SSO",
  "status_code": 200,
  "body_word_count": 842,
  "visible_dates": [
    {
      "label": "Last updated",
      "value": "2025-08-10"
    }
  ],
  "outbound_links": [
    {
      "url": "https://docs.example.com/security/sso",
      "status": "ok"
    }
  ],
  "search_result": {
    "title": "Set up SSO | Acme Help",
    "snippet": "Learn how Enterprise admins enable SSO..."
  }
}
```

### Finding

```json
{
  "article_url": "https://help.example.com/articles/sso-setup",
  "type": "conflicting_claim",
  "severity": "medium",
  "confidence": 0.78,
  "claim": "Enterprise customers can enable SSO from Settings > Security.",
  "source_observation": "Current security docs say SSO is managed from Admin Console > Identity.",
  "source_url": "https://docs.example.com/security/sso",
  "recommended_action": "Update the navigation path and confirm role requirements."
}
```

## Markdown Report Layout

- Executive summary.
- Freshness score distribution.
- High-priority review queue.
- Findings grouped by article.
- Source inventory.
- Articles with no visible date.
- Dead links and redirect surprises.
- Unverified claims that need a human owner.

## Prototype Constraints

- Limit the first run to 50 articles and 10 source pages.
- Treat AI comparisons as recommendations, not automatic edits.
- Require fetched source URLs for contradiction findings.
- Prefer review-needed over stale when evidence is incomplete.
- Store raw fetch metadata so reviewers can reproduce results.

## Future UI

- Help center scan setup with quota estimate.
- Discovery table with sitemap and search-origin badges.
- Review queue sorted by severity, traffic proxy, and claim type.
- Article detail view with extracted claims and source evidence.
- Filters for article age, owner, category, plan, product area, and confidence.
- Export to CSV, Markdown, JSON, or issue tracker.

