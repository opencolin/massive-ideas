# Evaluation

Goal: prove the Recruiting Job Description Analyzer can turn public job posts into accurate, source-backed recruiting intelligence faster than manual review while preserving uncertainty and citations.

## Test Set

Use 40 public job-analysis tasks:

- 8 single-company career pages with clearly structured job posts.
- 8 ATS-hosted job sets across common platforms such as Greenhouse, Lever, Ashby, Workday, and SmartRecruiters.
- 6 competitor-comparison tasks across 3-5 companies in the same role family.
- 5 geo-sensitive searches where country, city, or mobile SERPs expose different jobs or salary snippets.
- 4 remote-policy-heavy tasks with onsite, hybrid, remote, and region-restricted wording.
- 4 compensation-focused tasks in pay-transparency jurisdictions.
- 3 ambiguous company or title tasks with same-name collisions.
- 2 sparse or stale-posting tasks where gaps should be surfaced instead of overfilled.

For each task, create a human-labeled benchmark:

- Correct public job URLs and canonical company domain.
- Expected role title, team, seniority, location, and remote-policy label.
- Required versus preferred skills and tools.
- Core responsibilities and ownership areas.
- Compensation clues and pay-range source type.
- Urgency signals that are explicit versus inferred.
- Known stale, conflicting, duplicate, or low-quality sources.
- Required citations for each material extracted field.

## Metrics

Primary metrics:

- Field accuracy: at least 92% exact or acceptable matches for role title, location, remote policy, seniority, and compensation clue type.
- Citation coverage: at least 97% of material extracted fields include a valid public citation.
- Required-skill precision: at least 90% of extracted required skills are actually required in the source text.
- Required-skill recall: at least 85% of benchmark required skills are captured.
- Duplicate control: at least 95% of duplicate public listings collapse into the same canonical job.
- Manual time saved: reduce a 25-post recruiting analysis task from 2-3 hours to under 20 minutes of review.

Secondary metrics:

- Team extraction accuracy where team is explicitly listed.
- Seniority accuracy for ambiguous staff, principal, lead, manager, director, and executive titles.
- Remote-policy conflict detection.
- Compensation range extraction accuracy, including currency and location restrictions.
- SERP snippet usefulness versus fetched-page usefulness.
- Source freshness and visible-date capture.
- Cost per analyzed job post and per completed company batch.

## Manual Review Rubric

Score each report from 1-5:

- Source grounding: Are extracted fields tied to inspectable public sources?
- Recruiting usefulness: Would a recruiter or hiring manager trust the summary for intake or calibration?
- Field precision: Are title, team, seniority, location, remote policy, skills, responsibilities, and compensation clues correct?
- Inference discipline: Are inferred urgency, team, and seniority signals clearly labeled?
- Comparison quality: Do cross-post insights reflect repeated evidence rather than isolated phrasing?
- Concision: Can a reviewer understand the hiring pattern and source trail quickly?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No material field lacks a citation unless it is explicitly listed as a gap.
- No private candidate, applicant, employee, credential, or internal ATS data appears in the output.
- Inferred urgency and compensation clues are labeled with confidence and source type.
- Same-name collisions, duplicate posts, stale pages, and location conflicts are surfaced.

## Automated Checks

Run after every report build:

- JSON schema validation for the final report.
- Every job post has company, role title, canonical URL, source citation, and fetched or SERP evidence.
- Every material field has at least one citation or appears in the gaps list.
- Evidence URLs are valid HTTP(S) URLs.
- Source domains reconcile with raw SERP and fetch records.
- Snippet-only salary clues are labeled as `snippet_only` and capped below high confidence.
- Remote-policy labels are limited to the approved enum.
- Seniority labels are limited to the approved enum.
- Required skills have a source citation and requirement level.
- Duplicate canonical URLs do not appear as separate job posts.
- Exclusion terms are checked against selected URLs, titles, and extracted job text.
- Reports contain no private applicant data, credential material, or non-public ATS content.

## Failure Modes To Track

- Confusing a company with a same-name employer or staffing agency.
- Treating third-party job mirrors as more authoritative than the company or ATS source.
- Overstating remote eligibility when the page includes country, state, timezone, or office restrictions.
- Missing salary ranges hidden behind JavaScript-rendered sections.
- Treating benefits or equity mentions as base compensation.
- Extracting preferred skills as required skills.
- Inferring seniority only from years of experience when title and scope disagree.
- Counting duplicate ATS and company-career listings as separate roles.
- Presenting stale or closed jobs as active without caveat.
- Letting chatbot synthesis introduce uncited role details.

## Golden Examples

Create fixture tasks before implementation:

1. Clear single role: one company-hosted page with explicit title, level, location, skills, responsibilities, and salary range.
2. ATS JavaScript role: role details require rendered fetch to capture responsibilities and compensation.
3. Remote conflict: SERP says remote, page body restricts the job to specific states or countries.
4. Skill ambiguity: required and preferred sections contain overlapping tools.
5. Duplicate listing: same requisition appears on company site and ATS with different URLs.
6. Sparse posting: title and location are clear, but team, compensation, and urgency are missing.
7. Competitive hiring batch: several companies post similar senior engineering roles in one region.
8. Same-name collision: two employers share a name and require domain-based disambiguation.

Each fixture should include:

- Input request.
- Raw SERP snippets.
- Fetched source excerpts.
- Expected canonical job records.
- Expected extracted fields and allowed confidence ranges.
- Known conflicts, gaps, duplicates, and disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 40-task benchmark completes without crashes.
- Field accuracy is at least 92%.
- Citation coverage is at least 97%.
- Required-skill precision is at least 90%.
- Required-skill recall is at least 85%.
- Duplicate control is at least 95%.
- Median review time for a 25-post batch is under 20 minutes.
- Markdown, JSON, CSV, and skills-matrix exports are readable without manual cleanup.
