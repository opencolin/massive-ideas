# Evaluation

MCP Demo App should prove that a user can understand the difference between `web_fetch`, `web_search`, and `ai_chat_completion` in one short run. Evaluation focuses on clarity, source preservation, side-by-side comparability, and whether the app teaches the right next MCP call.

## Success Criteria

- A first-time user can run the demo with a question, URL, query, country, city, and device in under two minutes.
- All three panels preserve their own request parameters, status, latency, and source metadata.
- Fetch, search, and chat outputs are visibly distinct while sharing normalized source and claim structures.
- The comparison summary identifies at least one overlap, one difference, and one recommended next call.
- Chat claims are not presented as verified unless citations or fetched/search evidence support them.
- Blocked, captcha, JS-rendered, redirected, stale, or partial outputs are labeled clearly.

## Golden Test Fixtures

Use fixed fixtures before live API regression tests:

1. Official SaaS homepage
   - Question: "What does Linear offer for product teams?"
   - Fetch URL: `https://linear.app/`
   - Search query: `Linear product management software`
   - Expected: fetch and chat include official claims; search includes official and third-party domains.
2. Local intent query
   - Question: "What are good payroll providers for restaurants in Austin?"
   - Fetch URL: a known vendor page
   - Search query: `restaurant payroll provider Austin`
   - Target: US, Austin, mobile
   - Expected: search panel reflects local targeting; chat cites sources; fetch remains first-party.
3. JS-dependent page
   - Question: "What pricing tiers are visible on this pricing page?"
   - Fetch URL: a page requiring JS rendering
   - Search query: matching pricing query
   - Expected: fetch render mode is visible and extracted content differs from non-rendered fixture.
4. Blocked or captcha page
   - Question: "What does this page say about plans?"
   - Fetch URL: a known protected page
   - Search query: equivalent public query
   - Expected: fetch panel marks captcha or blocked status without failing the full report.

## Metrics

Track per run:

- `run_completion_rate`: percent of runs where at least two panels complete.
- `all_panel_completion_rate`: percent of runs where fetch, search, and chat all complete.
- `median_total_latency_ms`: time from run click to full report.
- `panel_latency_ms`: latency per MCP tool.
- `source_overlap_rate`: percent of chat citations that also appear in fetch or search outputs.
- `unsupported_chat_claim_count`: count of chat claims lacking citations or corroborating evidence.
- `blocked_fetch_rate`: percent of fetches with blocked, captcha, or failed status.
- `serp_parse_success_rate`: percent of search runs with parsed Google SERP features.
- `next_call_acceptance_rate`: percent of users who run the recommended next call.

## Quality Rubric

Score each demo report from 1 to 5:

- 5: The report cleanly explains what each tool observed, preserves sources, labels uncertainty, and recommends a useful next call.
- 4: The report is accurate and source-backed, with minor gaps in explanation or overlap detection.
- 3: The report is usable, but one panel lacks enough structure or the recommendation is generic.
- 2: The report mixes evidence types, hides partial failures, or overstates chatbot claims.
- 1: The report fails to compare tools or loses source lineage.

## Regression Checks

- `account_status` is called before any paid tool call.
- The same country, city, and device are passed to fetch, search, and chat.
- `web_fetch` stores requested URL and final URL separately.
- `web_search` preserves rank, title, URL, domain, snippet, and SERP feature.
- `ai_chat_completion` preserves answer excerpt, source URLs, and citation coverage.
- Source overlap uses normalized URLs but keeps original URLs in panel output.
- A failed panel does not erase completed panel results.
- Exported JSON validates against the `DemoReport` shape in `prototype.md`.

## Manual QA Script

1. Run the Linear fixture on desktop targeting San Francisco.
2. Confirm the account status and credit estimate appear before the run starts.
3. Confirm the fetch panel shows render and captcha states.
4. Confirm the search panel shows ranked results and parsed SERP features.
5. Confirm the chat panel shows citations and unsupported claim count.
6. Confirm the bottom comparison names an overlap and a concrete difference between tools.
7. Export JSON and verify it includes `run_id`, `target_key`, all three panels, and `comparison.source_overlap`.
8. Repeat on mobile targeting London and confirm target metadata changes in every panel.

## Risks

- Chat output may sound more authoritative than the evidence supports.
- SERP results may vary by time, location, and device, making screenshots harder to compare.
- Captcha handling can make live demos look slow or inconsistent.
- URL normalization can collapse distinct pages if query parameters matter.
- Cost estimates can drift if MCP tool pricing changes.

## Open Questions

- Should the app include saved sample fixtures for offline demos?
- Should chat be grounded only in fetched and searched sources, or also allowed to use its own source retrieval?
- Should the recommended next call be rule-based for predictability or AI-generated for richer guidance?
- Should screenshots be enabled by default for visual demos, or kept off to minimize cost and latency?
