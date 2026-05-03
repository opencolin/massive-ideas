# Evaluation

Goal: prove AI Overview Inclusion Tracker can reliably measure whether a brand and its competitors appear in AI Overview-style results and sourced chatbot answers, while preserving enough evidence for SEO and content teams to trust the recommendations.

## Test Set

Use 30 inclusion-tracking briefs:

- 6 mature B2B software categories with visible comparison content.
- 5 emerging AI categories with unstable terminology and fast-changing vendors.
- 5 consumer categories where SERP features vary heavily by device.
- 4 local service categories where city targeting changes answers.
- 4 ambiguous brand names that require domain confirmation.
- 3 categories where competitors dominate third-party listicles.
- 3 sparse categories where AI Overview is rarely present.

For each brief, create a human-labeled benchmark:

- Brand and domain identity
- Competitor identities and aliases
- Query group and intent labels
- Whether an AI Overview or sourced answer is present
- Brand mention and citation status
- Competitor mention and citation status
- Cited source domains and owned-source matches
- Answer placement and sentiment
- Ambiguous or excluded entity matches
- Human-written recommended actions

## Metrics

Primary metrics:

- AI Overview detection accuracy: at least 95% agreement with human review on whether an AI Overview-style result is present.
- Brand inclusion precision: at least 95% of positive brand mentions should match the intended brand and domain.
- Citation extraction accuracy: at least 90% of cited URLs and domains should match human-reviewed citations.
- Competitor share accuracy: at least 90% agreement on competitor mentions in tracked answers.
- Recommendation usefulness: at least 80% of reviewed recommendations should be actionable with minor edits.

Secondary metrics:

- Recall of brand mentions across aliases, product names, and domains.
- Sentiment classification agreement with human reviewers.
- Answer-position classification agreement.
- False-positive rate for ambiguous brand names.
- Difference between Google AI Overview inclusion and chatbot answer inclusion.
- Local/device variance captured without blending snapshots.
- Cost per completed run.
- Trend stability across repeated runs for the same query set.

## Manual Review Rubric

Score each report from 1-5:

- Entity accuracy: Does the report track the intended brand and competitors?
- Inclusion accuracy: Are mentions and citations correctly detected?
- Evidence quality: Are claims backed by source URLs, answer snippets, query lineage, and timestamps?
- Competitor comparison: Does share of answer reflect what appears in the tracked results?
- Recommendation quality: Are actions specific to missing citations, weak pages, or source opportunities?
- Volatility handling: Does the report label missing AI Overview results and snapshot timing clearly?
- Readability: Can a marketer understand the brand's AI-answer position in under five minutes?

An inclusion report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No positive brand mention is an ambiguous or wrong entity match.
- Every query-level claim has SERP or chatbot-source evidence.
- Google AI Overview and chatbot answer observations are visibly separated.
- Every recommendation points to the query, source, or page gap that motivated it.

## Automated Checks

Run after every inclusion-tracking build:

- JSON schema validation for final report.
- Every query result must include query, group, intent, AI Overview presence, brand mention, brand citation, cited domains, evidence, and recommendation fields.
- Evidence URLs must be valid HTTP(S) URLs.
- Each evidence item must include source type and fetched-at timestamp.
- Brand citation cannot be true unless a cited URL matches the brand domain or preferred source list.
- Competitor mentions must map to a configured competitor or alias.
- Visibility score must be an integer from 0-100.
- Caps must apply when no Google AI Overview evidence, no citations, or ambiguous entity matches are present.
- Query snapshots must preserve country, city, device, and checked-at timestamp.
- CSV export row count must match query result count.

## Failure Modes To Track

- Confusing organic ranking with AI Overview inclusion.
- Blending Google AI Overview observations with chatbot answer observations.
- Counting a brand mention when the answer refers to an unrelated company with the same name.
- Counting an owned citation when only a third-party listicle mentions the brand.
- Missing citations rendered by JavaScript or hidden behind SERP expansion.
- Treating absence of AI Overview as a negative brand result instead of a missing SERP feature.
- Overstating trend changes caused by normal answer volatility.
- Losing country, city, or device context during aggregation.
- Producing generic content recommendations that do not map to a query or cited source.

## Golden Examples

Create fixture briefs before implementation:

1. Strong inclusion: brand appears and is cited in multiple commercial AI Overview results.
2. Mention-only gap: brand is included in answers but citations favor competitors or third-party pages.
3. Competitor-dominated: competitors appear repeatedly while the tracked brand is absent.
4. Ambiguous entity: brand name overlaps with another company and requires domain confirmation.
5. Local variance: inclusion changes materially between two city-targeted SERPs.
6. No AI Overview: tracked queries produce normal SERPs and sourced chatbot answers only.

Each fixture should include:

- Input inclusion brief
- Raw SERP snapshots
- AI Overview text and citations when present
- Grounded chatbot answer with sources
- Fetched source excerpts
- Expected brand and competitor mention labels
- Expected citation labels
- Expected recommendations
- Acceptable visibility score range

## Launch Criteria

The MVP is ready for first users when:

- 30-brief benchmark completes without crashes.
- AI Overview detection accuracy is at least 95%.
- Brand inclusion precision is at least 95%.
- Citation extraction accuracy is at least 90%.
- Competitor share accuracy is at least 90%.
- Recommendation usefulness is at least 80%.
- Ambiguous entity false positives are below 2%.
- Batch cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
