# Scholarship And Grant Finder

Idea 95 is a public scholarship and grant finder that discovers programs from public sources, extracts eligibility requirements, and creates a source-backed shortlist for students, families, nonprofit teams, small organizations, researchers, and advisors.

The product is framed as public program research. It is not financial, legal, tax, immigration, admissions, or benefits advice. It does not guarantee eligibility, funding, award availability, or application outcomes. It helps users find public opportunities and understand what the source pages appear to require before a human reviews the program.

## Problem

Scholarship and grant discovery is fragmented across government portals, university pages, community foundations, nonprofit sites, professional associations, corporate philanthropy pages, and PDF listings. Eligibility language is often buried in rendered pages or downloadable documents, and applicants waste time opening programs that are closed, stale, geographically mismatched, or obviously ineligible.

This finder turns that work into a repeatable evidence pipeline. It searches public sources, fetches program pages with rendering when needed, extracts eligibility criteria, identifies likely disqualifiers, and preserves citations so users can audit every match.

## Target Users

- Students and families searching for scholarships by location, school, field, background, grade level, or deadline.
- College access counselors and advisors building source-backed opportunity lists.
- Nonprofits and community organizations looking for operating, program, research, or capacity-building grants.
- Small public agencies, libraries, schools, and civic groups tracking grant opportunities.
- Researchers comparing public funding availability across populations, regions, or program areas.

## Public Sources

Allowed source types:

- Government grant portals, agency pages, notices, and program guidelines.
- University, school district, foundation, nonprofit, association, and corporate scholarship pages.
- Community foundation funds and local award directories.
- Public PDFs, application guides, FAQ pages, and deadline notices.
- Public Google SERP results, snippets, and cached source metadata where available.

Excluded source types:

- Private applicant accounts, authenticated portals, non-public databases, paid application services, or scraped personal data.
- Attempts to bypass access controls, robots restrictions, paywalls, rate limits, or site terms.
- Advice about whether the user should apply for aid, accept funds, structure finances, or interpret legal/tax obligations.

## Core Workflow

1. User enters a profile and search scope, such as student level, location, citizenship or residency status, field, organization type, mission area, deadline window, and award type.
2. App checks `account_status` and recommends quick, standard, or deep research mode.
3. App builds search plans for scholarships, grants, fellowships, awards, and local program directories.
4. Massive MCP collects evidence through:
   - `web_search` with Google SERP parsing for program discovery
   - `web_fetch` with JavaScript rendering for dynamic portals, foundation pages, and PDF-like pages
   - captcha handling for public challenge pages where access is permitted
   - country, city, and device targeting for localized opportunities and mobile-specific portals
   - `ai_chat_completion` for eligibility extraction, match reasoning, contradiction checks, and sourced summaries
5. App normalizes program records, eligibility criteria, deadlines, award details, required documents, and source citations.
6. User reviews a ranked shortlist with match status, source links, uncertainty notes, and next-review checklist.

## Eligibility Fields

The finder extracts eligibility as structured criteria:

| Field | Examples |
| --- | --- |
| Applicant type | High school senior, undergraduate, graduate student, nonprofit, school, researcher, small business, municipality. |
| Geography | Country, state, county, city, school district, service area, residency, institution location. |
| Education | Grade level, enrollment status, GPA, major, institution, accreditation, graduation year. |
| Demographics and affiliations | First-generation status, military affiliation, membership, employer, union, professional association, community group. |
| Program area | STEM, nursing, arts, climate, housing, education, public health, entrepreneurship, community development. |
| Financial or need criteria | Need-based language, FAFSA requirement, income threshold, budget size, matching funds. |
| Citizenship or residency | Citizen, permanent resident, DACA, visa status, local residency, tribal citizenship, documentation requirements. |
| Deadline and timing | Open date, due date, cycle, rolling review, renewal rules, stale or unclear deadline. |
| Award details | Amount, range, number of awards, reimbursement, restricted use, indirect costs, matching requirement. |
| Application requirements | Essays, recommendations, transcripts, budgets, tax status, IRS determination letter, work samples. |

## Output

Each run produces:

- Ranked program shortlist with `strong_match`, `possible_match`, `unlikely_match`, `closed_or_stale`, or `needs_review`.
- Extracted eligibility table with criteria, source URL, excerpt, confidence, and conflict notes.
- Deadline calendar with freshness labels and missing-date warnings.
- Disqualifier and uncertainty notes, such as geography mismatch, deadline ambiguity, or citizenship status not specified.
- Source inventory with query, rank, title, URL, fetched timestamp, country, city, device, and rendering settings.
- Exportable Markdown, JSON, and CSV packets for human review.

## Massive MCP Fit

- `account_status`: estimate and record credit budgets for quick, standard, and deep searches.
- `web_search`: discover public programs across government, foundation, school, nonprofit, association, and corporate sources.
- Google SERP parsing: preserve rank, snippet, dates, source type, and query provenance.
- `web_fetch`: capture rendered eligibility pages, program details, FAQs, application guides, and PDFs.
- Captcha handling: retry public pages that present allowed challenges without bypassing private access.
- Country, city, and device targeting: reveal local opportunities and region-specific program pages.
- `ai_chat_completion`: extract criteria, classify match status, detect contradictions, and explain confidence with citations.

## Guardrails

- Present results as public program research, not financial, legal, tax, immigration, admissions, or benefits advice.
- Never guarantee eligibility, funding, award amount, application success, or deadline accuracy.
- Require source URLs and concise excerpts for every extracted eligibility criterion.
- Treat chatbot answers as discovery leads until verified against fetched or inspectable sources.
- Label stale, closed, ambiguous, or missing deadlines instead of assuming availability.
- Separate source-observed criteria from match interpretation.
- Avoid collecting sensitive personal data unless the user provides it intentionally for local matching.
- Never access non-public applicant portals or submit applications on the user's behalf.

## First Build

Ship as a local CLI and JSON-backed research store:

```bash
program-finder create-profile --type student --state CA --level "high school senior" --field nursing
program-finder search profile_095_ca_nursing --mode standard
program-finder fetch profile_095_ca_nursing --program prog_001
program-finder shortlist profile_095_ca_nursing --out shortlist.md
```

Minimum viable UI after CLI validation:

- Profile editor with applicant type, location, level, field, affiliations, deadline window, and sensitivity controls.
- Program table with match status, deadline, award amount, source quality, and confidence.
- Eligibility drawer showing extracted criteria, excerpts, citations, and uncertainty notes.
- Search run log with queries, SERP ranks, fetch status, region, device, and credit usage.
- Export to Markdown, JSON, and CSV for counselor, family, or program-team review.
