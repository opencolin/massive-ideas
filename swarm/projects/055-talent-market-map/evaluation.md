# Evaluation

Goal: prove Talent Market Map produces useful, source-backed geography prioritization for hiring strategy faster than manual SERP, job-board, and community review.

## Test Set

Use 24 role-geography runs:

- 5 engineering role families with distinct skill stacks.
- 4 go-to-market role families where employer demand varies by city.
- 4 healthcare, finance, or regulated roles where certifications matter.
- 4 remote-friendly roles where local and national evidence can be confused.
- 3 sparse markets where the correct answer may be "low evidence."
- 2 ambiguous roles with overlapping titles or training-program noise.
- 2 mobile-sensitive runs where local search surfaces different job or community results.

For each run, create a human-labeled benchmark:

- Candidate geographies and expected relative hiring attractiveness.
- Relevant and irrelevant SERP results.
- Expected employer-demand, talent-supply, community, and compensation signals.
- Known competitor employers.
- Skills, certifications, seniority, and location phrases that should match.
- Exclusions and ambiguous title variants.
- Human-written geography recommendation summary.

## Metrics

Primary metrics:

- Geography ranking usefulness: at least 80% of top-ranked geographies should be human-rated as plausible recruiting priorities.
- Evidence validity: at least 95% of claims should be backed by SERP, fetched-page, or AI-summary source lineage.
- Relevance precision: at least 85% of top evidence items per geography should match the requested role, seniority, and skills.
- Time saved: reduce first-pass talent-market research from 3-5 hours to under 30 minutes of review.

Secondary metrics:

- Correct identification of low-evidence geographies.
- Employer extraction precision.
- Skill and certification extraction recall.
- Sourcing channel coverage against human labels.
- Compensation evidence precision.
- Duplicate employer normalization rate.
- Agreement between automated confidence labels and reviewer confidence.
- Cost per completed geography comparison.

## Manual Review Rubric

Score each report from 1-5:

- Geography prioritization: Are the highest-ranked geographies reasonable given the evidence?
- Evidence quality: Are claims supported by inspectable sources with query and rank lineage?
- Role fit: Does the evidence match role family, seniority, skills, and employment mode?
- Locality: Does the report capture geography-specific differences rather than generic national hiring language?
- Demand versus supply separation: Does it distinguish employer competition from candidate supply proxies?
- Actionability: Are recommendations specific enough to guide sourcing channels, outreach messaging, job-location strategy, or recruiter screens?
- Restraint: Does it avoid claiming exact candidate counts, compensation certainty, or private candidate attributes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every top-ranked geography has at least five relevant evidence items or is explicitly marked low confidence.
- No individual candidate identification, private contact discovery, or protected-trait inference appears.
- Country, city, region, and device targets are visible in the final report.
- Google SERP facts, fetched-page facts, and AI synthesis are clearly distinguishable in the evidence trail.

## Automated Checks

Run after every talent-market analysis:

- JSON schema validation for the final report.
- All scores must be integers from 0-100.
- Every evidence item must include geography target, query, URL, source type, and fetched-at timestamp.
- Result URLs must be valid HTTP(S) URLs.
- Each top geography must include at least three unique source domains unless confidence is low.
- Talent supply score must be capped when relevant evidence is sparse.
- Excluded titles, training pages, staffing spam, and unrelated role meanings must be tagged as noise.
- Localized observations must not be merged across city, country, region, or device targets.
- CSV and Markdown exports must reconcile with JSON geography scores.

## Failure Modes To Track

- Treating public web visibility as exact candidate supply.
- Overweighting job postings and ignoring actual sourcing-channel evidence.
- Collapsing national remote-role signals into a city-specific recommendation.
- Counting staffing agencies, bootcamps, or training pages as available talent.
- Missing local communities, universities, associations, or events that indicate sourcing channels.
- Letting high employer demand automatically imply high talent supply.
- Failing to normalize subsidiaries, office locations, and parent employers.
- Inventing compensation conclusions from weak or stale salary pages.
- Letting AI synthesis create claims without source lineage.
- Storing or exposing personal candidate data.

## Golden Examples

Create fixture runs before implementation:

1. Engineering role: strong stack-specific signals and visible local data communities.
2. Go-to-market role: high employer demand but mixed supply-channel evidence.
3. Regulated role: certifications and licensing requirements must be recognized.
4. Remote-friendly role: national results must not dominate local scoring.
5. Sparse geography: few relevant results and a correct low-confidence recommendation.
6. Ambiguous title: SERPs contain correct roles, training programs, and unrelated meanings.

Each fixture should include:

- Input talent brief.
- Raw SERP snippets by geography, query, and device.
- Fetched source excerpts.
- Human relevance labels.
- Expected score bands.
- Expected visible employers.
- Expected sourcing channels.
- Expected local language and skill terms.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 24-run benchmark completes without crashes.
- Geography ranking usefulness is at least 80%.
- Evidence validity is at least 95%.
- Top evidence relevance precision is at least 85%.
- Median human review time is under 30 minutes per report.
- Duplicate employer rate is below 5%.
- Batch credit cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
