# Territory Planner

Territory Planner finds target companies for sales or recruiting teams by combining city, industry, and hiring intent. The MVP turns a territory prompt like "healthcare software companies in Austin hiring sales leaders" into a sourced account list with confidence scores and next actions.

## User

Primary user: an account executive, founder, recruiter, or agency operator building a local prospecting list.

Example jobs:

- Find 50 companies in a metro area that match a vertical.
- Prioritize companies showing hiring demand right now.
- Export a ranked list with evidence links for outreach.

## MVP

Inputs:

- City or metro area
- Industry or keyword cluster
- Hiring intent role keywords
- Optional company size hints
- Optional country, device, and localization settings

Outputs:

- Company name
- Website
- City or nearby office evidence
- Industry fit evidence
- Hiring intent evidence
- Open roles found
- Confidence score
- Source URLs
- Suggested outreach angle

## Massive MCP Fit

Territory Planner should use Massive MCP as the acquisition and evidence layer:

- `web_search` for Google SERP queries such as `site:greenhouse.io Austin healthcare software sales director` or `Austin healthtech companies hiring account executive`.
- Google SERP parsing to extract candidate company pages, job boards, directories, and local lists.
- `web_fetch` with JS rendering for company pages, careers pages, LinkedIn-style public result pages, ATS pages, and local business directories.
- Country, city, and device targeting to make local search results match the territory.
- Captcha handling for resilient browsing where supported.
- `ai_chat_completion` to classify companies, summarize evidence, normalize industry labels, and generate outreach angles with citations.
- `account_status` to show credits, quota, or capability readiness before running large territory scans.

## MVP Flow

1. User enters territory criteria.
2. App generates 8 to 15 search queries across company discovery, hiring discovery, and local directory discovery.
3. `web_search` returns SERP results with parsed titles, snippets, URLs, and rankings.
4. App deduplicates domains and keeps likely company, ATS, and directory pages.
5. `web_fetch` loads selected pages with JS rendering where needed.
6. `ai_chat_completion` extracts structured company records and source-backed evidence.
7. App scores each account and presents a ranked table.
8. User exports CSV or copies selected accounts.

## Scoring

Simple score for MVP:

```text
score = city_match * 30 + industry_fit * 30 + hiring_intent * 30 + source_quality * 10
```

Each component is 0 to 1:

- `city_match`: evidence of HQ, office, job location, or service area in the target city.
- `industry_fit`: company page, directory category, or AI classification matches the requested industry.
- `hiring_intent`: active relevant job posts or recent careers page evidence.
- `source_quality`: direct company or ATS source is stronger than a generic list.

## Non-Goals

- Full CRM enrichment.
- Private LinkedIn scraping.
- Automated outreach sending.
- Perfect company headcount estimates.
- Real-time job board exhaustiveness.

## First Build

Build a single-page app or CLI that accepts a JSON request, runs a bounded scan, and writes `territory-results.csv` plus a JSON evidence file. Keep the first version synchronous and limit each run to 25 to 50 ranked accounts.

