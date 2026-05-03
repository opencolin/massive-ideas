# Prototype

## Prototype Goal

Build a lightweight tracker that accepts a target-account list, discovers public hiring pages and job postings, extracts structured role data, and returns a ranked feed of company-level hiring signals. The prototype should prove that Massive MCP can combine search, rendered fetches, and source-grounded AI extraction into useful "why now?" account intelligence.

## User Flow

1. User uploads accounts with company name, domain, owner, segment, and optional region.
2. System checks `account_status` and chooses a collection depth.
3. System discovers public careers and job pages with search queries and known ATS patterns.
4. System fetches listing and detail pages, rendering JavaScript when required.
5. System extracts roles, locations, teams, seniority, dates, URLs, and source snippets.
6. System compares against prior runs to identify new, removed, and persistent roles.
7. System classifies hiring signals and produces a ranked report with citations.

## Query Strategy

Initial discovery queries:

```text
site:{domain} careers jobs
site:{domain} hiring "open roles"
site:{domain} "security engineer" jobs
site:{domain} "customer success" careers
site:{domain} "implementation" "remote"
{company} careers
{company} jobs greenhouse OR lever OR ashby OR workday OR smartrecruiters
{company} hiring {city}
{company} "we're hiring" {function}
```

The prototype should prefer first-party pages and official ATS-hosted job boards. Third-party job aggregators can be used for discovery, but signals should be backed by an official company or ATS source when possible.

## Fetch Policy

Allowed:

- Public careers pages, job listing pages, job detail pages, and company announcements.
- JavaScript rendering for ATS pages and modern careers sites.
- Country, city, and device targeting for public localized job inventory.
- Captcha handling only when it preserves normal public visitor access.

Disallowed:

- Authenticated job-board dashboards, recruiter tools, candidate databases, or resume sites.
- Personal candidate profile collection or enrichment.
- Circumventing paywalls, rate limits, robots restrictions, or access controls.
- Inferring individual protected characteristics or making employment decisions.

## Data Model

```json
{
  "account": {
    "name": "Northstar Health",
    "domain": "northstar.example",
    "crm_id": "001xx000003",
    "owner": "sdr-west",
    "segment": "healthcare SaaS"
  },
  "run": {
    "id": "hiretrack_2026_05_02_001",
    "mode": "weekly_snapshot",
    "fetched_at": "2026-05-02T12:00:00-07:00"
  },
  "roles": [
    {
      "title": "Senior Security Engineer, Cloud",
      "function": "security",
      "seniority": "senior_individual_contributor",
      "location": "Remote US",
      "status": "new",
      "source_url": "https://northstar.example/careers/security-engineer",
      "evidence_excerpt": "Senior Security Engineer, Cloud - Remote US",
      "first_seen": "2026-05-02",
      "confidence": "high"
    }
  ],
  "signals": [
    {
      "type": "security_buildout",
      "observed_evidence": "Three new security roles appeared across cloud security, GRC, and detection engineering.",
      "why_now": "The account may be scaling internal security controls or preparing for enterprise assurance requirements.",
      "confidence": 0.84,
      "sources": [
        "https://northstar.example/careers/security-engineer"
      ]
    }
  ]
}
```

## Classification Rubric

High confidence:

- Multiple current roles on official company or ATS pages support the signal.
- Role titles, teams, locations, and dates are visible in source snippets.
- The signal is based on a clear change from a prior run or a dense current cluster.

Medium confidence:

- One senior or first-of-kind role suggests a new function, but needs human review.
- Aggregator discovery points to an official source that is partially rendered or sparse.
- Location or department is implied by the page structure rather than explicit text.

Low confidence:

- Role appears stale, duplicated, evergreen, or syndicated.
- Job title is vague or could belong to multiple functions.
- Source is not first-party and no official posting was found.

## Scoring

Default account signal score is 100 points:

- recency: 0-25
- role cluster strength: 0-25
- strategic relevance to configured focus areas: 0-20
- source quality: 0-15
- actionability: 0-15

The scoring model should be configurable. A security seller can upweight GRC, cloud security, SSO, privacy, and audit roles. A customer support seller can upweight implementation, support operations, onboarding, and customer success roles.

## Report Format

```text
Hiring Signal Tracker

Run: {run_id}
Scope: Public company and official ATS pages only

Ranked accounts
| Account | Signal | Evidence | Why now | Score | Sources |

Role changes
| Account | New roles | Removed roles | Persistent roles | Locations |

Notes
- Evidence is public hiring data, not confirmation of budget or active vendor evaluation.
- Signals require human judgment before outreach or CRM routing.
```

## MVP Implementation Notes

- Store raw fetched text and rendered HTML metadata separately from AI summaries.
- Normalize role function using a controlled taxonomy before scoring.
- Canonicalize URLs to deduplicate ATS mirrors, tracking links, and pagination.
- Keep one source-backed role record per distinct opening.
- Include an explicit "no current public hiring found" state for accounts with no visible roles.
- Avoid collecting names, resumes, personal email addresses, or candidate-specific data.

## Future Extensions

- Daily alerting for first-seen roles in high-priority functions.
- Historical hiring velocity charts by account, function, and region.
- CRM and Slack exports with owner-specific digests.
- Competitive talent movement summaries using only company-level public postings.
- Regional comparison using localized search and fetch targeting.
