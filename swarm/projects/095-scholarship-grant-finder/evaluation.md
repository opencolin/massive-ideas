# Evaluation

Goal: prove the Scholarship And Grant Finder discovers relevant public programs, extracts eligibility accurately, and produces auditable shortlists without presenting financial, legal, tax, immigration, admissions, or benefits advice.

## Test Set

Use 45 benchmark finder runs:

- 8 undergraduate scholarship searches across state, school, major, and local foundation criteria.
- 6 high school senior searches with city, county, GPA, first-generation, and deadline constraints.
- 5 graduate fellowship or research award searches with field, institution, and citizenship criteria.
- 6 nonprofit grant searches across mission area, geography, tax status, and budget-size constraints.
- 5 school, library, or municipality grant searches with public-sector eligibility.
- 5 small organization or small business public grant searches where source quality varies heavily.
- 4 local-only searches that require country, city, and mobile or desktop targeting.
- 3 stale-directory searches where the correct result is closed, stale, or needs review.
- 3 adversarial searches that try to force guarantees, advice, or unsupported eligibility conclusions.

For each benchmark, create human labels:

- Applicant profile, geography, field, institution, organization type, affiliations, and deadline window.
- Known official sources and program sponsor pages.
- Known stale aggregators, spam directories, and unrelated similarly named programs.
- Required extracted eligibility criteria.
- Deadline status and freshness label.
- Expected match status, confidence, disqualifiers, and human-review questions.
- Claims or advice that must not appear in the final output.

## Metrics

Primary metrics:

- Program discovery recall: at least 85% of benchmark-relevant public programs are found.
- Eligibility extraction accuracy: at least 92% of required criteria are extracted with the correct field label.
- Citation validity: at least 97% of eligibility criteria cite a source excerpt that supports the criterion.
- Match classification agreement: at least 88% agreement with expert match labels.
- Stale or closed detection: at least 95% of known stale, closed, or missing-deadline programs are flagged.
- Advice avoidance: 100% of outputs avoid guarantees and financial, legal, tax, immigration, admissions, or benefits advice.

Secondary metrics:

- Correct source authority classification for official, sponsor-owned, government, school, foundation, aggregator, and weak sources.
- Correct preservation of query, rank, country, city, device, timestamp, and fetch status.
- Duplicate program suppression across sponsor pages, PDFs, and directories.
- Correct separation of required criteria from preference criteria.
- Sensible handling of sensitive profile fields and opt-in matching.
- Credit estimate accuracy for quick, standard, and deep modes.
- Markdown, JSON, and CSV export completeness.

## Manual Review Rubric

Score each generated shortlist from 1-5:

- Relevance: Are programs appropriate to the profile and search scope?
- Source quality: Are official and sponsor-owned sources prioritized over aggregators?
- Eligibility quality: Are criteria extracted precisely and without overinterpretation?
- Match reasoning: Does the status follow from the profile and cited criteria?
- Deadline handling: Are open, closed, rolling, stale, and unknown deadlines handled conservatively?
- Reviewability: Can a human audit every criterion and match decision quickly?
- Restraint: Does the output remain public program research rather than advice?

A shortlist is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every program has at least one inspectable source URL.
- Every eligibility criterion links to a source ID and excerpt.
- Every match explanation cites criterion IDs.
- Closed, stale, or unknown-deadline programs are not presented as open opportunities.
- Sensitive criteria are marked `needs_review` when the source language is ambiguous.
- The export contains the same program, source, criterion, and match graph as the UI.

## Automated Checks

Run after every finder run:

- Validate profile, source, program, criterion, match, and run records against JSON schemas.
- Every program has a name, source ID, source URL, and program type.
- Every criterion has `field`, `requirement_text`, `excerpt`, `source_id`, and `confidence`.
- Every match has status, confidence, cited criterion IDs, explanation, and next review steps.
- SERP records include query, rank, country, city, device, and timestamp.
- Fetched records include URL, fetch timestamp, status, rendering settings, and source type.
- Deadline fields use ISO dates when exact dates are known.
- Closed or stale programs cannot be ranked as `strong_match`.
- Snippet-only and AI-answer-only leads cannot produce accepted eligibility criteria.
- Advice disclaimer appears in Markdown exports.
- Banned guarantee phrases do not appear, such as "you qualify", "you will receive", or "guaranteed award".
- CSV row counts reconcile with JSON program, source, criterion, and match counts.

## Failure Modes To Track

- Treating aggregator snippets as verified eligibility.
- Presenting stale scholarship pages as current.
- Missing local programs because city, county, or mobile targeting was skipped.
- Confusing grants for organizations with scholarships for individuals.
- Merging similarly named foundations, funds, or award cycles.
- Treating preference language as a hard requirement.
- Ignoring citizenship, residency, institution, or tax-status restrictions.
- Overstating match certainty when profile fields are missing.
- Producing advice about whether to apply, accept funds, file taxes, or handle immigration status.
- Losing the source trail between criteria, excerpts, and final match status.

## Golden Examples

Create fixture runs before implementation:

1. Strong scholarship match: official sponsor page, explicit geography, major, level, current deadline, and clear award amount.
2. Possible match: likely relevant program with ambiguous residency or institution requirement.
3. Unlikely match: field or applicant type mismatch that should be explained with citations.
4. Closed or stale: old deadline visible on an aggregator and no current sponsor confirmation.
5. Local-only opportunity: community foundation award found through city/county SERP targeting.
6. Nonprofit grant: mission and tax-status requirements extracted from a foundation guideline PDF.
7. Public-sector grant: municipality or school eligibility with agency page and application guide.
8. Sensitive criterion: citizenship, residency, financial need, or documentation language requiring human review.
9. Adversarial profile: user asks for guaranteed funding or advice, and system stays in research mode.

Each fixture should include:

- Input profile.
- Expected search plan.
- Raw parsed SERP results.
- Fetched official pages, PDFs, FAQs, and aggregator excerpts.
- Expected program records.
- Required eligibility criteria and rejected criteria.
- Expected match status, confidence, disqualifiers, and human-review questions.
- Output text that must not appear.

## Launch Criteria

The MVP is ready for first users when:

- 45-run benchmark completes without crashes.
- Program discovery recall is at least 85%.
- Eligibility extraction accuracy is at least 92%.
- Citation validity is at least 97%.
- Match classification agreement is at least 88%.
- Stale or closed detection is at least 95%.
- Advice avoidance is 100%.
- Median human review time for a standard shortlist is under 15 minutes.
- Quick, standard, and deep modes log estimated and actual Massive MCP credit usage.
- Markdown, JSON, and CSV exports are complete and readable.
