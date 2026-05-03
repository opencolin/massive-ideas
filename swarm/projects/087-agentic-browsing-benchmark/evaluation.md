# Evaluation

## Evaluation Goals

The benchmark should measure whether an agent can conduct public research on JS-heavy websites with reliable rendered-page observation, source grounding, and honest handling of access friction.

It should not reward security testing behavior, private data access, captcha bypass as an objective, or unsupported claims from pages the agent did not observe.

## Scoring Rubric

Each task receives 100 points:

- 20 points: render fidelity. The agent used rendered page evidence when the task required JavaScript.
- 15 points: navigation. The agent followed necessary public links, tabs, filters, pagination, or client-side routes.
- 20 points: evidence grounding. Key claims cite fetched or searched public sources, with rendered evidence preferred.
- 15 points: localization and device awareness. The agent respected requested country, city, and device profiles.
- 10 points: friction handling. Captcha, consent, paywall, geoblock, or unavailable states were labeled accurately.
- 10 points: answer contract. Output matches the required schema and includes all required fields.
- 10 points: answer quality. The final response is concise, correct, and useful.

Automatic caps:

- Cap at 80 if no rendered fetch was attempted on a task marked `requires_js`.
- Cap at 70 if the answer cites only SERP or chatbot summaries when page fetches were available.
- Cap at 60 if localization or device context was ignored on a profile-sensitive task.
- Cap at 50 if the agent treats a blocked or inconclusive page as a definitive content answer.
- Cap at 40 if sources are missing.

## Realistic Example Tasks

### 1. JS Ecommerce Filter Check

Task: Starting from a public category URL, determine whether a filtered product set has in-stock results on mobile in the United States.

Massive MCP usage:

- `web_fetch` with JS rendering and mobile device targeting.
- Optional `web_search` if the category URL is discovered from a query.
- `ai_chat_completion` to summarize evidence only after rendered observations are captured.

Good looks like:

- The agent observes a rendered product grid, empty state, or loading failure.
- The answer distinguishes raw category copy from post-filter rendered results.
- The cited URL supports the availability conclusion.
- If a consent modal or challenge prevents observation, the result is marked blocked or inconclusive.

### 2. Localized Public Service Page

Task: Compare whether a public service page shows the same eligibility, hours, or availability information from two city profiles.

Massive MCP usage:

- `web_fetch` with JS rendering for each country/city/device profile.
- `web_search` for supporting public source discovery when the start point is a query.
- Google SERP parsing to record the search-facing title/snippet if relevant.

Good looks like:

- The agent produces separate observations for each profile.
- It cites the rendered page or relevant public result for each claim.
- It calls out redirects, city-specific banners, unavailable pages, or profile-specific content.
- It avoids collapsing localized differences into one generic answer.

### 3. Documentation Client Route Research

Task: Starting from a public docs landing page, find the current public instructions for a feature that is loaded through client-side docs navigation.

Massive MCP usage:

- `web_fetch` with JS rendering on the docs landing page and final route.
- `web_search` when internal navigation does not expose a direct route.
- `ai_chat_completion` to produce a source-grounded concise answer.

Good looks like:

- The agent reaches the client-side route or equivalent rendered documentation page.
- It cites the final docs URL and does not rely only on stale search snippets.
- It notes when the docs app renders a shell but the relevant content fails to load.
- The answer separates observed instructions from inferred next steps.

## Metrics

- Task pass rate: percentage of tasks with score 75 or higher.
- Render attempt rate: percentage of JS-required tasks with at least one rendered `web_fetch`.
- Rendered citation rate: percentage of answer-critical claims backed by rendered fetches.
- Source diversity: average number of relevant public source URLs per task.
- Blocked honesty rate: percentage of access-friction cases labeled blocked or inconclusive instead of guessed.
- Profile coverage: percentage of required country/city/device profiles actually executed.
- Tool efficiency: score per tool call and score per credit estimate.

## Test Procedure

1. Run the benchmark pack with the reference Massive MCP agent.
2. Inspect `trace.jsonl` for required tool usage and profile coverage.
3. Review `run.json` for schema validity and automatic caps.
4. Sample at least one passing, failing, and blocked task manually.
5. Compare final answers against captured evidence only.
6. Publish `report.md` with aggregate metrics, examples, and known limitations.

## Acceptance Criteria

- At least three task categories are represented in the seed pack.
- Every task includes an explicit public-scope policy note.
- JS-required tasks verify that rendered fetches were attempted.
- Reports preserve source URLs and profile settings.
- Blocked, inconclusive, and unavailable states are first-class outcomes.
- No task requires credentials, private data, vulnerability probing, or security testing.
