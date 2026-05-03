# Competitor Hiring Trend Dashboard

Competitor Hiring Trend Dashboard monitors public job listings, careers pages, search-visible hiring pages, and role changes so product, strategy, finance, and recruiting teams can see where competitors are investing before those investments show up in launches or headcount reports.

The first version is intentionally narrow: track a known competitor set, collect public hiring evidence on a recurring cadence, classify roles into strategic functions and initiatives, compare against prior snapshots, and present trend changes with source-backed confidence.

## Target User

Primary users:

- Product strategists watching competitor investment areas.
- Recruiting and talent leaders benchmarking role demand and market pressure.
- Finance and corporate development teams tracking expansion, contraction, and new-market signals.
- Founders and operators looking for early evidence of competitor bets.
- Agencies and consultants reporting hiring movement across a category.

## Core Workflow

1. User enters a tracking brief:
   - Company or market being monitored
   - Competitor names, domains, and optional careers URLs
   - Role families, seniority bands, locations, and keywords of interest
   - Tracking frequency and lookback window
   - Geography, city, and device targets for search collection
   - Excluded roles, contractors, agencies, or duplicate boards
2. App checks Massive MCP account status and estimates credit cost for the run.
3. Massive MCP collects evidence:
   - `web_search` with Google SERP parsing for competitor jobs pages, role-specific searches, location searches, and freshness queries
   - country, city, and device targeting to preserve localized hiring and search visibility differences
   - `web_fetch` with JS rendering for careers pages, ATS listings, job detail pages, greenhouse or lever-style boards, and blocked pages that need captcha handling
   - `ai_chat_completion` to classify role family, seniority, location mode, strategic theme, duplicate status, and likely new or removed postings
4. App normalizes job URLs, canonical posting IDs, titles, departments, locations, salary ranges when public, fetched text, and observed timestamps.
5. App compares the current run to previous snapshots and calculates hiring trend movement by competitor, role family, seniority, location, and strategic theme.
6. User gets a dashboard and recurring report with competitor deltas, source links, alerts, and exportable JSON, CSV, and Markdown.

## MVP Inputs

```json
{
  "tracked_company": {
    "name": "Acme AI",
    "domain": "acmeai.example"
  },
  "competitors": [
    {
      "name": "Northstar AI",
      "domain": "northstar.example",
      "careers_url": "https://northstar.example/careers"
    },
    {
      "name": "Vector Labs",
      "domain": "vectorlabs.example",
      "careers_url": "https://jobs.vectorlabs.example"
    }
  ],
  "role_families": ["engineering", "sales", "customer_success", "security", "data", "product"],
  "strategic_keywords": ["agent platform", "enterprise security", "data residency", "healthcare"],
  "locations": ["United States", "New York", "London", "Remote"],
  "geo": {
    "country": "us",
    "device": "desktop"
  },
  "lookback_days": 30,
  "exclude": ["internships", "staffing agencies", "general talent community", "expired postings"]
}
```

## MVP Output

```json
{
  "period": {
    "start": "2026-04-01",
    "end": "2026-04-30"
  },
  "summary": "Northstar AI added several enterprise security and data residency roles, with senior engineering and compliance hiring concentrated in New York and remote US postings. Vector Labs reduced customer success postings while adding two healthcare go-to-market roles.",
  "competitors": [
    {
      "name": "Northstar AI",
      "domain": "northstar.example",
      "hiring_momentum_score": 86,
      "active_postings": 42,
      "net_new_postings": 9,
      "removed_postings": 3,
      "meaningful_updates": 5,
      "role_family_momentum": [
        {
          "role_family": "security",
          "score": 91,
          "active_postings": 8,
          "net_new_postings": 4,
          "seniority_mix": ["senior", "staff", "manager"],
          "signal": "accelerating"
        }
      ],
      "strategic_themes": [
        {
          "theme": "enterprise security",
          "evidence_count": 6,
          "confidence": "high",
          "source_urls": ["https://northstar.example/careers/security-engineer"]
        }
      ],
      "notable_postings": [
        {
          "url": "https://northstar.example/careers/security-engineer",
          "title": "Staff Security Engineer, Enterprise Platform",
          "role_family": "security",
          "seniority": "staff",
          "location": "New York, NY or Remote US",
          "status": "new",
          "first_seen": "2026-04-14",
          "evidence": [
            {
              "source_type": "web_fetch",
              "url": "https://northstar.example/careers/security-engineer",
              "fetched_at": "2026-04-14T17:20:00Z"
            },
            {
              "source_type": "serp_result",
              "query": "Northstar AI enterprise security jobs",
              "rank": 2,
              "url": "https://northstar.example/careers/security-engineer"
            }
          ]
        }
      ],
      "recommended_watch": "Monitor enterprise security and data residency messaging, because hiring evidence suggests Northstar is staffing a deeper compliance-ready platform push."
    }
  ],
  "alerts": [
    {
      "severity": "high",
      "message": "Northstar AI added four security roles in 30 days, including staff and manager-level postings tied to enterprise platform work.",
      "role_family": "security",
      "source_urls": ["https://northstar.example/careers/security-engineer"]
    }
  ]
}
```

