# Personal Buying Research Assistant

Idea 98 is a personal buying research assistant for any product category. Given a user goal, budget, constraints, and location, it searches the public web, fetches product pages and reviews, compares tradeoffs, and returns a sourced shortlist with a clear recommendation.

The assistant is built for considered purchases where one search tab is not enough: laptops, strollers, coffee grinders, mattresses, cameras, appliances, outdoor gear, musical equipment, travel accessories, and niche hobby products. It does not buy anything, bypass account walls, invent prices, or pretend affiliate pages are neutral. It helps a person decide what to inspect, compare, and buy with confidence.

## Problem

Consumer buying research is noisy. Search results mix ads, SEO comparison pages, outdated listicles, retailer inventory, forum threads, brand pages, local stock, and review sites with unclear incentives. Buyers often need to answer practical questions: which models fit my use case, what changed this year, what do owners complain about, which sellers have current pricing, and what tradeoff is actually worth paying for?

Personal Buying Research Assistant turns scattered product research into a repeatable brief. It uses Massive MCP to discover current sources, fetch rendered pages, parse Google SERPs, account for country, city, and device differences, and synthesize cited recommendations with source-level caveats.

## Target Users

- Consumers making medium or high-consideration purchases.
- Busy households comparing appliances, baby gear, electronics, and furniture.
- Hobbyists buying specialized gear where forums and expert reviews matter.
- Gift buyers who need strong options without learning a whole category.
- Deal seekers validating whether discounts, availability, and older models are worth it.
- Personal assistants, concierge teams, and researchers preparing buying briefs.

## Core Workflow

1. User enters a product category, use case, budget, location, must-haves, dealbreakers, and tolerance for used, refurbished, or older models.
2. App checks `account_status` and estimates the search, fetch, and AI synthesis budget.
3. App uses `ai_chat_completion` to turn the user brief into category-specific buying criteria and search queries.
4. App runs `web_search` with Google SERP parsing across expert reviews, retailer pages, official product pages, forums, issue searches, and "best for" queries.
5. App uses `web_fetch` with JavaScript rendering and captcha handling to collect current prices, availability, specs, review text, owner complaints, return policies, and warranty pages.
6. App repeats selected queries with country, city, and device targeting to detect local stock, mobile-only pages, localized prices, and regional model differences.
7. App uses `ai_chat_completion` to extract product facts, normalize models, deduplicate variants, score fit, identify evidence conflicts, and write a sourced recommendation.
8. User receives a ranked shortlist, comparison matrix, "buy now or wait" advice, risks to verify, and links to the evidence trail.

## MVP Inputs

```json
{
  "shopping_brief": {
    "category": "espresso grinder",
    "buyer_goal": "Quiet grinder for a small apartment, mostly milk drinks, occasional straight espresso.",
    "budget": {
      "min": 200,
      "max": 600,
      "currency": "USD"
    },
    "location": {
      "country": "us",
      "city": "Portland",
      "device": "mobile"
    },
    "must_haves": ["low retention", "not too loud", "available new"],
    "nice_to_haves": ["single dose workflow", "easy cleaning"],
    "dealbreakers": ["large footprint", "known reliability issues"],
    "purchase_window_days": 14
  },
  "research_policy": {
    "max_products": 12,
    "max_sources_per_product": 8,
    "include_forums": true,
    "include_retailers": true,
    "include_video_transcripts": false,
    "prefer_recent_reviews_days": 730
  }
}
```

## MVP Output

```json
{
  "run_id": "personal-buying-research-2026-05-02",
  "category": "espresso grinder",
  "summary": "Three grinders fit the apartment and milk-drink brief. The strongest recommendation is Product A because it balances quiet operation, espresso capability, small footprint, and current availability within budget.",
  "recommendation": {
    "best_overall": "Product A",
    "best_value": "Product B",
    "avoid_or_verify": ["Product C"],
    "buy_now_or_wait": "Buy now if Product A is under $499; otherwise wait for a recurring sale or consider Product B."
  },
  "shortlist": [
    {
      "product": "Product A",
      "fit_score": 88,
      "estimated_price": "$449-$499",
      "availability": "in_stock_public_sources",
      "why_it_fits": ["Quiet compared with common alternatives", "Small footprint", "Good espresso workflow"],
      "tradeoffs": ["More expensive than entry-level options", "Limited color availability"],
      "evidence": [
        {
          "url": "https://example.com/product-a-review",
          "source_type": "expert_review",
          "claim": "Reviewer measured lower noise than comparable grinders.",
          "fetched_at": "2026-05-02T19:00:00Z"
        }
      ],
      "verify_before_buying": ["Confirm return window", "Check whether the listed burr version matches the current model"]
    }
  ],
  "comparison_matrix": [
    {
      "product": "Product A",
      "price": "$449-$499",
      "fit": "best_overall",
      "noise": "strong",
      "size": "strong",
      "reliability_signal": "medium",
      "source_confidence": "high"
    }
  ],
  "source_summary": {
    "search_queries": 14,
    "fetched_pages": 32,
    "expert_reviews": 8,
    "retailer_pages": 10,
    "forum_threads": 7,
    "official_pages": 4,
    "conflicts_found": 3
  }
}
```

## Product Signals

- `fit_to_use_case`: product strengths match the user's stated use, household, skill level, and constraints.
- `current_price`: fetched retailer or brand page shows a current visible price or range.
- `availability`: product appears in stock, backordered, discontinued, local-only, or unclear.
- `expert_support`: credible review, teardown, lab test, or category guide supports the product.
- `owner_signal`: forums, retail reviews, and long-term updates reveal common praise or complaints.
- `model_variant_risk`: names, generations, bundles, regional SKUs, or year variants are easy to confuse.
- `deal_quality`: sale price appears meaningfully better than recent public pricing or common list price.
- `return_warranty_risk`: seller, return policy, warranty, or refurbished status changes the recommendation.
- `source_conflict`: price, specs, availability, or review conclusions disagree across sources.

## Massive MCP Fit

- `web_search`: discover current product candidates, reviews, retailer pages, forum discussions, alternatives, and complaints.
- Google SERP parsing: preserve query, rank, snippet, date, shopping-intent wording, and source diversity.
- `web_fetch`: fetch official pages, retailer listings, expert reviews, forums, policy pages, and rendered product pages.
- JavaScript rendering: inspect dynamic price, stock, specs, review sections, and comparison tables.
- Captcha handling: label retailer or review pages that challenge automated fetches instead of treating them as missing evidence.
- Country, city, and device targeting: catch regional model names, local stock, localized prices, and mobile shopping page differences.
- `ai_chat_completion`: generate buying criteria, extract product facts, cluster variants, compare tradeoffs, summarize sources, and write recommendations with caveats.
- `account_status`: preflight quota and keep broad shopping runs within budget.

## Guardrails

- Do not complete purchases, enter payment data, create accounts, or impersonate the buyer.
- Cite a source for every price, availability, warranty, reliability, and performance claim.
- Label affiliate, sponsored, retailer, manufacturer, forum, and expert-review sources separately.
- Do not rank products only by SEO listicle frequency.
- Preserve source URL, query, SERP rank, fetch timestamp, country, city, device, and fetch status.
- Flag stale reviews, discontinued products, ambiguous model variants, and region-specific availability.
- Treat medical, safety, legal, financial, and child-safety purchases as higher risk and require stronger primary or expert sources.
- Present recommendations as decision support, not guaranteed product quality or professional advice.
