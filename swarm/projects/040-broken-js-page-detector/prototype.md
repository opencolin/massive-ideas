# Prototype

## Goal

Build a thin working prototype that accepts public URLs and flags pages that are likely broken only after JavaScript rendering.

## Inputs

```json
{
  "urls": [
    "https://example.com/pricing",
    "https://example.com/docs/getting-started"
  ],
  "profiles": [
    { "country": "US", "city": "San Francisco", "device": "desktop" },
    { "country": "US", "city": "New York", "device": "mobile" },
    { "country": "GB", "city": "London", "device": "mobile" }
  ],
  "serp_query_template": "site:{host} {path keywords}"
}
```

## Flow

1. Fetch the raw page with `web_fetch` without JavaScript rendering.
2. Fetch the same URL with JavaScript rendering enabled for each target profile.
3. Extract comparable signals:
   - HTTP status and final URL.
   - Raw title, meta description, headings, and body text length.
   - Rendered title, headings, visible text length, link count, image count, and primary button/form presence.
   - Rendered blocking indicators such as captcha, access denied, cookie wall, geoblock, or consent-only page.
4. Optionally run Google SERP parsing for high-value pages and compare indexed title/snippet to rendered content.
5. Score the page with deterministic rules.
6. Ask `ai_chat_completion` to write a concise diagnosis using the collected evidence and source URLs.

## Scoring Heuristics

| Signal | Broken Weight | Notes |
| --- | ---: | --- |
| Rendered visible text under 300 chars while raw body has substantial content | +30 | Classic client render failure or overlay |
| Rendered heading/title missing compared with raw or SERP | +20 | Important SEO and UX signal |
| Same URL healthy on desktop but broken on mobile | +25 | Device-specific JS/CSS/data issue |
| Same URL healthy in one country but broken in another | +25 | Geo, consent, localization, or CDN issue |
| Captcha or bot block detected | +10 | Mark as blocked, not necessarily broken |
| Redirect to login, error, or unsupported browser page | +30 | Public page no longer public for that profile |
| SERP snippet content absent from render | +20 | Search-facing mismatch |

Suggested status thresholds:

- `healthy`: score 0-19
- `degraded`: score 20-39
- `broken`: score 40+
- `blocked`: bot/captcha/access control dominates evidence
- `inconclusive`: fetch or render failed without enough evidence

## Report Shape

```json
{
  "url": "https://example.com/pricing",
  "status": "broken",
  "score": 65,
  "profiles": [
    {
      "country": "US",
      "city": "San Francisco",
      "device": "desktop",
      "status": "healthy",
      "signals": {
        "raw_text_chars": 18422,
        "rendered_text_chars": 17610,
        "headings": ["Pricing"]
      }
    },
    {
      "country": "US",
      "city": "New York",
      "device": "mobile",
      "status": "broken",
      "signals": {
        "raw_text_chars": 18422,
        "rendered_text_chars": 87,
        "headings": [],
        "blocking_terms": ["enable javascript"]
      }
    }
  ],
  "diagnosis": "The pricing page renders normally on desktop but mobile only shows a minimal fallback message. This points to a mobile client-rendering or bundle-loading failure rather than an origin outage.",
  "recommended_next_step": "Reproduce with a mobile US profile and inspect the client bundle/API calls used by the pricing route."
}
```

## Minimal Implementation Plan

1. Create a CLI wrapper that reads URLs from a text file.
2. For each URL, call `web_fetch` twice: raw and JS-rendered.
3. Normalize extracted text with boilerplate removal and whitespace collapse.
4. Apply scoring rules and produce JSON plus Markdown.
5. Add a SERP comparison pass for URLs marked degraded or broken.
6. Use `ai_chat_completion` only after deterministic scoring, so the narrative never hides the evidence.

## Demo Dataset

Use a mixed list:

- JS-heavy SaaS pricing pages.
- Documentation pages with client-side routing.
- Ecommerce category pages with API-backed product grids.
- Localized landing pages.
- Known healthy static pages as controls.

