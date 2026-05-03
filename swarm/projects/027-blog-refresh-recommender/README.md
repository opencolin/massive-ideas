# Blog Refresh Recommender

Blog Refresh Recommender turns an existing content inventory into a source-backed refresh queue by comparing each blog post against the current Google SERP, competing pages, and AI-answer sources. It helps SEO and content teams decide which posts need updates because the search surface has changed, not just because a calendar says the post is old.

The first version is intentionally narrow: analyze one site, one geography, one device profile, and a bounded set of existing blog URLs with their target keywords.

## Target User

Primary users:

- SEO teams protecting rankings for high-value informational and commercial blog posts.
- Content marketers deciding which old articles deserve refresh budget this sprint.
- Growth teams tracking SERP intent shifts after competitors publish new guides.
- Agencies producing evidence-backed content refresh recommendations for clients.
- GEO teams checking whether posts still deserve inclusion in chatbot answers and cited sources.

## Core Workflow

1. User uploads or enters a refresh brief:
   - Target site and blog URLs
   - Primary and secondary keywords per URL
   - Current known rank, traffic, conversions, or business priority when available
   - Geography, city, and device target
   - Competitor domains and excluded meanings
   - Maximum search and fetch budget
2. App estimates run feasibility with `account_status`.
3. App normalizes URLs, canonical domains, target keywords, and page age metadata.
4. Massive MCP runs:
   - `web_search` with Google SERP parsing for every tracked keyword
   - country, city, and device targeting for the exact surface that matters
   - `web_fetch` with JS rendering for the user's blog posts, newly ranking competitors, and third-party sources
   - captcha handling for public pages that require browser-like collection
   - `ai_chat_completion` to classify intent, compare topic coverage, identify SERP changes, and draft refresh actions with sources
5. App compares each blog post against current SERP winners, snippets, result types, People Also Ask themes, and answer-engine citations.
6. App scores each URL for refresh urgency, likely upside, evidence quality, and recommended update type.
7. User receives a prioritized refresh backlog with evidence, specific content edits, source URLs, and exportable JSON, Markdown, and CSV.

## MVP Inputs

```json
{
  "site": {
    "name": "ExampleCRM",
    "domain": "examplecrm.com"
  },
  "geo": {
    "country": "us",
    "city": "Austin",
    "device": "desktop"
  },
  "pages": [
    {
      "url": "https://www.examplecrm.com/blog/sales-pipeline-stages",
      "primary_keyword": "sales pipeline stages",
      "secondary_keywords": ["sales pipeline examples", "sales pipeline management"],
      "business_priority": "high",
      "last_updated": "2024-02-12",
      "known_rank": 7
    },
    {
      "url": "https://www.examplecrm.com/blog/crm-implementation-plan",
      "primary_keyword": "crm implementation plan",
      "secondary_keywords": ["crm rollout checklist"],
      "business_priority": "medium",
      "last_updated": "2023-09-05",
      "known_rank": 11
    }
  ],
  "competitors": [
    { "name": "HubSpot", "domain": "hubspot.com" },
    { "name": "Pipedrive", "domain": "pipedrive.com" },
    { "name": "Zoho CRM", "domain": "zoho.com" }
  ],
  "required_topics": [
    "pipeline stages",
    "sales process examples",
    "automation",
    "templates",
    "common mistakes"
  ],
  "exclusions": ["oil pipeline", "software release pipeline"],
  "max_serp_results_per_keyword": 10,
  "max_fetches": 80
}
```

## MVP Output

