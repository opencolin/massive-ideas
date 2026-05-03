# Internet Consensus Checker

Idea 85 is an "ask the internet twice" research tool. Given a factual question, product claim, market belief, or buying assumption, it runs two independent web research passes through Massive MCP, compares the answers, and returns a sourced consensus report with agreement level, dissenting evidence, freshness, and confidence.

The product is for people who need a fast but skeptical read on public internet consensus. It does not try to declare absolute truth. It shows what reputable public sources currently appear to agree on, where they disagree, and which claims still need human review.

## Problem

Search and chatbot answers often feel authoritative after one pass. That is risky for questions where source freshness, geography, search phrasing, SEO bias, or forum repetition can change the answer. A founder asking "Is this market growing?", a buyer asking "Does this vendor support SSO?", or an analyst asking "Is this regulation in force?" needs more than one polished response.

Internet Consensus Checker makes the second look automatic. It asks the web from two angles, captures the source trails for both, and highlights claims that survive independent discovery.

## Target Users

- Founders validating market, customer, competitor, or product assumptions.
- Analysts checking current public consensus before writing briefs.
- Operators verifying vendor, policy, compliance, or pricing claims.
- Journalists and researchers looking for fast disagreement maps.
- Product marketers testing whether positioning claims are supported publicly.
- Sales and customer success teams checking prospect or account claims.

## Core Workflow

1. User enters a question, claim, or assumption to verify.
2. User chooses geography, city, device, source preferences, and risk level.
3. App checks `account_status` and estimates the search, fetch, and chat budget.
4. First research pass uses `web_search` and `web_fetch` to answer the question directly.
5. Second research pass reformulates the question into adversarial, alternate, and source-specific queries.
6. Massive MCP fetches public sources with JavaScript rendering, captcha handling, Google SERP parsing, and region or device targeting as needed.
7. `ai_chat_completion` extracts claims from each pass, clusters equivalent claims, scores source quality, and identifies agreement, conflict, or uncertainty.
8. User receives a consensus report with answer, agreement score, source map, dissenting claims, confidence, and recommended follow-up searches.

## MVP Inputs

```json
{
  "question": "Do modern data warehouses typically support native vector search?",
  "context": "Market research for an AI analytics product roadmap.",
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "research_policy": {
    "freshness_days": 365,
    "max_sources_per_pass": 12,
    "prefer_primary_sources": true,
    "include_forums": false,
    "include_news": true,
    "include_vendor_docs": true
  },
  "risk_level": "medium",
  "output": {
    "include_source_log": true,
    "include_query_log": true,
    "include_follow_up_questions": true
  }
}
```

## MVP Output

```json
{
  "run_id": "internet-consensus-checker-2026-05-02",
  "question": "Do modern data warehouses typically support native vector search?",
  "short_answer": "Consensus is partial: several major warehouses now offer vector search or vector similarity features, but support is uneven and often tied to specific editions, previews, or adjacent services.",
  "consensus": {
    "level": "mixed",
    "score": 0.68,
    "confidence": "medium",
    "freshness": "recent_public_sources_found",
    "needs_human_review": true
  },
  "agreed_claims": [
    {
      "claim": "Vector search support is increasingly common among major cloud data platforms.",
      "supporting_sources": [
        {
          "url": "https://example.com/vendor-docs/vector-search",
          "source_type": "official_docs",
          "pass": "direct",
          "fetched_at": "2026-05-02T12:00:00Z"
        }
      ],
      "confidence": "medium"
    }
  ],
  "disputed_claims": [
    {
      "claim": "Native support is universal across modern warehouses.",
      "status": "overstated",
      "reason": "Second-pass sources show feature availability varies by vendor, region, and release stage.",
      "evidence": [
        {
          "url": "https://example.com/release-notes/vector-preview",
          "source_type": "release_notes",
          "pass": "challenge"
        }
      ]
    }
  ],
  "source_summary": {
    "direct_pass_sources": 10,
    "challenge_pass_sources": 11,
    "primary_sources": 8,
    "third_party_sources": 13,
    "conflicts_found": 2
  },
  "recommended_follow_ups": [
    "Check each named warehouse vendor separately for GA versus preview status.",
    "Run a country-specific pass if product availability matters outside the United States."
  ]
}
```

## Consensus Levels

- `strong`: independent passes produce the same core answer from high-quality sources.
- `moderate`: core answer agrees, but important details vary by source, date, region, or wording.
- `mixed`: both agreement and credible dissent appear; use the output as a decision aid, not a conclusion.
- `weak`: sources are sparse, stale, low-authority, or mostly repeat the same unsourced claim.
- `conflict`: high-quality sources disagree on the answer or scope.
- `unknown`: the public web evidence is insufficient for a responsible answer.

## Massive MCP Fit

- `account_status`: quota preflight and feature availability checks.
- `web_search`: independent direct and challenge-pass source discovery.
- Google SERP parsing: preserve query wording, rank, snippet, URL, and source diversity.
- `web_fetch`: fetch official docs, news, articles, forums, public reports, pricing pages, and rendered pages.
- JavaScript rendering: handle docs portals, dynamic help centers, modern news sites, and vendor pages.
- Captcha handling: recover public pages that block scripted access and label unresolved challenges.
- Country, city, and device targeting: detect localized results, mobile variants, and region-specific claims.
- `ai_chat_completion`: reformulate queries, extract claims, cluster evidence, compare passes, summarize consensus, and produce caveats.

## Guardrails

- Never present internet consensus as verified truth.
- Require citations for every agreed, disputed, or high-confidence claim.
- Keep direct-pass and challenge-pass sources separately traceable.
- Do not count duplicate syndications or copied snippets as independent agreement.
- Prefer primary sources for legal, medical, technical, pricing, and product capability claims.
- Flag stale sources when freshness matters.
- Preserve query, rank, URL, fetch timestamp, geography, device, source type, and pass label.
- Mark conflicts explicitly instead of smoothing them into a single answer.
