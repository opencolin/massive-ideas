# SERP Gap Analyzer

SERP Gap Analyzer turns a keyword cluster into a source-backed report showing where a company is absent, weak, or mispositioned across Google results and AI answers. It is built for SEO, content, and product marketing teams that need to know which competitors, pages, sources, and topics own the search surface before deciding what to publish or update.

The first version is intentionally narrow: analyze one keyword cluster, one target domain, one geography, and one device profile at a time.

## Target User

Primary users:

- SEO teams planning content refreshes and net-new landing pages.
- Product marketers comparing message coverage across competitor pages.
- Founders validating whether their category narrative appears in search results.
- Agencies producing source-backed SERP audits for clients.
- GEO teams checking whether chatbot answers cite them, competitors, or third-party sources.

## Core Workflow

1. User defines a SERP gap brief:
   - Target domain and brand name
   - Keyword cluster and intent labels
   - Competitor domains
   - Geography, city, and device profile
   - Required topics, entities, and exclusions
   - Maximum search and fetch budget
2. App estimates run feasibility with `account_status`.
3. App expands the keyword cluster into normalized Google queries and AI-answer prompts.
4. Massive MCP runs:
   - `web_search` with Google SERP parsing for every keyword and intent
   - country, city, and device targeting for localized SERP surfaces
   - `web_fetch` with JS rendering for ranking pages, competitor pages, comparison pages, and target-domain pages
   - captcha handling for public pages that need browser-like access
   - `ai_chat_completion` to summarize result themes, identify missing topics, and answer recurring buyer questions with sources
5. App normalizes domains, ranks, result types, topics, cited sources, and content coverage.
6. App compares the target domain against competitors and neutral sources.
7. User receives a prioritized gap report with evidence, recommended pages, and exportable keyword and URL tables.

## MVP Inputs

```json
{
  "target": {
    "brand": "ExampleCRM",
    "domain": "examplecrm.com"
  },
  "geo": {
    "country": "us",
    "city": "New York",
    "device": "desktop"
  },
  "keyword_cluster": [
    {
      "keyword": "best CRM for small business",
      "intent": "comparison",
      "priority": "high"
    },
    {
      "keyword": "CRM pricing for startups",
      "intent": "pricing",
      "priority": "medium"
    },
    {
      "keyword": "sales pipeline software for agencies",
      "intent": "use_case",
      "priority": "medium"
    }
  ],
  "competitors": [
    { "name": "HubSpot", "domain": "hubspot.com" },
    { "name": "Pipedrive", "domain": "pipedrive.com" },
    { "name": "Zoho CRM", "domain": "zoho.com" }
  ],
  "required_topics": [
    "pricing transparency",
    "pipeline automation",
    "email integration",
    "agency workflows"
  ],
  "exclusions": ["jobs", "investor relations", "generic spreadsheet templates"],
  "max_serp_results_per_keyword": 10,
  "max_fetches": 60
}
```

## MVP Output

```json
{
  "target": {
    "brand": "ExampleCRM",
    "domain": "examplecrm.com"
  },
  "summary": "ExampleCRM is visible for pricing-adjacent queries but absent from two high-priority comparison SERPs. Competitors own agency workflow language and third-party listicles, while AI answers cite HubSpot and neutral review pages.",
  "cluster_score": 54,
  "gaps": [
    {
      "gap_type": "missing_serp_presence",
      "keyword": "best CRM for small business",
      "intent": "comparison",
      "severity": "high",
      "why_it_matters": "The target domain does not appear in the top 10 while three direct competitors do.",
      "recommended_action": "Create or refresh a comparison landing page with small-business buyer criteria and proof points.",
      "evidence": [
        {
          "source_type": "google_serp",
          "query": "best CRM for small business",
          "country": "us",
          "city": "New York",
          "device": "desktop",
          "source_url": "https://www.google.com/search?q=best+CRM+for+small+business",
          "observed_facts": [
            "Target domain not present in top 10 parsed organic results.",
            "HubSpot ranks 2 and Pipedrive ranks 5."
          ]
        }
      ]
    }
  ],
  "competitor_coverage": [
    {
      "domain": "hubspot.com",
      "visible_keywords": 3,
      "best_rank": 2,
      "covered_topics": ["pricing transparency", "email integration"],
      "missing_topics": ["agency workflows"]
    }
  ],
  "ai_answer_gaps": [
    {
      "prompt": "What is the best CRM for a small agency?",
      "target_mentioned": false,
      "competitors_mentioned": ["HubSpot", "Pipedrive"],
      "cited_sources": ["https://example-review-site.com/best-crm"],
      "recommended_action": "Earn or improve third-party comparison coverage for agency-specific CRM use cases."
    }
  ],
  "recommended_pages": [
    {
      "page_type": "comparison_landing_page",
      "priority": 1,
      "target_keywords": ["best CRM for small business"],
      "topics_to_cover": ["pricing transparency", "pipeline automation", "email integration"],
      "source_urls_to_review": [
        "https://www.hubspot.com/products/crm",
        "https://www.pipedrive.com/en/crm-comparison"
      ]
    }
  ]
}
```

