# Evaluation

The MVP should be evaluated on whether it finds timely, sourced, actionable sales triggers that a rep would trust enough to use in account prioritization.

## Evaluation Set

Create a hand-labeled dataset of 50 account-trigger pairs:

- 10 launch triggers
- 10 hiring triggers
- 10 funding triggers
- 5 outage or incident triggers
- 10 regulation or compliance triggers
- 5 business-change triggers such as partnerships, leadership changes, or expansion

Include:

- at least 15 accounts outside tech
- at least 10 accounts with JS-heavy pages
- at least 10 accounts with weak or ambiguous triggers
- at least 10 accounts where the correct answer is "no useful recent trigger"
- at least 5 localized regulation or expansion examples

For each account, manually record:

- official website
- expected trigger type
- event date
- source URLs
- observed evidence
- acceptable "why now" rationale
- likely buyer teams
- whether the trigger is actionable for the chosen seller persona

## Success Metrics

### Trigger Discovery

- Precision at 50: at least 75% of surfaced triggers are real, recent, and relevant.
- Recall: find at least 60% of manually labeled high-confidence triggers.
- No-trigger accuracy: correctly suppress at least 70% of accounts with weak or stale signals.
- Duplicate rate: below 10% after URL and event deduplication.

### Evidence Quality

- Citation coverage: 100% of generated trigger cards include at least one source URL.
- Unsupported claim rate: below 5%.
- Source authority: at least 80% of trigger cards use an official, authoritative, or clearly relevant source.
- Event-date accuracy: within 3 days for at least 75% of dated triggers.

### Sales Usefulness

Ask three target users to rate generated cards:

- "Would this help me decide whether to prioritize the account?" target average: 3.7/5
- "Is the why-now rationale clear?" target average: 4/5
- "Is the suggested angle usable without rewriting from scratch?" target average: 3.5/5
- "Are the sources sufficient to trust the claim?" target average: 4/5

### Safety and Tone

- Sensitive trigger caution: 100% of outage, layoffs, regulation, and compliance cards use factual, non-alarmist wording.
- Inference separation: 100% of cards separate observed evidence from why-now interpretation.
- Disqualifier capture: at least 80% of weak cards include an explanation such as stale source, ambiguous company match, or low relevance.

## Test Queries

Use these discovery query templates for the first benchmark:

```text
{company} launch changelog integration after:{date}
{company} careers hiring engineer security data after:{date}
{company} raised funding partnership acquisition after:{date}
{company} outage incident postmortem status after:{date}
{industry} regulation deadline compliance {country_or_state} after:{date}
{company} expansion executive hire new market after:{date}
```

Run each with:

- country: US unless account metadata says otherwise
- city targeting when the account or regulation is local
- device: desktop
- Google SERP parsing enabled
- result limit: 10 per query
- recency window: 14 days for general triggers, 45 days for regulation

## Golden Record Format

```json
{
  "accountName": "Acme Health",
  "website": "https://example.com",
  "market": "US healthcare",
  "expectedTrigger": {
    "type": "regulation",
    "eventDate": "2026-04-28",
    "observedEvidence": "State agency published enforcement deadline for patient data handling.",
    "whyNow": "Vendors serving affected healthcare customers may need workflow updates before the deadline.",
    "sourceUrls": ["https://example.gov/privacy-rule"],
    "actionable": true
  },
  "acceptableBuyerTeams": ["legal", "security", "operations"],
  "notes": "Must not claim the company is out of compliance."
}
```

## Manual Review Rubric

Score each generated trigger card from 0-2 for each category:

| Category | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Trigger match | wrong or missing | partially related | correct trigger |
| Recency | stale or undated | plausible but unclear | clearly recent |
| Evidence | unsupported | mixed or thin | well sourced |
| Why now | generic | plausible | specific and actionable |
| Tone | risky or overstated | acceptable | careful and factual |
| Ranking | poor prioritization | fair | clearly worth surfacing |

Maximum score per card: 12. MVP target: average 8+.

## Failure Modes To Track

- Treating old blog posts or evergreen jobs as new triggers.
- Confusing subsidiaries, customers, or similarly named companies.
- Overstating outages, compliance risk, or legal implications.
- Using generic industry news as if it applied directly to the account.
- Duplicate cards from syndicated funding or news articles.
- Missing triggers hidden behind JS-heavy changelogs or ATS pages.
- Treating fetch failures as no-trigger outcomes.
- Ranking a weak but recent source above a strong authoritative source.

## Instrumentation

Log one JSONL event per major step:

```json
{
  "runId": "2026-05-02T15:00:00Z",
  "account": "Acme Health",
  "step": "extract_trigger_cards",
  "queriesIssued": 6,
  "urlsFetched": 5,
  "jsRendered": 4,
  "captchaSolved": 1,
  "triggersGenerated": 2,
  "triggersDropped": 1,
  "errors": []
}
```

Track:

- search queries and result counts
- URLs selected, skipped, and deduplicated
- fetch status, render mode, and captcha handling
- extraction schema validation failures
- dropped cards and reasons
- score components
- source count and authority by trigger type

## Acceptance Criteria

The MVP is ready for a pilot when:

- It can process 100 accounts from a CSV in one run.
- It emits Markdown, JSON, and CSV outputs.
- Every surfaced card includes source URLs and separates evidence from interpretation.
- The benchmark averages at least 8/12 on the manual rubric.
- At least three sales users can each identify 10 credible outreach targets from the feed in under 20 minutes.
