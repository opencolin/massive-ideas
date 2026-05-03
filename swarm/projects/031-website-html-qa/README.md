# Website Screenshot/HTML QA Bot

Website Screenshot/HTML QA Bot audits a page across countries, cities, and devices, then reports visual, HTML, accessibility, localization, and content issues with source-backed evidence. It helps growth, web, QA, and localization teams catch broken hero sections, missing CTAs, geo-specific copy drift, rendering bugs, and SERP-landed page problems before customers see them.

The first version is intentionally narrow: check a list of URLs across device and country targets, capture rendered HTML and screenshots, compare them against expected rules, and produce a prioritized QA report.

## Target User

Primary users:

- Growth teams validating landing pages before paid or SEO launches.
- Web QA teams checking responsive and locale-specific rendering.
- Localization managers verifying country-specific messaging, currency, links, and legal copy.
- SEO teams auditing rendered HTML, metadata, schema, and crawl-visible content.
- Agencies monitoring client sites across markets and devices.

## Core Workflow

1. User defines a QA brief:
   - URLs to test
   - Countries, cities, and devices to emulate
   - Required page elements, copy, links, and metadata
   - Optional visual baselines or same-page comparison targets
   - Accessibility, localization, and SEO checks to run
2. App checks `account_status` and estimates the run cost before fetching pages.
3. Massive MCP runs:
   - `web_fetch` with JS rendering for every URL, country, city, and device
   - country, city, and device targeting to expose localized page variants
   - captcha handling for bot defenses, cookie walls, and challenge pages where supported
   - `web_search` with Google SERP parsing when validating indexed snippets or SERP landing behavior
   - `ai_chat_completion` to inspect rendered HTML, screenshots, and page evidence for QA findings
4. App normalizes rendered DOM, extracted text, metadata, links, screenshots, console/network notes when available, and response state.
5. App scores each URL-target pair by severity, confidence, and user impact.
6. User receives a QA report with issue screenshots, HTML evidence, reproduction context, and JSON, CSV, and Markdown exports.

## MVP Inputs

```json
{
  "project": "spring-campaign-launch",
  "urls": [
    {
      "url": "https://example.com/pricing",
      "page_type": "pricing",
      "priority": "high"
    },
    {
      "url": "https://example.com/demo",
      "page_type": "lead_capture",
      "priority": "high"
    }
  ],
  "targets": [
    { "country": "us", "city": "New York", "device": "desktop" },
    { "country": "gb", "city": "London", "device": "mobile" },
    { "country": "de", "city": "Berlin", "device": "mobile" }
  ],
  "required_elements": [
    { "name": "primary_cta", "selector_hint": "a[href*='demo']", "required_text": "Book a demo" },
    { "name": "pricing_table", "selector_hint": "[data-testid='pricing-table']" }
  ],
  "content_rules": [
    { "rule": "no_placeholder_copy", "severity": "high" },
    { "rule": "currency_matches_country", "severity": "medium" },
    { "rule": "legal_footer_visible", "severity": "medium" }
  ],
  "seo_rules": {
    "require_title": true,
    "require_meta_description": true,
    "require_canonical": true,
    "check_h1_count": true
  },
  "accessibility_rules": {
    "image_alt_text": true,
    "form_labels": true,
    "button_names": true
  }
}
```

## MVP Output

