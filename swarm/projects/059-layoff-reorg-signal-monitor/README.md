# Layoff Reorg Signal Monitor

Idea 59 is a public layoff and reorg signal monitor for account, market, and talent intelligence teams. It watches public news, company pages, regulatory notices, WARN-style postings, blogs, press releases, leadership announcements, and search results, then turns scattered restructuring evidence into a sourced company-level signal feed.

The monitor does not collect private employee data, scrape authenticated systems, identify individual employees affected by layoffs, or infer sensitive personal attributes. It summarizes public organization-level evidence and clearly separates observed facts from interpretation.

## Problem

Layoffs, restructurings, office closures, divestitures, and leadership changes can indicate budget pressure, strategy shifts, vendor consolidation, market exits, or new operating priorities. The evidence is fragmented across news coverage, company blogs, investor relations pages, state notices, social snippets, and regional search results. Teams often see the headline but miss the practical account-level implications, or they overreact to weak rumors.

This product creates a repeatable, evidence-backed workflow for answering "what changed at this company, how reliable is the evidence, and what might it mean?" without presenting layoffs as a simple sales trigger or using personal hardship for exploitative outreach.

## Target Users

- B2B sales and customer success teams monitoring named accounts for budget, consolidation, and stakeholder-change risk.
- RevOps and account planning teams maintaining current account intelligence.
- Investors and analysts tracking workforce reductions, restructurings, and operating discipline across markets.
- Recruiting and talent strategy teams watching company-level labor-market movement without profiling individuals.
- Competitive intelligence teams comparing reorg patterns, market exits, and leadership changes.

## Inputs

- Target company list with company name, domain, optional ticker, region, owner, account tier, and industry.
- Optional monitoring categories such as layoffs, hiring freezes, office closures, divestitures, leadership changes, restructurings, and department consolidation.
- Optional geography lens such as country, state, province, city, or regulatory jurisdiction.
- Optional date window and cadence such as daily alerts, weekly account risk scan, or quarterly market review.

## Monitored Signals

| Signal | Public evidence |
| --- | --- |
| Layoff announcement | Company statement, credible news article, regulatory notice, investor update, or public blog post. |
| Reorganization | Official restructuring plan, business unit consolidation, reporting-line change, or leadership memo published publicly. |
| Office or site closure | WARN notice, local news, company facilities page update, lease notice, or regional announcement. |
| Hiring freeze or slowdown | Official statement, careers page collapse, removal of requisitions, or executive commentary. |
| Divestiture or market exit | Press release, investor relations filing, product sunset, regional shutdown, or business-line sale. |
| Leadership change | Executive departure, interim appointment, board update, new operating model, or public org announcement. |

## Output

Each run produces:

- Ranked company feed with signal type, observed evidence, event date, affected geography or unit, confidence, and source URLs.
- Source-backed summary that distinguishes confirmed public facts from interpretation.
- Timeline of related events such as prior layoffs, hiring changes, office closures, or restructuring updates.
- Risk and opportunity notes for account owners, written in neutral and non-exploitative language.
- Source log with search queries, SERP metadata, fetched pages, render settings, skipped URLs, and extraction confidence.

## Massive MCP Fit

- `web_search` discovers current news, official company statements, investor pages, regulatory notices, and regional reports.
- Google SERP parsing provides structured titles, snippets, dates, result URLs, and ranking context for repeatable discovery.
- `web_fetch` retrieves source pages, including JavaScript-rendered company newsrooms, investor relations pages, and government notice sites.
- Country, city, and device targeting helps surface local WARN notices, regional business press, and localized company pages.
- Captcha handling improves resilience for public sites that gate ordinary visitors while preserving normal access boundaries.
- `ai_chat_completion` extracts event facts, classifies signal type, normalizes dates and geographies, assigns confidence, and writes source-grounded summaries.
- `account_status` gates batch size, recency depth, and monitoring cadence for large account lists.

## Guardrails

- Use public company-level and regulatory data only.
- Do not collect private employee lists, personal contact details, severance information, or individual employment status.
- Do not scrape authenticated systems, private forums, internal memos, or employee-only pages.
- Do not infer protected characteristics or target individuals affected by layoffs.
- Avoid sensational or exploitative language; frame account actions around support, risk, continuity, or planning.
- Require source URLs and evidence snippets for every signal.
- Label unconfirmed reports, rumors, and social-only claims as low confidence or exclude them.

## Example Summary

```text
Account: Northstar Health
Run date: 2026-05-02

Top signals:
- Confirmed reorg: company announced consolidation of customer operations into a single global support unit.
- Layoff notice: state WARN posting lists 82 affected roles at the Phoenix office, effective 2026-06-30.
- Leadership change: new COO appointed to lead operational efficiency program.

Interpretation:
The public evidence suggests an operating-model reset and possible vendor consolidation pressure. Treat this as an account-risk and continuity-planning signal, not as proof of immediate budget availability.
```