```json
{
  "site": "ExampleCRM",
  "generated_at": "2026-05-02T12:00:00Z",
  "summary": "Three high-priority posts need refreshes because current SERPs favor example-heavy guides with templates, while ExampleCRM's pages still rank but omit new buyer language and recent competitor sections.",
  "refresh_queue": [
    {
      "url": "https://www.examplecrm.com/blog/sales-pipeline-stages",
      "primary_keyword": "sales pipeline stages",
      "refresh_score": 88,
      "urgency": "high",
      "recommended_update_type": "major_refresh",
      "why_now": "The target page ranks below competitors that now include templates, visual examples, and automation sections.",
      "serp_change_signals": [
        "Four of the top 10 results include downloadable templates.",
        "People Also Ask themes emphasize examples and stage definitions.",
        "Two competitors updated ranking posts within the last six months."
      ],
      "content_gaps": [
        "Missing pipeline template section.",
        "Thin coverage of automation handoffs between stages.",
        "No refreshed examples for SaaS and agency sales teams."
      ],
      "recommended_actions": [
        "Add a template module above the midpoint of the article.",
        "Expand each pipeline stage with example exit criteria.",
        "Refresh title and intro to reflect practical examples, not definitions only.",
        "Add source-backed FAQ answers for recurring SERP questions."
      ],
      "evidence": [
        {
          "source_type": "google_serp",
          "query": "sales pipeline stages",
          "rank": 3,
          "source_url": "https://www.hubspot.com/sales/sales-pipeline",
          "observed_fact": "Ranking competitor page includes templates and stage examples."
        },
        {
          "source_type": "fetched_page",
          "source_url": "https://www.examplecrm.com/blog/sales-pipeline-stages",
          "observed_fact": "Target page defines stages but does not include downloadable templates."
        }
      ],
      "confidence": "high"
    }
  ]
}
```

## Refresh Types

Refresh recommendations use a fixed taxonomy:

- `no_action`: SERP and source evidence do not justify work now.
- `metadata_refresh`: update title, description, snippet language, or publish date context only.
- `section_addition`: add one or two missing modules, examples, FAQs, or internal links.
- `major_refresh`: rewrite structure, intent match, examples, sources, and competitive coverage.
- `merge_or_redirect`: consolidate overlapping posts when SERPs reward a broader page.
- `split_into_new_post`: create a dedicated post when a subtopic now has distinct SERP intent.
- `source_outreach`: improve third-party mentions or citations when owned content is not the main gap.

## Scoring

Refresh scores are 0-100:

- 20 points: rank risk or opportunity across target keywords.
- 20 points: current SERP intent drift compared with the existing post.
- 15 points: topic and entity gaps versus ranking pages.
- 15 points: freshness gap from competitor updates, dates, examples, or current-source coverage.
- 10 points: snippet and title mismatch against winning results.
- 10 points: AI-answer mention and citation gaps.
- 5 points: business priority supplied by the user.
- 5 points: evidence quality and fetch completeness.

Automatic caps:

- Cap at 65 when the page has no current rank or traffic context.
- Cap at 60 when fewer than three relevant competing pages were fetched.
- Cap at 55 when SERP intent is mixed or ambiguous after exclusions.
- Cap at 50 when the recommendation depends only on AI-answer evidence.
- Cap at 40 when the target page cannot be fetched or canonicalized.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
blog-refresh-recommender run \
  --brief refresh-brief.json \
  --out refresh-report.json \
  --report-md refresh-report.md \
  --queue-csv refresh-queue.csv \
  --evidence-csv refresh-evidence.csv
```

Minimum viable UI after CLI validation:

- Content inventory import and validation
- URL-to-keyword mapping table
- Query plan and credit estimate preview
- Run status by URL, keyword, and fetch stage
- Prioritized refresh queue
- URL detail view with SERP change signals and fetched-page comparisons
- Evidence drawer for each recommended action
- Export buttons for JSON, Markdown, and CSV

## Massive MCP Usage

- `account_status`: estimate whether the refresh batch fits available credits.
- `web_search`: collect parsed Google SERPs for each page's primary and secondary keywords.
- Google SERP parsing: preserve rank, URL, title, snippet, result type, query, country, city, and device.
- Country, city, and device targeting: compare the current SERP surface for the user's market.
- `web_fetch`: fetch target posts, competitor posts, newly ranking pages, neutral sources, and source pages.
- JS rendering: handle modern blog templates, embedded comparison tables, calculators, and interactive content modules.
- Captcha handling: attempt public page access without private credentials or gated content.
- `ai_chat_completion`: classify intent shifts, extract topics, compare page coverage, identify refresh type, and draft source-backed recommendations.

## Guardrails

- Treat SERP changes as evidence for prioritization, not guaranteed traffic forecasts.
- Keep every recommendation tied to source URLs, queries, ranks, and fetched timestamps.
- Separate observed source facts from AI-generated editorial recommendations.
- Do not recommend changing product claims, statistics, or customer proof without source evidence.
- Preserve country, city, and device target for every observation.
- Mark thin, ambiguous, or partially fetched pages as low confidence instead of forcing a refresh.
