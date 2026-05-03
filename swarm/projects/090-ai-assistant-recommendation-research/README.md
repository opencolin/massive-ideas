# AI Assistant Recommendation Research Tool

AI Assistant Recommendation Research Tool asks multiple AI assistants the same buyer, product, or vendor research question and turns their answers into a sourced comparison of what each assistant recommends, cites, omits, and overstates. It helps product marketers, founders, analysts, agencies, and sales teams understand how AI-mediated discovery represents a market.

The first version is deliberately narrow: run one product research prompt across a configured set of assistant personas and search contexts, then produce a recommendation audit with cited entities, source overlap, confidence, and positioning gaps.

## Target User

Primary users:

- Product marketers tracking whether AI assistants recommend their product or competitors.
- Founders validating category positioning and discoverability in AI answers.
- Analysts comparing how assistant-generated recommendations differ from search results.
- Agencies auditing AI answer visibility for clients.
- Sales and partnerships teams finding products or vendors surfaced by AI assistants.
- Category creators testing whether assistants understand a new product space.

## Core Workflow

1. User defines a research brief:
   - Product category, buyer persona, use case, budget, geography, and constraints
   - Prompt variants such as "what should I buy," "best alternatives," and "compare tools for"
   - Assistant personas, answer formats, and expected source requirements
   - Competitors, owned product names, aliases, and excluded meanings
   - Country, city, device, and SERP context to use as retrieval evidence
2. App checks `account_status` and estimates the credit cost for search, fetch, and assistant runs.
3. Massive MCP runs:
   - `web_search` with Google SERP parsing to collect baseline search results for the same research intent
   - country, city, and device targeting to test localized recommendations
   - `web_fetch` with JS rendering for vendor sites, reviews, pricing pages, docs, and comparison pages
   - captcha handling for public pages that challenge collection
   - `ai_chat_completion` to ask controlled assistant prompts, extract recommendations, normalize entities, and cite sources
4. App stores raw assistant answers, parsed recommendations, source IDs, and baseline SERP evidence.
5. App compares assistant outputs across prompt variants, personas, locations, and baseline search results.
6. User receives a report showing recommended products, rankings, citations, omissions, unsupported claims, and recommended positioning actions.

## MVP Inputs

```json
{
  "category": "AI meeting note takers for sales teams",
  "buyer_persona": "VP Sales at a 150-person B2B SaaS company",
  "use_case": "recording calls, extracting MEDDICC fields, and syncing notes to Salesforce",
  "constraints": {
    "budget": "mid-market",
    "country": "us",
    "city": "Chicago",
    "device": "desktop",
    "must_have": ["Salesforce integration", "SOC 2 evidence"],
    "avoid": ["consumer-only transcription apps"]
  },
  "prompt_variants": [
    "What are the best AI meeting note takers for a sales team?",
    "Compare AI tools for sales call recording and CRM note sync.",
    "Which Gong alternatives should a mid-market sales team evaluate?"
  ],
  "watched_entities": [
    { "name": "Gong", "domain": "gong.io", "aliases": ["Gong.io"] },
    { "name": "Fireflies.ai", "domain": "fireflies.ai", "aliases": ["Fireflies"] },
    { "name": "Fathom", "domain": "fathom.video", "aliases": ["Fathom AI"] }
  ],
  "assistant_runs": [
    { "name": "neutral_buyer", "temperature": 0.2, "require_sources": true },
    { "name": "cost_sensitive_buyer", "temperature": 0.2, "require_sources": true },
    { "name": "enterprise_security_buyer", "temperature": 0.2, "require_sources": true }
  ],
  "baseline_search_depth": 20
}
```

## MVP Output

