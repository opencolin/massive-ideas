# Local Regulation Summary Bot

Idea 76 is a local regulation summary bot that gathers public information about city, county, state, and country rules for a specific business activity or operational question. It uses Massive MCP to discover official government pages, fetch and render public sources, and produce a plain-language summary with source links.

The bot is framed as a public information assistant, not legal advice. It does not interpret private facts, determine legal obligations, replace counsel, file forms, or tell a user they are compliant. It summarizes publicly available regulatory materials and highlights questions to verify with the relevant authority or a qualified professional.

## Problem

Local rules are fragmented across municipal codes, county health departments, state agencies, licensing portals, zoning pages, PDF forms, FAQ pages, and public notices. A founder, operator, landlord, marketplace team, or local service provider may need a quick orientation before opening a location, launching a service, hiring workers, posting signage, selling regulated goods, or running a public event.

Manual research is slow and brittle. Search results mix official pages with blogs, outdated PDFs, paid lead forms, and legal marketing content. This bot turns the first pass into a repeatable source-backed workflow that says what was found, where it came from, and what still needs human confirmation.

## Target Users

- Small business owners checking local permits, licenses, signage, hours, health, or zoning basics.
- Marketplace and operations teams launching city-by-city services.
- Property managers and venue operators reviewing public occupancy, event, noise, or short-term rental rules.
- Compliance and legal teams preparing a first-pass source packet for deeper review.
- Civic researchers comparing how different cities describe the same activity.

## Inputs

- Location, such as city, county, state, province, country, or postal code.
- Activity or question, such as "food truck permit," "short-term rental registration," "sidewalk cafe," "home bakery," "massage business license," or "noise limits for outdoor event."
- Optional business context, such as industry, entity type, venue type, operating hours, number of employees, or target launch date.
- Optional source preferences, such as official sources only, include state-level rules, include forms, or include fee schedules.
- Optional country, city, language, and device targeting for localized search and rendered public pages.

## Public Sources

Preferred source types:

- Official city, county, state, province, national, or agency pages.
- Municipal code, ordinance, regulation, licensing, permitting, zoning, tax, and health department pages.
- Official forms, fee schedules, checklists, PDFs, FAQs, inspection guides, and public notices.
- Official portals and public search pages that do not require login or private records.
- Court, legislature, or gazette pages when they are official and relevant.

Secondary source types:

- University, chamber of commerce, nonprofit, or professional association explainers, clearly labeled as secondary.
- Legal or consulting blogs only when official sources are unavailable, and never as the sole basis for a claim.

Excluded source types:

- Private portals, authenticated account areas, paid databases, leaked documents, private records, or non-public filings.
- Attempts to bypass access controls, captchas, rate limits, paywalls, or robots restrictions.
- Personalized legal analysis, compliance certification, or advice about what the user must do.

## Output

Each run produces:

- Public information summary with jurisdiction, activity, date collected, and scope.
- Source-backed rule table with topic, plain-language summary, source URL, source type, excerpt, and confidence.
- Official source inventory grouped by agency or jurisdiction level.
- Required verification list for items that depend on facts, dates, thresholds, inspections, exemptions, or agency discretion.
- "No public source found" notes for expected topics that could not be confirmed.
- Clear disclaimer that the result is public information, not legal advice.

## Massive MCP Fit

- `web_search` discovers official pages, municipal codes, licensing portals, forms, FAQs, and Google SERP results for the target location and activity.
- `web_fetch` retrieves public pages and PDFs, with JavaScript rendering for agency portals and modern government sites.
- Country, city, and device targeting help observe location-specific government content and mobile-only public flows.
- Google SERP parsing separates official government results from secondary explainers and ads.
- Captcha handling supports normal public access where a government page presents a public challenge.
- `ai_chat_completion` converts source excerpts into concise summaries, confidence labels, and verification questions.
- `account_status` checks quota before broad multi-jurisdiction runs.

## Guardrails

- Always say the product provides public information summaries, not legal advice.
- Require source links and excerpts for every rule-like claim.
- Prefer official sources and label secondary sources clearly.
- Distinguish "public source says" from "this applies to you."
- Mark uncertainty, missing evidence, stale pages, and jurisdiction conflicts.
- Do not provide legal conclusions, compliance determinations, form-filing instructions tailored to private facts, or advice to ignore a rule.
- Do not access non-public content or attempt to bypass access controls.

## Example Summary

```text
Question: What public rules apply to a sidewalk cafe in Portland, Oregon?
Scope: Public official sources collected on 2026-05-02

Summary:
- The city publishes a sidewalk cafe permit page and application checklist.
- Public materials mention insurance, site plan, clearance, and renewal requirements.
- Fee amounts appear in a separate public fee schedule.
- Alcohol service may require separate state liquor licensing review.

Verification:
- Confirm current fee amount and processing time with the city.
- Confirm whether the specific address falls inside any overlay district.
- Ask counsel or the agency whether the proposed layout satisfies clearance rules.

This is a public information summary, not legal advice.
```
