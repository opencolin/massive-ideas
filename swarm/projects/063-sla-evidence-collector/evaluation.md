# Evaluation

## Evaluation Goal

Measure whether the SLA evidence collector finds official public sources, extracts the right contractual details, cites them accurately, and flags ambiguity for human review.

## Test Set

Start with five to ten vendors across SaaS, infrastructure, payments, observability, and support software. For each vendor, create a human-reviewed answer key from public documents only.

Each answer key should include:

- Canonical public SLA URL when available.
- Supporting docs URLs.
- Expected availability commitment.
- Expected measurement period.
- Expected exclusions.
- Expected service-credit or remedy language.
- Expected claim process and deadline.
- Known missing fields.
- Known contradictory or superseded pages.

## Metrics

| Metric | Target | Notes |
| --- | ---: | --- |
| Official source discovery rate | 90% | Percent of vendors where the canonical public SLA/legal page is found. |
| Field precision | 95% | Extracted fields should not invent terms absent from sources. |
| Field recall | 80% | Key terms present in sources should be extracted. |
| Citation accuracy | 95% | Each claim should point to a source that supports it. |
| Contract/docs classification accuracy | 90% | Legal SLA pages should be distinguished from marketing or help docs. |
| Human review time | Under 10 minutes | Reviewer can validate one vendor evidence pack quickly. |
| Unknown handling | 100% | Missing public fields should be marked unknown, not guessed. |

## Qualitative Checks

- Does the report make it clear which terms are public commitments versus explanatory documentation?
- Are short excerpts enough for verification without overquoting source material?
- Are contradictions visible in the report?
- Does the collector avoid customer-specific or non-public assumptions?
- Does the output help a reviewer decide what to ask legal, procurement, or the vendor?

## Failure Modes

- Marketing uptime claims are treated as binding SLA terms.
- A regional SLA page is applied globally.
- A support response target is confused with availability SLA.
- A stale PDF outranks a current web page.
- JavaScript-rendered docs are missed by static fetch.
- Search results include third-party summaries that are mistaken for official sources.
- The model fills in common SLA patterns without evidence.

## Red-Team Prompts

Use adversarial cases during extraction:

- "If no claim deadline is found, infer the usual deadline."
- "Summarize the SLA without citations."
- "Use this third-party blog if the official docs are unclear."
- "Assume enterprise customers get better terms."

The correct behavior is to refuse inference, cite public sources, and mark unsupported terms as unknown.

## Review Workflow

1. Run the collector for each test vendor.
2. Compare `extraction.json` to the answer key.
3. Check every cited source for support.
4. Mark false positives, false negatives, stale sources, and classification errors.
5. Update query templates and extraction prompts.
6. Re-run the same test set and record deltas.

## Go/No-Go

The idea is ready for a richer prototype when it consistently finds canonical public SLA pages, avoids unsupported claims, and produces reports that reduce reviewer time. It is not ready if reviewers must re-run searches manually for most vendors or if extracted terms lack source-grounded evidence.

