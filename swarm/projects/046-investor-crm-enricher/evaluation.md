# Evaluation

## Success Criteria

The MVP is successful when a founder can upload a messy investor list and receive a trustworthy, source-backed shortlist that improves prioritization without encouraging unsupported claims or private-data enrichment.

Target outcome: within 15 minutes for a 100-row CRM, the founder can identify the top 20 investor matches, see why each match is relevant, and click through to public evidence for every important claim.

## Test Inputs

Use 6 to 10 CRM-style lists:

| List Type | Why |
| --- | --- |
| Seed SaaS investor list | Common founder workflow with many firm profiles |
| Healthcare or fintech investor list | Tests regulated-sector nuance |
| Climate or deeptech list | Tests thesis specificity and stage ambiguity |
| Angel-heavy list | Tests sparse public evidence |
| Mixed-name CRM export | Tests normalization and duplicate handling |
| International investor list | Tests country/city targeting and regional pages |
| Stale CRM export | Tests recent-activity detection and warnings |

Each list should include a mix of investor names, firm names, profile URLs, domains, blank fields, duplicate rows, and ambiguous same-name investors.

## Metrics

### Input Normalization

Manually label 100 sampled rows:

- Investor name accuracy: normalized person is correct.
- Firm accuracy: normalized firm is correct.
- Duplicate handling: true duplicates merge or receive shared evidence.
- Original field preservation: no source CRM columns are dropped.

Target MVP thresholds:

- Investor name accuracy: 92%+
- Firm accuracy: 90%+
- Duplicate handling accuracy: 85%+
- Original field preservation: 100%

### Source Discovery

For 50 sampled rows:

- Official profile recall: finds official firm or investor profile when it exists publicly.
- Portfolio/thesis recall: finds a public source for sector or stage focus when available.
- Recent activity recall: finds at least one relevant recent activity item when an obvious public item exists.
- False source rate: percentage of fetched sources about the wrong person, wrong firm, or unrelated company.

Target MVP thresholds:

- Official profile recall: 85%+
- Portfolio/thesis recall: 75%+
- Recent activity recall: 70%+
- False source rate: under 8%

### Extraction

For enriched rows, sample and label the appended fields:

- Role accuracy.
- Sector accuracy.
- Stage accuracy.
- Geography accuracy.
- Recent activity support rate.
- Source support rate for all appended claims.

Target MVP thresholds:

- Role accuracy: 85%+
- Sector accuracy: 80%+
- Stage accuracy: 75%+
- Geography accuracy: 75%+
- Recent activity support rate: 90%+
- Source support rate: 95%+

### Fit Scoring

Evaluate against founder briefs with manually ranked ideal investors:

- Top-20 precision: percentage of top-20 rows that a human reviewer considers relevant.
- Pairwise ranking accuracy: for labeled investor pairs, higher-scored row is the better fit.
- Outreach angle usefulness: angle is specific, concise, and source-supported.
- Confidence calibration: low-confidence rows actually have sparse or conflicting evidence.

Target MVP thresholds:

- Top-20 precision: 75%+
- Pairwise ranking accuracy: 75%+
- Outreach angle usefulness: 80%+
- Confidence calibration: 80%+

## Golden Fixture Tests

Build deterministic local fixtures:

| Fixture | Expected Result |
| --- | --- |
| `firm-team.html` | Extract role, sectors, stages, and official firm domain |
| `portfolio.html` | Extract sector and geography signals from portfolio cards |
| `news.html` | Extract recent investment activity with date and source URL |
| `ambiguous-serp.json` | Warn on same-name conflict and lower confidence |
| `broad-thesis.html` | Do not over-score generic thesis language |
| `blocked-page.json` | Continue run and emit blocked-source warning |

Assertions:

- Every enriched row has at least one source URL unless no public source was found.
- Every recent activity item has source URL, snippet, and activity type.
- No email, phone, or private contact fields are generated.
- Fit scores stay between 0 and 100.
- Rows with same-name conflicts have warnings and cannot receive `high` confidence.
- Original CSV columns appear unchanged in the output.

## Live Run Review Checklist

For each live test:

- Did `account_status` produce a useful run-budget message?
- Are official firm pages preferred over third-party mirrors?
- Did search results confuse similarly named investors or firms?
- Are sectors specific enough to be useful for founder prioritization?
- Are stages supported by source text or portfolio evidence?
- Are recent activity items actually recent under the configured lookback window?
- Are outreach angles grounded in evidence rather than generic fundraising advice?
- Are low-information rows marked with low confidence instead of overfilled?

## Failure Modes

- Same-name investor collision: require firm co-occurrence and add warnings when identity is ambiguous.
- Broad thesis inflation: cap fit score when sector language is generic and not backed by portfolio or recent activity.
- Stale portfolio evidence: mark recency confidence low when dates are missing or outside the lookback window.
- Investor-level attribution error: avoid saying an individual led a deal unless the source explicitly attributes it.
- JavaScript-rendered firm pages return empty text: retry `web_fetch` with rendering waits or alternate device settings.
- Captcha or access block: preserve partial evidence and continue the run.
- Regional content mismatch: rerun with requested country/city when pages redirect by geography.

## Manual Evaluation Template

```csv
run_id,row_id,field,error_type,notes
acme-seed,12,firm,wrong_entity,"Matched Jane Lee at Example Capital instead of Example Ventures"
acme-seed,19,fit_score,over_scored,"Generic AI thesis scored 91 without healthcare portfolio evidence"
acme-seed,24,recent_activity,unsupported,"Announcement was about the firm, not this investor"
acme-seed,31,outreach_angle,generic,"Could apply to any seed investor"
```

## Go/No-Go

Ship the MVP if:

- At least 5 live CRM lists complete without manual intervention.
- Official profile recall is at least 85%.
- Source support rate is at least 95%.
- Top-20 precision is at least 75%.
- No tests show private contact data generation.

Do not ship if:

- The tool routinely merges same-name investors incorrectly.
- Fit scores are high without source-backed sector, stage, or recency evidence.
- The output drops original CRM columns.
- Rows lack source URLs for appended claims.
- The product frames enrichment as investment advice instead of research support.
