# Competitor Content Velocity Tracker

Competitor Content Velocity Tracker monitors competitor publishing pace, topic movement, SERP footprint, and message changes so growth and content teams can see who is accelerating, where they are investing, and which gaps are opening up.

The first version is intentionally narrow: track a known competitor set over a recurring window, collect their public content and search-visible pages, classify each content item, and report velocity changes with source-backed evidence.

## Target User

Primary users:

- SEO and content leads watching competitor publishing cadence.
- Product marketers tracking competitor messaging, launches, comparisons, and category narratives.
- Growth teams deciding which content clusters need defensive or opportunistic investment.
- Agencies reporting competitive content movement across client categories.
- Founders wanting a simple weekly view of who is gaining organic surface area.

## Core Workflow

1. User enters a tracking brief:
   - Company or site being defended
   - Competitor domains
   - Topic clusters, keywords, and exclusions
   - Tracking frequency and lookback window
   - Geography and device targets
   - Content types to monitor
2. App checks Massive MCP account status and estimates credit cost for the run.
3. Massive MCP collects evidence:
   - `web_search` with Google SERP parsing for tracked keywords, competitor domains, freshness queries, and topic clusters
   - country, city, and device targeting to preserve localized ranking differences
   - `web_fetch` with JS rendering for blogs, changelogs, resource hubs, comparison pages, docs, and sitemap-like pages
   - captcha handling for blocked competitor pages or search result collection
   - `ai_chat_completion` to classify content type, infer topic cluster, detect net-new or meaningfully changed pages, and summarize velocity signals
4. App normalizes URLs, canonical pages, publish dates, page titles, snippets, fetched content, and SERP ranks.
5. App compares the current run to previous snapshots and calculates velocity by domain, topic, content type, and search visibility.
6. User gets a weekly or monthly report with competitor deltas, source links, alerts, and exportable JSON, CSV, and Markdown.

## MVP Inputs

```json
{
  "owned_site": {
    "name": "Acme Security",
    "domain": "acmesecurity.example"
  },
  "competitors": [
    {
      "name": "SecureFrame",
      "domain": "secureframe.example"
    },
    {
      "name": "Vanta",
      "domain": "vanta.example"
    }
  ],
  "topics": [
    {
      "name": "SOC 2 automation",
      "keywords": ["soc 2 automation", "soc 2 compliance software"]
    },
    {
      "name": "vendor risk management",
      "keywords": ["vendor risk management software", "third party risk automation"]
    }
  ],
  "content_types": ["blog", "guide", "comparison", "changelog", "docs", "landing_page"],
  "geo": {
    "country": "us",
    "device": "desktop"
  },
  "lookback_days": 30,
  "exclude": ["jobs", "press releases", "support login pages"]
}
```

## MVP Output

```json
{
  "period": {
    "start": "2026-04-01",
    "end": "2026-04-30"
  },
  "summary": "SecureFrame increased publishing around SOC 2 automation with four net-new guide or comparison pages and two improved SERP positions. Vanta published fewer net-new pages but refreshed high-ranking vendor risk pages.",
  "competitors": [
    {
      "name": "SecureFrame",
      "domain": "secureframe.example",
      "velocity_score": 82,
      "net_new_pages": 6,
      "meaningful_updates": 3,
      "serp_gains": 5,
      "topic_momentum": [
        {
          "topic": "SOC 2 automation",
          "score": 88,
          "new_pages": 4,
          "rank_gains": 2,
          "signal": "accelerating"
        }
      ],
      "notable_pages": [
        {
          "url": "https://secureframe.example/soc-2-automation-guide",
          "title": "SOC 2 Automation Guide",
          "content_type": "guide",
          "status": "new",
          "topic": "SOC 2 automation",
          "first_seen": "2026-04-12",
          "evidence": [
            {
              "source_type": "web_fetch",
              "url": "https://secureframe.example/soc-2-automation-guide",
              "fetched_at": "2026-04-12T15:30:00Z"
            },
            {
              "source_type": "serp_result",
              "query": "soc 2 automation",
              "rank": 7,
              "url": "https://secureframe.example/soc-2-automation-guide"
            }
          ]
        }
      ],
      "recommended_response": "Refresh Acme's SOC 2 automation hub with clearer auditor workflow coverage and add a comparison page before the competitor cluster compounds."
    }
  ],
  "alerts": [
    {
      "severity": "high",
      "message": "SecureFrame added four SOC 2 automation pages and gained two tracked SERP positions in 30 days.",
      "topic": "SOC 2 automation",
      "source_urls": ["https://secureframe.example/soc-2-automation-guide"]
    }
  ]
}
```

## Velocity Scoring

Velocity scores are 0-100:

- 25 points: net-new relevant pages discovered during the lookback window.
- 20 points: meaningful updates to existing strategic pages.
- 20 points: SERP gains across tracked queries, countries, cities, and devices.
- 15 points: topic concentration, indicating a deliberate cluster push.
- 10 points: source confidence from publish dates, page diffs, fetched content, and SERP evidence.
- 10 points: strategic fit to the user's tracked topics, competitor set, and exclusions.

Automatic caps:

- Cap at 70 when publish dates are inferred rather than observed.
- Cap at 65 when the domain has new pages but no SERP movement.
- Cap at 60 when evidence comes from fewer than three relevant URLs.
- Cap at 50 when pages match the competitor domain but not the tracked topics.
- Cap at 40 when results are mostly excluded pages, duplicate URLs, or thin index artifacts.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
content-velocity track \
  --brief velocity-brief.json \
  --snapshot-dir snapshots \
  --out velocity-report.json \
  --csv velocity-pages.csv \
  --report-md velocity-report.md
```

Minimum viable UI after CLI validation:

- Competitor and topic setup form
- Query plan and credit estimate preview
- Snapshot history with run-to-run deltas
- Competitor velocity leaderboard
- Topic momentum table
- Page-level evidence drawer with SERP ranks, fetched timestamps, and diff notes
- Alerts for acceleration, SERP gains, and defensive content gaps
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate run cost and confirm access before collecting recurring snapshots.
- `web_search`: discover fresh pages, site-specific results, tracked keyword rankings, snippets, and SERP features.
- Google SERP parsing: preserve query, rank, title, snippet, URL, result type, country, city, device, and fetched time.
- Country, city, and device targeting: compare whether competitor velocity is global, local, mobile-specific, or desktop-specific.
- `web_fetch`: fetch competitor pages with JS rendering, captcha handling, title extraction, visible text, canonical URL, and timestamp evidence.
- `ai_chat_completion`: classify content type, topic, strategic relevance, update significance, and recommended response with source references.

## Guardrails

- Treat velocity as directional competitive intelligence, not exact publishing volume.
- Preserve source lineage for every page, SERP rank, publish-date claim, and update claim.
- Separate observed facts from AI interpretation and recommended response.
- Do not infer private strategy from public content beyond clearly labeled hypothesis.
- Avoid scraping gated content, account-only pages, or personal data.
- Respect exclusions for jobs, press releases, login pages, and irrelevant subdomains.
- Mark uncertain publish dates and canonicalization conflicts as low confidence.
- Never fabricate traffic, revenue, customer, or conversion impact.
