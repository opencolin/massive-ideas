# Public Compliance Evidence Mapper

Idea 49 is a public compliance evidence mapper for sales, diligence, and partnership teams. It uses Massive MCP to collect and summarize public website claims that suggest GDPR, HIPAA, SOC 2, financial services, healthcare, education, or geography-specific compliance considerations.

The product does not scan for vulnerabilities, perform penetration testing, identify exploits, bypass access controls, test authentication, or infer private system state. It only reads public pages such as terms, privacy policies, security pages, marketing pages, documentation, pricing pages, and help center articles.

## Problem

Teams often need a quick, source-backed view of what regulatory or assurance topics a company publicly exposes. This can matter during vendor review, account qualification, customer discovery, partner onboarding, or market research. Today, that work is usually manual: search the website, skim legal pages, open help center articles, and assemble a brittle note with pasted links.

This mapper turns that into a repeatable evidence-gathering workflow. It does not declare whether a company is compliant. It maps public claims to likely review areas and explains why those claims may matter.

## Target users

- Revenue teams qualifying regulated accounts or verticals.
- Vendor management and procurement teams preparing an intake packet.
- Compliance, legal, and security teams triaging public statements before deeper review.
- Investors and analysts comparing regulatory positioning across public websites.

## Inputs

- Company domain or public URL.
- Optional target market, such as United States, European Union, United Kingdom, Canada, or Australia.
- Optional vertical lens, such as healthcare, financial services, education, public sector, or B2B SaaS.
- Optional crawl limits, such as max pages, allowed paths, language, country, city, and device profile.

## Public sources

Allowed source types:

- Privacy policy, cookie policy, data processing addendum, terms of service.
- Security, trust, compliance, and legal pages.
- Marketing pages that mention regulated customers, industries, certifications, or regions.
- Product documentation, API docs, admin docs, and help center pages.
- Pricing, plan comparison, and enterprise feature pages.
- Public blog posts, changelogs, and press pages when they contain compliance claims.

Excluded source types:

- Non-public pages, authenticated portals, private customer data, and paid account areas.
- Vulnerability scans, exploit probes, security testing endpoints, or bypass attempts.
- Dark web, leaked data, credential material, or anything requiring circumvention.

## Evidence categories

The mapper classifies source-backed claims into these categories:

| Category | Public signals |
| --- | --- |
| GDPR and privacy | DPA, SCCs, subprocessors, EU representative, lawful basis, data subject rights, cookie consent, international transfer language. |
| HIPAA and healthcare | BAA availability, PHI language, covered entity or business associate wording, healthcare customer pages, clinical workflow mentions. |
| SOC 2 and security assurance | SOC 2 Type II, ISO 27001, audit reports under NDA, security whitepaper, encryption, SSO, SCIM, retention controls. |
| Financial services | GLBA, FINRA, SEC, PCI DSS, payment processing, banking customers, KYC, AML, lending, insurance, broker-dealer references. |
| Education | FERPA, COPPA, student data privacy, school district language, LMS integrations, campus or university customer claims. |
| Geographic exposure | Region-specific privacy laws, data residency, country-specific terms, localized policies, public sector regional procurement claims. |

## Output

Each run produces:

- Evidence map with claim, category, confidence, source URL, page title, and short excerpt.
- Regulatory consideration summary that says what the public claim may imply.
- Source inventory grouped by page type.
- Contradiction and freshness notes, such as claims that appear outdated or inconsistent across pages.
- Human review checklist for counsel, compliance, or vendor management.

## Massive MCP fit

- `web_search` discovers public compliance, trust, legal, and help center pages with targeted search queries.
- `web_fetch` retrieves public pages with JavaScript rendering when needed.
- Country, city, and device targeting reveal region-specific privacy notices or consent experiences.
- Google SERP parsing helps find indexed legal and trust documents that site navigation may hide.
- `ai_chat_completion` summarizes evidence into structured categories with source-grounded reasoning.
- `account_status` can check quota and keep batch runs predictable.

## Guardrails

- Never represent the result as a legal opinion or compliance certification.
- Never access non-public content or attempt to bypass robots, authentication, paywalls, captchas, rate limits, or access controls.
- Never design or run vulnerability scanning, penetration testing, exploit discovery, or endpoint probing.
- Require source URLs and evidence snippets for every claim.
- Label absence of evidence clearly instead of treating it as evidence of absence.
- Separate "public claim observed" from "regulatory implication to review."

## Example summary

```text
Domain: example.com
Primary considerations:
- GDPR/privacy: The privacy policy references EU data subject rights, SCCs, and subprocessors.
- SOC 2/security assurance: The trust page says SOC 2 Type II is available under NDA.
- Healthcare: A solutions page markets to clinics, but no BAA claim was found.

Review notes:
- Ask whether a BAA is available before healthcare deployment.
- Confirm whether the SOC 2 report covers the product and current period.
- Review subprocessor list freshness and data transfer language.
```