## Gap Types

Gap cards use a fixed taxonomy:

- `missing_serp_presence`: target domain does not appear in the configured top results.
- `weak_rank`: target domain appears, but below a configurable rank threshold or below key competitors.
- `topic_gap`: target pages omit topics or entities repeatedly present in higher-ranking pages.
- `intent_mismatch`: target page type does not match the dominant result intent.
- `source_gap`: influential third-party or neutral sources mention competitors but not the target.
- `ai_answer_gap`: chatbot answers omit the target, cite competitors, or cite weak/outdated target sources.
- `localization_gap`: target visibility or page relevance differs by country, city, or device.
- `snippet_gap`: target title or snippet lacks high-frequency buyer language present in winning results.

## Scoring

Cluster scores are 0-100:

- 25 points: target organic visibility across priority keywords.
- 20 points: coverage of required topics and recurring SERP entities.
- 15 points: intent fit between target pages and dominant SERP result types.
- 15 points: competitive share of top positions and cited sources.
- 10 points: AI-answer mention and source-citation strength.
- 10 points: localization and device consistency.
- 5 points: evidence quality and fetch completeness.

Automatic caps:

- Cap at 65 when fewer than five relevant SERP results were collected.
- Cap at 60 when the target appears only through third-party pages.
- Cap at 55 when fetched page content is unavailable for most ranking URLs.
- Cap at 45 when keyword meanings remain ambiguous after exclusions.
- Cap at 40 when all high-priority keywords show zero target-domain visibility.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
serp-gap-analyzer run \
  --brief serp-gap-brief.json \
  --out serp-gap-report.json \
  --report-md serp-gap-report.md \
  --keyword-csv keyword-gaps.csv \
  --url-csv ranking-urls.csv
```

Minimum viable UI after CLI validation:

- Brief setup form
- Keyword cluster table
- Competitor domain editor
- Query plan and credit estimate preview
- Run status by keyword and surface
- Gap-prioritized report view
- SERP rank and AI-answer source tables
- Evidence drawer for each claim
- Export buttons for JSON, Markdown, and CSV

## Massive MCP Usage

- `account_status`: estimate whether the planned cluster run fits available credits.
- `web_search`: collect parsed Google results for every keyword and generated query variant.
- Google SERP parsing: preserve rank, URL, title, snippet, result type, query, country, city, and device.
- Country, city, and device targeting: compare the exact SERP surface the user cares about.
- `web_fetch`: fetch ranking pages, target pages, competitor pages, comparison articles, review pages, and help docs.
- JS rendering: handle modern marketing pages, pricing tables, interactive comparison pages, and client-rendered docs.
- Captcha handling: attempt public page access without using private credentials or gated content.
- `ai_chat_completion`: classify search intent, extract topics from fetched pages, summarize gaps, draft recommendations, and collect chatbot answers with sources.

## Guardrails

- Do not claim search volume; parsed SERPs show visibility, not demand volume.
- Keep Google rank evidence, fetched-page evidence, and AI-answer citations separate.
- Preserve query, locale, device, rank, URL, and collected-at timestamp for every observation.
- Never treat chatbot output as source-backed unless it includes inspectable source URLs.
- Do not scrape private dashboards, gated reports, paid communities, or personal data.
- Avoid recommending a page when the gap is actually authority, third-party coverage, or intent mismatch.
- Label ambiguous keywords and exclude unrelated meanings before scoring.
- Prefer a short list of high-impact gaps over a long undifferentiated audit.
