# Evaluation

## Success Criteria

- Runs the same prompt set across all selected models.
- Extracts expected brand aliases with deterministic ranking.
- Preserves sources and raw completions for audit.
- Produces a day-over-day diff without re-querying old data.
- Handles missing model responses without failing the whole run.

## Test Cases

1. AI coding tools category with known brands like Cursor, GitHub Copilot, Replit, Windsurf, and Sourcegraph.
2. CRM software category with Salesforce, HubSpot, Attio, Pipedrive, and Close.
3. Browser automation category with Browserbase, Stagehand, Playwright, Selenium, and Puppeteer.

## Metrics

- Brand extraction precision.
- Alias recall.
- Source coverage by model.
- Daily job completion rate.
- Time to generate report.
- False movement rate caused by extraction changes.

## Golden Fixtures

Create saved model completions with known brand order:

- Plain prose answer.
- Bulleted ranked list.
- Table answer.
- Answer with source citations.
- Answer with no tracked brands.

The extractor should produce the same rank order every time.

## Failure Modes

- Model UI text gets counted as a brand.
- Alias collision creates false positive mentions.
- Shared upstream hallucination causes cross-model agreement on bad facts.
- Slow model blocks the daily job.
- Source extraction varies by model.

## Launch Gate

Ship when five consecutive daily mock runs and two live runs produce stable reports, all raw completions are auditable, and at least 90% of expected aliases are detected in fixtures.
