# Prototype

## Prototype Goal

Build a lightweight scorer that accepts a startup job posting URL, fetches the public posting and related company context, and returns a sourced assessment of role quality. The prototype should prove that Massive MCP can turn messy job pages into a consistent candidate-facing rubric without overclaiming beyond public evidence.

## User Flow

1. User enters a job posting URL, optional company domain, location, career stage, and candidate priorities.
2. System checks `account_status` and selects quick, standard, or deep mode.
3. System fetches the job page with JavaScript rendering when needed.
4. System searches for official company, careers, benefits, funding, hiring, layoff, compensation, and review context.
5. System extracts structured role facts and supporting evidence snippets.
6. System scores role quality across rubric dimensions.
7. System returns green flags, red flags, unknowns, recruiter questions, and source citations.

## Query Strategy

Initial discovery queries:

```text
{company} careers
site:{domain} careers jobs
site:{domain} benefits compensation
site:{domain} "interview process"
{company} "{role title}"
{company} funding
{company} layoffs
{company} employee reviews {city}
{company} salary {role function}
{company} greenhouse OR lever OR ashby OR workday OR smartrecruiters
```

The prototype should prefer first-party company and official ATS pages. Third-party job boards, review sites, salary pages, and chatbot answers can add context, but the report must label them by source type and confidence.

## Fetch Policy

Allowed:

- Public job descriptions, careers pages, company pages, benefits pages, interview-process pages, blogs, and press pages.
- Public third-party pages that are accessible to ordinary visitors.
- JavaScript rendering for modern ATS or careers pages.
- Country, city, and device targeting for localized job pages and SERP context.
- Captcha handling when it preserves ordinary public visitor access.

Disallowed:

- Authenticated recruiter dashboards, applicant tracking admin pages, private salary databases, or candidate databases.
- Personal employee or candidate profiling.
- Circumventing paywalls, rate limits, robots restrictions, login walls, or access controls.
- Inferring protected characteristics or making individual employment decisions.

## Data Model

```json
{
  "input": {
    "job_url": "https://acme.example/careers/founding-product-designer",
    "company": "Acme Robotics",
    "domain": "acme.example",
    "candidate_priorities": ["learning", "scope clarity", "compensation transparency"],
    "geo": {
      "country": "us",
      "city": "San Francisco",
      "device": "desktop"
    }
  },
  "role": {
    "title": "Founding Product Designer",
    "function": "design",
    "seniority": "senior_ic",
    "location": "San Francisco or Remote US",
    "employment_type": "full_time",
    "salary_range": "$160,000-$190,000",
    "equity_language": "equity included",
    "source_url": "https://acme.example/careers/founding-product-designer"
  },
  "scores": {
    "overall": 78,
    "confidence": "medium",
    "dimensions": [
      {
        "name": "role_clarity",
        "score": 17,
        "max_score": 20,
        "evidence": "The posting lists first-90-day goals, core design ownership, and cross-functional partners.",
        "sources": ["https://acme.example/careers/founding-product-designer"]
      }
    ]
  },
  "findings": {
    "green_flags": [
      "Clear ownership over product discovery and design execution."
    ],
    "red_flags": [
      "Reporting line and design support are not stated."
    ],
    "unknowns": [
      "No public hiring timeline was found."
    ],
    "questions_to_ask": [
      "Who manages this role and how are design priorities set?"
    ]
  }
}
```

## Scoring Rubric

Default score is 100 points:

- Role clarity: 0-20
- Seniority and scope fit: 0-15
- Compensation and benefits transparency: 0-15
- Hiring process quality: 0-10
- Company context and momentum: 0-15
- Candidate upside: 0-15
- Risk clarity and caveats: 0-10

The scoring model should be configurable by candidate priority. For example, an early-career candidate can upweight mentorship and learning, while an executive candidate can upweight reporting line, mandate clarity, compensation, and board or founder context.

## Classification Guidance

High confidence:

- Posting is official, current, detailed, and fetched successfully.
- Salary, location, responsibilities, requirements, team context, and process are explicit.
- Company context is supported by multiple public sources.

Medium confidence:

- Posting is official but missing some candidate-critical details.
- Company context is sparse or dependent on third-party sources.
- The role appears current but freshness is not directly visible.

Low confidence:

- Posting is duplicated, stale, vague, or only visible on aggregators.
- Company identity is ambiguous.
- Sources conflict or key facts depend on snippets instead of fetched pages.

## Report Format

```text
Startup Role Quality Scorer

Role: {title}
Company: {company}
Score: {overall}/100
Confidence: {confidence}

Dimension scores
| Dimension | Score | Evidence | Notes |

Green flags
- ...

Red flags
- ...

Unknowns
- ...

Questions to ask
- ...

Sources
| Source | Type | Used for | Confidence |
```

## MVP Implementation Notes

- Store raw fetched text, rendered HTML metadata, SERP records, and generated summaries separately.
- Preserve query, rank, URL, fetch timestamp, country, city, device, and source type for each cited claim.
- Normalize job title, function, seniority, location, salary range, remote policy, and employment type.
- Deduplicate official postings mirrored across ATS, careers pages, and job boards.
- Use evidence snippets for every scored dimension.
- Include a clear "insufficient evidence" state rather than filling gaps with speculation.

## Future Extensions

- Compare multiple roles side by side for a candidate.
- Track a role over time and alert when scope, compensation, or location changes.
- Build function-specific rubrics for engineering, design, sales, product, operations, and executive roles.
- Generate recruiter email questions tailored to the posting.
- Add portfolio-wide hiring-page quality audits for investors and talent partners.
