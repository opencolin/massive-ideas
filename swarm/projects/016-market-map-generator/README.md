# Market Map Generator

Market Map Generator turns a prompt like "all tools like X in vertical Y" into a sourced market map of comparable tools, adjacent categories, buyer segments, positioning clusters, and evidence-backed gaps.

The first version is intentionally narrow: given one seed product and one vertical, find credible alternatives and near-neighbors, then organize them into a useful market map for founders, GTM teams, investors, and product strategists.

## Target User

Primary users:

- Founders validating whether a new product belongs in an existing category or a new wedge.
- Product marketers building competitor and alternatives maps for positioning work.
- Investors screening a vertical before calls or memo writing.
- Sales and partnerships teams looking for ecosystem tools around a known vendor.

## Core Workflow

1. User enters a market-map brief:
   - Seed tool name
   - Seed tool domain, if known
   - Vertical
   - Buyer persona
   - Geography
   - Inclusion and exclusion rules
2. App expands the brief into search and chatbot prompts across alternatives, competitors, vertical software, review sites, directories, integrations, pricing, use cases, and buyer questions.
3. Massive MCP runs:
   - `account_status` to preflight credits and feature availability
   - `web_search` with Google SERP parsing for all planned queries
   - country, city, and device targeting when the vertical has regional or mobile-sensitive results
   - `web_fetch` with JS rendering for vendor pages, review pages, directories, app marketplaces, and comparison pages
   - captcha handling for sources that block normal browsing
   - `ai_chat_completion` to ask sourced market questions and normalize extracted companies
4. App deduplicates vendors by brand, domain, parent company, and product line.
5. AI clusters vendors by use case, buyer, workflow, deployment model, and adjacency to the seed tool.
6. User gets a ranked market map with source evidence, confidence, and exportable JSON, CSV, and Markdown.

## MVP Inputs

```json
{
  "seed_tool": {
    "name": "Toast",
    "domain": "toasttab.com"
  },
  "vertical": "restaurant operations",
  "buyer": "independent restaurant owners and operators",
  "geo": {
    "country": "us",
    "city": "Chicago",
    "device": "desktop"
  },
  "map_goal": "find all tools like Toast plus adjacent restaurant software categories",
  "include": ["POS", "online ordering", "labor management", "inventory", "guest engagement"],
  "exclude": ["consumer food delivery apps", "restaurant review sites", "generic accounting software"]
}
```

## MVP Output

```json
{
  "seed_tool": "Toast",
  "vertical": "restaurant operations",
  "market_summary": "The restaurant operations market clusters around POS platforms, ordering and delivery enablement, labor scheduling, inventory, guest marketing, and back-office reporting. Toast-like vendors are most visible in POS and all-in-one restaurant management queries, while adjacent tools appear through integration directories and vertical workflow searches.",
  "clusters": [
    {
      "name": "Restaurant POS and all-in-one platforms",
      "description": "Core systems for ordering, payments, menus, reporting, and front-of-house workflows.",
      "seed_adjacency": "direct_competitor",
      "vendors": ["Square for Restaurants", "Lightspeed Restaurant", "Clover", "SpotOn"]
    }
  ],
  "vendors": [
    {
      "name": "ExampleVendor",
      "domain": "examplevendor.com",
      "cluster": "Restaurant POS and all-in-one platforms",
      "positioning": "Cloud POS and operations platform for independent restaurants.",
      "relationship_to_seed": "direct_competitor",
      "map_score": 84,
      "evidence": [
        {
          "claim": "Appears in Google results for Toast alternatives in restaurant POS.",
          "source_url": "https://example.com/toast-alternatives",
          "source_type": "serp_result",
          "query": "Toast alternatives restaurant POS",
          "rank": 3
        },
        {
          "claim": "Official site describes restaurant POS, ordering, and reporting workflows.",
          "source_url": "https://examplevendor.com/restaurants",
          "source_type": "fetched_page"
        }
      ],
      "confidence": "high"
    }
  ],
  "source_domains": [
    {
      "domain": "g2.com",
      "role": "review/comparison",
      "serp_mentions": 5,
      "ai_answer_citations": 1
    }
  ],
  "gaps": [
    "Back-office and inventory tools are underrepresented in generic Toast-alternatives SERPs and require vertical workflow queries."
  ]
}
```

## Market Map Scoring

Vendor map scores are 0-100:

- 25 points: Direct relevance to the seed tool and stated vertical.
- 20 points: Google SERP visibility across alternatives, best-tools, category, and vertical workflow queries.
- 20 points: Evidence strength from official pages, review sites, comparison pages, directories, and cited AI-answer sources.
- 15 points: Positioning clarity and fit to a specific buyer workflow.
- 10 points: AI-answer visibility with inspectable sources.
- 10 points: Freshness, geography fit, and source diversity.

Automatic caps:

- Cap at 65 when a vendor is adjacent but not truly "like X."
- Cap at 60 when the vendor appears only in chatbot answers and has no fetched source confirmation.
- Cap at 50 when the vendor belongs to the vertical but not the requested tool type.
- Cap at 40 when evidence conflicts with an exclusion rule.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
market-map generate \
  --brief market-map.json \
  --out market-map-output.json \
  --csv vendors.csv \
  --brief-md market-map.md
```

Minimum viable UI after CLI validation:

- Seed tool and vertical setup form
- Query plan preview with credit estimate
- Run status with SERP, fetch, and AI-answer stages
- Clustered market-map table
- Vendor detail drawer with source evidence
- Export buttons for CSV, JSON, and Markdown

## Massive MCP Usage

- `account_status`: estimate available credits and confirm rendering/captcha capabilities before a run.
- `web_search`: discover alternatives, category pages, review pages, app directories, integration pages, and vertical buying guides.
- Google SERP parsing: preserve query, intent, rank, title, snippet, URL, and SERP feature metadata.
- `web_fetch`: fetch vendor, review, marketplace, directory, and comparison pages with JS rendering and captcha handling.
- country, city, and device targeting: compare localized vertical markets and buyer-device differences when needed.
- `ai_chat_completion`: ask sourced market questions, extract vendors, normalize company names, classify clusters, and synthesize final output.

## Guardrails

- Keep direct competitors separate from adjacent ecosystem tools.
- Do not include vendors only because they advertise against the seed tool unless fetched evidence supports product relevance.
- Preserve query, rank, prompt, and URL lineage for every claim.
- Cite every vendor-level claim with SERP, fetched page, or AI-answer source evidence.
- Show confidence and uncertainty for ambiguous verticals.
- Do not scrape gated reports, private communities, or personal contact data.
