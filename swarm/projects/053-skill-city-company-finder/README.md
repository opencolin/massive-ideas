# Skill City Company Finder

Skill City Company Finder answers the recruiting and sales research question, "Which companies are hiring for this skill in this city right now?" It searches localized job and company signals, verifies postings on rendered pages, clusters openings by employer, and returns a ranked list of companies with source-backed hiring evidence.

The MVP is intentionally narrow: take one skill and one city, discover live job postings and hiring pages, verify evidence with Massive MCP, classify whether the role truly requires the skill, and output a company list with confidence, urgency, and citations.

## Target Users

- Recruiters building company target lists for candidates with a specific skill.
- Sales teams prospecting accounts with hiring-driven technology or team-growth signals.
- Job seekers finding employers likely to value their skill in a target city.
- Talent market analysts mapping local demand by skill.
- Economic development teams tracking companies growing certain capabilities.

## Core Workflow

1. User enters a skill, city, country, and optional filters:
   - Skill aliases, related tools, seniority, function, and exclusions
   - Remote, hybrid, onsite, or city-specific requirements
   - Source types, lookback window, and minimum confidence
2. App checks budget and feasibility with `account_status`.
3. App uses `web_search` with Google SERP parsing and city/country/device targeting to find job posts, career pages, ATS pages, staffing pages, and local hiring articles.
4. App uses `web_fetch` with JavaScript rendering, captcha handling, and the same geo/device targeting to verify visible job details from each source.
5. App extracts company, role, location, required skills, posting freshness, source URL, and evidence excerpt.
6. App uses `ai_chat_completion` to normalize skill matches, reject false positives, group postings by employer, and classify hiring confidence.
7. User receives a ranked company list with supporting postings, confidence, hiring urgency, source links, and warnings.

## MVP Inputs

```json
{
  "skill": {
    "name": "Kubernetes",
    "aliases": ["k8s", "container orchestration", "EKS", "GKE", "AKS"],
    "exclude_terms": ["training course", "certification provider", "resume sample"]
  },
  "location": {
    "city": "Austin",
    "region": "Texas",
    "country": "us",
    "device": "desktop",
    "language": "en"
  },
  "filters": {
    "seniority": ["senior", "staff", "principal"],
    "workplace": ["onsite", "hybrid"],
    "functions": ["engineering", "platform", "devops"],
    "lookback_days": 30,
    "min_confidence": "medium"
  },
  "source_preferences": ["company_careers", "ats", "job_board", "local_news"]
}
```

## MVP Output

```json
{
  "run_id": "skill-city-company-finder-2026-05-02",
  "skill": "Kubernetes",
  "city": "Austin, Texas",
  "summary": "Found 18 companies with recent Austin-area postings that require or strongly prefer Kubernetes. Six show high-confidence, multi-posting demand.",
  "companies": [
    {
      "company": "ExampleCloud",
      "domain": "examplecloud.com",
      "city_match": "Austin, Texas",
      "hiring_score": 88,
      "confidence": "high",
      "urgency": "high",
      "matched_roles": 3,
      "skill_match": "Required Kubernetes experience across platform engineering roles.",
      "top_evidence": [
        {
          "source_type": "ats",
          "url": "https://jobs.examplecloud.com/platform-engineer-austin",
          "title": "Senior Platform Engineer",
          "excerpt": "Experience operating Kubernetes clusters in production is required.",
          "observed_at": "2026-05-02T16:15:00Z"
        }
      ],
      "warnings": []
    }
  ],
  "suppressed_sources": [
    {
      "url": "https://example.com/kubernetes-training-austin",
      "reason": "training_provider_not_hiring_company"
    }
  ],
  "warnings": []
}
```

## Company Ranking

Hiring scores are 0-100:

- 25 points: skill is explicitly required in visible job content.
- 20 points: city match is clear from posting location, workplace policy, or localized careers page.
- 15 points: posting freshness is within the requested lookback window.
- 15 points: source quality from company career pages, ATS pages, or reputable job boards.
- 10 points: multiple matching roles from the same employer.
- 10 points: urgency signals such as "urgent", "actively hiring", many similar roles, or recent reposting.
- 5 points: company identity and domain can be confidently resolved.

Automatic caps:

- Cap at 80 when the skill is preferred but not required.
- Cap at 75 when only a third-party job board source is available.
- Cap at 70 when location is metro-area, remote-friendly, or ambiguous.
- Cap at 60 when the page could not be rendered or only a SERP snippet mentions the skill.
- Cap at 50 for staffing agencies unless the user explicitly includes agencies.
- Cap at 40 for training providers, resume pages, stale posts, or generic content.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
skill-city-company-finder run \
  --skill "Kubernetes" \
  --city "Austin" \
  --country us \
  --lookback-days 30 \
  --out companies.json \
  --report-md companies.md \
  --csv companies.csv
```

Minimum viable UI after CLI validation:

- Skill, aliases, city, country, device, and workplace controls
- Credit estimate preview
- Ranked company table with score, confidence, urgency, and role count
- Evidence drawer with job excerpts, source URLs, SERP rank, and fetch metadata
- Filters for required skill, preferred skill, direct employer, staffing agency, remote, onsite, and stale
- Export buttons for JSON, CSV, and Markdown
