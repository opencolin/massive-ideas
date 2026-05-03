# Evaluation

## Success Criteria

The procurement research assistant is useful when it finds real public opportunities, preserves cited evidence, and helps humans decide whether to pursue without flooding them with stale or unsupported records. Evaluation should measure discovery coverage, fact extraction accuracy, prioritization quality, and operational fit.

## Test Corpus

Use a mixed corpus of 100 public procurement records:

- 25 open opportunities with clear deadlines and public requirements.
- 20 closed, canceled, awarded, or expired opportunities that should not be prioritized.
- 20 seeded records with mandatory pre-bid meetings, addenda, registration requirements, or eligibility constraints.
- 15 award or incumbent records connected to relevant categories.
- 10 supplier registration, policy, and buyer instruction pages.
- 10 JavaScript-heavy, localized, or portal-search pages that require rendering or geo/device targeting.

Create seeded cases by pairing opportunity pages with public addenda, award notices, supplier guides, and known expected facts. Keep source URLs and expected findings in a gold file.

## Metrics

| Metric | Target | Notes |
| --- | --- | --- |
| Open opportunity precision | 85%+ | Records labeled actionable should be genuinely open or worth immediate review. |
| Open opportunity recall | 70%+ | Public opportunities in the gold set should be discovered often enough to justify monitoring. |
| Deadline extraction accuracy | 90%+ | Due dates, pre-bid dates, and question deadlines must match source pages. |
| Requirement precision | 85%+ | Mandatory events, registration, addenda, and eligibility flags should be source-backed. |
| Closed record suppression | 90%+ | Expired, canceled, and awarded records should not appear as active opportunities. |
| Unsupported claim rate | < 5% | Claims without source URLs should be rejected or marked review-needed. |
| Reviewer acceptance | 70%+ | Human reviewers mark findings as useful for pursuit or monitoring. |

## Gold Labels

Each labeled record should include:

```json
{
  "opportunity_url": "https://city.example.gov/procurement/rfp-2026-042",
  "expected_status": "open",
  "expected_priority": "high",
  "expected_dates": [
    {
      "label": "proposal_due",
      "value": "2026-05-17"
    }
  ],
  "expected_findings": [
    {
      "type": "mandatory_prebid",
      "source_url": "https://city.example.gov/procurement/rfp-2026-042"
    },
    {
      "type": "registration_required",
      "source_url": "https://city.example.gov/purchasing/vendor-registration"
    }
  ],
  "acceptable_actions": [
    "Confirm attendance requirements.",
    "Register in supplier portal.",
    "Track addenda before submission."
  ]
}
```

## Evaluation Runs

1. Baseline search scan: discover procurement records with `web_search` and Google SERP parsing only.
2. Rendered opportunity scan: add `web_fetch` with JavaScript rendering and status extraction.
3. Requirement extraction scan: add AI extraction of dates, status, requirements, addenda, and eligibility.
4. Source-backed comparison scan: add supplier pages, award pages, addenda pages, and rejection of unsupported claims.
5. Geo/device scan: rerun selected portals with country, city, and mobile targeting.

Compare each run against the gold labels and record which signals improve actionable precision, recall, and reviewer acceptance.

## Human Review Rubric

Reviewers score each opportunity or finding from 1 to 5:

- 5: Clear opportunity or requirement, source-backed, immediate action warranted.
- 4: Likely useful, needs owner confirmation.
- 3: Useful monitoring or research prompt, evidence incomplete.
- 2: Weak signal, stale, or low value.
- 1: Incorrect, misleading, or unsupported.

A finding is accepted when it scores 4 or 5. A review-needed item is accepted when it scores 3 or higher.

## Failure Modes To Track

- AI treats a closed, awarded, or canceled solicitation as open.
- Deadline extraction confuses question deadlines, pre-bid meetings, board dates, or addendum dates with proposal due dates.
- Mandatory requirements are summarized without source URLs.
- Procurement portal renders an empty results page because JavaScript, captcha, cookies, or geography changed the page.
- Search snippets expose stale portal records that are no longer active.
- Attachments or addenda are mentioned but not publicly fetchable.
- Supplier registration instructions are interpreted as guaranteed eligibility.
- Award or incumbent mentions are overstated as active buying intent.

## Acceptance Gate

The prototype is ready for pilot use when:

- Actionable opportunity precision reaches at least 85% on the test corpus.
- Deadline extraction accuracy reaches at least 90% for labeled records.
- Every requirement finding includes an opportunity URL, observation, source URL, and confidence score.
- Closed, canceled, and awarded records are clearly separated from active opportunities.
- Markdown and CSV reports are usable by a proposal or sourcing reviewer without raw logs.
- At least three reviewers agree that the queue saves time compared with manual procurement portal research.

## Pilot Plan

Run the tool twice weekly for four weeks across one category and 20 public buyers. Track discovered opportunities, accepted findings, missed opportunities, false positives, quota use, runtime, and reviewer comments. Use the results to tune search queries, deadline parsing, status suppression, fit scoring, and source page discovery.
