# Content Originality Checker

Content Originality Checker compares a draft, outline, or existing page against the top-ranking pages for its target queries. It helps content, SEO, and editorial teams see whether a piece has original substance or mostly repeats the same claims, sections, examples, and wording patterns already present in search results.

The first version is intentionally narrow: evaluate one content asset against one keyword cluster, one geography, and one device profile at a time.

## Target User

Primary users:

- SEO editors deciding whether a draft is differentiated enough to publish.
- Content strategists refreshing pages that have become generic.
- Agencies auditing client copy against live competitors.
- Product marketers checking whether their proof points and examples are distinct.
- GEO teams validating whether content adds source-worthy information beyond ranking pages and chatbot answers.

## Core Workflow

1. User submits an originality brief:
   - Target URL or pasted draft text
   - Brand and domain
   - Keyword cluster and search intent labels
   - Geography, city, and device profile
   - Known competitors and excluded domains
   - Claims, examples, data points, and first-party assets to protect
2. App checks run feasibility with `account_status`.
3. App uses `web_search` with Google SERP parsing to collect top-ranking pages for each target query.
4. App uses `web_fetch` with JS rendering and captcha handling to fetch ranking pages and, when provided, the target URL.
5. App uses `ai_chat_completion` to extract page structures, topics, claims, examples, statistics, entity coverage, and answer-source patterns.
6. App computes overlap and novelty signals between the target content and the competitive set.
7. User receives an originality report with risk levels, copied-market patterns, differentiated sections, missing proof, and recommended rewrites.

## MVP Inputs

```json
{
  "target": {
    "brand": "ExampleCRM",
    "domain": "examplecrm.com",
    "url": "https://www.examplecrm.com/blog/best-crm-for-agencies",
    "draft_text": null
  },
  "geo": {
    "country": "us",
    "city": "Chicago",
    "device": "desktop"
  },
  "keyword_cluster": [
    {
      "keyword": "best CRM for agencies",
      "intent": "comparison",
      "priority": "high"
    },
    {
      "keyword": "agency CRM software",
      "intent": "commercial",
      "priority": "high"
    }
  ],
  "competitors": [
    { "name": "HubSpot", "domain": "hubspot.com" },
    { "name": "Pipedrive", "domain": "pipedrive.com" }
  ],
  "excluded_domains": ["examplecrm.com"],
  "protected_original_assets": [
    "first-party agency benchmark survey",
    "customer implementation examples",
    "internal workflow screenshots"
  ],
  "max_serp_results_per_keyword": 10,
  "max_fetches": 40
}
```

## MVP Output

```json
{
  "target": {
    "brand": "ExampleCRM",
    "domain": "examplecrm.com",
    "url": "https://www.examplecrm.com/blog/best-crm-for-agencies"
  },
  "summary": "The page covers the expected comparison topics but reads close to the market average. Its strongest original material is the agency benchmark survey, while its feature sections and buying criteria repeat language found across six ranking pages.",
  "originality_score": 62,
  "risk_level": "medium",
  "competitive_set": [
    {
      "query": "best CRM for agencies",
      "rank": 1,
      "url": "https://example-review-site.com/best-agency-crm",
      "domain": "example-review-site.com"
    }
  ],
  "overlap_findings": [
    {
      "finding_type": "structure_overlap",
      "severity": "medium",
      "target_section": "Top features to look for",
      "why_it_matters": "Seven of the top ten pages use nearly identical feature groupings, so this section is unlikely to feel distinctive.",
      "evidence": [
        {
          "source_type": "fetched_page",
          "source_url": "https://example-review-site.com/best-agency-crm",
          "observed_fact": "Ranking page uses the same feature grouping: pipeline tracking, email sync, reporting, automations."
        }
      ],
      "recommended_action": "Reframe the section around agency operating moments such as intake, handoff, retainer renewal, and client reporting."
    }
  ],
  "originality_assets": [
    {
      "asset_type": "first_party_data",
      "target_section": "Agency CRM benchmark data",
      "strength": "high",
      "recommendation": "Move this section earlier and connect each stat to a buying implication."
    }
  ],
  "rewrite_priorities": [
    {
      "priority": 1,
      "section": "Buying criteria",
      "rewrite_goal": "Replace generic comparison criteria with agency-specific workflows and proof."
    }
  ]
}
```

## Originality Signals

The checker separates market-standard coverage from meaningful novelty:

- `structure_overlap`: target headings and section order mirror top-ranking pages.
- `topic_overlap`: target covers the same topics without adding useful specificity.
- `claim_overlap`: target makes common claims without unique evidence.
- `example_overlap`: examples are generic or repeated across ranking pages.
- `wording_similarity`: phrases are close enough to raise editorial risk.
- `missing_original_asset`: known first-party proof is absent or buried.
- `intent_gap`: target adds novelty in an area that does not match search intent.
- `source_gap`: chatbot answers or SERP pages cite sources the target does not address.

## Scoring

Originality scores are 0-100:

- 20 points: distinct structure and framing.
- 20 points: unique claims, examples, and first-party proof.
- 15 points: specific entity and use-case coverage beyond the competitive set.
- 15 points: low wording and paragraph-level similarity risk.
- 10 points: alignment with the dominant SERP intent.
- 10 points: source-worthy data, quotes, screenshots, or methodology.
- 10 points: evidence completeness and fetch quality.

Automatic caps:

- Cap at 70 when no target URL or draft text is available for direct comparison.
- Cap at 65 when fewer than five relevant ranking pages are fetched.
- Cap at 60 when the target lacks any first-party examples, data, or proof.
- Cap at 55 when high wording similarity appears in multiple sections.
- Cap at 45 when the target intent does not match the dominant SERP intent.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
content-originality-checker run \
  --brief originality-brief.json \
  --out originality-report.json \
  --report-md originality-report.md \
  --overlap-csv overlap-findings.csv \
  --sources-csv competitive-sources.csv
```

Minimum viable UI after CLI validation:

- Brief setup form
- Draft text or target URL input
- Keyword cluster table
- SERP collection preview and credit estimate
- Competitive source table
- Originality score with risk bands
- Section-by-section overlap map
- Evidence drawer for each finding
- Rewrite priority queue
- Export buttons for JSON, Markdown, and CSV

## Massive MCP Usage

- `account_status`: estimate whether the planned SERP and fetch run fits available credits.
- `web_search`: collect parsed Google results for every target query.
- Google SERP parsing: preserve rank, URL, title, snippet, result type, query, country, city, and device.
- Country, city, and device targeting: evaluate the exact competitive surface the editor cares about.
- `web_fetch`: fetch ranking pages, the target URL, competitor pages, and cited source pages.
- JS rendering: capture client-rendered article bodies, tables, widgets, and comparison modules.
- Captcha handling: attempt public page access without private credentials or gated content.
- `ai_chat_completion`: extract outlines, claims, topics, examples, entities, similarity findings, rewrite opportunities, and chatbot-style answers with sources.
