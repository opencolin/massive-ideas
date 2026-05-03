# Recruiting Personalization Writer

Recruiting Personalization Writer turns public company context into source-backed recruiting outreach for specific roles, hiring teams, and target candidate segments. It helps recruiters write credible messages that explain why the opportunity may matter now, while keeping facts, inference, and personalization assumptions clearly separated.

The MVP is built for recruiting teams that want better outbound than "{company} is growing" or "{role} looks exciting." It researches the employer, role, product, market, location, and hiring signals, then drafts concise candidate-facing outreach with citations and review notes.

## Target Users

- In-house recruiters writing outbound for hard-to-fill roles.
- Recruiting agencies supporting multiple clients.
- Talent sourcers building role-specific message variants.
- Founder-led teams that need credible recruiting copy without a full talent brand function.
- Recruiting ops teams standardizing outreach quality and compliance.

## Core Workflow

1. User enters company, company URL, role title, optional job posting URL, target candidate segment, location, tone, and channel.
2. App checks `account_status` and selects fast, standard, or deep research depth.
3. App builds searches for official company context, product pages, careers pages, job postings, hiring signals, recent news, leadership updates, market positioning, customer stories, and location-specific details.
4. Massive MCP runs:
   - `web_fetch` with JavaScript rendering for company pages, careers sites, ATS job posts, blogs, press pages, docs, investor pages, and customer pages
   - `web_search` with Google SERP parsing for recent public context, competitors, hiring signals, funding or financial updates, and local office signals
   - country, city, and device targeting to capture localized career pages, salary-range snippets, and mobile-only job pages
   - captcha handling for public careers pages and ATS sites that challenge ordinary fetches
   - `ai_chat_completion` to extract role-relevant context, map evidence to candidate motivators, and draft outreach with source notes
5. App normalizes evidence, deduplicates pages, classifies claims, and flags weak or stale context.
6. User receives outreach variants, personalization bullets, source notes, and recruiter review warnings.

## MVP Inputs

```json
{
  "company": {
    "name": "Acme Robotics",
    "url": "https://example.com",
    "geo": {
      "country": "us",
      "city": "Boston",
      "device": "desktop"
    }
  },
  "role": {
    "title": "Senior Robotics Software Engineer",
    "function": "engineering",
    "seniority": "senior",
    "job_posting_url": "https://example.com/careers/senior-robotics-software-engineer"
  },
  "candidate_segment": {
    "persona": "backend engineers with robotics or warehouse automation experience",
    "motivators": ["technical depth", "customer impact", "career growth"],
    "avoid_topics": ["compensation promises", "visa advice"]
  },
  "outreach": {
    "channel": "linkedin",
    "tone": "direct and technical",
    "variants": 3,
    "max_words": 120
  }
}
```

## MVP Output

```json
{
  "company": "Acme Robotics",
  "role": "Senior Robotics Software Engineer",
  "generated_at": "2026-05-02T12:00:00-07:00",
  "confidence": "medium",
  "personalization_angles": [
    {
      "angle": "Warehouse automation scale",
      "candidate_relevance": "Appeals to engineers who want production systems with physical-world constraints.",
      "confidence": "high",
      "evidence": [
        {
          "source_url": "https://example.com/customers",
          "source_type": "fetched_page",
          "excerpt": "Customer page references fulfillment and warehouse automation use cases."
        }
      ]
    }
  ],
  "drafts": [
    {
      "channel": "linkedin",
      "subject": null,
      "body": "Hi Jordan, I am hiring for a senior robotics software role at Acme Robotics. The work appears focused on warehouse automation systems used by logistics teams, so it could be a good fit if you like backend problems with real-world operational constraints. Open to a quick conversation?",
      "source_notes": [
        "Warehouse automation positioning is sourced from the company customer page.",
        "Role scope should be verified against the active job posting before sending."
      ],
      "review_warnings": [
        "No claim about compensation or remote flexibility was included because public evidence was insufficient."
      ]
    }
  ],
  "do_not_say": [
    "Do not claim the company is profitable unless supported by filings or authoritative public sources.",
    "Do not imply the candidate's current employer, background, age, citizenship, or personal life."
  ]
}
```

## Research Sections

- Company snapshot: business model, products, customers, locations, leadership, ownership, and public size clues.
- Role context: responsibilities, team, seniority, required skills, location policy, and likely success metrics.
- Why now: recent product launches, funding, public-company financial signals, customer wins, expansion, hiring clusters, or strategic shifts.
- Candidate motivators: source-backed angles tied to technical challenge, market impact, mission, team growth, learning, ownership, or location.
- Risk and caveats: stale postings, vague company claims, layoffs, contradictory culture signals, missing salary details, or ambiguous remote policy.
- Outreach drafts: channel-specific messages, subject lines when needed, personalization bullets, and review warnings.

## Massive MCP Usage

- `account_status`: estimate credits and gate run depth before researching a role.
- `web_fetch`: fetch official company pages, job postings, career pages, blogs, press releases, customer stories, investor pages, and docs with JS rendering.
- `web_search`: discover recent public context, hiring signals, competitors, funding, layoffs, product news, and localized career information.
- Google SERP parsing: preserve query, rank, title, snippet, URL, visible date, job metadata, salary snippets, and SERP feature type.
- Captcha handling: recover public pages from ATS and careers systems while respecting normal public access.
- Country, city, and device targeting: localize role context, office details, salary-range snippets, and mobile job-page behavior.
- `ai_chat_completion`: classify evidence, generate personalization angles, draft outreach, and produce review warnings with source references.

## Guardrails

- Use public company and role context only; do not enrich or infer private candidate attributes.
- Do not generate messages that reference protected characteristics, health, family status, immigration status, age, religion, ethnicity, or other sensitive traits.
- Do not imply personal knowledge of the candidate beyond user-provided, lawful recruiting context.
- Do not present anonymous reviews, chatbot answers, rumors, or recruiter assumptions as verified facts.
- Require evidence for every company-specific personalization angle.
- Label weak, stale, or inferred claims so recruiters can review before sending.
- Avoid compensation, visa, relocation, remote-work, or job-security claims unless directly supported by current public sources.
- Do not bypass authentication, paywalls, robots restrictions, or rate limits.
