# Prototype

## Prototype Goal

Build a lightweight monitor that accepts a target-company list, searches public sources for layoff and reorg evidence, fetches relevant pages, extracts structured event records, and returns a ranked signal feed with citations. The prototype should prove that Massive MCP can combine search, rendered fetches, localized discovery, and source-grounded AI extraction into responsible company-level restructuring intelligence.

## User Flow

1. User uploads companies with name, domain, optional ticker, industry, region, owner, and account tier.
2. System checks `account_status` and chooses fast, standard, or deep monitoring depth.
3. System builds query sets for company pages, news, regulatory notices, local sources, and investor relations pages.
4. System searches with recency and location targeting, then selects candidate official and credible third-party sources.
5. System fetches selected pages, rendering JavaScript when needed.
6. System extracts event facts, dates, affected units, locations, source type, and evidence excerpts.
7. System deduplicates syndicated coverage and reconciles official statements against third-party reports.
8. System scores signals and produces a ranked report with observed facts, interpretation, confidence, and citations.

## Query Strategy

Initial discovery queries:

```text
site:{domain} layoff OR layoffs OR restructuring OR reorganization
site:{domain} "workforce reduction" OR "reduction in force"
site:{domain} "office closure" OR "site closure"
site:{domain} "leadership changes" OR "operating model"
site:{domain} investor relations restructuring
{company} layoffs {year}
{company} restructuring {year}
{company} "WARN notice" {state}
{company} "office closure" {city}
{company} "hiring freeze"
{company} reorg OR reorganization news
```

The prototype should prefer first-party company statements, regulatory notices, investor relations materials, and reputable news sources. Social snippets and forums can be used as discovery hints only; they should not support high-confidence signals without corroborating public sources.

## Fetch Policy

Allowed:

- Public company newsrooms, blogs, investor relations pages, press releases, and careers pages.
- Public government, state, provincial, and local notice pages.
- Public news articles and business press pages.
- JavaScript rendering for modern company and government pages.
- Country, city, and device targeting for localized public results.
- Captcha handling when it preserves ordinary public visitor access.

Disallowed:

- Authenticated employee portals, recruiter systems, paid databases, leaked files, or internal memos.
- Private social profiles, private groups, or personal employee enrichment.
- Circumventing paywalls, rate limits, robots restrictions, or access controls.
- Identifying, contacting, or scoring individual employees affected by layoffs.

## Data Model

```json
{
  "company": {
    "name": "Northstar Health",
    "domain": "northstar.example",
    "ticker": "NSTH",
    "industry": "healthcare SaaS",
    "owner": "cs-enterprise"
  },
  "run": {
    "id": "reorgmon_2026_05_02_001",
    "mode": "weekly_snapshot",
    "fetched_at": "2026-05-02T12:00:00-07:00"
  },
  "events": [
    {
      "type": "layoff_notice",
      "event_date": "2026-06-30",
      "detected_date": "2026-05-02",
      "affected_count": 82,
      "affected_unit": "Phoenix customer operations office",
      "geography": "Phoenix, Arizona, US",
      "source_type": "regulatory_notice",
      "source_url": "https://example.gov/warn/northstar-health",
      "evidence_excerpt": "Northstar Health listed 82 affected positions at its Phoenix location.",
      "confirmation_level": "confirmed_public_notice",
      "confidence": 0.91
    }
  ],
  "signals": [
    {
      "type": "operating_model_reset",
      "observed_evidence": "A public WARN notice and company reorg announcement both reference customer operations consolidation.",
      "interpretation": "The company may be centralizing support operations and reducing regional delivery capacity.",
      "account_implication": "Review renewal risk, service continuity, stakeholder changes, and vendor consolidation exposure.",
      "confidence": 0.86,
      "sources": [
        "https://example.gov/warn/northstar-health",
        "https://northstar.example/news/operations-update"
      ]
    }
  ]
}
```

## Classification Rubric

High confidence:

- Official company statement, regulatory notice, investor filing, or multiple reputable news sources support the event.
- Event date, affected unit or geography, and signal type are explicit.
- Evidence is recent and corroborated by at least one primary or high-quality source.

Medium confidence:

- Credible news source reports a restructuring but the company statement is vague.
- Event details are partially explicit, such as layoff count without affected unit.
- Careers-page collapse or leadership change suggests a slowdown but lacks direct confirmation.

Low confidence:

- Social-only claim, anonymous rumor, stale article, or syndicated article without primary details.
- Company name collision creates uncertainty.
- Evidence is inferred from sparse snippets or pages that cannot be fetched.

## Scoring

Default signal score is 100 points:

- recency: 0-25
- source quality: 0-25
- event specificity: 0-20
- account relevance: 0-15
- corroboration and confidence: 0-15

Scoring should be configurable by persona. Customer success can upweight renewal risk, service continuity, and stakeholder churn. Sales can upweight vendor consolidation, new executives, and operating-model changes. Analysts can upweight scale, geography, and market-level comparability.

## Report Format

```text
Layoff Reorg Signal Monitor

Run: {run_id}
Scope: Public company, news, investor, and regulatory sources only

Ranked companies
| Company | Signal | Observed evidence | Interpretation | Score | Sources |

Event timeline
| Company | Date | Event type | Affected unit | Geography | Confidence |

Notes
- Public restructuring evidence is not proof of budget, intent to buy, or individual employee status.
- Use neutral account planning language and verify sensitive outreach manually.
```

## MVP Implementation Notes

- Store raw fetched text, rendered HTML metadata, search snippets, and AI summaries separately.
- Normalize signal types with a controlled taxonomy before scoring.
- Canonicalize URLs to deduplicate syndicated news, tracking links, and mirrored press releases.
- Track source type separately from confidence so regulatory notices, company statements, and news reports can be weighted differently.
- Include a "no recent public layoff or reorg signal found" state for quiet companies.
- Require human review for low-confidence, social-only, or rumor-adjacent findings.
- Keep employee names out of the structured data model unless they are public executives named in official leadership-change announcements.

## Future Extensions

- Daily alerts for new WARN notices, office closures, or confirmed restructuring announcements.
- Cross-account market maps showing layoffs and reorgs by sector, region, and company size.
- Customer-success risk digest that flags renewal accounts with confirmed restructuring evidence.
- Analyst export with event timelines, source quality, and confidence fields.
- Pair with hiring-signal trends to detect post-reorg rebuilding or strategic pivots.