```json
{
  "category": "AI meeting note takers for sales teams",
  "generated_at": "2026-05-02T16:00:00Z",
  "summary": "Assistants consistently recommended Gong, Fireflies.ai, and Fathom. Gong appeared in every enterprise-security answer, while Fathom was more common in cost-sensitive prompts. Two recommendations lacked current pricing evidence.",
  "recommendation_visibility_score": 74,
  "entities": [
    {
      "name": "Gong",
      "domain": "gong.io",
      "recommendation_rate": 1.0,
      "average_rank": 1.3,
      "assistant_mentions": 3,
      "baseline_serp_rank": 2,
      "common_rationale": ["sales coaching depth", "CRM workflows", "enterprise trust"],
      "unsupported_claims": [],
      "source_coverage": "high"
    }
  ],
  "assistant_comparisons": [
    {
      "assistant_run": "cost_sensitive_buyer",
      "prompt": "Which Gong alternatives should a mid-market sales team evaluate?",
      "top_recommendations": ["Fathom", "Fireflies.ai", "Avoma"],
      "omitted_watched_entities": ["Gong"],
      "sources": [
        {
          "url": "https://www.fathom.video/",
          "source_type": "official_site",
          "supports_claims": ["pricing fit", "meeting summaries"]
        }
      ],
      "confidence": "medium"
    }
  ],
  "positioning_actions": [
    {
      "entity": "Fireflies.ai",
      "issue": "Mentioned often but rarely cited with Salesforce-specific evidence.",
      "recommended_action": "Improve public integration pages and comparison-page language for sales CRM sync queries."
    }
  ]
}
```

## Recommendation Dimensions

Each assistant answer is normalized into:

- Prompt variant, assistant persona, model settings, country, city, device, and timestamp.
- Product name, aliases, domain, category fit, and watched-entity match confidence.
- Recommendation rank, mention type, rationale, stated buyer fit, and caveats.
- Source URLs, source types, fetched evidence, freshness, and whether the source supports the claim.
- Baseline Google SERP rank and overlap with assistant-cited sources.
- Omissions, hallucinated products, outdated claims, unsupported claims, and ambiguity flags.

## Scoring

Recommendation visibility scores are 0-100:

- 25 points: watched product appears across prompt variants and assistant personas.
- 20 points: assistant recommendation rank and consistency.
- 15 points: source support quality for recommendation rationales.
- 15 points: overlap with high-quality baseline search evidence.
- 10 points: localization and persona relevance.
- 10 points: competitive differentiation clarity.
- 5 points: absence of hallucinated or outdated claims.

Automatic caps:

- Cap at 70 when sources are not required or source support is incomplete.
- Cap at 65 when fewer than three prompt variants are tested.
- Cap at 60 when the category is ambiguous or dominated by excluded meanings.
- Cap at 55 when assistant answers disagree materially without enough evidence to explain why.
- Cap at 45 when recommended products cannot be matched to real domains.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
ai-rec-research run \
  --brief recommendation-brief.json \
  --out recommendation-report.json \
  --csv recommendation-entities.csv \
  --markdown recommendation-report.md
```

Minimum viable UI after CLI validation:

- Research brief builder
- Prompt variant and assistant persona editor
- Watched product and competitor list
- Credit estimate preview
- Run status by prompt, persona, and evidence source
- Recommendation comparison table
- Source support and unsupported-claim drawer
- Baseline SERP overlap view
- Omission and hallucination review queue
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate credits before assistant and evidence runs.
- `web_search`: collect baseline Google results for product research intent, alternatives queries, reviews, pricing, and comparison pages.
- Google SERP parsing: preserve rank, title, snippet, URL, result type, and query context.
- Country, city, and device targeting: test whether recommendations change by location or device context.
- `web_fetch`: verify official product pages, pricing pages, docs, integrations, review pages, and comparison pages with JS rendering.
- Captcha handling: keep collection resilient for public review and search pages.
- `ai_chat_completion`: run controlled assistant prompts, require cited answers, normalize recommendations, judge source support, and summarize findings.

## Guardrails

- Treat assistant answers as observations, not objective product rankings.
- Preserve raw prompts, raw answers, model settings, and timestamps.
- Do not count a recommendation as sourced unless the cited or fetched page supports the specific claim.
- Separate baseline search rank from assistant recommendation rank.
- Flag outdated, unsupported, or unverifiable claims instead of polishing them away.
- Do not infer market share, revenue, or product quality from recommendation frequency alone.
- Keep location, device, persona, and prompt variant separate in analysis.
- Label ambiguous entity matches for human review.
- Respect exclusions and avoid private, gated, or personal data collection.
