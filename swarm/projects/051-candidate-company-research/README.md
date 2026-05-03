# Candidate Company Research Assistant

Candidate Company Research Assistant helps job candidates quickly understand a company before applying, interviewing, or negotiating. It turns a company name, role, job posting URL, and candidate priorities into a sourced research brief covering business model, products, customers, recent signals, culture clues, interview prep, compensation context, and risks.

The MVP is designed for candidates who need a credible read in minutes, not a generic company summary. It separates sourced facts from interpretation and highlights where public evidence is weak, stale, or contradictory.

## Target User

Primary users:

- Active job candidates preparing for interviews.
- Passive candidates deciding whether to respond to recruiter outreach.
- Career coaches helping clients evaluate opportunities.
- University career offices supporting students before applications.
- Recruiters who want to share balanced, sourced company prep.

## Core Workflow

1. User enters research context:
   - Company name and website URL
   - Optional job posting URL
   - Role title, function, and seniority
   - Candidate priorities such as growth, stability, remote work, mission, compensation, learning, or work-life balance
   - Target country, city, and device
2. App checks `account_status` and estimates a fast, standard, or deep run.
3. App builds queries for official company pages, job posting facts, product and customer signals, recent news, leadership, funding or financials, hiring trends, employee reviews, interview reports, compensation clues, layoffs, litigation, outages, and culture risks.
4. Massive MCP runs:
   - `web_fetch` with JS rendering for the company site, careers pages, job descriptions, blogs, docs, investor pages, and review pages
   - `web_search` with Google SERP parsing for third-party evidence, recent company mentions, interview reports, compensation pages, and risk queries
   - country, city, and device targeting to capture local hiring, office, remote, and mobile SERP differences
   - captcha handling for job boards, review sites, and company pages that block basic fetches
   - `ai_chat_completion` to extract role-relevant facts, synthesize candidate guidance, and generate interview questions from cited sources
5. App deduplicates sources, pages, job postings, review excerpts, people, and repeated claims.
6. App assigns confidence levels to each section based on source diversity, recency, and relevance to the candidate's role.
7. User receives a candidate-ready brief with citations, caveats, interview angles, red flags, and follow-up questions.

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
    "title": "Senior Product Manager",
    "function": "product",
    "seniority": "senior",
    "job_posting_url": "https://example.com/careers/senior-product-manager"
  },
  "candidate_priorities": ["company stability", "manager quality", "career growth", "remote flexibility"],
  "risk_tolerance": "medium",
  "time_horizon": "next interview"
}
```

## MVP Output

```json
{
  "company": "Acme Robotics",
  "role": "Senior Product Manager",
  "summary": "Acme Robotics appears to sell warehouse robotics software and hardware to logistics teams. Public evidence supports active hiring and recent customer momentum, but employee-review signals around execution pace should be discussed in interviews.",
  "confidence": "medium",
  "sections": [
    {
      "name": "Company snapshot",
      "confidence": "high",
      "findings": [
        {
          "claim": "The company positions itself around warehouse automation for logistics operators.",
          "candidate_takeaway": "Prepare examples about operational complexity, enterprise buyers, and hardware-software tradeoffs.",
          "evidence": [
            {
              "source_url": "https://example.com",
              "source_type": "fetched_page",
              "query": "Acme Robotics warehouse automation",
              "rank": 1
            }
          ]
        }
      ]
    },
    {
      "name": "Interview prep",
      "confidence": "medium",
      "findings": [
        {
          "claim": "The role likely requires cross-functional work with engineering, operations, and customer success.",
          "candidate_takeaway": "Ask how product decisions are balanced across hardware constraints, customer commitments, and roadmap bets.",
          "evidence": [
            {
              "source_url": "https://example.com/careers/senior-product-manager",
              "source_type": "fetched_page"
            }
          ]
        }
      ]
    }
  ],
  "red_flags": [
    {
      "risk": "Several public reviews mention fast execution cycles and changing priorities.",
      "severity": "medium",
      "question_to_ask": "How does the team set product priorities when customer deployments and engineering capacity conflict?"
    }
  ],
  "interview_questions": [
    "What does success look like for this role in the first six months?",
    "Which customer segment is driving the most product investment this year?"
  ]
}
```

## Research Sections

The MVP brief includes:

- Company snapshot: category, products, customers, locations, size clues, ownership, financial status, and leadership.
- Role fit: responsibilities, required skills, org context, seniority clues, and likely success metrics from the job posting.
- Business health: recent growth, funding, revenue signals, public-company financials, customer wins, hiring velocity, layoffs, or restructuring.
- Product and market: what the company sells, target customers, competitors, market language, and product momentum.
- Culture and work style: careers pages, employee-review themes, public leadership communication, remote or office expectations, and operating cadence.
- Compensation and benefits clues: job-posted ranges, public salary sources, benefits pages, location factors, and negotiation prompts.
- Interview prep: personalized talking points, likely questions, source-backed company questions, and role-specific follow-ups.
- Red flags and unknowns: unsupported claims, stale sources, negative signals, contradictory evidence, and topics to validate directly.

## Massive MCP Usage

- `account_status`: estimate credits before a run and choose fast, standard, or deep mode.
- `web_fetch`: fetch official pages, job postings, careers pages, benefits pages, blogs, docs, leadership pages, investor pages, and review pages with JS rendering.
- `web_search`: discover recent news, employee reviews, interview reports, compensation data, competitors, funding, layoffs, lawsuits, outages, and local office signals with Google SERP parsing.
- Google SERP parsing: preserve query, rank, title, snippet, URL, visible dates, review counts, salary ranges, and SERP feature types.
- Captcha handling: recover high-value pages from job boards, review sites, and company careers portals.
- Country, city, and device targeting: surface local job-market context, office-specific reviews, mobile-only job pages, and region-specific salary or remote-work evidence.
- `ai_chat_completion`: classify evidence, synthesize role-specific takeaways, generate interview questions, and keep claims tied to sources.

## Guardrails

- Do not present rumors, anonymous reviews, chatbot answers, or candidate notes as verified facts.
- Preserve raw query, rank, URL, fetch timestamp, source type, and extracted excerpt for each material claim.
- Separate "what the source says" from "what this may mean for the candidate."
- Label sections with confidence and source coverage.
- Treat salary estimates as directional unless sourced from the job posting or authoritative public filings.
- Avoid collecting private personal data about employees or interviewers.
- Never make legal, immigration, financial, or career decisions for the user; provide evidence and questions to support their judgment.
