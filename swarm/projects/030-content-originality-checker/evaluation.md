# Evaluation

Goal: prove Content Originality Checker can identify whether a content asset meaningfully differs from top-ranking pages while keeping every overlap and rewrite recommendation traceable to collected evidence.

## Test Set

Use 30 benchmark briefs:

- 6 B2B SaaS comparison articles with mature, repetitive SERPs.
- 5 how-to articles where structure overlap is expected but examples can be original.
- 5 ecommerce buying guides with shared product criteria.
- 4 local-service pages with city-sensitive SERPs.
- 4 technical documentation or integration pages with JS-rendered content.
- 3 thought-leadership drafts with first-party data.
- 3 intentionally generic drafts that should receive high-risk originality scores.

For each brief, create a human-labeled benchmark:

- Target draft text or target URL.
- Keyword cluster, geography, city, and device.
- Top Google results for each query.
- Relevant competitor and excluded domains.
- Human-reviewed page outlines from ranking sources.
- Known repeated topics, claims, examples, and wording patterns.
- Known unique assets in the target content.
- Expected overlap findings and expected omitted false positives.
- Human-written rewrite priorities.

## Metrics

Primary metrics:

- Finding precision: at least 85% of surfaced overlap findings should be human-rated relevant.
- High-risk recall: catch at least 80% of benchmarked severe overlap problems.
- Evidence validity: at least 95% of findings should cite a valid source URL and observed fact.
- Source collection accuracy: at least 98% of parsed ranking URLs should match stored SERP snapshots.
- Rewrite usefulness: at least 80% of rewrite priorities should be rated useful by editors.

Secondary metrics:

- Outline extraction accuracy.
- Topic and entity extraction precision against human labels.
- Claim-cluster accuracy across semantically similar but differently worded claims.
- False-positive rate for standard category terms and unavoidable intent coverage.
- Calibration of originality score against human risk ratings.
- Duplicate finding rate after section and topic normalization.
- Cost per completed originality report.
- Median editor review time.

## Manual Review Rubric

Score each report from 1-5:

- Relevance: Are findings about the submitted target and configured search surface?
- Evidence quality: Are source URLs inspectable and directly connected to each claim?
- Editorial judgment: Does the checker distinguish necessary intent coverage from generic repetition?
- Specificity: Are findings tied to sections, claims, examples, or assets rather than broad vibes?
- Rewrite value: Would the recommendation help a writer produce a more useful page?
- Competitive clarity: Are top-ranking pages and competitors separated from neutral sources?
- Concision: Can an editor understand the top risks in under 10 minutes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-severity finding lacks a valid source URL.
- No topic-only overlap is labeled as plagiarism.
- Standard definitions or required category terms are not treated as originality failures.
- Every rewrite priority maps back to at least one overlap or missing-asset finding.

## Automated Checks

Run after every analysis:

- JSON schema validation for brief, SERP sources, content signals, findings, and report.
- Every finding must include type, severity, recommendation, and evidence.
- Every evidence item must include source type, source URL, and observed fact.
- Source URLs must be valid HTTP(S) and present in raw observations.
- SERP observations must include query, rank, URL, title, country, city, device, and collected-at timestamp.
- Target and competitor domains must be normalized before matching.
- Originality score must be an integer from 0-100.
- Risk level must match the configured score band.
- High-severity findings require either repeated evidence across sources or direct wording similarity.
- Reports with fewer than five fetched competitive pages must be capped and labeled low evidence.
- Markdown and CSV exports must render without missing required fields.

## Failure Modes To Track

- Confusing common category vocabulary with originality risk.
- Calling a page original because wording differs while claims and examples are generic.
- Calling a page unoriginal because it correctly covers required search intent.
- Overweighting one ranking page instead of comparing against the competitive set.
- Ignoring country, city, or device differences in SERP competitors.
- Missing client-rendered article bodies, comparison widgets, or data tables.
- Treating AI-generated rewrite suggestions as evidence without source support.
- Recommending novelty that would make the page less helpful for the query.
- Failing to detect repeated examples with slightly different wording.
- Producing vague rewrite advice that cannot guide an editor.

## Golden Examples

Create fixture briefs before implementation:

1. Generic comparison article: target mirrors the top-ranking outline and feature list.
2. Strong first-party data: target shares basic topics but includes unique survey results.
3. How-to structure overlap: headings are similar because the task has necessary steps, but examples differ.
4. Wording similarity: multiple paragraphs are close to a ranking page and should be flagged high severity.
5. Missing original asset: user lists protected proof that is absent from the target draft.
6. Intent mismatch: target adds a novel essay angle that does not satisfy the commercial SERP.
7. Localized SERP: competitors and examples differ by city and should not be collapsed nationally.
8. Low-evidence collection: too few ranking pages fetched, requiring cautious scoring.

Each fixture should include:

- Brief input
- Raw parsed SERP observations
- Raw fetched page excerpts
- Extracted content signals
- Human-labeled overlap findings
- Expected omitted false positives
- Expected rewrite priorities
- Acceptable originality score range

## Launch Criteria

The MVP is ready for first users when:

- 30 benchmark briefs complete without crashes.
- Finding precision is at least 85%.
- High-risk recall is at least 80%.
- Evidence validity is at least 95%.
- Source collection accuracy is at least 98%.
- Duplicate finding rate is below 5%.
- Median editor review time is under 10 minutes.
- Every run records planned cost, actual collection counts, skipped URLs, failed fetches, and export paths.
