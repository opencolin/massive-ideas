# Persona Pain-Point Extractor

Persona Pain-Point Extractor turns public forum threads, review pages, support docs, help-center comments, and community discussions into a sourced map of what a specific persona is struggling with. It is built for founders, product marketers, PMs, UX researchers, and sales teams who need real buyer language before building positioning, roadmap items, or outbound campaigns.

The first version is intentionally focused: one persona, one problem space, one geography or language market, and a bounded set of source types.

## Target User

Primary users:

- Founders validating whether a problem is painful enough to build around.
- Product marketers collecting customer-language proof for messaging.
- PMs and UX researchers looking for repeated workflow complaints.
- Sales teams building persona-specific discovery prompts.
- Support leaders looking for recurring confusion across public docs and communities.

## Core Workflow

1. User enters a persona and research brief:
   - Persona name
   - Industry or product category
   - Job-to-be-done or workflow
   - Known products, communities, or competitors
   - Geography, city, language, and device context when relevant
   - Excluded topics or personas
2. App generates query plans for forums, Reddit-style communities, review sites, help centers, vendor support pages, and general Google SERPs.
3. Massive MCP runs:
   - `account_status` to estimate run cost before collection
   - `web_search` with Google SERP parsing for public discussion and review discovery
   - country, city, and device targeting for regional pain points
   - `web_fetch` with JS rendering for forums, reviews, support pages, and dynamic community pages
   - captcha handling for public pages that require browser-like access
   - `ai_chat_completion` to classify pain points, extract quotes, dedupe themes, and produce sourced summaries
4. App normalizes posts, reviews, support articles, comments, timestamps, products, and author persona hints.
5. AI extracts persona-specific pains, severity, frequency, emotional language, triggers, workaround behavior, and evidence.
6. User gets a ranked pain-point map with quotes, source links, confidence, and exportable research notes.

## MVP Inputs

```json
{
  "persona": "RevOps manager at a 100-500 employee B2B SaaS company",
  "problem_space": "CRM data quality and sales forecasting hygiene",
  "geo": {
    "country": "us",
    "city": "Austin",
    "device": "desktop"
  },
  "known_products": ["Salesforce", "HubSpot", "Clari"],
  "source_types": ["forums", "reviews", "support_pages", "community_posts"],
  "excluded_topics": ["consumer CRM", "real estate CRM", "generic sales advice"]
}
```

## MVP Output

```json
{
  "persona": "RevOps manager at a 100-500 employee B2B SaaS company",
  "problem_space": "CRM data quality and sales forecasting hygiene",
  "summary": "RevOps managers repeatedly complain that forecast accuracy depends on brittle CRM hygiene workflows, unclear ownership, and manual cleanup before pipeline reviews.",
  "pain_points": [
    {
      "title": "Manual cleanup before forecast meetings",
      "description": "Teams describe recurring spreadsheet exports, stale opportunity stages, and last-minute manager follow-up before forecast calls.",
      "severity": "high",
      "frequency_score": 84,
      "persona_fit": "high",
      "trigger_events": ["quarter-end forecast", "pipeline review", "new sales leader"],
      "workarounds": ["spreadsheet audits", "manual Slack reminders", "custom validation rules"],
      "verbatim_snippets": [
        {
          "text": "Every forecast call starts with chasing reps to update fields.",
          "source_url": "https://example.com/forum/thread",
          "source_type": "forum",
          "fetched_at": "2026-05-02T00:00:00Z"
        }
      ],
      "evidence": [
        {
          "claim": "Multiple support and community threads mention stale opportunity fields before forecast meetings.",
          "source_url": "https://example.com/support/community-post",
          "source_type": "support_page",
          "query": "RevOps stale opportunity fields forecast meeting",
          "rank": 3
        }
      ],
      "confidence": "medium"
    }
  ],
  "language_patterns": ["chasing reps", "forecast hygiene", "manual cleanup"],
  "source_mix": {
    "forums": 8,
    "reviews": 12,
    "support_pages": 6,
    "community_posts": 14
  },
  "gaps": ["Few sources state company size, so persona fit is inferred from context."]
}
```

## Pain Scoring

Pain scores are 0-100:

- 30 points: frequency across distinct sources and domains.
- 25 points: severity based on blocked workflows, revenue impact, time cost, or emotional intensity.
- 20 points: persona fit from explicit role, company context, vocabulary, and workflow ownership.
- 15 points: evidence quality, favoring first-person posts, detailed reviews, official support communities, and recent sources.
- 10 points: recency and geographic or market relevance.

Automatic caps:

- Cap at 60 when a pain appears only in AI synthesis without fetched source evidence.
- Cap at 55 when the persona is inferred but never directly supported.
- Cap at 45 when all evidence comes from one domain.
- Cap at 35 when the pain may belong to an excluded persona or unrelated market.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
persona-pain extract \
  --brief persona.json \
  --out pains.json \
  --csv pains.csv \
  --brief-md pain-map.md
```

Minimum viable UI after CLI validation:

- Persona research brief form
- Query plan preview with source-type toggles
- Credit estimate and collection status
- Pain-point table sorted by score
- Evidence drawer with snippets and source links
- Language-pattern and workaround views
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate available credits before broad forum and review collection.
- `web_search`: discover forum threads, review pages, support posts, help articles, and public communities.
- Google SERP parsing: preserve query, rank, title, snippet, URL, and source type for evidence lineage.
- `web_fetch`: fetch dynamic forum, review, and support pages with JS rendering and captcha handling.
- country, city, and device targeting: compare pain language across regional markets or mobile-heavy personas.
- `ai_chat_completion`: classify persona fit, extract pain themes, summarize evidence, dedupe near-duplicate complaints, and return structured JSON with sources.

## Guardrails

- Use only public, indexable sources; do not scrape private communities, gated customer portals, or personal data.
- Preserve source URL, query, rank, fetch time, and quote context for every claim.
- Treat quotes as evidence of language, not universal truth.
- Separate first-person complaints from vendor-authored support content.
- Label inferred persona fit and keep confidence low when role or company context is unclear.
- Avoid medical, legal, financial, or employment advice; report user complaints without prescribing actions.
- Do not expose usernames unless they are necessary public organization names.
