# Evaluation

Goal: prove API Docs Comparison Assistant creates useful, conservative, source-backed API comparisons faster and more reliably than manual API documentation review.

## Test Set

Use 20 comparison briefs:

- 5 mature REST API categories with stable docs and public references.
- 4 fast-moving AI or data APIs with frequent version changes.
- 4 SDK-heavy categories where language support and generated docs matter.
- 3 webhook or event-driven categories with complex payload differences.
- 2 localized or region-gated API categories.
- 2 sparse or poorly documented categories where `unknown` should be common.

For each brief, create a human-labeled benchmark:

- API list, canonical domains, docs URLs, and versions
- Capability list and accepted synonyms
- Expected status per API-capability cell
- Expected endpoint paths, methods, auth details, SDK availability, and rate-limit notes when public
- High-quality source URLs
- Disallowed inferences
- Notes on ambiguity, localization, deprecation, and stale docs

## Metrics

Primary metrics:

- Cell accuracy: at least 85% of evaluated cells match human labels.
- Source validity: at least 95% of non-unknown cells include a relevant inspectable source.
- Absent safety: at least 98% of `absent` cells must be explicitly supported by evidence, not absence of evidence.
- Version awareness: at least 90% of version-specific claims preserve the correct API version or deprecation context.
- Review usefulness: at least 80% of flagged review notes should be judged actionable by a technical reviewer.
- Time saved: reduce first-pass API comparison work from 4-8 hours to under 45 minutes of review.

Secondary metrics:

- Capability synonym normalization accuracy.
- Endpoint method and path extraction accuracy.
- Request and response schema extraction accuracy.
- Auth, pagination, rate-limit, and webhook event accuracy.
- SDK language availability accuracy.
- Region, plan, beta, and account-gated detection.
- Duplicate source and duplicate API rate.
- Cost per completed comparison.
- Percentage of cells marked `unknown`.
- Confidence calibration across high, medium, and low confidence cells.

## Manual Review Rubric

Score each generated comparison from 1-5:

- Capability relevance: Does the matrix compare the requested API behaviors rather than generic product claims?
- Cell correctness: Are statuses accurate and appropriately conservative?
- Evidence quality: Do linked sources support the exact API claim?
- Version clarity: Are version, changelog, beta, preview, and deprecation details preserved?
- Migration usefulness: Are differences translated into practical implementation notes?
- Readability: Can a technical user quickly understand what changes between APIs?

A comparison is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-confidence cell is unsupported by cited evidence.
- `absent` is used only with explicit evidence.
- Official and third-party evidence are clearly distinguishable.
- Low-confidence and ambiguous cells are easy to find.
- Migration notes are specific enough to guide follow-up engineering review.

## Automated Checks

Run after every comparison build:

- JSON schema validation for the final comparison.
- Every requested capability appears exactly once in the output matrix.
- Every requested API appears in every capability row.
- Cell status must be one of the allowed statuses.
- Confidence must be high, medium, or low.
- Non-unknown cells must include at least one valid HTTP(S) evidence URL.
- Evidence URLs must preserve source type, fetched timestamp, API name, and version when available.
- `absent` cells must include explicit negative evidence text or be downgraded to `unknown`.
- Official documentation claims should not be overwritten by weaker third-party claims without a conflict note.
- Deprecated and gated cells must include explanatory details.
- Endpoint path and method fields must use normalized casing and path formats.

## Failure Modes To Track

- Treating missing docs mentions as proof that a capability is absent.
- Confusing product feature pages with API support.
- Missing endpoint details hidden behind JavaScript-rendered docs.
- Dropping API version context from changelog or migration pages.
- Letting third-party tutorials override official references.
- Merging similarly named endpoints or webhook events that have different semantics.
- Equating SDK helper methods with raw API support without evidence.
- Missing localized, region-gated, account-gated, beta, or plan-gated access details.
- Losing query, rank, fetch context, or source type during synthesis.
- Producing a matrix that is technically sourced but too vague for migration planning.

## Golden Examples

Create fixture comparisons before implementation:

1. Mature REST category: stable vendors, reference docs, and clear auth/rate-limit pages.
2. AI API category: frequent version changes and ambiguous capability naming.
3. SDK category: multiple language SDKs, generated references, and helper-only features.
4. Webhook category: event names, payload schemas, retry semantics, and signing behavior.
5. Localized API category: region-specific endpoints, compliance, pricing, or availability.

Each fixture should include:

- Input comparison brief
- Raw SERP snippets
- Fetched page excerpts
- Expected capability matrix
- Expected source inventory
- Expected endpoint and schema notes
- Disallowed claims
- Acceptable confidence ranges
- Expected manual review flags

## Launch Criteria

The MVP is ready for first users when:

- 20-brief benchmark completes without crashes.
- Cell accuracy is at least 85%.
- Source validity is at least 95%.
- Absent safety is at least 98%.
- Version awareness is at least 90%.
- Median review time is under 45 minutes per comparison.
- Cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
