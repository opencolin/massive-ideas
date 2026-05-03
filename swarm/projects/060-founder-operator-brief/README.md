# Founder/Operator Background Brief Generator

Founder/Operator Background Brief Generator creates concise, source-backed background briefs on startup founders, executives, and senior operators. It gathers public web evidence, resolves identity ambiguity, builds a dated career and company timeline, and turns the evidence into an operator-ready memo with citations, confidence levels, and open diligence questions.

The first version is focused on ethical public-source research: given a person, company, role, and geography, produce a brief that helps investors, recruiters, partnership teams, and founders understand the person's public professional track record without pretending weak or private signals are facts.

## Problem

Founder and operator research is often assembled from search results, LinkedIn snippets, company bios, podcasts, press mentions, conference pages, and archived company pages. Manual research is slow, same-name collisions are common, and AI summaries can overstate unsupported claims about employment dates, exits, education, or achievements.

This product turns Massive MCP into a repeatable background brief workflow that preserves source metadata, separates observed facts from interpretation, and highlights gaps where direct confirmation is required.

## Target Users

- Investors preparing for founder meetings or partner discussions.
- Recruiters and talent teams evaluating senior operators.
- Founders researching potential cofounders, advisors, executives, or board members.
- Corporate development and partnership teams vetting counterparties.
- Accelerators and communities preparing high-context member or speaker notes.

## Core Workflow

1. User enters a person brief request:
   - person name
   - current or target company
   - known role/title
   - optional city, country, school, previous employer, or seed URLs
   - brief purpose: investor diligence, recruiting, partnership, advisor review, or meeting prep
   - depth mode and excluded domains
2. App calls `account_status` and estimates quick, standard, or deep-run credit cost.
3. App builds discovery queries for official bios, current company pages, previous employers, interviews, talks, podcasts, publications, funding/news mentions, social profiles, and disambiguation terms.
4. Massive MCP runs:
   - `web_search` with Google SERP parsing to capture ranked public evidence
   - country, city, and device targeting to reveal localized profile, event, and company results
   - `web_fetch` with JavaScript rendering for dynamic team pages, conference pages, podcasts, press pages, and profile pages
   - captcha handling for public pages that challenge ordinary fetchers
   - `ai_chat_completion` to extract career facts, detect contradictions, draft the brief, and verify claim-source coverage
5. App normalizes evidence into a person identity graph, role timeline, source inventory, and claim table.
6. App drafts the background brief, then verifies every material claim against cited evidence.
7. User receives Markdown, JSON, and optional CSV source exports.

## MVP Inputs

```json
{
  "person": {
    "name": "Jordan Lee",
    "current_company": "Acme Robotics",
    "current_role": "Founder and CEO",
    "geo": {
      "country": "us",
      "city": "San Francisco",
      "device": "desktop"
    }
  },
  "brief_purpose": "investor_diligence",
  "known_context": {
    "previous_companies": ["Example Labs"],
    "schools": ["Example University"],
    "seed_urls": ["https://example.com/team/jordan-lee"]
  },
  "focus_areas": ["career timeline", "company-building record", "technical background", "public reputation", "risk flags"],
  "exclude_domains": ["example-spam-directory.com"],
  "depth": "standard"
}
```

## MVP Output

```json
{
  "person": "Jordan Lee",
  "resolved_identity": {
    "current_company": "Acme Robotics",
    "current_role": "Founder and CEO",
    "confidence": "medium",
    "same_name_risks": [
      "Several search results refer to a different Jordan Lee in consumer robotics."
    ]
  },
  "summary": "Public evidence supports Jordan Lee as the founder and CEO of Acme Robotics and a former engineering leader at Example Labs. Prior startup outcome and customer traction claims require direct confirmation.",
  "sections": [
    {
      "name": "Career timeline",
      "confidence": "medium",
      "findings": [
        {
          "claim": "Jordan Lee is listed as Founder and CEO on Acme Robotics' public team page.",
          "citation_ids": ["src_001"],
          "confidence": "high"
        }
      ],
      "gaps": ["No independently verified start month for the founder role."]
    }
  ],
  "open_questions": [
    "What was the exact scope and reporting line of the Example Labs engineering role?",
    "Which customer or investor references can verify the claimed robotics deployments?"
  ],
  "source_inventory": [
    {
      "id": "src_001",
      "url": "https://example.com/team/jordan-lee",
      "title": "Acme Robotics Team",
      "source_type": "fetched_page",
      "query": "Jordan Lee Acme Robotics founder CEO",
      "rank": 1,
      "country": "us",
      "city": "San Francisco",
      "device": "desktop",
      "fetched_at": "2026-05-02T12:00:00Z"
    }
  ]
}
```

## Brief Sections

- Identity resolution: current role, company, location clues, same-name risks, and confidence.
- Snapshot: concise professional summary, evidence strength, and what still needs direct verification.
- Career timeline: dated roles, companies, education, publications, launches, acquisitions, talks, and board/advisor roles.
- Company-building record: founding roles, hiring signals, funding mentions, product launches, customer or partner evidence, and exits when publicly supported.
- Operating strengths: recurring evidence about functional expertise, domain depth, leadership style, and network.
- Public reputation: interviews, talks, community activity, media mentions, awards, and credible third-party commentary.
- Risk flags and contradictions: stale bios, inconsistent dates, unsupported achievement claims, same-name collisions, and weak evidence.
- Open questions: reference-call prompts and diligence items that cannot be settled from public sources.
- Source inventory: every SERP result, fetched page, AI-answer source, query, rank, region, device, timestamp, and source quality label.

## Massive MCP Usage

- `account_status`: check available credits and choose depth mode before collecting sources.
- `web_search`: discover official bios, employer pages, news, podcasts, interviews, conference pages, publications, and profile pages.
- Google SERP parsing: preserve query, rank, URL, title, snippet, visible date, result type, and same-name clues.
- `web_fetch`: render dynamic team pages, JavaScript-heavy profile pages, event pages, podcasts, docs, and archived public pages.
- JavaScript rendering: capture content hidden from simple HTTP fetches.
- Captcha handling: improve collection resilience for public profile, event, and directory pages.
- Country, city, and device targeting: compare localized search results and mobile-visible profile snippets.
- `ai_chat_completion`: generate query expansions, extract structured claims, detect contradictions, classify evidence quality, draft the brief, and run citation checks.

## Guardrails

- Use only public, legally accessible sources.
- Do not collect private personal data, sensitive attributes, home addresses, family details, or contact details unless the user explicitly supplied them for matching.
- Do not infer protected characteristics or personal life details.
- Do not present employment dates, exits, funding outcomes, education, or achievements without citations.
- Separate observed facts from interpretation and label confidence on every material section.
- Treat chatbot answers as leads unless their sources are fetched or independently confirmed.
- Cap confidence when evidence comes only from snippets, company-owned pages, or directories.
- Always surface same-name risks, stale pages, inaccessible sources, and contradictions.
- Produce research context only; do not make hiring, investment, legal, or reputational judgments as final recommendations.

## First Build

Ship as a CLI:

```bash
founder-operator-brief build --input person.json --out brief.md --json brief.json --sources sources.csv
```

Minimum viable UI after CLI validation:

- Brief setup form with person, company, role, geography, purpose, and depth.
- Source discovery preview with same-name clusters and include/exclude controls.
- Run status with estimated and actual credit usage.
- Brief viewer with citation drawer, timeline, confidence labels, and contradiction callouts.
- Evidence table mapping claims to source IDs.
- Markdown, JSON, and CSV export.
