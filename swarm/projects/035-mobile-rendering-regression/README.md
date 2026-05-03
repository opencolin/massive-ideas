# Mobile Rendering Regression Checker

Mobile Rendering Regression Checker compares how important pages render across mobile device profiles over time. It helps growth, SEO, design, and QA teams catch layout breakage that only appears in mobile web rendering: missing content, hidden calls to action, intrusive overlays, broken lazy loading, viewport overflow, collapsed menus, and device-specific JavaScript failures.

The first version is intentionally narrow: compare a current mobile render against a saved baseline for one URL set, one geography, and a small set of mobile devices.

## Target User

Primary users:

- SEO teams protecting mobile-first indexing and organic landing pages.
- Growth teams monitoring paid and lifecycle landing pages after deploys.
- QA teams adding external rendered-page checks without maintaining browser farms.
- Agencies validating client pages across location and device targets.
- Product marketers checking that public pages remain usable after CMS and tag changes.

## Core Workflow

1. User defines a regression brief:
   - Target URLs and page labels
   - Device profiles to test
   - Country and optional city target
   - Baseline snapshot IDs or baseline collection mode
   - Required selectors, text snippets, and conversion elements
   - Ignore rules for dynamic areas such as ads, cookie banners, timestamps, and personalization
2. App checks `account_status` and estimates fetch volume before running.
3. App uses `web_fetch` with JS rendering, captcha handling, country/city targeting, and device emulation for every URL and device profile.
4. App extracts rendered content, viewport metadata, status codes, screenshots or visual hashes where available, links, forms, headings, and key element presence.
5. App compares the current render against the stored baseline and flags mobile-specific regressions.
6. App optionally uses `ai_chat_completion` to summarize evidence, classify severity, and produce source-backed remediation notes.
7. User receives a regression report with per-page status, evidence, affected devices, and recommended next actions.

## MVP Inputs

```json
{
  "project": {
    "name": "Acme Marketing Site",
    "environment": "production",
    "release_id": "2026-05-02.1"
  },
  "geo": {
    "country": "us",
    "city": "Los Angeles"
  },
  "devices": [
    {
      "id": "iphone_15",
      "label": "iPhone 15",
      "type": "mobile"
    },
    {
      "id": "pixel_8",
      "label": "Pixel 8",
      "type": "mobile"
    }
  ],
  "pages": [
    {
      "label": "Homepage",
      "url": "https://www.example.com/",
      "baseline_snapshot_id": "base_home_2026_04_25",
      "required_text": ["Start free trial", "Trusted by"],
      "required_selectors": ["nav", "main", "form[action*='signup']"],
      "critical_links": ["https://www.example.com/pricing"]
    },
    {
      "label": "Pricing",
      "url": "https://www.example.com/pricing",
      "baseline_snapshot_id": "base_pricing_2026_04_25",
      "required_text": ["Pro", "Enterprise"],
      "required_selectors": ["[data-plan-card]", "[data-primary-cta]"],
      "critical_links": []
    }
  ],
  "ignore_rules": [
    {
      "type": "selector",
      "value": "[data-testid='chat-widget']"
    },
    {
      "type": "text_pattern",
      "value": "Last updated:*"
    }
  ],
  "thresholds": {
    "min_content_similarity": 0.92,
    "max_layout_shift_score": 0.18,
    "max_viewport_overflow_px": 24,
    "max_failed_resources": 3
  }
}
```

## MVP Output

```json
{
  "project": {
    "name": "Acme Marketing Site",
    "environment": "production",
    "release_id": "2026-05-02.1"
  },
  "summary": "Two mobile regressions were detected. The pricing page lost the primary CTA on Pixel 8, and the homepage has horizontal overflow on both tested devices.",
  "overall_status": "fail",
  "generated_at": "2026-05-02T18:30:00Z",
  "results": [
    {
      "page_label": "Pricing",
      "url": "https://www.example.com/pricing",
      "device": "pixel_8",
      "status": "fail",
      "severity": "high",
      "regressions": [
        {
          "type": "missing_required_selector",
          "selector": "[data-primary-cta]",
          "baseline_observation": "Primary CTA was visible in the hero and plan cards.",
          "current_observation": "No matching CTA selector was present after JS rendering.",
          "recommended_action": "Check responsive pricing card markup and hydration errors for Pixel-width breakpoints."
        }
      ],
      "evidence": {
        "current_snapshot_id": "snap_pricing_pixel_8_2026_05_02",
        "baseline_snapshot_id": "base_pricing_2026_04_25",
        "status_code": 200,
        "rendered_title": "Pricing | Example",
        "fetch_url": "https://www.example.com/pricing"
      }
    }
  ]
}
```

## Regression Signals

The checker focuses on externally observable mobile breakage:

- `missing_required_text`: critical copy disappeared after rendering.
- `missing_required_selector`: a required element is absent from the rendered DOM.
- `hidden_required_element`: element exists but appears offscreen, covered, or visually hidden.
- `viewport_overflow`: page introduces horizontal scroll or clipped content.
- `content_similarity_drop`: rendered text diverges from the accepted baseline beyond threshold.
- `layout_shift`: visual or structural hash changed enough to require review.
- `resource_failure_spike`: CSS, JS, image, or font failures increased materially.
- `status_or_redirect_change`: HTTP status, canonical URL, or redirect chain changed.
- `mobile_nav_failure`: navigation exists on desktop baseline but cannot be observed on mobile.
- `overlay_blocking_content`: cookie, chat, interstitial, or captcha overlay covers critical content.

## Scoring

Each URL-device observation receives a 0-100 mobile render health score:

- 25 points: required text and selectors are present.
- 20 points: rendered content remains similar to baseline after ignore rules.
- 15 points: no severe viewport overflow or clipping.
- 15 points: status code, redirects, canonical URL, and title are stable.
- 10 points: critical links and forms are present.
- 10 points: failed resources stay within threshold.
- 5 points: evidence quality and fetch completeness.

Automatic caps:

- Cap at 80 when no baseline exists and the run is presence-only.
- Cap at 70 when JS rendering completes but screenshot or visual hash evidence is unavailable.
- Cap at 60 when captcha handling prevents normal page observation.
- Cap at 50 when the page returns a non-2xx status.
- Cap at 40 when critical selectors cannot be evaluated.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
mobile-rendering-regression run \
  --brief render-brief.json \
  --baseline-dir baselines/ \
  --out render-regression-report.json \
  --report-md render-regression-report.md \
  --csv render-regressions.csv
```

Minimum viable UI after CLI validation:

- URL and device test matrix
- Baseline capture and comparison mode
- Required selector and text checks
- Credit estimate preview
- Run status by page and device
- Regression table grouped by severity
- Snapshot evidence drawer
- Ignore-rule editor
- Export buttons for JSON, Markdown, and CSV

## Massive MCP Usage

- `account_status`: estimate whether planned URL-device fetches fit available credits.
- `web_fetch`: render every page with JS enabled under mobile device emulation.
- Device targeting: collect true mobile render observations for specific device profiles.
- Country and city targeting: catch region-specific banners, redirects, consent flows, and content variants.
- Captcha handling: distinguish site challenge failures from application regressions.
- JS rendering: observe hydrated content, lazy-loaded sections, menus, forms, and client-side routing.
- `ai_chat_completion`: classify regression evidence, summarize likely causes, and create remediation notes with source references.
