# Hiring Signal Tracker

Idea 52 is a hiring signal tracker for target accounts. It turns public job postings, careers pages, search results, and company announcements into a sourced account intelligence feed that explains where a company appears to be investing headcount and what that may imply for sales, recruiting, partnership, or market research teams.

The tracker does not scrape private candidate data, bypass job board restrictions, use authenticated social profiles, or infer sensitive individual attributes. It only analyzes public company-level hiring signals and cites the pages that support each finding.

## Problem

Hiring is one of the clearest public indicators of company priorities, but the signal is scattered across career sites, applicant tracking systems, LinkedIn-style snippets, Google results, press releases, blogs, and local job boards. Teams that sell to named accounts often want to know whether a company is building a security team, entering a new region, hiring its first data leader, expanding implementation support, or slowing down recruiting.

This product packages those observations into repeatable, source-backed account signals. It answers "what are they hiring for, where, and why might it matter now?" without pretending that every open role is a buying trigger.

## Target Users

- B2B sales and SDR teams prioritizing named accounts.
- RevOps teams building trigger-based routing and campaign lists.
- Customer success teams watching expansion, support, and implementation needs.
- Recruiters and talent partners tracking competitor or prospect hiring patterns.
- Investors and analysts monitoring operating momentum across portfolios or markets.

## Inputs

- Target account list with company name, domain, optional CRM ID, owner, segment, and region.
- Optional focus areas such as security, data, AI, sales, customer success, legal, finance, implementation, or infrastructure.
- Optional geography lens such as country, state, city, remote, or office market.
- Optional date window and run mode, such as daily delta, weekly snapshot, or deep baseline.

## Hiring Signals

The MVP tracks company-level signals:

| Signal | Public evidence |
| --- | --- |
| Function buildout | Multiple roles in the same team, new leadership role, first specialist role, or senior IC cluster. |
| Geographic expansion | New city, country, language, field team, distribution center, or region-specific support roles. |
| Product investment | Roles tied to AI, integrations, mobile, platform, payments, security, data, or industry solutions. |
| Go-to-market motion | SDR, AE, partner, RevOps, sales engineer, implementation, onboarding, or customer success hiring. |
| Compliance and risk | Security, privacy, legal, audit, trust, GRC, procurement, or regulatory affairs roles. |
| Operational stress | Support, reliability, SRE, incident, billing, fulfillment, or implementation hiring after growth signals. |

## Output

Each run produces:

- Ranked account feed with hiring signal, observed evidence, why-now interpretation, confidence, and source URLs.
- Role inventory grouped by function, location, seniority, source, and first-seen date.
- Delta summary showing new, removed, and persistent roles since the last run.
- Suggested outreach or research angle that clearly separates public evidence from inference.
- Source log with fetched pages, SERP results, render settings, skipped URLs, and extraction confidence.

## Massive MCP Fit

- `web_search` discovers careers pages, ATS-hosted postings, recent hiring announcements, and indexed job snippets.
- Google SERP parsing provides structured titles, snippets, dates, and result URLs for repeatable discovery.
- `web_fetch` retrieves careers pages and job detail pages, including JavaScript-rendered ATS sites.
- Country, city, and device targeting helps expose localized job inventory and region-specific careers pages.
- Captcha handling improves resilience for public pages that gate ordinary visitors.
- `ai_chat_completion` extracts roles, normalizes functions, classifies signals, and writes concise source-backed interpretations.
- `account_status` gates batch depth and quota-aware scheduling across large target-account lists.

## Guardrails

- Use public company-level hiring data only.
- Do not collect private candidate profiles, personal contact details, protected characteristics, or employment history about individuals.
- Do not bypass authentication, paywalls, robots restrictions, rate limits, or job-board anti-abuse systems.
- Do not use scraped hiring data for discriminatory targeting or individual employment decisions.
- Require source URLs and evidence snippets for every hiring signal.
- Label inference clearly and avoid claiming that a role definitively proves budget, vendor need, or internal strategy.

## Example Summary

```text
Account: Northstar Health
Run date: 2026-05-02

Top hiring signals:
- Security buildout: 5 open roles across GRC, cloud security, and security engineering.
- Regional expansion: new implementation and support roles in Toronto and Vancouver.
- Data platform investment: senior data engineering and analytics infrastructure roles appeared this week.

Suggested angle:
Lead with operational scale and risk readiness. The public roles suggest Northstar is expanding customer delivery while adding security controls, but confirm timing and ownership before treating this as an active project.
```
