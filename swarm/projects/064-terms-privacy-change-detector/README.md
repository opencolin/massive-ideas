# Terms and Privacy Policy Change Detector

Idea 64 in the Massive MCP rolling swarm: a detector that monitors public terms of service, privacy policies, cookie notices, subprocessors, and related legal pages for meaningful changes.

## Problem

Companies change legal and policy pages without sending clear notices to every affected customer, buyer, partner, or analyst. Important updates can be buried in rewritten privacy language, new data-sharing clauses, changed dispute terms, revised retention periods, added subprocessors, regional notice changes, or mobile-only consent flows.

Manual review is slow and noisy. Simple text diffs produce too many cosmetic changes and miss the practical meaning of policy edits. This product turns public policy monitoring into a source-backed change digest that highlights what changed, why it may matter, and what a human should review next.

## Product

Terms and Privacy Policy Change Detector accepts a company domain or known policy URL list, discovers public legal pages, fetches current versions, compares them with prior snapshots, and summarizes material changes with citations.

It does not provide legal advice or determine compliance. It identifies public text changes and translates them into review-ready notes for legal, privacy, procurement, security, revenue, and research teams.

## Target Users

- Legal and privacy teams monitoring vendors, competitors, or portfolio companies.
- Procurement and vendor management teams watching contract and data-use changes.
- Security and compliance teams tracking subprocessors, retention, transfer, and audit language.
- Customer success and revenue teams watching competitor policy shifts.
- Journalists, analysts, and investors following public policy posture changes.

## Sources

Primary public sources:

- Terms of service, terms of use, service agreements, acceptable use policies.
- Privacy policies, privacy notices, regional privacy addenda, children's privacy notices.
- Cookie policies, consent notices, preference center text, tracking disclosures.
- Data processing addenda, subprocessors, data transfer pages, retention notices.
- Security, trust, compliance, legal, accessibility, and help center policy pages.
- App store privacy labels or official hosted policy pages when linked by the company.

Excluded sources:

- Authenticated portals, private trust center documents, SOC 2 reports, account dashboards, or paid-only pages.
- Non-public contracts, leaked documents, credential-protected material, or bypassed content.
- Vulnerability scanning, penetration testing, exploit checks, or private system assessment.

## Core Checks

- Policy discovery: find official policy pages through site navigation, search results, sitemaps, and known legal URL patterns.
- Version capture: store fetched text, page metadata, rendered text, targeting context, fetch time, and canonical URL.
- Semantic diffing: separate material policy changes from formatting, navigation, boilerplate, and timestamp-only edits.
- Clause classification: label changes by topic, such as data sharing, AI use, retention, arbitration, children, cookies, subprocessors, international transfers, pricing terms, or cancellation.
- Region and device comparison: detect policy or consent differences by country, city, desktop, and mobile profile.
- Source-backed summary: quote short evidence excerpts and link every change to the exact source URL and prior snapshot.

## Why Massive MCP

- `web_search` discovers official policy URLs, indexed legal pages, and hidden-but-public regional notices.
- `web_fetch` retrieves public pages with JavaScript rendering for policy centers and consent experiences.
- Country, city, and device targeting reveal localized privacy notices, cookie banners, and mobile-specific policy pages.
- Captcha handling helps access public pages in the same way a normal visitor would, without bypassing private access.
- Google SERP parsing can find legal pages that are not exposed in current site navigation.
- `ai_chat_completion` can summarize diffs into source-grounded, non-legal review notes.
- `account_status` helps manage batch monitoring quotas across large watchlists.

## Output

Each monitoring run returns:

- Change summary with severity, topic, affected page, old wording, new wording, and source URL.
- Materiality explanation written as a review prompt, not a legal conclusion.
- Noise filter notes for ignored cosmetic edits.
- Regional and device variance report when targeting profiles differ.
- Watchlist status showing unchanged, changed, blocked, missing, or inconclusive pages.
- Exportable Markdown, JSON, and CSV artifacts for review workflows.

## Guardrails

- Never claim that a change is legally valid, enforceable, compliant, or non-compliant.
- Never access non-public content or attempt to bypass authentication, paywalls, private trust portals, or access controls.
- Never use leaked contracts, credentials, or confidential documents.
- Require source URLs and evidence excerpts for every reported change.
- Label blocked, missing, or inconclusive pages clearly.
- Preserve prior and current snapshots so reviewers can audit the generated summary.

## Example Summary

```text
Domain: example.com
Run date: 2026-05-02

Material changes:
- Privacy policy: New language says product analytics data may be used to improve AI features.
- Subprocessors: Two infrastructure providers were added to the public subprocessor list.
- Terms: Arbitration venue changed from New York County to San Francisco County.

Review prompts:
- Confirm whether AI feature language affects existing customer commitments.
- Check whether new subprocessors require customer notice.
- Ask counsel whether venue changes matter for current contract templates.
```
