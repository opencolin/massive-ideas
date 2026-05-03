# Vendor Risk Monitor

Idea 61 in the Massive MCP rolling swarm.

Vendor Risk Monitor tracks public vendor operations and commercial risk signals across status pages, documentation, pricing pages, product updates, news, and search results. It is designed for procurement, finance, legal, customer success, and operations teams that need early warning when a vendor's public posture changes.

This is not a cybersecurity testing product. It does not scan infrastructure, probe applications, enumerate weaknesses, bypass controls, or perform adversarial assessment. It only observes public information that vendors publish or that appears in public news and search results.

## Problem

Companies depend on dozens or hundreds of SaaS, data, infrastructure, and service vendors. Risk changes often show up publicly before they are captured in renewal notes or quarterly reviews:

- Repeated incidents on a status page.
- Documentation changes that deprecate features or alter SLAs.
- Pricing page changes that introduce minimums, usage fees, or packaging shifts.
- News about layoffs, acquisitions, lawsuits, outages, leadership changes, or market exits.
- Search results and AI answers that surface emerging customer complaints or operational concerns.

Most teams discover these shifts manually, late, or only during renewal cycles.

## Massive MCP Fit

Massive MCP provides the primitives needed for a public vendor intelligence monitor:

- `web_fetch` to capture status pages, docs, changelogs, pricing pages, trust pages, and public policy pages.
- JS rendering for modern vendor sites where pricing tables, incident history, or docs navigation load client-side.
- `web_search` and Google SERP parsing to monitor news, reviews, search snippets, and changing public narratives.
- Country, city, and device targeting to compare localized pricing, availability, packaging, and page rendering.
- Captcha handling for public pages that require normal browser-like access.
- `ai_chat_completion` to summarize change evidence, classify risk type, and produce operator-ready briefs.
- Chatbot answers with sources to generate grounded vendor risk summaries that point back to public evidence.
- `account_status` to expose monitor health, quota state, and run readiness.

## Users

- Procurement teams watching renewal and negotiation risk.
- Finance teams monitoring vendor cost exposure.
- Legal and compliance teams tracking public policy, terms, and data processing changes.
- Customer success and support teams preparing for vendor-driven customer impact.
- Operators maintaining critical vendor dependency lists.

## Core Workflow

1. Add a vendor with known public URLs: status page, docs, pricing, blog, changelog, terms, trust center, and key search queries.
2. Massive MCP fetches and renders pages on a schedule.
3. The monitor normalizes visible text, tables, metadata, links, dates, and source URLs.
4. Diffs identify meaningful changes while suppressing boilerplate, layout churn, and timestamps.
5. Search and SERP checks capture new external coverage and public sentiment shifts.
6. AI classification labels each signal by risk category, severity, confidence, and business impact.
7. The system emits a sourced digest with evidence links and recommended review actions.

## Risk Categories

- Availability risk: repeated incidents, degraded regions, maintenance windows, unresolved outage language.
- Commercial risk: price increases, package removals, new overage fees, minimum contract changes, discount policy shifts.
- Product continuity risk: deprecated APIs, feature retirement, changed limits, roadmap reversals.
- Contract and policy risk: terms updates, SLA changes, privacy policy changes, data residency changes.
- Market risk: layoffs, funding issues, acquisition rumors, leadership departures, office closures, negative analyst or customer coverage.
- Support risk: support tier changes, docs gaps, community complaints, longer response commitments.

## Output

Each alert should include:

- Vendor name and monitored surface.
- What changed.
- Why it matters commercially or operationally.
- Evidence URLs and captured excerpts.
- Severity and confidence.
- Suggested owner, such as procurement, finance, legal, or operations.
- Recommended next action, such as renewal note, vendor question, stakeholder escalation, or no-action watchlist.

## Guardrails

- Use only public pages, public search results, and public sourced summaries.
- Do not attempt login-protected monitoring unless the customer provides authorized credentials for their own account.
- Do not probe, fuzz, scan, exploit, or test vendor security posture.
- Do not infer private vendor health from unsupported speculation.
- Keep generated summaries evidence-bound and source-linked.

## Prototype Shape

The first prototype can be a scheduled command-line or lightweight web app that accepts a CSV of vendors and URLs, stores snapshots, computes page/search diffs, and writes a daily Markdown or JSON risk digest.

