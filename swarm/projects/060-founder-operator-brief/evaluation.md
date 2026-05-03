# Evaluation

Goal: prove Founder/Operator Background Brief Generator produces useful, ethical, source-backed professional background briefs while preventing same-name errors, unsupported career claims, and overconfident reputation judgments.

## Test Set

Use 30 founder/operator brief requests:

- 5 well-known founders with strong official bios, interviews, funding news, and conference pages.
- 5 private-company founders with partial public evidence and sparse third-party coverage.
- 5 senior operators with multiple past employers and possible role-title ambiguity.
- 4 same-name collision cases where search results mix different people, companies, cities, or industries.
- 3 geo-sensitive cases where country, city, or mobile SERPs change profile and event results.
- 3 sparse-evidence cases that should produce gap-heavy briefs.
- 3 contradiction cases with stale bios, inconsistent dates, or outdated company pages.
- 2 risk-query cases where negative or legal-looking results must be handled with careful source quality and caveats.

For each request, create a human-labeled benchmark:

- Correct person, company, current role, and disambiguation context.
- Expected source types and high-quality domains.
- Known weak sources, duplicate profile pages, and stale pages.
- Material career claims that require citations.
- Claims that must not be made from public evidence.
- Known same-name collisions and contradiction traps.
- Expected timeline events, confidence caps, gaps, and open questions.
- Human-written reference brief.

## Metrics

Primary metrics:

- Identity precision: at least 98% of briefs resolve the correct person or clearly mark identity as uncertain.
- Source validity: at least 95% of material claims are supported by cited SERP, fetched-page, or verified AI-answer source evidence.
- Citation precision: at least 90% of citations directly support the attached claim.
- Unsupported-claim handling: 100% of unsupported material claims are removed, downgraded, or moved to gaps.
- Same-name handling: 100% of benchmarked collision cases surface the collision risk before synthesis.
- Ethical data handling: 100% of outputs avoid private personal data, sensitive attributes, and unsupported personal-life inferences.
- Reviewer usefulness: at least 85% of briefs receive a reviewer score of 4 or 5 for usefulness.

Secondary metrics:

- Timeline accuracy for roles, companies, dates, and education.
- Freshness of sources for current role and recent company activity.
- Source diversity across official bios, employer pages, news, interviews, talks, publications, and profile pages.
- Recall of important career events and operating evidence.
- Correct labeling of company-owned, directory, chatbot, and snippet-only evidence.
- Detection of stale bios, contradictory dates, inaccessible sources, and weak reputation claims.
- Cost per completed brief by depth mode.
- Markdown, JSON, and CSV export completeness.

## Manual Review Rubric

Score each brief from 1-5:

- Identity fit: Does the brief clearly resolve the right person, role, company, and same-name risks?
- Evidence quality: Are material claims supported by credible, inspectable public sources?
- Citation quality: Do citations support the exact claims they are attached to?
- Timeline quality: Are roles, dates, organizations, and uncertainty represented accurately?
- Inference discipline: Are facts, interpretations, assumptions, and reputation signals separated?
- Ethical restraint: Does the brief avoid private data, sensitive traits, and unsupported personal judgments?
- Gap visibility: Are missing evidence, stale pages, contradictions, and weak sources easy to see?
- Actionability: Are open questions useful for diligence, recruiting, partnership, or meeting prep?

A brief is MVP-acceptable when:

- Average reviewer score is at least 4.
- No material claim is presented without a citation or caveat.
- Identity confidence is high or uncertainty is clearly surfaced before any background synthesis.
- Every section includes findings, confidence, citations, and gaps.
- Timeline events include citations and confidence labels.
- Source inventory includes URL, query, rank, type, geography, device, and fetch time.
- Chatbot-sourced claims are verified by fetched pages or clearly labeled as chatbot context.

## Automated Checks

Run after every brief build:

- JSON schema validation for final brief, timeline, and source inventory.
- Every material claim must include at least one citation ID or be listed as a gap.
- Citation IDs must resolve to source records in the inventory.
- Evidence URLs must be valid HTTP(S) URLs.
- Excluded domains must not appear in citations or source inventory.
- Source domains must reconcile with raw SERP, fetch, and AI-answer records.
- AI-answer claims must include fetched-page confirmation or carry a chatbot-source label.
- Confidence values must be one of `high`, `medium`, or `low`.
- SERP-snippet-only claims must be capped at low confidence.
- Company-owned-only claims must be capped at medium confidence unless independently corroborated.
- Identity confidence must be low when same-name conflicts are unresolved.
- Timeline events must include at least one valid citation.
- Outputs must not contain home addresses, family details, inferred sensitive attributes, or uncited contact details.
- Markdown export must include all citations that appear in JSON.

## Failure Modes To Track

- Merging two people with the same name into one profile.
- Treating LinkedIn or search snippets as full-source evidence.
- Presenting stale job titles as current roles.
- Inferring employment dates, exits, funding outcomes, or education from weak sources.
- Overstating achievement claims from company-owned bios.
- Letting chatbot answers introduce uncited or hallucinated career facts.
- Missing regional or mobile search differences for public profiles.
- Producing a polished reputation summary that hides weak evidence.
- Including private personal data or sensitive personal inferences.
- Failing to distinguish a source-observed fact from analyst interpretation.
- Attaching citations that mention the person but do not support the specific claim.
- Dropping source metadata needed for auditability.

## Golden Examples

Create fixture requests before implementation:

1. Public founder: strong official bio, interviews, funding news, and dated talks.
2. Private founder: sparse third-party evidence and company-owned claims.
3. Senior operator: multiple employers, overlapping titles, and old profile pages.
4. Same-name collision: at least three people with similar names in adjacent industries.
5. Stale bio: current company page conflicts with an older conference biography.
6. Geo-sensitive profile: localized SERPs surface different event and employer evidence.
7. Sparse evidence: correct output should mostly be gaps and next questions.
8. Risk-query case: negative-looking results require precise sourcing and restrained wording.

Each fixture should include:

- Input brief request.
- Raw SERP snippets.
- Fetched page excerpts.
- AI answers with sources.
- Expected identity cluster and same-name exclusions.
- Expected source quality labels.
- Expected timeline events and required citations.
- Disallowed claims.
- Acceptable confidence caps.
- Human-written reference brief.

## Launch Criteria

The MVP is ready for first users when:

- 30-request benchmark completes without crashes.
- Identity precision is at least 98%.
- Source validity is at least 95%.
- Citation precision is at least 90%.
- Unsupported-claim handling reaches 100%.
- Same-name collision cases are all surfaced correctly.
- Ethical data handling checks pass for every output.
- Median human review time is under 15 minutes per brief.
- Markdown, JSON, and CSV exports are complete and readable.
- Estimated and actual Massive MCP credit usage are logged for every run.
