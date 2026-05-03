# Evaluation

Massive MCP Playground should prove that developers can understand and reuse exact MCP tool calls while preserving every returned source. Evaluation focuses on transparency, reproducibility, source lineage, and whether exported examples match the observed run.

## Success Criteria

- A developer can run a `web_fetch`, `web_search`, or `ai_chat_completion` preset in under two minutes.
- The UI displays the exact MCP payload before each call is executed.
- Raw responses are preserved and can be inspected without renamed fields.
- Every normalized source row links back to a `response_path` in the raw response.
- `web_search` sources preserve rank, URL, title, snippet, domain, SERP feature, and target metadata.
- `web_fetch` sources preserve original URL, final URL, title, render setting, captcha status, and fetched timestamp.
- `ai_chat_completion` sources preserve citation index, source URL, title or excerpt, and answer association.
- Partial failures do not hide successful calls or source rows.
- Exported code snippets reproduce the same payloads shown in the call preview.

## Golden Test Fixtures

1. `account_status` preflight
   - Call: `account_status`
   - Expected: account panel shows status, credits or quota metadata, and no source rows.
2. JS-rendered fetch
   - Call: `web_fetch` on a modern SaaS homepage with `render_js: true`
   - Expected: exact call preview includes render and captcha options; response has a fetched page source with original and final URLs.
3. Localized Google SERP
   - Call: `web_search` with `parse_google_serp: true`, country US, city Austin, mobile device
   - Expected: source table includes ranked SERP results with snippets and target metadata.
4. Sourced chatbot answer
   - Call: `ai_chat_completion` with `answer_with_sources: true`
   - Expected: citations appear as source rows with citation indexes and raw response paths.
5. Combined source tracing
   - Calls: fetch a homepage, search for the same product, ask chat for a sourced summary
   - Expected: source overlap groups URLs found by multiple tools.
6. Blocked fetch
   - Call: `web_fetch` on a page likely to redirect, block, or require captcha
   - Expected: run status is partial or blocked, raw error details are visible, and completed calls remain available.

## Metrics

- `payload_preview_accuracy`: percent of executed calls exactly matching the displayed preview.
- `source_extraction_coverage`: percent of returned URLs represented in the normalized source table.
- `source_response_path_validity`: percent of source rows with a valid raw response path.
- `snippet_replay_success_rate`: percent of generated snippets that reproduce the same payload shape.
- `partial_run_recovery_rate`: percent of runs where successful calls remain usable after one call fails.
- `median_time_to_first_successful_call_ms`: time from opening the playground to first successful response.
- `raw_response_view_open_rate`: percent of runs where users inspect raw JSON.
- `source_export_usage_rate`: percent of completed runs exporting JSON, CSV, or code snippets.

## Quality Rubric

Score each run from 1 to 5:

- 5: Exact calls, raw responses, normalized sources, and code snippets all agree; every source has provenance.
- 4: Calls and sources are clear, with only minor missing metadata such as optional titles or snippets.
- 3: Playground is usable, but source rows or snippets require manual cleanup before reuse.
- 2: Raw response and normalized source table disagree, or partial failures obscure useful output.
- 1: The playground hides exact calls, loses sources, or cannot reproduce the executed payload.

## Regression Checks

- `account_status` can be run alone and before paid tools.
- Redaction removes secrets from saved exports without changing executable request fields.
- Exact call preview and stored execution payload are byte-for-byte equivalent after canonical JSON formatting.
- A failed execution stores `status`, `error.code`, `error.message`, and `retryable`.
- Source rows include `tool`, `execution_id`, `response_path`, `url`, and `source_kind`.
- URL normalization groups overlap but never deletes `original_url` or `final_url`.
- Search rank order is stable in the source table and CSV export.
- Chat citation indexes match the raw response citation order.
- Country, city, and device targeting are visible in call preview, execution metadata, and source rows.
- Generated TypeScript and Python snippets use the exact displayed payload.

## Manual QA Script

1. Open the fetch preset and confirm the call preview shows `web_fetch` with `render_js`, `handle_captcha`, country, city, and device.
2. Run the call and inspect raw JSON.
3. Confirm the source table has a fetched page row with original URL, final URL, title, and response path.
4. Open the search preset and run a localized mobile Google SERP query.
5. Confirm ranked sources include URL, domain, title, snippet, rank, and target metadata.
6. Open the chat preset and run a sourced answer prompt.
7. Confirm citations appear in both the raw response and normalized source table.
8. Export `run.json`, `sources.csv`, and `snippet.ts`.
9. Replay the snippet and confirm the payload matches the original execution.
10. Run the combined preset and verify overlap shows any URL found by more than one tool.

## Risks

- Response schemas may evolve, making source extraction brittle without fixture coverage.
- Over-normalizing URLs could hide meaningful query parameters or localized paths.
- Users may copy raw responses containing private prompts or account metadata.
- SERP and captcha behavior can vary by region, device, and time.
- Generated snippets may imply SDK methods that differ from a user's installed client version.

## Open Questions

- Should the playground support mock mode for offline demos?
- Should raw responses be stored locally only, or optionally shared as team fixtures?
- Should the UI include JSON Schema validation for each MCP tool payload?
- Should source extraction be rule-based only, or assisted by `ai_chat_completion` for unknown response shapes?
- Should replay compare exact raw responses or only payload shape, status, and source lineage?
