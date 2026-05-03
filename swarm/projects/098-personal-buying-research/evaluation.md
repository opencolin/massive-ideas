# Evaluation

Goal: prove Personal Buying Research Assistant helps users make better purchase decisions than a single search, listicle, or chatbot answer by producing current, sourced, use-case-specific shortlists with calibrated caveats.

## Test Set

Use 50 benchmark shopping briefs:

- 8 consumer electronics purchases where specs, reviews, and prices change often.
- 7 appliance or household purchases where reliability and return logistics matter.
- 6 baby, health-adjacent, or safety-sensitive purchases requiring extra caution.
- 6 hobby gear purchases where forums and expert reviews are important.
- 6 budget-constrained purchases with meaningful used, refurbished, or older-model tradeoffs.
- 5 local availability cases where country, city, or device targeting changes the result.
- 4 categories with confusing model variants, bundles, generations, or regional SKUs.
- 4 categories dominated by affiliate SEO pages.
- 4 intentionally underspecified briefs that should ask clarifying questions or return low confidence.

For each brief, create a human-labeled benchmark:

- Expected top product cluster or acceptable shortlist.
- Required must-have and dealbreaker handling.
- Known current prices or price ranges at evaluation time.
- Known model variant traps and discontinued products.
- Required caveats for availability, seller, return policy, warranty, region, or safety.
- Sources that should be trusted, downweighted, or excluded.
- Disallowed overclaims and products that should not be recommended.
- Expected follow-up checks before purchase.

## Baselines

Compare against:

- Single Google-style search summarized from top results.
- Single `ai_chat_completion` answer with web sources.
- A direct retailer search sorted by rating.
- A popular affiliate "best products" article.
- Human researcher first-pass notes after 20 minutes.

The MVP should outperform baselines on source traceability, product fit, variant detection, and caveat quality, even when it recommends fewer products.

## Metrics

Primary metrics:

- Shortlist acceptability: at least 85% of reports include a human-approved top-three option.
- Dealbreaker compliance: at least 98% of recommended products avoid explicit dealbreakers unless clearly flagged as "avoid or verify."
- Claim support: at least 95% of price, availability, spec, warranty, reliability, and performance claims cite a fetched source.
- Variant detection: at least 90% of benchmark model, generation, bundle, or regional SKU traps are flagged.
- Source validity: at least 95% of cited sources are relevant and inspectable.
- Overclaim rate: fewer than 5% of reports present uncertain price, stock, safety, or reliability claims as settled.
- Recommendation calibration: at least 85% of confidence labels match human review.

Secondary metrics:

- Expert, retailer, owner, and official-source diversity per recommendation.
- Duplicate affiliate and syndicated review suppression rate.
- Freshness policy compliance for volatile categories.
- Correct handling of JS-rendered prices, stock widgets, and review sections.
- Correct labeling of captcha-challenged or blocked pages.
- Localized result differences found by country, city, or device.
- Median runtime and cost per shopping brief.
- User-rated usefulness for deciding what to buy, avoid, or verify.

## Manual Review Rubric

Score each report from 1-5:

- Fit: Does the recommendation match the user's actual goal, budget, must-haves, and constraints?
- Evidence: Are claims supported by authoritative and diverse sources?
- Practicality: Does the report help the user decide what to do next?
- Tradeoff clarity: Are strengths and weaknesses specific rather than generic?
- Freshness: Are prices, availability, and reviews current enough for the purchase window?
- Variant safety: Does the report avoid confusing old, regional, bundled, or discontinued models?
- Calibration: Does confidence reflect the evidence quality and conflicts?
- Brevity: Is the shortlist concise enough to act on without hiding important risks?

An output is MVP-acceptable when:

- Average reviewer score is at least 4.
- No recommended product violates a stated dealbreaker without a visible warning.
- Every high-impact claim has a citation.
- The top recommendation includes both reasons to buy and reasons to hesitate.
- The report includes concrete verification steps before purchase.

## Automated Checks

Run after every report:

- JSON schema validation.
- Fit scores are between 0 and 100.
- Every shortlist item has product name, fit score, evidence, tradeoffs, and verification checks.
- Every cited source has URL, source type, query, fetched timestamp, country, city, device, and fetch status.
- Price and availability claims cite retailer, brand, or price-tracking sources.
- Warranty and return claims cite seller, manufacturer, or policy pages.
- Safety-sensitive categories trigger higher-risk caveats and stronger source requirements.
- Products with unresolved dealbreaker conflicts are not marked `best_overall`.
- Discontinued, backordered, or unclear-availability products are capped by scoring rules.
- Affiliate, sponsored, retailer, forum, official, and expert-review sources are labeled separately.
- Duplicate domains, copied listicles, and syndicated reviews are flagged before scoring.
- Captcha or render failures are recorded instead of silently ignored.

## Failure Modes To Track

- Recommending the most SEO-visible product rather than the best fit.
- Treating retailer star ratings as reliable without reading complaint patterns.
- Inventing or stale-reading prices, stock, specs, warranty, or return policy.
- Confusing model years, regional SKUs, bundles, sizes, refurbished units, or accessories.
- Missing local availability because only default-location desktop search was used.
- Overweighting manufacturer claims for subjective performance or reliability.
- Hiding serious owner complaints in a positive summary.
- Recommending unsafe, recalled, counterfeit-risk, or unsupported products without warning.
- Producing a broad catalog instead of a decision-ready shortlist.
- Failing to explain why a cheaper or more popular option was not selected.

## Golden Examples

Create fixtures for:

1. Electronics: volatile price and model-year variants.
2. Appliance: reliability complaints conflict with expert review praise.
3. Baby gear: safety-sensitive purchase requiring extra caveats.
4. Hobby gear: forum consensus beats generic listicles.
5. Budget purchase: refurbished option is good only with warranty verification.
6. Local stock: result differs by country, city, or mobile rendering.
7. Variant trap: similar product names hide major spec differences.
8. Affiliate trap: top SERP pages all recommend the same sponsored product.
9. Discontinued product: old reviews praise a model no longer sold new.
10. Underspecified brief: assistant asks for key constraints before ranking.

Each fixture should include:

- Input buying brief.
- Search query plan.
- SERP snippets and parsed ranks.
- Fetched source excerpts.
- Expected product facts and conflicts.
- Expected shortlist, score ranges, and caveats.
- Sources to exclude or downweight.
- Required verification checks before purchase.

## Launch Criteria

The MVP is ready for pilot users when:

- 50-brief benchmark completes without crashes.
- Shortlist acceptability is at least 85%.
- Dealbreaker compliance is at least 98%.
- Source validity is at least 95%.
- Variant detection is at least 90%.
- Overclaim rate is below 5%.
- Median run cost and runtime are shown before execution and recorded after completion.
- Markdown and JSON reports are readable without manual cleanup.
- At least 80% of pilot users say the assistant made them more confident about what to buy, avoid, or verify.
