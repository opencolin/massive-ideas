# Security Page Claims Monitor

Idea 65 is a public trust and compliance claims monitor for SOC 2, HIPAA, and GDPR language on company security, trust, privacy, legal, docs, and help center pages. It watches what a company says publicly, records evidence with sources, and highlights additions, removals, stale wording, and contradictions for human review.

This is not security testing. It does not scan systems, test controls, probe endpoints, bypass access, infer private security posture, or certify compliance. It only monitors public pages and frames findings as observed public claims.

## Problem

Compliance and procurement teams often rely on public trust pages to understand whether a vendor claims SOC 2 readiness, HIPAA support, GDPR processing terms, or related assurance materials. Those pages change quietly: a SOC 2 report date is updated, BAA language disappears, a GDPR DPA moves, a subprocessor page adds a region, or a security page starts claiming a new certification.

Manual review is slow and easy to miss. The monitor turns public-page checks into a recurring, source-backed workflow that separates "the company publicly claims this" from "the company is compliant."

## Target users

- Vendor risk, procurement, and compliance teams tracking suppliers.
- Sales and customer success teams preparing trust-package updates.
- Legal teams reviewing public privacy and DPA language over time.
- Investors, analysts, and partnership teams watching public assurance signals.

## Inputs

- Company domain or list of domains.
- Optional known URLs, such as `/security`, `/trust`, `/privacy`, `/legal`, `/dpa`, or `/subprocessors`.
- Optional claim categories to monitor: SOC 2, HIPAA, GDPR, security report availability, DPA, BAA, subprocessors, data residency, breach notice, encryption, access controls, retention, or audit language.
- Optional country, city, device, and rendering settings for public regional pages.
- Optional cadence, such as daily, weekly, monthly, or pre-renewal check.

## Public Sources

Allowed source types:

- Security, trust, compliance, privacy, cookie, legal, DPA, BAA, and subprocessor pages.
- Product documentation and help center articles about privacy, security, enterprise controls, and regulated use cases.
- Public trust centers, status pages, and official hosted policy portals.
- Public marketing pages that mention SOC 2, HIPAA, GDPR, audit reports, healthcare, EU data rights, or business associate language.
- Public changelogs or blog posts when they announce compliance-claim changes.

Excluded source types:

- Authenticated trust portals, private SOC 2 reports, customer-only files, leaked documents, or paid account areas.
- Vulnerability scanning, penetration testing, exploit checks, auth testing, endpoint probing, or hidden route discovery.
- Attempts to bypass login walls, captchas, paywalls, rate limits, robots restrictions, or access controls.

## Monitored Claims

| Category | Public claim examples |
| --- | --- |
| SOC 2 | SOC 2 Type I or Type II, report available under NDA, auditor name, report period, trust center evidence, annual audit language. |
| HIPAA | HIPAA-ready, BAA available, PHI handling, covered entity or business associate wording, healthcare customer eligibility. |
| GDPR | DPA, SCCs, subprocessors, data subject rights, international transfers, EU representative, lawful basis, data residency claims. |
| Trust posture | Encryption, SSO, SCIM, access reviews, retention, incident response, breach notification, vendor review packets. |
| Freshness | Certification dates, report periods, last updated timestamps, stale policy language, moved or removed pages. |
| Contradictions | One page says BAA available while another says healthcare use is prohibited, or a trust page says SOC 2 Type II while docs mention Type I. |

## Output

Each monitor run produces:

- Claim inventory with category, normalized claim, confidence, source URL, page title, excerpt, and first/last seen dates.
- Change log showing added, removed, modified, stale, or contradictory public claims.
- Diff summary written for humans, not lawyers or auditors.
- Review questions for the responsible team.
- Source inventory with fetch status, rendering status, country/device view, and canonical URL.
- Explicit non-goals disclaimer for legal/compliance interpretation.

## Massive MCP Fit

- `web_search` discovers indexed public trust, security, legal, and help center pages.
- `web_fetch` captures public pages with JavaScript rendering for modern trust centers.
- Captcha handling supports normal public visitor access when a public page presents a challenge.
- Country, city, and device targeting compare regional privacy notices and mobile/desktop trust pages.
- Google SERP parsing finds public policy pages that are not linked from navigation.
- `ai_chat_completion` extracts normalized claims, compares snapshots, and generates source-grounded review notes.
- `account_status` helps schedule recurring batch runs within quota.

## Guardrails

- Present findings as public claims monitoring only.
- Require a source URL and evidence excerpt for every claim.
- Do not say a company is compliant, certified, secure, or non-compliant based only on public pages.
- Label missing evidence as "no public claim observed" instead of proving absence.
- Do not fetch or request private reports, credentials, hidden files, or customer-only trust content.
- Refuse requests that ask for security testing, exploitation, bypass, credential use, or private access.

## Example Output

```text
Domain: example.com
Run date: 2026-05-02
Scope: Public first-party pages only

Changes since last run:
- Added: Security page now says "SOC 2 Type II report available under NDA."
- Modified: Privacy policy updated GDPR transfer language from SCC 2021 wording to SCC 2024 wording.
- Removed: HIPAA BAA availability was no longer found on the healthcare solutions page.

Review questions:
- Confirm whether the SOC 2 report period is current and covers the product under review.
- Ask whether BAA availability changed or moved to a different public page.
- Review the updated transfer language with counsel.

Non-goal: This monitor does not perform security testing or provide a compliance certification.
```
