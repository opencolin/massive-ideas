# Evaluation

Goal: prove SERP Gap Analyzer finds meaningful visibility, topic, source, and AI-answer gaps for a keyword cluster while keeping every recommendation traceable to collected evidence.

## Test Set

Use 25 keyword-cluster briefs:

- 6 mature B2B SaaS categories with strong competitor domains.
- 5 emerging AI categories where SERPs and AI answers change quickly.
- 4 local-service categories with city-sensitive results.
- 4 ecommerce or marketplace categories with mixed commercial and informational SERPs.
- 3 ambiguous categories where exclusions should suppress unrelated meanings.
- 3 low-visibility targets where the right answer may be "build foundational presence first."

For each brief, create a human-labeled benchmark:

- Target domain and known competitor domains.
- Expected high-priority keywords and intent labels.
- Top Google results for the chosen country, city, and device.
- Target best rank and competitor best rank per keyword.
- Known relevant topics and entities from winning pages.
- Known exclusions and unrelated meanings.
- AI-answer prompts, cited sources, and expected brand mentions.
- Human-written priority gap list and recommended actions.

## Metrics

Primary metrics:

- Gap precision: at least 85% of surfaced gap cards should be human-rated relevant and actionable.
- Critical-gap recall: catch at least 75% of benchmarked high-severity gaps.
- Evidence validity: at least 95% of gap claims should cite a valid observation and source URL.
- Rank accuracy: parsed target and competitor rank positions should be at least 98% accurate against stored SERP snapshots.
- Recommendation usefulness: at least 80% of recommended actions should be rated useful by SEO or content reviewers.

Secondary metrics:

- Topic extraction precision against human-labeled page topics.
- Intent classification accuracy per keyword and ranking page.
- AI-answer mention and citation accuracy.
- Duplicate gap-card rate after keyword, URL, and topic normalization.
- Cost per completed cluster analysis.
- Report review time for a human stakeholder.
- Confidence calibration across low, medium, and high confidence cards.

## Manual Review Rubric

Score each report from 1-5:

- Relevance: Are the gaps about the target domain, keyword cluster, and configured geography?
- Actionability: Would the recommendation help a team decide what page, update, or outreach to prioritize?
- Evidence quality: Are cited URLs inspectable and directly connected to the claim?
- Competitive clarity: Is the target compared fairly against named competitors and neutral sources?
- Intent clarity: Does the report distinguish comparison, pricing, local, informational, and use-case needs?
- Surface separation: Are Google SERP gaps, fetched-page topic gaps, and AI-answer gaps clearly separated?
- Concision: Can a reviewer understand the priority work in under 10 minutes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-severity gap lacks a valid source URL.
- No AI-answer-only observation is presented as confirmed Google visibility.
- Ambiguous keywords are either excluded, downgraded, or labeled low confidence.
- Every recommended page or action maps back to at least one gap card.

## Automated Checks

Run after every analysis:

- JSON schema validation for brief, observations, gap cards, and report.
- Every gap card must include gap type, severity, confidence, recommendation, and evidence.
- Every evidence item must include observation ID, source type, source URL, and observed fact.
- Source URLs must be valid HTTP(S) and present in raw observations.
- SERP observations must include query, rank, URL, title, country, city, device, and collected-at timestamp.
- Target and competitor domains must be normalized before matching.
- Cluster score must be an integer from 0-100.
- High-severity gaps require either a high-priority keyword or repeated evidence across surfaces.
- AI-answer-only gap cards cannot be high confidence.
- Reports with fewer than five relevant SERP observations must be capped and labeled low evidence.
- Markdown and CSV exports must render without missing required fields.

## Failure Modes To Track

- Treating search visibility as search volume.
- Collapsing country, city, or device observations into one undifferentiated rank.
- Matching the wrong domain because of subdomains, redirects, or similarly named companies.
- Recommending a content page when the real gap is third-party source coverage.
- Calling any competitor mention a gap even when the keyword intent is unrelated.
- Overtrusting chatbot answers without inspecting cited sources.
- Missing JS-rendered pricing tables, comparison widgets, or docs pages.
- Letting generic review sites dominate topic extraction without weighting official pages.
- Creating duplicate gaps for near-identical keywords.
- Producing a report that is accurate but too broad to guide the next content sprint.

## Golden Examples

Create fixture briefs before implementation:

1. Missing comparison page: target absent from top 10, two competitors and three listicles present.
2. Weak rank: target appears at rank 9, competitors appear at ranks 2 and 4.
3. Topic gap: target page ranks but omits pricing transparency and integration language.
4. Source gap: third-party listicles mention competitors but omit the target.
5. AI-answer gap: chatbot answer cites competitor pages and neutral review sources, but not the target.
6. Localized gap: target ranks nationally but disappears for a city-targeted query.
7. Ambiguous keyword: unrelated meanings dominate and should be excluded or downgraded.
8. Low-evidence cluster: too few relevant results, requiring a cautious report.

Each fixture should include:

- Brief input
- Raw parsed SERP observations
- Raw fetched page excerpts
- Raw AI answers with sources
- Expected normalized domain matches
- Expected gap cards
- Expected omitted candidates
- Acceptable score ranges

## Launch Criteria

The MVP is ready for first users when:

- 25 benchmark briefs complete without crashes.
- Gap precision is at least 85%.
- Critical-gap recall is at least 75%.
- Evidence validity is at least 95%.
- Rank accuracy is at least 98%.
- Duplicate gap-card rate is below 5%.
- Median human review time is under 10 minutes.
- Every run records planned cost, actual collection counts, skipped URLs, and export paths.
