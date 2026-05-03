# Evaluation

Goal: prove What Changed This Week? Category Digest produces a concise, source-backed weekly category briefing that catches meaningful changes while avoiding noisy or unsupported claims.

## Test Set

Use 20 category watches over at least four weekly runs:

- 5 mature B2B software categories with stable competitors and frequent content updates.
- 5 emerging AI categories with rapid positioning and product changes.
- 3 regulation-sensitive categories where official sources matter.
- 3 local or geography-sensitive categories with city-specific SERPs.
- 2 categories with ambiguous meanings and strong exclusions.
- 2 sparse categories where the right behavior may be "little changed."

For each category, create a human-labeled benchmark:

- Expected seed competitors and domains.
- Known weekly changes from official sources and reputable news.
- Known non-changes that should not become digest cards.
- Expected SERP rank deltas for recurring queries.
- Expected AI-answer citation or mention deltas.
- Excluded meanings, source types, and weak claims.
- Human-written weekly summary.

## Metrics

Primary metrics:

- Change precision: at least 85% of change cards should be human-rated meaningful and relevant.
- Source validity: at least 95% of factual claims should be supported by cited source URLs.
- Important-change recall: catch at least 75% of benchmarked high-importance changes.
- Noise control: no more than 8 top-level change cards per weekly digest unless the user raises the limit.
- Review speed: a reviewer should understand the week in under 10 minutes.

Secondary metrics:

- SERP delta accuracy against parsed Google result snapshots.
- AI-answer delta accuracy against recurring prompt snapshots and cited sources.
- Date accuracy for observed changes.
- Confidence calibration across low, medium, and high confidence cards.
- Duplicate change-card rate after company, URL, and topic normalization.
- Cost per completed weekly watch.
- Gaps quality when evidence is sparse or conflicting.

## Manual Review Rubric

Score each weekly digest from 1-5:

- Relevance: Are the cards truly about the watched category?
- Importance: Did the digest prioritize changes a user would care about?
- Evidence quality: Are source URLs credible, inspectable, and directly connected to the claim?
- Delta clarity: Is it clear what changed versus what was merely observed?
- Surface separation: Are Google SERP, fetched-page, and AI-answer changes labeled distinctly?
- Concision: Is the digest useful without reading every source?
- Follow-up quality: Are suggested checks specific and actionable?

A digest is MVP-acceptable when:

- Average reviewer score is at least 4.
- No top change card lacks a valid source URL.
- No AI-answer-only card is presented as confirmed fact.
- At least one useful gap or uncertainty is reported when evidence is incomplete.
- Reviewers can trace every card back to raw observations.

## Automated Checks

Run after every digest build:

- JSON schema validation for snapshots and change cards.
- Impact scores must be integers from 0-100.
- Every change card must include at least one evidence item.
- Every evidence item must include observation ID, source URL, source type, and observed change.
- Source URLs must be valid HTTP(S), deduplicated, and present in raw observations.
- SERP deltas must include previous rank, current rank, query, country, city, and device.
- AI-answer deltas must include prompt ID and source-citation state.
- AI-answer-only cards must score no higher than 60.
- Unclear-date cards must score no higher than 45.
- Cards matching exclusions must be omitted or marked low confidence below 35.
- Markdown, JSON, and CSV exports must render without missing required fields.

## Failure Modes To Track

- Treating ordinary SEO content churn as a meaningful market change.
- Calling a feature new because the page was newly discovered.
- Blending chatbot mentions with source-backed facts.
- Missing official changelogs because they require JS rendering.
- Overweighting syndicated news copied from a press release.
- Misclassifying SERP rank movement caused by localization or device changes.
- Losing prior snapshot lineage, making week-over-week comparison impossible.
- Turning weak pricing language into a false packaging-change claim.
- Including events outside the configured watch window.
- Producing a generic summary that does not say what changed.

## Golden Examples

Create fixture watches before implementation:

1. Product launch week: official changelog plus vendor blog confirms a new feature.
2. Pricing ambiguity week: pricing page changes but no plan-level business meaning is clear.
3. Visibility shift week: one vendor enters top 5 across recurring SERP queries.
4. AI-answer shift week: recurring chatbot answer changes cited sources but not Google rank.
5. Quiet week: many fetched pages changed boilerplate, but no meaningful category change occurred.
6. Exclusion week: a similar phrase in an unrelated category appears in news and should be filtered.

Each fixture should include:

- Watch input
- Previous snapshot
- Current raw SERP observations
- Current AI answers with sources
- Fetched source excerpts
- Expected change cards
- Expected omitted candidates
- Acceptable impact-score ranges

## Launch Criteria

The MVP is ready for first users when:

- 20 category watches run across four weekly snapshots without crashes.
- Change precision is at least 85%.
- Source validity is at least 95%.
- Important-change recall is at least 75%.
- Duplicate card rate is below 5%.
- Median review time is under 10 minutes per digest.
- Every run records estimated and actual cost.
- Digest exports are readable without manual cleanup.
