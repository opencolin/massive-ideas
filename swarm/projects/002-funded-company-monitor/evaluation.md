# Evaluation

The MVP should be evaluated on whether it produces useful, sourced account intelligence faster than a human first-pass research workflow.

## Evaluation Set

Create a hand-labeled dataset of 25 recently funded companies:

- 10 seed-stage companies
- 10 Series A/B companies
- 5 later-stage companies
- at least 5 with JS-heavy careers pages
- at least 5 outside San Francisco/New York
- at least 5 with weak or ambiguous stack signals

For each company, manually record:

- correct funding round, amount, announcement date, and source
- official website
- careers URL
- open role count
- role clusters
- 5-15 stack terms visible in public pages
- 0-5 verified pain signals
- source URLs for each label

## Success Metrics

### Funding Discovery

- Precision at 25: at least 80% of discovered records are real funding events from the last 30 days.
- Duplicate rate: below 15% after normalization.
- Company website accuracy: at least 85%.

### Hiring Signals

- Careers page discovery: at least 80%.
- Open role count within +/- 20% for at least 70% of companies.
- Role cluster accuracy: at least 75% F1 against manual labels.

### Stack Signals

- Stack precision: at least 75% of extracted stack terms are actually supported by cited evidence.
- Stack recall: at least 50% of manually labeled high-confidence stack terms are found.
- Citation coverage: 100% of extracted stack groups include source URLs.

### Pain Signals

- Pain precision: at least 70% of pain signals are considered fair by a human evaluator.
- Inference discipline: 100% of pain signals separate observed evidence from inferred need.
- Unsupported claim rate: below 5%.

### Report Usefulness

Ask two target users to rate 25 generated company cards:

- "Would you open this account?" target average: 3.5/5
- "Is the rationale clear?" target average: 4/5
- "Are the sources sufficient to trust the summary?" target average: 4/5

## Test Queries

Use these discovery queries for the first benchmark:

```text
"raised a seed round" startup "plans to hire"
"raised Series A" startup "engineering team"
"announced a $10 million Series A"
"emerged from stealth" "seed funding"
"startup raises" "to expand its team"
```

Run each with:

- country: US
- device: desktop
- Google SERP parsing enabled
- result limit: 20 per query
- funding recency window: 30 days

## Golden Record Format

```json
{
  "companyName": "Acme AI",
  "website": "https://example.com",
  "funding": {
    "round": "Series A",
    "amountUsd": 18000000,
    "announcementDate": "2026-04-27",
    "sourceUrl": "https://example.com/blog/series-a"
  },
  "careersUrl": "https://example.com/careers",
  "hiring": {
    "openRoles": 13,
    "roleClusters": ["engineering", "data", "security"]
  },
  "stackTerms": ["Python", "React", "AWS", "Postgres", "Kubernetes"],
  "painLabels": ["security_compliance", "infrastructure_scaling"]
}
```

## Manual Review Rubric

Score each generated company card from 0-2 for each category:

| Category | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Funding | wrong or missing | partially correct | correct and sourced |
| Hiring | wrong or stale | partly correct | accurate enough for prioritization |
| Stack | mostly unsupported | mixed evidence | useful and cited |
| Pain | speculative | plausible but thin | evidence-backed and actionable |
| Ranking | poor fit | acceptable | clearly worth reviewing |

Maximum score per company: 10. MVP target: average 7+.

## Failure Modes To Track

- Duplicate company records from syndicated press releases.
- Funding events older than configured recency window.
- Job counts inflated by duplicate ATS URLs.
- Company name collision with unrelated brands.
- Stack terms extracted from customer logos, old blog posts, or generic boilerplate.
- Pain signals phrased too strongly relative to evidence.
- Captcha or rendering failure silently treated as no hiring activity.

## Instrumentation

Log one JSONL event per major step:

```json
{
  "runId": "2026-05-02T08:00:00Z",
  "company": "Acme AI",
  "step": "collect_company_pages",
  "urlsFetched": 9,
  "jsRendered": 7,
  "captchaSolved": 1,
  "errors": []
}
```

Track:

- search queries issued
- URLs selected and skipped
- fetch status and render mode
- LLM extraction validity
- JSON schema validation failures
- score components
- source count by type

## Acceptance Criteria

The MVP is ready for a pilot when:

- It can run end-to-end on 25 companies from a config file.
- It emits Markdown, JSON, and CSV reports.
- Every non-empty pain signal includes at least one source URL.
- The generated report averages at least 7/10 on the manual rubric.
- A user can identify at least 10 credible outreach targets from the 25-company report in under 20 minutes.