## Hiring Momentum Scoring

Hiring momentum scores are 0-100:

- 25 points: net-new relevant postings discovered during the lookback window.
- 20 points: concentration across a role family, initiative, location, or seniority band.
- 15 points: seniority signal from leadership, staff, principal, manager, or founding roles.
- 15 points: meaningful updates to active postings, including scope, location, or compensation changes.
- 10 points: source confidence from fetched pages, canonical posting IDs, SERP evidence, and snapshot diffs.
- 10 points: trend durability, such as postings observed across multiple runs or multiple sources.
- 5 points: strategic fit to the user's tracked keywords and watchlist.

Automatic caps:

- Cap at 75 when postings are visible only through SERP snippets and cannot be fetched.
- Cap at 70 when canonical posting IDs cannot be resolved.
- Cap at 65 when most evidence comes from a third-party job aggregator rather than the employer domain.
- Cap at 55 when roles are relevant but seniority, location, or department cannot be classified.
- Cap at 45 when postings may be evergreen talent community pages or duplicate ATS mirrors.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
hiring-trends track \
  --brief hiring-brief.json \
  --snapshot-dir snapshots \
  --out hiring-report.json \
  --csv hiring-postings.csv \
  --report-md hiring-report.md
```

Minimum viable UI after CLI validation:

- Competitor and careers URL setup form
- Query plan and credit estimate preview
- Snapshot history with run-to-run deltas
- Competitor hiring momentum leaderboard
- Role family, seniority, location, and strategic theme views
- Posting-level evidence drawer with fetched text, SERP rank, canonical ID, and diff notes
- Alerts for hiring acceleration, leadership roles, market expansion, removals, and compensation shifts
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate run cost and confirm access before recurring monitoring.
- `web_search`: discover career pages, job detail URLs, role-specific results, freshness queries, snippets, and search-visible ATS mirrors.
- Google SERP parsing: preserve query, rank, title, snippet, URL, result type, country, city, device, and observed time.
- Country, city, and device targeting: compare whether hiring evidence differs by market, remote/local searches, or mobile search surfaces.
- `web_fetch`: fetch careers pages and posting detail pages with JS rendering, captcha handling, canonical URL extraction, visible text, and timestamp evidence.
- `ai_chat_completion`: classify role family, seniority, location mode, strategic theme, duplicate status, and recommended watch areas with source references.

## Guardrails

- Treat hiring trends as public-market signals, not proof of private strategy or confidential roadmap.
- Preserve source lineage for every posting, classification, trend, and alert.
- Separate observed facts from AI interpretation and recommended watch areas.
- Do not collect applicant data, employee personal profiles, or gated recruiting systems.
- Avoid scraping authenticated job portals or pages blocked by explicit access controls.
- Mark uncertain job status, duplicate boards, inferred locations, and aggregator-only evidence as low confidence.
- Never fabricate headcount, budget, compensation, revenue, customer impact, or launch timing.
- Respect exclusions for internships, evergreen talent pools, agencies, expired postings, and irrelevant locations.
