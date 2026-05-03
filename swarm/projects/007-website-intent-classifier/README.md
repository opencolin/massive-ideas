# Website Intent Classifier

## MVP

Website Intent Classifier answers one narrow GTM question for a list of domains: "Are they likely to need us?"

The MVP reads a seller's ICP and scans each company website plus search-visible context for need signals, disqualifiers, urgency, and evidence. It returns a ranked account list with an intent score, reason, confidence, and cited sources.

Massive MCP is a strong fit because company websites are increasingly JavaScript-rendered, region-specific, protected by bot defenses, and too varied for brittle scraping. The classifier can combine rendered website fetches, Google SERP parsing, targeted browsing profiles, and source-grounded chatbot answers.

## Target User

The first user is a founder, AE, growth marketer, or agency operator with a prospect list and a clear offer. They want to prioritize accounts that show public evidence of needing that offer before spending time on manual research or outreach.

## Inputs

- Required: seller ICP and offer description.
- Required: domains or company names.
- Optional: disqualifiers.
- Optional: intent signals to look for.
- Optional: target country, city, and device profile.
- Optional: freshness window, defaulting to 180 days for external search signals.

Example:

```json
{
  "offer": "API monitoring and incident debugging for B2B SaaS teams",
  "best_fit": [
    "B2B SaaS",
    "public API, SDK, or developer docs",
    "engineering team owns customer-facing reliability",
    "selling to mid-market or enterprise customers"
  ],
  "need_signals": [
    "API docs",
    "status page incidents",
    "enterprise launch",
    "SOC 2 or security page",
    "hiring platform or reliability engineers",
    "customer integrations"
  ],
  "disqualifiers": [
    "consumer-only app",
    "agency or consultancy",
    "static brochure site with no product surface"
  ],
  "targets": [
    { "company": "ExampleCo", "domain": "example.com" }
  ]
}
```

## Outputs

The MVP returns CSV and JSON:

| Field | Description |
| --- | --- |
| `company` | Best inferred company name |
| `domain` | Canonical website domain |
| `intent_score` | 0-100 likelihood that the account needs the seller's offer |
| `intent_tier` | `high`, `medium`, or `low` |
| `need_summary` | One-sentence explanation of the likely need |
| `why_now` | Timely trigger or reason to prioritize the account |
| `matched_signals` | Signals found on website or search results |
| `disqualifiers` | Any detected reasons to down-rank |
| `recommended_angle` | Short outreach or research angle |
| `evidence` | Source URLs and snippets supporting the score |
| `confidence` | `high`, `medium`, or `low` |

Example output:

```json
{
  "company": "ExampleCo",
  "domain": "example.com",
  "intent_score": 86,
  "intent_tier": "high",
  "need_summary": "ExampleCo appears likely to need API reliability help because it has public developer docs, many customer integrations, and recent platform engineering hiring.",
  "why_now": "Recent careers and changelog pages suggest the team is expanding customer-facing integration work.",
  "matched_signals": ["developer docs", "integrations", "platform hiring", "enterprise customers"],
  "disqualifiers": [],
  "recommended_angle": "Lead with reducing customer-impacting integration incidents as their enterprise API surface expands.",
  "evidence": [
    {
      "claim": "Company has public API documentation.",
      "source_url": "https://example.com/docs",
      "source_type": "docs"
    },
    {
      "claim": "Company is hiring platform engineers.",
      "source_url": "https://example.com/careers",
      "source_type": "careers"
    }
  ],
  "confidence": "medium"
}
```

## Massive MCP Usage

- `account_status`: preflight quota, JS rendering, targeting, and captcha support before batch runs.
- `web_fetch`: fetch home, pricing, docs, blog, changelog, careers, security, status, and customer pages with JS rendering.
- `web_search`: discover pages not exposed in navigation, recent intent signals, competing domains, and official source URLs.
- Google SERP parsing: collect high-signal snippets and fresh pages for query patterns like `site:domain.com API docs careers status`.
- Country/city/device targeting: inspect localized pricing, hiring, or product pages when geography matters.
- Captcha handling: recover public pages blocked by light anti-bot protections.
- `ai_chat_completion`: classify evidence into need signals, score intent, explain uncertainty, and produce structured JSON with sources.

## Scoring Rubric

Intent score is 0-100:

- 30 points: ICP fit, including company model, buyer, product category, and use case alignment.
- 25 points: Need evidence, including website pages that show the problem exists.
- 20 points: Urgency or "why now", including hiring, launches, incidents, compliance, expansion, or recent product changes.
- 15 points: Source quality, preferring official pages and recent search results.
- 10 points: Confidence, based on agreement across independent sources.

Automatic caps:

- Cap at 60 when no official website source is fetched.
- Cap at 55 when the account fits the ICP but has no clear need signal.
- Cap at 45 when all signals are stale or generic.
- Cap at 40 when a major disqualifier is found.

## MVP Scope

In scope:

- Public websites and public search results only.
- Up to 100 domains per batch.
- CSV and JSON export.
- Evidence-backed scoring.
- Configurable ICP, need signals, disqualifiers, geography, and device.

Out of scope:

- Login-protected pages.
- Private contact data.
- Autonomous outreach.
- CRM writeback.
- Claims not backed by source URLs.

## First Build

Ship as a CLI before UI:

```bash
website-intent classify \
  --icp ./icp.json \
  --domains ./domains.csv \
  --out ./intent.csv \
  --json ./intent.json
```

Minimum viable UI after CLI validation:

- ICP setup form
- Domain import table
- Batch status with cost estimate
- Ranked account table
- Evidence drawer with matched signals and source links

