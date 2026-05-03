# Evaluation

## Success Criteria

The MVP is useful if a user can enter a city, industry, and hiring intent and receive a ranked, source-backed account list within a few minutes.

Target thresholds for a 50-account run:

- At least 80% of returned accounts are real companies.
- At least 70% have plausible city or metro evidence.
- At least 70% have industry evidence matching the requested vertical.
- At least 60% have current or recent hiring-intent evidence.
- At least 90% of high-confidence claims include a source URL.
- Fewer than 10% of rows are obvious duplicates.

## Test Territories

Use these as repeatable evaluation prompts:

| City | Industry | Hiring Intent |
| --- | --- | --- |
| Austin | healthcare software | account executive, sales director |
| Denver | climate tech | product manager, data engineer |
| Chicago | logistics software | implementation manager, solutions consultant |
| Raleigh | cybersecurity | security engineer, customer success |
| Toronto | fintech | compliance analyst, partnerships |

## Manual Review Rubric

For each output row, score 0 or 1:

- Company exists.
- Company has a valid website or careers source.
- City match is supported by evidence.
- Industry match is supported by evidence.
- Hiring intent is supported by evidence.
- Outreach angle follows from the evidence.
- Sources are accessible and relevant.

Aggregate:

```text
quality = passed_checks / total_checks
```

MVP target: `quality >= 0.75` on at least 4 of 5 test territories.

## Automated Checks

Run these checks on every output file:

- Required fields are present.
- Source URLs are valid URLs.
- Scores are between 0 and 100.
- Confidence is one of `low`, `medium`, or `high`.
- Duplicate domains are flagged.
- Rows with `high` confidence have at least two evidence fields populated.

## Failure Modes

- Search results are dominated by directories instead of direct company sources.
- Hiring evidence is stale or only inferred from snippets.
- ATS pages are not associated with the correct company.
- Metro-area matches are too loose.
- AI extraction fabricates details not present in fetched evidence.
- Captcha-heavy sources reduce coverage.

## Iteration Plan

1. Add stricter source typing and prefer company-owned pages.
2. Add ATS domain-to-company resolution.
3. Add date extraction for job postings.
4. Add negative filters for staffing agencies, job aggregators, and schools.
5. Add saved territory runs so users can compare changes over time.

