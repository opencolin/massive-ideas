# Account Research Bot

Build a pre-call account brief from a company website, current news, Google search results, and sourced chatbot synthesis. The MVP is a sales-research assistant for AEs, founders, and customer-success teams who need a credible 5-minute prep doc before talking to a target account.

## User Workflow

1. User enters a company name, website URL, target persona, and optional product positioning.
2. Bot checks `account_status` so the UI can warn when the requested research depth may exceed available credits.
3. Bot uses `web_fetch` on the company homepage and likely high-signal pages such as `/pricing`, `/customers`, `/careers`, `/about`, `/blog`, and `/docs`.
4. Bot uses `web_search` for news, recent company mentions, leadership, competitors, funding, partnerships, and current hiring or product signals.
5. Bot asks `ai_chat_completion` to synthesize a cited brief from the fetched/search evidence only.
6. User receives a concise pre-call brief with citations, confidence levels, and suggested discovery questions.

## MVP Output

The first usable version should produce a markdown or JSON brief with these sections:

- Account snapshot: one-paragraph company summary, industry, likely ICP, headquarters, and employee-size estimate when available.
- What they sell: products, audiences, pricing clues, positioning, and customer proof.
- Recent triggers: launches, funding, hiring, partnerships, outages, regulation, expansion, or leadership changes.
- Likely pains: 3-5 hypotheses tied to evidence from site/news/search.
- Conversation hooks: 3 personalized openers with source links.
- Discovery questions: 6-8 questions mapped to the target persona.
- Risk flags: stale sources, unclear identity, no recent news, conflicting claims, or pages blocked by rendering/captcha.
- Source table: title, URL, source type, extracted facts, and confidence.

## Massive Tools Used

- `account_status`: estimate whether to run fast, standard, or deep research.
- `web_fetch`: fetch rendered pages from company site, including JS-heavy pages; use device targeting for mobile-only pages if needed.
- `web_search`: Google SERP parsing for recent news, official pages, third-party profiles, reviews, and People Also Ask.
- `ai_chat_completion`: synthesize the final brief with citations and enforce "no source, no claim."

## MVP Scope

Keep the first build intentionally small:

- Inputs: `company_name`, `website_url`, `target_persona`, `seller_context`.
- Research depth: homepage plus up to 5 discovered official pages, 10 search results, and 1 chatbot synthesis call.
- Output: single markdown brief and machine-readable JSON payload.
- Storage: none required for MVP; persist runs later.
- UI: one form, one progress log, one brief preview, one export button.

## Next Implementation Steps

1. Implement a `researchAccount(input)` function that orchestrates status check, fetches, searches, synthesis, and final validation.
2. Add page discovery from homepage links and SERP results, prioritizing official domain pages before third-party pages.
3. Add a citation validator that rejects any brief bullet without a source URL.
4. Add a small UI with depth selection: fast, standard, deep.
5. Add run logs so users can inspect exact Massive calls and skipped pages.
6. Add cache keys by URL and query to avoid refetching repeated sources during a single brief.

