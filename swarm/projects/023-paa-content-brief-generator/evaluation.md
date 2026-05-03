# Evaluation

Goal: prove People Also Ask Content Brief Generator can produce useful, source-backed content briefs faster and more consistently than manual PAA collection, SERP review, competitor-page reading, and outline drafting.

## Test Set

Use 30 content-brief prompts:

- 6 mature B2B SaaS topics with strong search and competitor coverage.
- 5 emerging AI or automation topics with unstable terminology.
- 5 compliance, finance, or security topics that require careful caveats.
- 4 local or geography-sensitive service topics.
- 4 comparison topics where competitor names change the question set.
- 3 consumer topics with noisy publisher and forum results.
- 3 sparse topics with few reliable public sources.

For each prompt, create a human-labeled benchmark:

- Correct topic interpretation
- Target audience and primary intent
- Must-include People Also Ask questions
- Useful related questions from ranking pages
- Irrelevant or excluded questions
- Expected outline sections
- High-quality source domains
- Risk notes for sensitive topics
- Human-written brief summary

## Metrics

Primary metrics:

- PAA capture: at least 90% of benchmark PAA questions should appear in the extracted question set.
- Question relevance: at least 85% of top 25 questions should be human-rated relevant to the topic and audience.
- Source validity: at least 95% of factual answer notes should be supported by cited SERP, fetched-page, or AI-answer source evidence.
- Outline usefulness: at least 80% of reviewed briefs should have outlines a human editor would keep with minor edits.
- Time saved: reduce first-pass content brief creation from 60-120 minutes to under 15 minutes of review.

Secondary metrics:

- Deduplication accuracy for semantically equivalent questions.
- Intent classification accuracy across informational, commercial, comparison, pricing, how-to, and FAQ questions.
- Content-gap usefulness for refresh and net-new article planning.
- Confidence calibration across high, medium, and low confidence questions.
- Geographic and device sensitivity when city, country, or mobile targeting is enabled.
- Cost per completed brief.
- Markdown readability without manual cleanup.

## Manual Review Rubric

Score each content brief from 1-5:

- Topic fit: Does the brief understand the exact topic and avoid adjacent drift?
- Audience fit: Are questions and answer angles appropriate for the requested reader?
- Question quality: Are high-value People Also Ask and related questions captured?
- Outline quality: Does the structure answer the search intent in a practical order?
- Evidence quality: Are factual notes grounded in credible, inspectable sources?
- Deduplication: Are repeated questions merged without losing meaningful differences?
- Editorial usefulness: Could a writer start drafting from this brief immediately?

A brief is MVP-acceptable when:

- Average reviewer score is at least 4.
- No top 10 question lacks evidence.
- AI-only questions are clearly labeled or excluded from high-confidence sections.
- Sensitive claims are framed as source-backed editorial notes, not professional advice.
- SERP observations, fetched-page evidence, and AI recommendations are not blended together as if they were the same source.

## Automated Checks

Run after every content-brief build:

- JSON schema validation for final output.
- Question scores must be integers from 0-100.
- Every question must have intent, score, confidence, and evidence lineage.
- Evidence URLs must be valid HTTP(S) URLs and unique per question.
- Every outline section must target at least one extracted question.
- Every factual answer note must include at least one source URL.
- AI-only questions must score no higher than 60 unless independently confirmed by SERP or fetched-page evidence.
- Questions matching exclusions must score below 35 or be omitted.
- Source-domain counts must reconcile with raw SERP, PAA, AI-answer, and fetch records.
- Markdown export must include title, intent summary, outline, FAQ, source notes, and content gaps.

## Failure Modes To Track

- Treating People Also Ask presence as keyword volume or demand size.
- Losing query, location, device, rank, or URL lineage during synthesis.
- Over-merging distinct pricing, comparison, or risk questions.
- Under-merging punctuation and wording variants of the same question.
- Pulling answer claims from snippets without fetching stronger supporting pages.
- Overweighting SEO articles that repeat unsupported claims.
- Including excluded domains or sensitive advice without expert-review caveats.
- Producing generic outlines that do not map to the actual question set.
- Letting chatbot-suggested questions crowd out observed SERP questions.
- Ignoring mobile or localized PAA differences when targeting is requested.

## Golden Examples

Create fixture prompts before implementation:

1. Mature B2B SaaS topic: stable PAA set, strong vendor and publisher coverage.
2. Emerging AI topic: inconsistent wording, fresh vendors, and volatile AI-answer suggestions.
3. Compliance topic: high need for caveats, source quality, and auditor or expert framing.
4. Comparison topic: competitor-specific questions that should not be merged.
5. Local service topic: city-targeted SERPs where PAA and organic results shift by location.

Each fixture should include:

- Input content brief request
- Raw SERP snippets and PAA questions
- AI answers with sources
- Fetched source excerpts
- Expected question clusters
- Expected outline headings
- Disallowed questions and claims
- Acceptable score ranges

## Launch Criteria

The MVP is ready for first users when:

- 30-prompt benchmark completes without crashes.
- PAA capture is at least 90%.
- Top 25 question relevance is at least 85%.
- Source validity is at least 95%.
- Median review time is under 15 minutes per brief.
- Duplicate question error rate is below 5%.
- Batch cost is estimated before each run and recorded after completion.
- Markdown and JSON exports are readable without manual cleanup.
