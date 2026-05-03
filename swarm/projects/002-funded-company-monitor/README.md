# Funded Company Monitor

An MVP that watches newly funded companies and turns public web signals into a prioritized outreach queue: who is hiring, what stack they use, what pain they are exposing, and why now is a good time to contact them.

## Problem

Sales, recruiting, partnership, and developer-tool teams all chase the same timing signal: a company just raised money and is likely to hire, buy software, migrate systems, or fix operational bottlenecks. The hard part is not finding funding announcements. It is connecting each announcement to concrete, current evidence:

- active job posts that show hiring urgency
- engineering stack hints from careers pages, docs, blogs, and job descriptions
- pain signals from social posts, help docs, status pages, community threads, reviews, and search results
- buyer and team context, including location, role clusters, and expansion markets

Most teams solve this with manual research in browser tabs. The monitor automates the first-pass research and produces sourced, explainable leads.

## Target Users

- B2B sales teams selling developer tools, infra, security, data, HR, finance, or operations software
- recruiters sourcing companies with fresh hiring budgets
- venture platform teams helping portfolio companies map vendor and talent needs
- market researchers tracking post-funding execution patterns

## MVP Outcome

Given a funding source query or a list of company names, produce a daily ranked report:

| Company | Funding trigger | Hiring signal | Stack signal | Pain signal | Fit score | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| Acme AI | Series A, $18M | 9 engineering roles, 4 data roles | React, Python, Postgres, AWS | hiring for security engineer; SOC2 page recently added | 84 | funding article, careers page, job pages, docs |

## Why Massive MCP

Massive MCP is a strong fit because this product needs live web intelligence rather than static enrichment.

- `web_search`: find fresh funding announcements, company pages, careers pages, job posts, docs, blogs, reviews, and forum mentions.
- `web_fetch`: fetch and render pages, including JS-heavy careers sites and applicant tracking systems.
- Google SERP parsing: extract structured result titles, snippets, URLs, and ranking context for repeatable company research.
- Country, city, and device targeting: localize hiring and market-expansion signals.
- Captcha handling: improve resilience for modern websites and job boards.
- `ai_chat_completion`: synthesize evidence into concise scored findings with source citations.
- `account_status`: gate runs, show usage, and prevent batch jobs from silently exhausting quota.

## Core Workflow

1. Discover funding events from configured searches:
   - `"raised Series A" "startup" "announced"`
   - `"seed funding" "plans to hire"`
   - site-specific sources such as TechCrunch, Crunchbase News, PR Newswire, company blogs, and investor blogs.
2. Normalize company records:
   - name, website, headquarters, funding round, amount, investor names, announcement date, source URL.
3. Collect public signals:
   - careers page and ATS roles
   - job descriptions and role clusters
   - engineering blog, docs, changelog, status page, GitHub org, security/trust pages
   - recent search mentions around outages, migration, compliance, hiring, support, pricing, and integrations
4. Extract structured evidence:
   - hiring count by function and seniority
   - technologies and vendors mentioned
   - explicit pain phrases and inferred operational needs
   - buyer personas likely affected
5. Score and rank:
   - recency, funding confidence, hiring intensity, stack match, pain relevance, source quality.
6. Output:
   - Markdown/CSV report, JSON records, and optional webhook payload for CRM or Slack.

## MVP Scope

### In Scope

- command-line batch runner
- input via saved search queries or CSV company list
- web search and fetch collection layer
- LLM extraction with source-grounded JSON
- deterministic scoring rules
- Markdown and JSON report outputs
- small local cache to avoid refetching pages every run

### Out of Scope

- full CRM sync
- authenticated LinkedIn scraping
- paid data-provider ingestion
- browser UI
- autonomous email generation or sending
- long-term trend warehouse

## Data Model

```json
{
  "company": {
    "name": "Acme AI",
    "website": "https://example.com",
    "hq": "San Francisco, CA",
    "funding_round": "Series A",
    "funding_amount_usd": 18000000,
    "announcement_date": "2026-04-27",
    "investors": ["Example Ventures"]
  },
  "signals": {
    "hiring": {
      "open_roles": 13,
      "role_clusters": ["engineering", "data", "security"],
      "notable_roles": ["Staff Infrastructure Engineer", "Security Engineer"]
    },
    "stack": {
      "languages": ["Python", "TypeScript"],
      "frameworks": ["React", "FastAPI"],
      "infrastructure": ["AWS", "Postgres", "Kubernetes"]
    },
    "pain": [
      {
        "label": "security_compliance",
        "evidence": "Hiring first security engineer and recently published trust page.",
        "confidence": 0.78
      }
    ]
  },
  "score": {
    "fit": 84,
    "components": {
      "funding_recency": 20,
      "hiring_intensity": 24,
      "stack_match": 18,
      "pain_relevance": 17,
      "source_quality": 5
    }
  },
  "sources": [
    {
      "url": "https://example.com/blog/series-a",
      "type": "funding_announcement",
      "title": "Acme AI raises Series A"
    }
  ]
}
```

## Scoring

Default score is 100 points:

- funding recency: 0-25
- hiring intensity: 0-25
- stack match: 0-20
- pain relevance: 0-20
- source quality: 0-10

The MVP should keep scoring explainable and editable in a config file. A sales team selling security software should weight security and compliance signals differently than a recruiting team tracking engineering headcount.

## CLI Sketch

```bash
funded-monitor discover --query "Series A startup raised" --days 7 --country US
funded-monitor enrich --input companies.csv --persona devtools_security
funded-monitor report --format markdown --out reports/weekly-funded-companies.md
```

## Configuration

```yaml
persona: devtools_security
markets:
  - country: US
    cities: ["San Francisco", "New York", "Austin", "Seattle"]
funding_queries:
  - '"raised a Series A" startup "plans to hire"'
  - '"seed funding" "engineering team" startup'
stack_keywords:
  - Kubernetes
  - AWS
  - SOC 2
  - Terraform
  - Postgres
pain_keywords:
  - compliance
  - migration
  - scale
  - outage
  - security
  - reliability
```

## Risks

- False positives from syndicated funding articles and duplicate company names.
- Careers pages may be behind JS-heavy ATS systems or bot controls.
- Stack mentions in job posts can be aspirational rather than currently deployed.
- Pain signals require careful wording; the report should separate observed evidence from inference.
- Some sites prohibit scraping; the MVP should respect robots, rate limits, and source terms.

## Build Plan

1. Build a local CLI with `discover`, `enrich`, and `report` commands.
2. Add Massive MCP adapters for `web_search`, `web_fetch`, `ai_chat_completion`, and `account_status`.
3. Implement extraction prompts that return strict JSON with source URLs.
4. Add rule-based scoring and persona config.
5. Create a small report renderer that emits Markdown, JSON, and CSV.
6. Evaluate against a hand-labeled set of 25 recently funded companies.
