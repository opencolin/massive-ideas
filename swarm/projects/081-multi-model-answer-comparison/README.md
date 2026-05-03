# Multi-Model Answer Comparison

Multi-Model Answer Comparison shows how ChatGPT, Gemini, Perplexity, and Copilot answer the same buyer, research, or SEO question. It captures each answer, cited sources, source freshness, brand mentions, claim differences, and recommendation bias so teams can see where AI assistants agree, diverge, or rely on different evidence.

The first version is intentionally narrow: run a fixed prompt set across four answer surfaces, collect source-backed answers, normalize the citations, and produce a comparison report with disagreements and evidence gaps.

## Target User

Primary users:

- SEO and GEO teams tracking brand visibility across AI answer engines.
- Product marketers comparing how AI assistants frame a category.
- Competitive intelligence teams watching where competitors are recommended.
- Content teams finding missing evidence, outdated pages, or weak source coverage.
- Agencies producing recurring AI search visibility reports for clients.

## Core Workflow

1. User defines a comparison brief:
   - Topic, market, or brand set
   - Prompts and prompt intents
   - Target countries, cities, and devices
   - Owned domains, competitor domains, and priority entities
   - Source freshness window and required evidence rules
   - Schedule and alert thresholds
2. App checks `account_status` and estimates run cost.
3. Massive MCP runs:
   - `ai_chat_completion` for ChatGPT, Gemini, Perplexity, and Copilot-style answers when supported by the configured provider set
   - `web_search` with Google SERP parsing to capture search context for each prompt and market
   - country, city, and device targeting to compare localized answer behavior
   - `web_fetch` with JS rendering and captcha handling for cited pages, owned pages, and competitor pages
   - `ai_chat_completion` to extract claims, citations, recommendations, sentiment, and answer differences with sources
4. App stores each model response and normalized source graph as a timestamped snapshot.
5. App compares answers across models and against prior runs.
6. User receives a matrix report showing consensus, conflicts, missing sources, brand visibility, and recommended content actions.

## MVP Inputs

```json
{
  "topic": "best customer support automation tools for startups",
  "prompts": [
    {
      "prompt": "What are the best customer support automation tools for a seed-stage B2B SaaS startup?",
      "intent": "recommendation",
      "priority": "high"
    },
    {
      "prompt": "Compare Intercom, Zendesk, and Freshdesk for AI customer support automation.",
      "intent": "comparison",
      "priority": "high"
    },
    {
      "prompt": "What should a startup look for in customer support automation software?",
      "intent": "buying-criteria",
      "priority": "medium"
    }
  ],
  "models": ["chatgpt", "gemini", "perplexity", "copilot"],
  "targets": [
    { "country": "us", "city": "San Francisco", "device": "desktop" },
    { "country": "gb", "city": "London", "device": "mobile" }
  ],
  "owned_domains": ["example.com"],
  "competitors": ["Intercom", "Zendesk", "Freshdesk", "Gorgias"],
  "required_entities": ["AI agent", "knowledge base", "ticket deflection"],
  "freshness_days": 180,
  "schedule": "weekly",
  "alert_thresholds": {
    "owned_domain_missing_all_models": true,
    "competitor_recommended_by_models": 3,
    "answer_similarity_below": 0.55,
    "uncited_claims_above": 2
  }
}
```

## MVP Output

