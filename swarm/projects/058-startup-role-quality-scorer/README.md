# Startup Role Quality Scorer

Idea 58 is a startup role quality scorer for public job pages. It helps candidates, career coaches, recruiters, and talent analysts evaluate whether a startup role appears clear, credible, seniority-appropriate, and worth deeper consideration based on the job description, company context, and source-backed public evidence.

The scorer does not decide whether a person should apply, accept an offer, or reject a company. It produces a structured role-quality assessment, calls out uncertainty, and separates evidence from interpretation.

## Problem

Startup job pages are often messy signals. Some describe a real scoped role with clear outcomes, hiring process, compensation, reporting line, and team context. Others are vague evergreen postings, inflated title ladders, under-scoped founding roles, or broad "wear many hats" descriptions that hide risk for the candidate.

Candidates need a fast way to understand whether a role is well-defined and aligned with their priorities before investing hours in applications, recruiter calls, and interviews. Talent teams and career advisors need consistent rubrics for comparing roles across startups without relying on vibes alone.

## Target Users

- Job candidates comparing startup opportunities.
- Career coaches and university career offices advising candidates.
- Recruiters qualifying inbound startup roles before promoting them.
- Talent marketplaces ranking role quality for members.
- Investors or operators reviewing portfolio-company hiring pages for candidate appeal.

## Inputs

- Job posting URL or raw job description text.
- Optional company name, company domain, role function, seniority, target city, country, and device.
- Candidate priorities such as learning, scope, compensation transparency, remote flexibility, stability, manager quality, mission, or growth.
- Optional risk tolerance and career stage.

## Quality Dimensions

| Dimension | What the scorer checks |
| --- | --- |
| Role clarity | Responsibilities, outcomes, reporting line, team context, success measures, and decision authority. |
| Seniority fit | Whether title, requirements, scope, compensation, and autonomy match the stated level. |
| Startup risk | Funding clues, hiring volume, churn signals, layoffs, vague strategy, unrealistic breadth, or compliance concerns. |
| Candidate upside | Learning, ownership, career path, market exposure, mission fit, and network value. |
| Compensation transparency | Salary range, equity language, benefits, location adjustments, and negotiation prompts. |
| Hiring process quality | Interview steps, timeline, take-home expectations, accommodations, and recruiter clarity. |
| Source credibility | First-party posting quality, official careers page consistency, date freshness, and corroborating public evidence. |

## Output

Each run produces:

- Overall role quality score with confidence and brief rationale.
- Dimension-level scores with cited evidence snippets.
- Candidate-fit notes based on stated priorities.
- Red flags, green flags, and questions to ask the recruiter or hiring manager.
- Source log covering fetched pages, search results, chatbot answers, render settings, and extraction confidence.
- Clear caveats when evidence is missing, stale, contradictory, or based on inference.

## Massive MCP Fit

- `web_fetch` retrieves job pages, company careers pages, benefits pages, funding or press pages, and JavaScript-rendered ATS postings.
- `web_search` discovers duplicate postings, recent company context, funding announcements, layoffs, employee-review pages, and role-specific market context.
- Google SERP parsing preserves result rank, snippets, visible dates, and source URLs for auditability.
- Country, city, and device targeting helps compare localized compensation, remote language, and mobile job-page quality.
- Captcha handling improves access to public job and review pages when normal visitor flows require it.
- `ai_chat_completion` extracts role facts, applies the scoring rubric, identifies evidence gaps, and drafts candidate questions with sources.
- Chatbot answers with sources can provide additional market or company context when web pages are sparse.
- `account_status` controls depth so the product can choose quick, standard, or deep scoring modes.

## Guardrails

- Use only public role and company evidence.
- Do not collect private candidate data, personal contact details, protected characteristics, or confidential employee information.
- Do not bypass authentication, paywalls, rate limits, robots restrictions, or private recruiting systems.
- Do not make employment, legal, immigration, financial, or medical decisions for a user.
- Label subjective judgments as interpretation and attach evidence to every material claim.
- Treat anonymous reviews and chatbot answers as directional signals, not verified facts.

## Example Summary

```text
Role: Founding Product Designer
Company: Acme Robotics
Run date: 2026-05-02

Overall score: 78 / 100
Confidence: medium

Green flags:
- Clear product ownership and user research expectations.
- Salary range and equity language are visible.
- The company has several current engineering and customer roles that support active product investment.

Red flags:
- Reporting line is not stated.
- "Own brand, product, research, and design systems" may exceed a single senior IC scope.
- No hiring process or expected timeline appears on the posting.

Questions to ask:
- Who will manage this role, and how often will design priorities be reset?
- Which outcomes define success in the first six months?
- How is equity refreshed as the company scales?
```
