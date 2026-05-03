# Evaluation

## Success Criteria

The support article freshness checker is useful when it finds real review candidates without overwhelming teams with vague warnings. Evaluation should measure evidence quality, prioritization quality, and operational fit.

## Test Corpus

Use a mixed corpus of 100 public support articles:

- 25 recently updated articles with no known stale claims.
- 25 older articles that are still intentionally valid.
- 25 seeded stale articles with changed plan names, limits, UI paths, or feature status.
- 15 articles with link rot, redirects, missing visible dates, or incomplete render output.
- 10 localized or region-specific articles that require country or city targeting.

Create seeded stale cases by comparing archived article text against current public source pages. Keep source URLs and expected findings in a gold file.

## Metrics

| Metric | Target | Notes |
| --- | --- | --- |
| Stale finding precision | 80%+ | Findings labeled stale should have source-backed evidence. |
| Stale finding recall | 70%+ | Seeded stale claims should be found often enough to justify scanning. |
| High severity precision | 90%+ | High severity should be reserved for customer-impacting contradictions. |
| Missing date detection | 95%+ | Visible date extraction should be deterministic. |
| Dead link detection | 95%+ | Includes 404s, obvious error pages, and unexpected redirect destinations. |
| Unsupported claim rate | < 5% | Contradiction findings without source URLs should be rejected. |
| Reviewer acceptance | 70%+ | Human reviewers mark findings as worth review or worth fixing. |

## Gold Labels

Each labeled article should include:

```json
{
  "article_url": "https://help.example.com/articles/api-rate-limits",
  "expected_status": "stale",
  "expected_severity": "high",
  "expected_findings": [
    {
      "type": "conflicting_claim",
      "claim_contains": "5,000 API calls per hour",
      "source_url": "https://docs.example.com/api/rate-limits"
    }
  ],
  "acceptable_actions": [
    "Update rate limit table.",
    "Verify plan limit against API docs."
  ]
}
```

## Evaluation Runs

1. Baseline date-only scan: flag old or missing dates without AI claim comparison.
2. Link and render scan: add dead links, redirects, status codes, and thin render detection.
3. Source-backed claim scan: add AI extraction and comparison against fetched source pages.
4. SERP-aware scan: add Google title/snippet mismatch signals.
5. Geo/device scan: rerun selected articles with country, city, and mobile device targeting.

Compare each run against the gold labels and record which additional signals improved precision or recall.

## Human Review Rubric

Reviewers score each finding from 1 to 5:

- 5: Clear issue, source-backed, should be fixed.
- 4: Likely issue, needs owner confirmation.
- 3: Useful review prompt, evidence incomplete.
- 2: Weak signal, not worth prioritizing.
- 1: Incorrect or misleading.

A finding is accepted when it scores 4 or 5. A review-needed item is accepted when it scores 3 or higher.

## Failure Modes To Track

- AI marks a claim stale without a fetched source URL.
- Article date extraction confuses comments, examples, changelog entries, or copyright years with update dates.
- Help center renders partial content because JavaScript, cookies, or localization changed the page.
- SERP snippet is old even though the article is current.
- Pricing or limit pages vary by country and create false contradictions.
- Article intentionally documents a legacy product version but lacks clear version metadata.
- Captcha or bot protection creates thin render false positives.

## Acceptance Gate

The prototype is ready for pilot use when:

- High-severity precision reaches at least 90% on the test corpus.
- Every contradiction finding includes an article URL, claim text, source URL, and source observation.
- No private or authenticated content is required.
- Markdown and CSV reports are understandable without raw logs.
- At least three reviewers agree that the queue saves time compared with manual article auditing.

## Pilot Plan

Run the tool weekly on one public help center section for four weeks. Track accepted findings, fixed articles, false positives, quota use, runtime, and reviewer feedback. Use the results to tune stale-age thresholds, claim-type severity, and which source pages should be treated as authoritative.

