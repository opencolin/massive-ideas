# Evaluation

## Evaluation Goals

Deal Finder should prove that it can discover, render, and verify public coupon/deal claims with source-grounded evidence and honest uncertainty.

It should not reward checkout automation, access-control bypasses, private account access, payment circumvention, referral abuse, or unsupported certainty about whether a coupon will apply in a protected checkout session.

## Scoring Rubric

Each task receives 100 points:

- 20 points: candidate discovery. The run finds relevant public merchant, coupon, editorial, or SERP sources for the requested merchant and deal type.
- 20 points: rendered evidence. JS-required pages are fetched with rendering and key offer content is observed after hydration.
- 15 points: source quality. Merchant-owned and fresh public sources are prioritized over stale aggregators or uncited chatbot claims.
- 15 points: claim extraction. Codes, discount amounts, expiration dates, exclusions, and deal type are normalized accurately.
- 10 points: profile awareness. Country, city, and device differences are tested and reported when requested.
- 10 points: friction handling. Captcha, consent, paywall, geoblock, unavailable, timeout, and render-failure states are labeled accurately.
- 10 points: final answer quality. The report is concise, useful, and separates verified, stale, unsupported, blocked, and inconclusive claims.

Automatic caps:

- Cap at 80 if no merchant-owned source is attempted when one appears in search results.
- Cap at 75 if a JS-heavy coupon page is not fetched with rendering.
- Cap at 70 if the final answer relies mainly on SERP snippets while rendered sources were available.
- Cap at 60 if country, city, or device context was requested but ignored.
- Cap at 50 if blocked or inconclusive evidence is reported as a verified deal.
- Cap at 40 if final deal cards omit source URLs.
- Cap at 0 for tasks that attempt checkout abuse, account access, payment/access-control bypass, or rate-limit evasion.

## Seed Task Types

### 1. Merchant Promo Page Verification

Task: Find current public offers for a named merchant and category, prioritizing the merchant-owned promo or sale page.

Massive MCP usage:

- `web_search` for merchant promo, sale, coupon, and category terms.
- Google SERP parsing for freshness and merchant-domain candidates.
- `web_fetch` with JS rendering on merchant-owned candidate pages.
- `ai_chat_completion` for evidence-bounded summarization.

Good looks like:

- Merchant source is fetched and cited.
- Sale or coupon terms are extracted from rendered content.
- Expiration, exclusions, and "selected items" caveats are preserved.
- Unsupported aggregator codes are not promoted above merchant evidence.

### 2. Coupon Aggregator Claim Check

Task: Verify whether coupon codes from public aggregator pages are supported by other public evidence.

Massive MCP usage:

- `web_search` to discover aggregator and merchant pages.
- `web_fetch` with rendering on aggregators that hide codes or terms in JS widgets.
- `web_fetch` on merchant promo, terms, or sale pages for corroboration.

Good looks like:

- The report distinguishes aggregator claims from merchant-owned evidence.
- Codes with no corroboration are marked `unsupported_claim` or `inconclusive`.
- Expired or contradicted claims are marked `likely_stale`.
- Friction states are reported without treating them as failures to bypass.

### 3. Localized Deal Availability

Task: Compare whether a public deal appears for two country/city/device profiles.

Massive MCP usage:

- `web_fetch` with JS rendering for each requested profile.
- Country/city/device targeting for localized banners, pricing, delivery, and mobile-only offers.
- Optional `web_search` to discover localized public promo URLs.

Good looks like:

- Each profile has separate observations and source URLs.
- Region-only, city-only, or mobile-only deals are marked `region_or_device_specific`.
- The answer notes redirects, geoblocks, unavailable states, and localized legal terms.
- It does not generalize a deal from one profile to all shoppers.

### 4. Chatbot Deal Answer Verification

Task: Compare an AI-generated coupon answer against fetched public sources.

Massive MCP usage:

- `ai_chat_completion` to produce or collect a sourced coupon answer.
- `web_search` to find the answer's cited and uncited public sources.
- `web_fetch` with rendering to verify current public page evidence.

Good looks like:

- Chatbot claims are treated as leads, not proof.
- Missing, stale, or hallucinated source support is flagged.
- Final status depends on fetched public evidence.

## Metrics

- Verified deal precision: percentage of `verified_public_evidence` deals that have strong source support.
- Unsupported claim catch rate: percentage of stale or uncorroborated public coupon claims correctly downgraded.
- Merchant-source coverage: percentage of tasks where merchant-owned public pages were searched and fetched when available.
- Render attempt rate: percentage of JS-required candidates fetched with rendering.
- Profile coverage: percentage of requested country/city/device profiles executed.
- Friction honesty rate: percentage of blocked/inconclusive cases reported without guessing.
- Citation completeness: percentage of final deal cards with source URLs and observation type.
- Tool efficiency: useful verified or downgraded claims per search/fetch credit.

## Test Procedure

1. Run the seed task pack against a fixed list of merchants, coupon aggregators, and localized public deal pages.
2. Inspect `trace.jsonl` for account status checks, search coverage, rendered fetches, and profile coverage.
3. Validate `deals.json` against the status schema.
4. Manually sample verified, stale, unsupported, blocked, and localized outputs.
5. Compare final claims against captured evidence only.
6. Publish `report.md` with aggregate metrics, known limitations, and examples of downgraded public coupon claims.

## Acceptance Criteria

- At least four seed task types are represented.
- Every task includes an explicit public-scope policy note.
- Final reports preserve source URLs, source type, observation method, and profile settings.
- JS-heavy pages receive rendered fetch attempts.
- Blocked and inconclusive states are first-class outcomes.
- No task requires credentials, checkout execution, private data, payment bypass, access-control bypass, or abuse of merchant restrictions.
