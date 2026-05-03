# Evaluation

Goal: prove Vendor Country Coverage Checker produces conservative, source-backed public-docs research about whether a vendor appears able to serve a target country, without presenting the result as legal advice.

## Test Set

Use 30 coverage briefs:

- 6 clearly supported country and product combinations with strong official availability pages.
- 5 explicitly unsupported or excluded country combinations.
- 5 plan-gated or sales-contact-gated combinations.
- 4 regulated or compliance-sensitive categories where data residency, sanctions, or industry restrictions matter.
- 4 pricing-localization cases with country-specific currencies, taxes, invoices, or payment methods.
- 3 sparse-docs vendors where `unclear` or `not_found` should be common.
- 3 localization cases where country-targeted fetches or SERPs materially change pricing, terms, or support content.

For each brief, create a human-labeled benchmark:

- Vendor domain, product, target country, and seed URLs
- Expected source inventory and preferred official URLs
- Coverage dimensions and accepted synonyms
- Expected status per dimension
- Expected public evidence claims
- Explicit negative evidence where `unsupported` is correct
- Gated, restricted, stale, or contradictory evidence notes
- Disallowed legal conclusions and disallowed private-source assumptions

## Metrics

Primary metrics:

- Dimension status accuracy: at least 85% of evaluated dimensions match human labels.
- Source validity: at least 95% of supported, unsupported, restricted, and gated statuses include relevant inspectable public sources.
- Unsupported safety: at least 98% of `unsupported` statuses must be backed by explicit official negative evidence.
- Conservative uncertainty: at least 90% of sparse or ambiguous cases should be labeled `unclear` or `not_found`, not forced into a decision.
- Product specificity: at least 90% of availability claims preserve the requested product, service line, plan, or scope when the source provides it.
- Disclaimer adherence: 100% of reports include the public-docs and not-legal-advice limitation.
- Review usefulness: at least 80% of review checklist items should be judged actionable by procurement, compliance, or operations reviewers.

Secondary metrics:

- Country alias and ISO code normalization accuracy.
- Official source classification accuracy.
- Localized pricing, terms, and support detection.
- Restricted, gated, beta, and sales-contact classification accuracy.
- Data residency and subprocessors extraction accuracy.
- Sanctions, export control, and restricted country extraction accuracy.
- Duplicate source rate.
- Cost per completed check.
- Percentage of dimensions marked `not_found`.
- Confidence calibration across high, medium, and low confidence cells.

## Manual Review Rubric

Score each generated report from 1-5:

- Scope control: Does the report answer the requested vendor, product, and target country rather than generic vendor presence?
- Status correctness: Are dimension statuses accurate and appropriately conservative?
- Evidence quality: Do sources support the exact public-docs claim?
- Restriction clarity: Are plan, contract, country, industry, data, tax, and support limitations clearly called out?
- Legal boundary: Does the report avoid legal advice and direct the user toward vendor or counsel verification when needed?
- Readability: Can a reviewer quickly identify likely blockers and open questions?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No high-confidence status is unsupported by cited public evidence.
- `unsupported` is used only with explicit official negative evidence.
- Official and secondary evidence are clearly distinguishable.
- Plan-gated, country-gated, and unclear dimensions are easy to find.
- The review checklist is specific enough for vendor follow-up or internal intake.

## Automated Checks

Run after every coverage build:

- JSON schema validation for the final report.
- Every requested coverage dimension appears exactly once.
- Every cell status is one of the allowed statuses.
- Confidence must be high, medium, or low.
- Report must include `not_legal_advice: true`.
- Report limitations must mention public documentation and no legal advice.
- Non-unclear and non-not-found statuses must include at least one valid HTTP(S) evidence URL.
- `unsupported` statuses must include explicit negative evidence or be downgraded to `unclear`.
- Evidence URLs must preserve source type, fetched timestamp, query, rank, and geo metadata when available.
- Product-specific claims must not be generalized to all vendor products without supporting evidence.
- Third-party sources must not override official sources without a conflict note.
- Country-targeted and generic pages must remain distinguishable in the source inventory.

## Failure Modes To Track

- Treating a vendor's office, customer story, or marketing mention in a country as product availability.
- Treating absence of a country mention as proof that the vendor cannot serve the country.
- Generalizing one product's supported countries to another product.
- Missing pricing or terms content that changes under localized fetch settings.
- Confusing account-gated, sales-gated, or plan-gated support with general support.
- Converting public-docs research into legal advice or compliance certification.
- Missing sanctions, export control, acceptable use, or restricted industry limitations.
- Dropping policy effective dates, fetch timestamps, or localized source context.
- Letting third-party summaries override official vendor docs.
- Producing a correct but vague report that does not say what to verify next.

## Golden Examples

Create fixture checks before implementation:

1. Clear support: official country availability and pricing pages both list the target country.
2. Clear exclusion: official terms or restricted country page explicitly excludes the target country.
3. Plan-gated support: country appears supported only on enterprise, custom, or sales-approved plans.
4. Compliance-sensitive support: product is available, but data residency, subprocessors, or regulated industry support is unclear.
5. Localized pricing: country-targeted fetch exposes different currency, tax, or payment method details than the generic page.
6. Sparse documentation: vendor has no strong public availability page, requiring `insufficient_public_evidence`.

Each fixture should include:

- Input coverage brief
- Raw SERP snippets
- Fetched page excerpts
- Expected coverage statuses
- Expected evidence inventory
- Expected review checklist
- Disallowed claims
- Acceptable confidence ranges
- Expected limitations and disclaimer language

## Launch Criteria

The MVP is ready for first users when:

- 30-brief benchmark completes without crashes.
- Dimension status accuracy is at least 85%.
- Source validity is at least 95%.
- Unsupported safety is at least 98%.
- Disclaimer adherence is 100%.
- Median review time is under 20 minutes per vendor-country check.
- Cost is estimated before each run and recorded after completion.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