```json
{
  "topic": "best customer support automation tools for startups",
  "run_id": "mmac-2026-05-02-us",
  "summary": "Perplexity and Copilot gave source-heavy vendor recommendations, while ChatGPT and Gemini emphasized buying criteria. Zendesk appeared in all four answers. The owned domain was not cited, and two models recommended Intercom for startups based on recent AI agent pages.",
  "model_answers": [
    {
      "model": "perplexity",
      "prompt": "What are the best customer support automation tools for a seed-stage B2B SaaS startup?",
      "target": { "country": "us", "city": "San Francisco", "device": "desktop" },
      "answer_excerpt": "For seed-stage teams, prioritize tools that combine shared inbox, knowledge base automation, and AI triage...",
      "recommended_brands": ["Intercom", "Zendesk", "Freshdesk"],
      "mentioned_competitors": ["Intercom", "Zendesk", "Freshdesk"],
      "owned_domain_cited": false,
      "source_count": 6,
      "fresh_source_count": 4,
      "uncited_claim_count": 1,
      "confidence": "high"
    }
  ],
  "source_graph": [
    {
      "url": "https://example-source.com/ai-customer-support",
      "domain": "example-source.com",
      "cited_by_models": ["perplexity", "copilot"],
      "source_role": "comparison",
      "freshness": "fresh",
      "owned": false,
      "competitor": false
    }
  ],
  "comparisons": [
    {
      "prompt": "What are the best customer support automation tools for a seed-stage B2B SaaS startup?",
      "target_key": "us:san-francisco:desktop",
      "consensus": ["AI triage is important", "knowledge base quality affects automation success"],
      "disagreements": [
        {
          "topic": "best startup-fit vendor",
          "models": {
            "chatgpt": "Zendesk",
            "gemini": "Freshdesk",
            "perplexity": "Intercom",
            "copilot": "Intercom"
          },
          "evidence_urls": ["https://example-source.com/ai-customer-support"]
        }
      ],
      "visibility_score": 42,
      "citation_gap_score": 73
    }
  ],
  "alerts": [
    {
      "alert_type": "owned_domain_absent",
      "severity": "high",
      "message": "The owned domain was not cited by any model for high-priority prompts."
    }
  ]
}
```

## Comparison Dimensions

Each snapshot preserves:

- Prompt text, intent, priority, model, target, and collection timestamp.
- Full answer metadata plus a short answer excerpt and structured claims.
- Cited URLs, normalized domains, source roles, freshness, and fetch status.
- Brand mentions, recommendation rank, sentiment, and competitor flags.
- Consensus claims that appear across multiple models.
- Disagreements in recommendations, definitions, pricing claims, or risk framing.
- SERP context for the same prompt so answer sources can be compared with Google-visible sources.
- Prior-run deltas for citations, recommendations, and answer framing.

## Scoring

Visibility score is 0-100:

- 30 points: owned brand or domain is mentioned by high-priority prompts.
- 25 points: owned domain is cited by source-aware models.
- 15 points: owned pages appear in SERP context for the prompt.
- 15 points: answer sentiment and recommendation rank are favorable.
- 10 points: required entities and category terms appear accurately.
- 5 points: answer uses fresh sources.

Citation gap score is 0-100:

- 25 points: competitors are cited but owned domain is absent.
- 20 points: models agree on claims that owned content does not directly support.
- 20 points: cited sources are older than the freshness window.
- 15 points: source-aware models rely on non-authoritative summaries.
- 10 points: SERP-visible owned pages are not cited by answer engines.
- 10 points: uncited claims appear in more than one model answer.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
multi-model-answer-comparison run \
  --brief comparison-brief.json \
  --history-dir snapshots \
  --out latest-comparison.json \
  --csv answer-sources.csv \
  --report-md model-comparison-report.md
```

Minimum viable UI after CLI validation:

- Brief setup form
- Prompt, target, and model selector
- Credit estimate preview
- Run status by model and prompt
- Answer comparison matrix
- Source overlap graph
- Brand visibility and recommendation rank table
- Disagreement and citation gap queue
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate and confirm credits before multi-model runs.
- `ai_chat_completion`: collect model-style answers and perform source-backed extraction.
- `web_search`: capture Google SERP context for each prompt, target, and device.
- Google SERP parsing: preserve organic results, AI modules, snippets, and visible source candidates.
- Country, city, and device targeting: compare localized model behavior and search context.
- `web_fetch`: verify cited sources, owned pages, and competitor pages with JS rendering and captcha handling.
- Chatbot answers with sources: preserve citation lineage and separate answer text from fetched evidence.

## Guardrails

- Treat model answers as observed outputs, not objective truth.
- Store short excerpts and structured claims, not large copied answer text.
- Separate answer claims, citation facts, fetched source facts, and AI synthesis.
- Preserve model, prompt, target, URL, timestamp, and fetch status for every claim.
- Do not imply a model endorses a brand because it mentioned or cited it once.
- Label unsupported, stale, blocked, or unverifiable claims clearly.
- Compare like-for-like prompts and targets only.
- Avoid collecting private account data or bypassing gated content.