```json
{
  "project": "spring-campaign-launch",
  "summary": "Two high-severity issues were found. The demo CTA is missing on mobile in Germany, and the UK pricing page shows US dollar pricing. Desktop US pages passed required-element and SEO checks.",
  "overall_score": 74,
  "tested_targets": 6,
  "issues": [
    {
      "issue_id": "qa-001",
      "url": "https://example.com/demo",
      "country": "de",
      "city": "Berlin",
      "device": "mobile",
      "severity": "high",
      "category": "missing_required_element",
      "title": "Primary demo CTA is not visible on German mobile",
      "evidence": {
        "selector_hint": "a[href*='demo']",
        "html_excerpt": "<header>...</header>",
        "screenshot_ref": "screenshots/demo-de-berlin-mobile.png",
        "fetched_at": "2026-05-02T18:30:00Z"
      },
      "recommendation": "Check mobile header and localization rules for the German variant. Ensure the primary CTA remains visible above the fold.",
      "confidence": "high"
    }
  ],
  "pages": [
    {
      "url": "https://example.com/pricing",
      "target": { "country": "gb", "city": "London", "device": "mobile" },
      "status": "completed",
      "score": 68,
      "passed_checks": ["title_present", "canonical_present", "h1_single"],
      "failed_checks": ["currency_matches_country"],
      "warnings": ["meta_description_short"]
    }
  ]
}
```

## QA Dimensions

Each observation preserves:

- URL, page type, priority, country, city, device, and collection timestamp.
- HTTP status, final URL, redirects, rendered HTML, extracted text, and screenshot reference.
- Required element match state, selector evidence, visible text, and above-the-fold presence.
- Metadata, canonical URL, robots tags, heading structure, schema presence, and link health.
- Localization signals such as currency, language, shipping/legal text, and regional CTAs.
- Accessibility checks for image alt text, form labels, button names, and obvious focus traps.
- Challenge, captcha, cookie wall, timeout, or render-failure state when collection is incomplete.

## Scoring

Page scores are 0-100:

- 25 points: required page elements present, visible, and clickable.
- 20 points: rendered page has no severe layout, blank-state, challenge, or broken JS issue.
- 15 points: localization matches the requested country and city context.
- 15 points: SEO-critical HTML is present and internally consistent.
- 10 points: accessibility basics pass for visible images, forms, and controls.
- 10 points: links, redirects, and canonical URLs are sane.
- 5 points: evidence quality and reproducibility are complete.

Automatic caps:

- Cap at 50 when the rendered page is a captcha, bot challenge, or unsupported cookie wall.
- Cap at 60 when a high-priority required element is missing.
- Cap at 70 when the screenshot or rendered HTML is unavailable.
- Cap at 80 when only one device or country target was tested for a high-priority URL.

## First Build

Ship as a CLI that writes JSON, CSV, Markdown, and screenshot artifacts:

```bash
website-html-qa run \
  --brief qa-brief.json \
  --out qa-report.json \
  --csv qa-issues.csv \
  --report-md qa-report.md \
  --screenshots-dir screenshots
```

Minimum viable UI after CLI validation:

- QA brief setup form
- URL and target matrix editor
- Required element and rule builder
- Credit estimate preview
- Run status by URL, country, city, and device
- Screenshot comparison view
- HTML evidence drawer
- Issue triage table with severity filters
- Export buttons for JSON, CSV, Markdown, and screenshot bundle

## Massive MCP Usage

- `account_status`: estimate and confirm available credits before cross-target QA runs.
- `web_fetch`: collect rendered HTML, final URL, page text, and screenshot evidence with JS rendering.
- Country, city, and device targeting: reproduce regional and responsive page variants.
- Captcha handling: identify and handle challenge pages without misclassifying them as normal page content.
- `web_search`: optionally validate Google SERP snippets, indexed titles, and landing-page behavior for target URLs.
- Google SERP parsing: preserve search result title, snippet, URL, and SERP context when search validation is enabled.
- `ai_chat_completion`: classify visual and HTML issues, compare expected rules against evidence, and generate source-backed recommendations.

## Guardrails

- Treat screenshots and rendered HTML as point-in-time observations.
- Keep country, city, and device results separate; never merge them into one pass/fail state.
- Preserve screenshot, HTML excerpt, target context, and timestamp for every issue.
- Mark captcha, login, cookie, timeout, and blocked states distinctly from content failures.
- Avoid collecting private, gated, account-specific, or personal data.
- Do not infer analytics impact, conversion loss, or SEO ranking impact without external evidence.
- Keep AI-generated findings tied to concrete DOM, screenshot, fetch, or SERP evidence.
