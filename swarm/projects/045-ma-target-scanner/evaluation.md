# Evaluation

Goal: prove M&A Target Scanner can produce a useful, source-backed acquisition target universe for a narrow niche faster and more consistently than manual SERP, directory, news, and chatbot research.

## Test Set

Use 24 target-scan prompts:

- 6 vertical software niches with known public vendor universes.
- 4 fragmented services niches where local and regional search matters.
- 4 data, API, or infrastructure niches with unclear category labels.
- 4 buyer-specific adjacency theses where strategic fit matters more than exact category match.
- 3 ambiguous niches with terms that have unrelated meanings.
- 3 sparse or long-tail niches with limited public source coverage.

For each prompt, create a human-labeled benchmark:

- Correct niche interpretation
- Known in-scope target companies
- Known adjacent but not core companies
- Known excluded companies
- Expected market segments
- Buyer-thesis fit notes
- High-quality source domains
- Ambiguous terms and required exclusions
- Human-written short scan summary

## Metrics

Primary metrics:

- Target precision: at least 85% of top 20 ranked companies should be human-rated in scope or correctly labeled adjacent.
- Core-target precision: at least 80% of top 10 core targets should match the buyer thesis and required capabilities.
- Source validity: at least 95% of target-level factual claims should be supported by cited SERP, fetched page, or AI-answer source evidence.
- Fit-rationale usefulness: at least 80% of reviewed rationales should be specific enough for a corp-dev or PE reviewer to keep with minor edits.
- Time saved: reduce first-pass target universe creation from 4-8 hours to under 45 minutes of review.

Secondary metrics:

- Recall of benchmark target companies in top 50.
- Correct separation of core targets, adjacent companies, partners, services firms, and disqualified companies.
- Duplicate company rate after brand, domain, parent, and product normalization.
- Confidence calibration across high, medium, and low confidence targets.
- Accuracy of geography and customer-profile labels.
- Disqualifier precision for public, acquired, too-large, agency-only, or consumer-only companies.
- Cost per completed target scan.
- Export readability for JSON, CSV, and Markdown outputs.

## Manual Review Rubric

Score each target scan from 1-5:

- Niche fit: Does the scan correctly understand the requested market?
- Buyer-thesis fit: Are the ranked targets relevant to the strategic acquisition rationale?
- Target quality: Are core targets separated from adjacent or disqualified companies?
- Coverage: Does the scan include obvious players and useful long-tail candidates?
- Evidence quality: Are product, customer, geography, ownership, and traction claims grounded in inspectable sources?
- Risk labeling: Are uncertainties and disqualifiers visible rather than hidden?
- Concision: Can a reviewer understand the opportunity space in under five minutes?

A target scan is MVP-acceptable when:

- Average reviewer score is at least 4.
- No top 10 core target lacks evidence.
- Core targets, watchlist companies, and disqualified companies are visibly separated.
- Acquisition-plausibility language is framed as public signal or inference, not certainty.
- SERP observations, fetched page evidence, and AI-answer citations remain distinguishable.

## Automated Checks

Run after every target-scan build:

- JSON schema validation for final output.
- Target scores must be integers from 0-100.
- Every target must have a segment, fit type, score, confidence label, and evidence list.
- Evidence URLs must be valid HTTP(S) URLs and unique per target.
- Every top 10 core target must have at least two evidence items or one high-quality official source.
- AI-answer-only targets must score no higher than 60 unless independently confirmed by fetched pages.
- Adjacent-only companies must not be labeled as core platforms.
- Companies matching exclusions must score below 35 or be placed in disqualified output.
- Acquired, public, or very large companies must include an explicit risk or disqualification reason when the profile asks for lower-middle-market or founder-led targets.
- Source-domain counts must reconcile with raw SERP and AI-answer records.
- Every claim must retain query, rank, or prompt lineage where applicable.

## Failure Modes To Track

- Treating any company in the niche as a plausible acquisition target.
- Implying a company is for sale without evidence.
- Overweighting directory pages that include irrelevant vendors.
- Missing founder-led or bootstrapped companies because they rank poorly in generic SERPs.
- Including agencies, consultants, resellers, or marketplaces when the brief asks for software companies.
- Merging distinct products owned by one parent company.
- Splitting one company into multiple rows because of subdomains or product pages.
- Confusing funding news, acquisition news, and partnership announcements.
- Losing source lineage during AI synthesis.
- Producing generic fit rationales that do not connect to the buyer thesis.

## Golden Examples

Create fixture prompts before implementation:

1. Vertical software: a niche with known review-site and directory coverage.
2. Fragmented local services: city and country targeting changes visible candidate sets.
3. Buyer adjacency: targets are valuable because they own a workflow next to the buyer's product.
4. Ambiguous niche: one term maps to multiple unrelated markets and requires exclusions.
5. Sparse niche: few sources exist, so confidence and watchlist labels matter.

Each fixture should include:

- Input target-scan brief
- Raw SERP snippets
- AI answers with sources
- Fetched source excerpts
- Expected core targets
- Expected adjacent or watchlist companies
- Disallowed companies and claims
- Acceptable score ranges

## Launch Criteria

The MVP is ready for first users when:

- 24-prompt benchmark completes without crashes.
- Top 20 target precision is at least 85%.
- Top 10 core-target precision is at least 80%.
- Source validity is at least 95%.
- Median human review time is under 45 minutes per scan.
- Duplicate company rate is below 5%.
- Disqualified companies are separated with clear reasons.
- Batch cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
