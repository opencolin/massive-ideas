# Evaluation

## Success Criteria

- Queries all selected models in parallel.
- Returns useful partial results when one model times out.
- Surfaces disagreement clearly.
- Preserves source provenance by model.
- Produces deterministic field votes for structured enrichment.

## Test Cases

1. Known company prompt with official sources available.
2. Niche startup prompt where at least one model is likely stale.
3. Recent-news prompt where model source coverage differs.
4. Structured lead-enrichment prompt for three companies.
5. Source-less model answer that should lower confidence.

## Metrics

- Consensus precision against hand-labeled claims.
- Disagreement recall.
- Source-domain overlap accuracy.
- JSON parse success rate for enrichment.
- Timeout recovery rate.
- End-to-end latency for fastest three models.

## Failure Modes

- All models agree on the same wrong fact.
- Source domains overlap but do not support the claim.
- Model prefix text pollutes the normalized answer.
- One slow model stalls the whole run.
- JSON extraction becomes brittle across model styles.

## Review Rubric

For each generated consensus report, a reviewer should answer:

- Are agreed claims actually supported by sources?
- Are disputed claims visible before the final summary?
- Are low-source answers marked lower confidence?
- Is the user told what to verify manually?
- Are field-level votes explainable?

## Launch Gate

Ship when benchmark reports correctly flag all seeded disagreements, no timeout blocks a partial report, and at least 90% of structured fixture fields receive the expected vote/confidence label.
