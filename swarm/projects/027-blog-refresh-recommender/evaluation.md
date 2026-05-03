# Evaluation

Goal: prove Blog Refresh Recommender identifies blog posts that deserve updates because current SERPs, competitor pages, and AI-answer sources have changed, while keeping every recommendation traceable to collected evidence.

## Test Set

Use 30 refresh briefs:

- 8 mature B2B SaaS blogs with old but still ranking posts.
- 5 fast-changing AI or developer-tool categories where current examples matter.
- 5 ecommerce or marketplace blogs with template, listicle, and buying-guide SERPs.
- 4 local-service blogs where city and device targeting changes the result mix.
- 4 health, finance, or legal-adjacent informational posts that require careful source handling.
- 2 ambiguous keyword sets where exclusions should suppress unrelated meanings.
- 2 low-evidence sites where the right answer may be "no reliable recommendation yet."

For each brief, create a human-labeled benchmark:

- Target blog URLs, primary keywords, and business priorities.
- Current top Google results for the selected country, city, and device.
- Target best rank and competitor best rank per keyword.
- Dominant current SERP intent and result type.
- Known competing pages that changed the content bar.
- Required topics, examples, source types, and exclusions.
- AI-answer prompts, cited sources, and expected target mentions.
- Human-written refresh queue with recommended update type and priority.

## Metrics

Primary metrics:

- Refresh precision: at least 85% of recommended refreshes should be human-rated relevant and actionable.
- Critical-refresh recall: catch at least 75% of benchmarked high-urgency refresh opportunities.
- Evidence validity: at least 95% of recommendation claims should cite a valid observation and source URL.
- Rank accuracy: parsed target and competitor rank positions should be at least 98% accurate against stored SERP snapshots.
- Update-type accuracy: at least 80% of recommendations should match the human-labeled refresh type.

Secondary metrics:

- Topic-gap precision against human-labeled competing-page coverage.
- Intent-drift classification accuracy.
- Freshness-signal precision from publish dates, modified dates, examples, snippets, and page content.
- AI-answer mention and citation accuracy.
- Duplicate recommendation rate after URL, canonical, keyword, and topic normalization.
- Cost per analyzed blog URL.
- Human review time for the generated queue.
- Confidence calibration across low, medium, and high confidence recommendations.

## Manual Review Rubric

Score each report from 1-5:

- Relevance: Are recommendations about the supplied URL, keyword, and configured geography?
- Actionability: Does the output say what to update, add, remove, merge, or split?
- Evidence quality: Are cited URLs inspectable and directly connected to each recommendation?
- SERP-change clarity: Does the report explain what changed in current results or competitor coverage?
- Intent clarity: Does the report distinguish definitions, examples, templates, comparisons, local intent, and freshness needs?
- Surface separation: Are Google SERP observations, fetched-page gaps, and AI-answer citations clearly separated?
- Prioritization: Would a content lead know what to refresh first?
- Concision: Can a reviewer understand the queue in under 10 minutes?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-urgency recommendation lacks a valid source URL.
- No AI-answer-only observation is presented as confirmed Google visibility.
- Ambiguous keywords are excluded, downgraded, or labeled low confidence.
- Every recommended action maps back to at least one observed source fact.
- Every `merge_or_redirect` or `split_into_new_post` recommendation includes canonical URL reasoning.

## Automated Checks

Run after every analysis:

- JSON schema validation for brief, observations, recommendations, and report.
- Every recommendation must include URL, primary keyword, score, urgency, update type, confidence, and evidence.
- Every evidence item must include observation ID, source type, source URL, and observed fact.
- Source URLs must be valid HTTP(S) and present in raw observations.
- SERP observations must include query, rank, URL, title, country, city, device, and collected-at timestamp.
- Target and competitor domains must be normalized before matching.
- Canonical URLs must be stored for every fetched target page when available.
- Refresh score must be an integer from 0-100.
- High-urgency recommendations require either high business priority or repeated evidence across surfaces.
- AI-answer-only recommendations cannot be high confidence.
- Reports with fewer than three fetched competing pages for a URL must be capped and labeled low evidence.
- Markdown and CSV exports must render without missing required fields.

## Failure Modes To Track

- Treating page age alone as a reason to refresh.
- Treating SERP visibility as search volume or traffic forecast.
- Collapsing country, city, or device observations into one undifferentiated rank.
- Matching the wrong page because of canonical tags, redirects, subdomains, or URL parameters.
- Recommending a rewrite when a metadata refresh or section addition is enough.
- Recommending owned-content work when the real gap is third-party source coverage.
- Overweighting generic listicles and underweighting official competitor pages.
- Missing JS-rendered tables, calculators, embeds, or FAQ sections.
- Letting chatbot answers override direct SERP evidence.
- Creating duplicate recommendations for near-identical keywords mapped to the same URL.
- Recommending content changes that invent product capabilities, statistics, or customer proof.
- Producing a technically accurate report that is too vague for an editor to act on.

## Golden Examples

Create fixture briefs before implementation:

1. Major refresh: target ranks but current top results include templates, examples, and updated screenshots.
2. Section addition: target is strong but lacks one repeated topic across higher-ranking pages.
3. Metadata refresh: target content matches intent, but title and snippet language lag behind winners.
4. Merge or redirect: two target posts split authority while SERPs favor a broader guide.
5. Split into new post: one subsection now maps to a distinct SERP with different intent.
6. Source outreach: AI answers and third-party lists cite competitors but not the target.
7. No action: target remains current, well-matched, and competitively cited.
8. Localized drift: target ranks nationally but loses relevance for a city-targeted query.
9. Ambiguous keyword: excluded meanings dominate and should suppress recommendations.
10. Low-evidence URL: target or competitors cannot be fetched, requiring a cautious report.

Each fixture should include:

- Brief input
- Raw parsed SERP observations
- Raw fetched page excerpts
- Raw AI answers with sources
- Expected normalized domain and canonical URL matches
- Expected recommendation cards
- Expected omitted candidates
- Acceptable score ranges

## Launch Criteria

The MVP is ready for first users when:

- 30 benchmark briefs complete without crashes.
- Refresh precision is at least 85%.
- Critical-refresh recall is at least 75%.
- Evidence validity is at least 95%.
- Rank accuracy is at least 98%.
- Update-type accuracy is at least 80%.
- Duplicate recommendation rate is below 5%.
- Median human review time is under 10 minutes.
- Every run records planned cost, actual collection counts, skipped URLs, and export paths.
