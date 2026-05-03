# Deal Finder

Idea 91 in the Massive MCP rolling swarm: a public coupon and deal verification assistant that searches for offer pages, fetches rendered coupon details, and verifies whether a deal appears current and usable from public evidence.

## Problem

Coupon search is noisy. Search results, affiliate pages, store promo pages, and chatbot answers often repeat expired, region-specific, or unsupported codes. Shoppers and commerce teams need a fast way to distinguish public deals that appear valid from stale claims without attempting checkout circumvention, account access, or protected-payment bypasses.

Many coupon pages are also JavaScript-heavy. Codes, expiration dates, merchant exclusions, store-specific banners, and "verified today" labels may load after hydration, behind consent dialogs, or differently by country, city, or device.

## Product

Deal Finder searches the public web for coupon and deal pages, fetches candidate pages with rendering, extracts offer claims, and assigns each deal a verification status with cited evidence.

The product is framed as public coupon/deal verification. It does not bypass payment flows, defeat access controls, scrape private accounts, automate checkout abuse, evade merchant limits, or claim that a coupon works unless public evidence supports that conclusion.

## Target Users

- Shoppers who want source-backed public coupons before trying a purchase.
- Deal editorial teams checking whether listed offers are stale or unsupported.
- Ecommerce and affiliate operators monitoring public coupon quality for their brand.
- Consumer research teams comparing advertised discounts across regions or devices.

## Core Workflow

1. User enters a merchant, product category, optional location/device profile, and optional deal type such as promo code, sale, free shipping, or student discount.
2. Runner checks `account_status` and estimates search/fetch budget.
3. Runner calls `web_search` for public coupon, merchant promo, and deal-result candidates.
4. Google SERP parsing captures result titles, snippets, visible dates, and source domains.
5. Runner calls `web_fetch` with JavaScript rendering on high-confidence public candidates.
6. Captcha, consent, unavailable, paywall, or geoblock states are recorded as friction outcomes, not bypass objectives.
7. Extracted deal claims are normalized into a comparable offer table.
8. `ai_chat_completion` synthesizes a source-grounded answer from captured evidence only.
9. Final report ranks deals as verified public evidence, likely stale, region/device-specific, unsupported, blocked, or inconclusive.

## Massive MCP Tools Used

- `web_search`: discover merchant promo pages, public coupon aggregators, news/deal posts, and SERP-visible offer claims.
- Google SERP parsing: preserve titles, snippets, dates, sitelinks, and public result context.
- `web_fetch`: fetch raw and rendered public pages for offer text, code visibility, expiration dates, exclusions, and merchant terms.
- JS rendering: observe hydrated coupon widgets, modal-gated public content, client-side offer lists, and mobile-only sale banners.
- Captcha handling: classify page friction honestly without treating challenge-solving as a success metric.
- Country/city/device targeting: detect localized pricing, regional availability, mobile app banners, and device-specific offers.
- `ai_chat_completion`: summarize evidence, reconcile conflicts, and produce a final deal card with citations.
- `account_status`: budget runs and fail gracefully when credits are low.

## Deal Statuses

- `verified_public_evidence`: public rendered or merchant evidence supports that the deal is current.
- `likely_stale`: public evidence suggests the coupon is expired, removed, or contradicted by fresher sources.
- `unsupported_claim`: search snippets or chatbot answers mention a deal, but fetched public pages do not support it.
- `region_or_device_specific`: the deal appears only under certain country, city, or device profiles.
- `blocked`: a public page could not be observed due to captcha, consent, paywall, geoblock, or unavailable state.
- `inconclusive`: evidence is insufficient or contradictory.

## MVP Scope

The MVP is a CLI-style research prototype and evidence format. It accepts a merchant/category query, searches for public deal pages, renders candidate pages, extracts offer claims, and exports a Markdown/JSON verification report.

Out of scope: account-specific discounts, checkout automation, private loyalty offers, payment bypasses, vulnerability testing, rate-limit evasion, or any behavior intended to avoid merchant controls.

## Next Implementation Steps

- Define the deal query schema and verification report schema.
- Build source selection rules for merchant-owned pages versus coupon aggregators.
- Implement rendered page extraction for common offer fields.
- Add conflict detection for expiration dates, code strings, exclusions, and region/device differences.
- Create seed evaluation tasks across merchant promo pages, coupon aggregators, and localized public offers.
