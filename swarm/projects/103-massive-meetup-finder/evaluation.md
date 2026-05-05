# Evaluation

## Success Criteria

- Discovers relevant public event calendars for a city/topic pair.
- Correctly classifies calendar URLs versus single-event and user pages.
- Extracts organizer and event details from rendered Markdown.
- Produces explainable recurrence and topic scores.
- Exports a reviewable CSV with source links.

## Test Cases

1. San Francisco + AI agents hackathons.
2. London + AI engineers meetups.
3. New York + climate tech founder events.
4. Berlin + developer tools meetups.
5. Toronto + startup pitch nights.

## Metrics

- Calendar precision.
- Calendar recall against hand-curated fixtures.
- URL classification accuracy.
- Organizer extraction accuracy.
- Contact-confidence calibration.
- Time to first useful result.

## Failure Modes

- Discovery returns one-off events instead of recurring calendars.
- Calendar pages change Markdown structure.
- Organizer profile has no public contact path.
- AI discovery invents a calendar URL.
- Topic score overweights generic terms like AI or startup.

## Review Rubric

For each result, a reviewer should check:

- Is the URL a real recurring calendar?
- Are event counts and organizer names supported by fetched pages?
- Is contact information public and correctly labeled?
- Does the topic score match the event titles/descriptions?
- Would this be useful for a human doing partnership or community outreach?

## Launch Gate

Ship when three city/topic benchmark sets reach at least 80% precision for recurring calendars, all exported rows include source URLs, and low-confidence contact enrichment is never shown as verified.
