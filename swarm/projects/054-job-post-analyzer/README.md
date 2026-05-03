# Recruiting Job Description Analyzer

Idea 54 is a recruiting job-description analyzer that turns public job posts into structured, source-backed hiring intelligence. It extracts role title, team, seniority, location, remote policy, required skills and tools, responsibilities, urgency signals, compensation clues, and citation trails from public job pages, company career sites, applicant tracking systems, and search results.

The product is for recruiting, talent operations, workforce planning, competitive hiring research, and candidate-market analysis. It only uses public job-posting information and does not collect private candidate data, access gated systems, test security, look for vulnerabilities, identify exploits, handle credentials, or bypass access controls.

## Problem

Public job posts contain rich signals, but the information is scattered across company career pages, ATS-hosted posts, search snippets, and localized pages. Recruiters and analysts often have to manually compare titles, levels, requirements, remote policy language, hiring urgency, and compensation hints across dozens of postings.

This analyzer makes that work repeatable. It fetches and normalizes public job posts, preserves source citations for every extracted field, and distinguishes explicit statements from inferred recruiting signals.

## Target Users

- Recruiters building intake notes, talent maps, and calibration packets.
- Talent operations teams monitoring hiring plan changes.
- People analytics teams comparing skills demand across competitors or regions.
- Founders and hiring managers benchmarking job descriptions before opening a role.
- Candidates or career coaches comparing public role expectations across employers.

## Core Workflow

1. User submits one or more company names, career URLs, ATS URLs, public job-post URLs, or search criteria.
2. App checks available Massive MCP quota with `account_status`.
3. App creates search plans for career pages, specific role families, location variants, remote-policy language, compensation snippets, and ATS-hosted listings.
4. Massive MCP runs:
   - `web_search` with Google SERP parsing to discover public job posts and preserve query, rank, title, snippet, URL, and visible metadata.
   - Country, city, and device targeting to capture localized job surfaces and mobile-specific result snippets.
   - `web_fetch` with JavaScript rendering for career pages and ATS pages that load job details client-side.
   - Captcha handling for public pages where normal fetches need browser-like recovery.
   - `ai_chat_completion` to extract structured job facts, normalize skills, label confidence, and generate source-grounded summaries.
5. App deduplicates jobs by canonical URL, company, title, location, requisition ID, and posting text similarity.
6. App produces a role profile, evidence table, comparison matrix, and structured JSON export.

## MVP Inputs

```json
{
  "targets": [
    {
      "company": "ExampleCo",
      "career_url": "https://example.com/careers",
      "role_keywords": ["product manager", "growth"],
      "locations": ["United States", "New York", "Remote"],
      "geo": {
        "country": "us",
        "city": "New York",
        "device": "desktop"
      }
    }
  ],
  "direct_job_urls": [
    "https://example.com/careers/jobs/123-product-manager"
  ],
  "analysis_lens": ["role_scope", "skills", "remote_policy", "compensation", "urgency"],
  "max_posts": 50,
  "exclude_terms": ["internship", "contract agency"]
}
```

## MVP Output

```json
{
  "generated_at": "2026-05-02T12:00:00Z",
  "query_summary": {
    "companies": ["ExampleCo"],
    "posts_analyzed": 12,
    "confidence": "high"
  },
  "job_posts": [
    {
      "company": "ExampleCo",
      "role_title": "Senior Product Manager, Growth",
      "team": "Growth Product",
      "seniority": "senior",
      "locations": ["New York, NY", "Remote - US"],
      "remote_policy": {
        "label": "hybrid_or_remote",
        "evidence_text": "This role may be based in New York or remote within the United States."
      },
      "required_skills_tools": [
        {
          "name": "SQL",
          "type": "technical_skill",
          "requirement_level": "required"
        },
        {
          "name": "A/B testing",
          "type": "method",
          "requirement_level": "required"
        }
      ],
      "responsibilities": [
        "Own growth experiments across onboarding and activation.",
        "Partner with engineering, design, data science, and marketing."
      ],
      "urgency_signals": [
        {
          "signal": "Role appears in current career-page listings and multiple SERP results.",
          "confidence": "medium"
        }
      ],
      "compensation_clues": [
        {
          "type": "posted_range",
          "value": "$150,000-$190,000 base salary",
          "confidence": "high"
        }
      ],
      "source_citations": [
        {
          "source_url": "https://example.com/careers/jobs/123-product-manager",
          "source_type": "fetched_page",
          "query": "ExampleCo Senior Product Manager Growth job",
          "rank": 1,
          "fetched_at": "2026-05-02T12:00:00Z"
        }
      ],
      "field_confidence": {
        "role_title": "high",
        "team": "medium",
        "seniority": "high",
        "remote_policy": "high",
        "compensation_clues": "high"
      }
    }
  ],
  "cross_post_insights": [
    {
      "insight": "Growth roles repeatedly require SQL, experimentation, and cross-functional product leadership.",
      "confidence": "high",
      "supporting_post_count": 8
    }
  ]
}
```

## Extracted Fields

| Field | What the analyzer captures |
| --- | --- |
| Role title | Normalized title, raw title, function, role family, and requisition ID when visible. |
| Team | Explicit team, department, business unit, reporting line, or inferred team with caveat. |
| Seniority | Intern, entry, mid, senior, staff, principal, manager, director, executive, or unknown. |
| Location | City, region, country, office, timezone, travel expectations, and location restrictions. |
| Remote policy | Onsite, hybrid, remote, remote-region-limited, flexible, unclear, or conflicting. |
| Required skills/tools | Skills, tools, methods, credentials, years of experience, and required versus preferred status. |
| Responsibilities | Main duties, ownership areas, deliverables, stakeholders, and operating cadence. |
| Urgency signals | Fresh postings, repeated listings, evergreen language, immediate-start language, reposts, and hiring-burst patterns. |
| Compensation clues | Posted ranges, bonus/equity mentions, benefits, pay transparency location notes, and snippet-only salary hints. |
| Source citations | SERP records, fetched pages, snippets, timestamps, excerpts, and confidence per extracted field. |

## Massive MCP Fit

- `account_status`: estimate run cost before large company or competitor batches.
- `web_search`: discover public job posts, career pages, ATS listings, and search-result snippets with Google SERP parsing.
- Google SERP parsing: preserve query, rank, title, snippet, URL, visible date, location hints, salary snippets, and job-result metadata.
- `web_fetch`: retrieve career pages and ATS job pages with JavaScript rendering.
- Captcha handling: recover access to public pages that require browser-like interaction.
- Country, city, and device targeting: compare local job availability, salary-snippet exposure, and remote-policy wording.
- `ai_chat_completion`: extract structured fields, normalize titles and skills, classify seniority, identify caveated inferences, and synthesize comparisons with citations.

## Guardrails

- Use only public job-posting pages, public search results, and public company career pages.
- Do not collect private candidate, employee, recruiter, or applicant data.
- Do not access authenticated ATS dashboards, private requisitions, internal referrals, or non-public HR systems.
- Do not perform vulnerability discovery, security testing, exploit research, credential handling, or bypass activity.
- Cite every extracted material field to a public source URL, SERP result, or fetched excerpt.
- Mark inferred seniority, team, urgency, and compensation clues separately from explicit statements.
- Label stale, conflicting, missing, or snippet-only evidence rather than smoothing it into certainty.
