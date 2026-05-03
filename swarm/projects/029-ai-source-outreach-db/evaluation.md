# Evaluation

Goal: prove AI Source Outreach DB can reliably identify AI-cited sources, enrich them into outreach-ready records, and prioritize opportunities that a marketer would actually contact.

## Test Set

Use 30 outreach briefs:

- 6 mature B2B software categories with many third-party comparison pages.
- 5 emerging AI categories where source sets change quickly.
- 5 consumer software categories where chatbot answers cite different publishers than Google.
- 4 local service categories where city targeting changes cited domains.
- 4 categories with ambiguous product names or overlapping acronyms.
- 3 categories dominated by directories and review sites.
- 3 sparse categories where few cited pages expose useful contacts.

For each brief, create a human-labeled benchmark:

- Product domain, aliases, and excluded domains
- Competitor domains and aliases
- Query and prompt intent labels
- AI answer citation URLs and source domains
- Organic-only URLs that should not be treated as AI citations
- Source type labels
- Whether the product and competitors are mentioned on each source page
- Contact path labels and confidence
- Human-written pitch angle
- Expected outreach priority band

## Metrics

Primary metrics:

- Citation extraction accuracy: at least 90% of cited URLs and domains should match human-reviewed citations.
- Surface separation accuracy: at least 95% of records should correctly distinguish Google AI Overview, organic SERP, chatbot answer, and fetched-page references.
- Source type accuracy: at least 85% agreement with human labels.
- Competitor and product mention precision: at least 95% precision for configured entities and aliases.
- Contact path precision: at least 90% of exported contact paths should be visible on fetched pages.
- Recommendation usefulness: at least 80% of top-20 pitch angles should be actionable with minor edits.

Secondary metrics:

- Recall of citation URLs hidden behind rendered or expanded SERP elements.
- Duplicate-source merge quality across canonical URLs and tracking parameters.
- False positives for ambiguous product names.
- Percentage of high-priority sources with a reachable contact path.
- Cost per completed brief.
- Runtime per query-target and prompt collection job.
- Stability of top source rankings across repeated runs.

## Manual Review Rubric

Score each report from 1-5:

- Citation accuracy: Are cited sources copied from the observed AI answer or SERP surface?
- Evidence quality: Does every recommendation point to URL, query or prompt, target, timestamp, and observed fact?
- Entity accuracy: Are product and competitor mentions matched to the intended companies?
- Contactability: Are exported contact paths real and useful for outreach?
- Prioritization: Would the top sources be the first places a marketer should contact?
- Pitch quality: Is the suggested pitch grounded in the page and outreach goal?
- Readability: Can a user understand the outreach plan in under five minutes?

An outreach report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No top-20 opportunity depends on an invented contact, author, or citation.
- Every top-20 source has evidence from at least one AI answer citation or is clearly labeled organic-only.
- Google AI evidence and chatbot evidence are visibly separated.
- Every pitch angle references the specific page gap or competitor exposure that motivated it.

## Automated Checks

Run after every outreach database build:

- JSON schema validation for final report.
- Every source record must include domain, URL, citation surfaces, citation count, source type, outreach priority, confidence, and evidence.
- Evidence URLs must be valid HTTP(S) URLs.
- Each evidence item must include observation ID, surface, collected-at timestamp, and observed fact.
- Outreach priority must be an integer from 0-100.
- Sources with no contact paths must be capped at 60.
- Organic-only sources must be capped at 30.
- Blocked domains must not appear as outreach opportunities.
- Contact URLs must come from fetched page content or same-domain discoverable pages.
- Product mention cannot be true unless the page text includes the product name, alias, or domain.
- Competitor mentions must map to a configured competitor or alias.
- CSV export row count must match source record count after blocked-domain filtering.

## Failure Modes To Track

- Treating organic search results as AI answer citations.
- Merging different pages on the same domain when their outreach context differs.
- Counting an AI citation without preserving the prompt, query, target, or timestamp.
- Inventing author names, emails, submission forms, or editorial contacts.
- Missing citations that require JavaScript rendering or SERP expansion.
- Misclassifying vendor pages as third-party outreach opportunities.
- Over-prioritizing forums or stale pages with weak contactability.
- Matching ambiguous product names to unrelated companies.
- Producing generic pitch angles that do not cite the source page gap.
- Losing location or device context during aggregation.

## Golden Examples

Create fixture briefs before implementation:

1. Strong opportunity: a high-authority listicle is cited repeatedly, mentions competitors, and omits the product.
2. Mention-only gap: a cited page mentions the product but gives competitors stronger placement.
3. Organic-only decoy: a page ranks organically but is not cited by any AI answer.
4. Ambiguous entity: product name overlaps with an unrelated company and requires domain confirmation.
5. Local variance: city-targeted Google results cite different directories.
6. No contact path: a useful cited source has no reachable editorial path and should be capped.

Each fixture should include:

- Input outreach brief
- Raw Google SERP snapshots
- Sourced chatbot answer outputs
- Fetched source markdown
- Expected citation observations
- Expected normalized source records
- Expected contact path labels
- Expected outreach priority range
- Expected CSV and Markdown export snippets

## Launch Criteria

The MVP is ready for first users when:

- 30-brief benchmark completes without crashes.
- Citation extraction accuracy is at least 90%.
- Surface separation accuracy is at least 95%.
- Source type accuracy is at least 85%.
- Product and competitor mention precision is at least 95%.
- Contact path precision is at least 90%.
- Recommendation usefulness is at least 80%.
- Ambiguous entity false positives are below 2%.
- Batch cost is estimated before each run and recorded after completion.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
