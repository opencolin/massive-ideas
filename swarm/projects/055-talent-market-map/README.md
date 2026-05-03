# Talent Market Map

Talent Market Map compares geography-specific public talent signals so hiring teams can decide where to recruit, open roles, launch sourcing campaigns, or place local employer-brand spend. It turns a role family and candidate profile into a ranked map of cities, countries, or regions with source-backed evidence about talent density, competition, compensation language, and channel availability.

The MVP is intentionally bounded: analyze one role family across a short list of geographies and produce a directional talent-market report with citations and confidence labels.

## Target User

Primary users:

- Recruiting leaders choosing which geographies to target for a hard-to-fill role.
- Founders deciding whether to hire locally, remotely, or in a lower-competition region.
- Talent sourcers building city-specific search and outreach plans.
- People teams comparing hiring difficulty across expansion locations.
- Agencies advising clients on regional hiring feasibility.

## Core Workflow

1. User enters a talent brief:
   - Role family and seniority
   - Required skills, certifications, or industry background
   - Candidate geography list
   - Target employment mode: local, hybrid, remote, contractor
   - Competitor employers or talent-source companies
   - Exclusions such as staffing agencies, training programs, or unrelated job titles
2. App generates localized queries for supply, demand, competition, compensation, and community signals.
3. Massive MCP runs:
   - `account_status` to estimate available credits before the scan
   - `web_search` with Google SERP parsing for each geography and query
   - country, city, and device targeting to capture local SERP differences
   - `web_fetch` with JS rendering for job boards, company careers pages, salary pages, directories, meetups, bootcamps, and community pages
   - captcha handling when public job or directory pages challenge automated browsing
   - `ai_chat_completion` to classify evidence, normalize employers and skills, and summarize source-backed market patterns
4. App normalizes employers, job titles, location mentions, skills, seniority, and source types.
5. App scores each geography on talent supply signal, employer demand competition, sourcing channel richness, compensation visibility, and evidence confidence.
6. User gets a ranked geography map with recommended recruiting plays and exportable evidence.

## MVP Inputs

```json
{
  "role_family": "senior data engineer",
  "seniority": "senior",
  "skills": ["dbt", "Snowflake", "Airflow", "Python"],
  "geographies": [
    { "country": "us", "city": "Atlanta", "device": "desktop" },
    { "country": "us", "city": "Minneapolis", "device": "desktop" },
    { "country": "ca", "city": "Toronto", "device": "desktop" }
  ],
  "employment_mode": "remote-friendly local hiring",
  "competitor_employers": ["Databricks", "Snowflake", "Capital One"],
  "exclusions": ["entry level", "bootcamp students", "data analyst"]
}
```

## MVP Output

```json
{
  "role_family": "senior data engineer",
  "summary": "Atlanta shows the strongest balance of senior data-engineering supply signals and manageable employer competition. Toronto has deeper visible communities and more enterprise demand, but competition is heavier.",
  "geographies": [
    {
      "country": "us",
      "city": "Atlanta",
      "device": "desktop",
      "talent_supply_score": 82,
      "competition_score": 63,
      "channel_score": 78,
      "compensation_visibility_score": 55,
      "recommended_action": "Run a senior data-engineering sourcing sprint focused on dbt and Snowflake communities, then validate compensation expectations with direct recruiter screens.",
      "top_signals": [
        {
          "signal": "Multiple localized senior data engineer openings mention Snowflake, dbt, and Airflow.",
          "source_urls": ["https://example.com/jobs/senior-data-engineer-atlanta"],
          "signal_type": "job_demand"
        }
      ],
      "visible_employers": [
        {
          "name": "Example Analytics",
          "domain": "exampleanalytics.com",
          "mentions": 3,
          "best_rank": 2,
          "source_urls": ["https://exampleanalytics.com/careers"]
        }
      ],
      "sourcing_channels": [
        "local data engineering meetup",
        "university analytics alumni groups",
        "regional cloud data conferences"
      ],
      "evidence": [
        {
          "claim": "Atlanta has several senior data engineering postings with the requested stack.",
          "source_url": "https://example.com/jobs/senior-data-engineer-atlanta",
          "source_type": "fetched_page",
          "query": "senior data engineer dbt Snowflake Atlanta",
          "rank": 4
        }
      ],
      "confidence": "high"
    }
  ],
  "cross_geo_insights": [
    "Snowflake and dbt appear consistently in enterprise markets, while Airflow is more common in startup-heavy results.",
    "Salary evidence is thinner than job-demand evidence and should be validated through recruiter calls."
  ]
}
```

## Geography Scoring

Scores are 0-100:

- 25 points: density of relevant role and skill signals in localized SERPs.
- 20 points: apparent talent supply proxies, including communities, alumni pages, portfolios, events, directories, and role-specific pages.
- 20 points: employer competition intensity from active job postings and visible hiring pages.
- 15 points: sourcing channel richness and specificity.
- 10 points: compensation visibility from salary pages, postings, and local pay discussions.
- 10 points: evidence quality, freshness, and consistency across query types.

Automatic caps:

- Cap at 60 when fewer than five relevant evidence items support a geography.
- Cap at 55 when evidence is mostly generic national results rather than localized signals.
- Cap at 50 when job-demand signals are strong but talent-supply proxies are absent.
- Cap at 40 when results are dominated by excluded titles, training pages, or staffing spam.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
talent-market-map analyze \
  --brief talent-brief.json \
  --out talent-market-map.json \
  --csv geographies.csv \
  --report-md talent-market-map.md
```

Minimum viable UI after CLI validation:

- Talent brief setup form
- Geography list editor
- Query plan and credit estimate preview
- Run status by geography and signal type
- Ranked geography table
- Evidence drawer for jobs, communities, employers, salary pages, and directories
- Sourcing play recommendations
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: estimate credits and confirm capability readiness before each run.
- `web_search`: collect localized Google results for role, skill, employer, community, salary, and job queries.
- Google SERP parsing: preserve rank, URL, title, snippet, result type, and SERP features for scoring.
- Country, city, and device targeting: compare geography-specific candidate and hiring signals.
- `web_fetch`: fetch pages with JS rendering for job boards, careers pages, communities, salary pages, and event listings.
- Captcha handling: improve resilience on public job and directory pages where permitted.
- `ai_chat_completion`: classify source relevance, normalize titles and employers, extract skills, and produce source-backed summaries.

## Guardrails

- Treat public web evidence as directional, not a complete count of available candidates.
- Do not infer protected demographic characteristics or individual candidate traits.
- Do not scrape private communities, gated profiles, or personal contact data.
- Separate talent supply proxies from employer demand signals.
- Preserve query, geography, rank, URL, source type, and fetched-at timestamp for every claim.
- Keep country, city, and device observations separate.
- Label low-evidence geographies instead of forcing a confident ranking.
- Avoid compensation promises unless backed by explicit source evidence.
