# Evaluation

Goal: prove Market Map Generator can produce a useful, source-backed map of "all tools like X in vertical Y" faster and more consistently than manual SERP, review-site, directory, and chatbot research.

## Test Set

Use 24 market-map prompts:

- 6 mature vertical software markets with well-known seed tools.
- 5 emerging AI or automation markets with unstable category language.
- 4 local or geography-sensitive verticals.
- 4 markets where the seed tool has both direct competitors and a large integration ecosystem.
- 3 ambiguous seed tools or vertical terms with unrelated meanings.
- 2 sparse markets with few reliable public sources.

For each prompt, create a human-labeled benchmark:

- Seed tool and correct vertical interpretation
- Known direct competitors
- Known adjacent tools and categories
- Known irrelevant vendors
- Expected clusters
- High-quality source domains
- Ambiguous terms and exclusions
- Human-written short market summary

## Metrics

Primary metrics:

- Direct-competitor precision: at least 85% of top 10 direct competitors should be human-rated relevant.
- Vendor relevance: at least 80% of all top 25 vendors should belong in the requested vertical or clearly labeled adjacent cluster.
- Source validity: at least 95% of vendor-level factual claims should be supported by cited SERP, fetched page, or AI-answer source evidence.
- Cluster usefulness: at least 80% of reviewed maps should have clusters that a human reviewer would keep with minor edits.
- Time saved: reduce first-pass market mapping from 3-6 hours to under 30 minutes of review.

Secondary metrics:

- Recall of benchmark direct competitors in top 25.
- Adjacency labeling accuracy for ecosystem, integration, and category-neighbor tools.
- Duplicate vendor rate after brand and domain normalization.
- Confidence calibration across high, medium, and low confidence vendors.
- Geographic relevance for city or country-targeted prompts.
- Cost per completed market map.
- Export readability for JSON, CSV, and Markdown outputs.

## Manual Review Rubric

Score each market map from 1-5:

- Seed fit: Does the map correctly understand what "tools like X" means?
- Vertical fit: Are vendors and clusters relevant to the requested vertical?
- Direct competitor quality: Are direct competitors separated from adjacent ecosystem tools?
- Coverage: Does the map include the obvious major players and useful challengers?
- Cluster quality: Are clusters named around real buyer workflows rather than generic labels?
- Evidence quality: Are claims grounded in credible, recent, and inspectable sources?
- Concision: Can a reader understand the market shape in under five minutes?

A market map is MVP-acceptable when:

- Average reviewer score is at least 4.
- No top 10 direct competitor lacks evidence.
- Direct competitors and adjacent tools are visibly separated.
- The report clearly labels inference and low-confidence claims.
- SERP and AI-answer observations are not blended together as if they were the same source.

## Automated Checks

Run after every market-map build:

- JSON schema validation for final output.
- Vendor scores must be integers from 0-100.
- Every vendor must have a cluster, relationship-to-seed label, confidence label, and evidence list.
- Evidence URLs must be valid HTTP(S) URLs and unique per vendor.
- Every top 10 direct competitor must have at least two evidence items or one high-quality official source.
- AI-answer-only vendors must score no higher than 60 unless independently confirmed by fetched pages.
- Adjacent-only vendors must not be labeled as direct competitors.
- Vendors matching exclusions must score below 40 or be omitted.
- Source-domain counts must reconcile with raw SERP and AI-answer records.
- Every fetched claim must retain query, rank, or prompt lineage where applicable.

## Failure Modes To Track

- Treating any vendor in the vertical as a direct competitor to the seed tool.
- Missing adjacent categories because all queries overfocus on the seed brand.
- Including consumer products when the prompt asks for B2B vertical tools.
- Overweighting SEO comparison pages that mention many irrelevant vendors.
- Overweighting chatbot answers that cite weak or circular sources.
- Merging distinct products with similar names or shared parent companies.
- Splitting one vendor into multiple rows because of product-line pages.
- Losing rank, query, prompt, or citation lineage during synthesis.
- Producing generic clusters that do not help a buyer understand the market.

## Golden Examples

Create fixture prompts before implementation:

1. Mature vertical: a known seed tool with stable direct competitors and review-site coverage.
2. Emerging AI market: inconsistent terminology, new vendors, and strong AI-answer variance.
3. Ecosystem-heavy market: a seed tool surrounded by integrations and adjacent workflow tools.
4. Ambiguous market: a seed or vertical phrase with at least two unrelated meanings and clear exclusions.
5. Local market: city-targeted SERPs where geography materially changes vendor visibility.

Each fixture should include:

- Input market-map brief
- Raw SERP snippets
- AI answers with sources
- Fetched source excerpts
- Expected direct competitors
- Expected adjacent clusters
- Disallowed vendors and claims
- Acceptable score ranges

## Launch Criteria

The MVP is ready for first users when:

- 24-prompt benchmark completes without crashes.
- Top 10 direct-competitor precision is at least 85%.
- Top 25 vendor relevance is at least 80%.
- Source validity is at least 95%.
- Median review time is under 30 minutes per map.
- Duplicate vendor rate is below 5%.
- Batch cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
