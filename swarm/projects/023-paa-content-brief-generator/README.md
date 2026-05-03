# People Also Ask Content Brief Generator

People Also Ask Content Brief Generator turns a topic, keyword, or URL into a source-backed content brief built from Google People Also Ask questions, related SERP evidence, fetched source pages, and grounded AI synthesis.

The first version is intentionally narrow: given one seed topic and audience, collect People Also Ask questions and SERP context, cluster buyer questions by intent, and generate an editor-ready brief for SEO, content, and product marketing teams.

## Target User

Primary users:

- Content marketers planning SEO articles around searcher questions.
- Editorial teams refreshing existing pages with better question coverage.
- Product marketers turning buyer objections into comparison and explainer content.
- Agencies producing repeatable briefs for many client topics.
- Founders validating the language buyers use before writing landing pages.

## Core Workflow

1. User enters a content brief request:
   - Seed topic or keyword
   - Optional seed URL
   - Audience
   - Geography
   - Device
   - Content format
   - Competitor or source domains to include or exclude
2. App expands the seed into query variants for informational, commercial, comparison, problem-aware, and how-to intent.
3. Massive MCP runs:
   - `account_status` to preflight credits and feature availability
   - `web_search` with Google SERP parsing to capture People Also Ask, organic results, snippets, and related SERP features
   - country, city, and device targeting to detect localized or mobile-specific question sets
   - `web_fetch` with JS rendering for ranking pages, competitor pages, documentation, forums, and publisher articles
   - captcha handling when ranking pages or SERPs block normal collection
   - `ai_chat_completion` to classify questions, synthesize answer angles, and draft the brief with cited sources
4. App deduplicates and normalizes questions by meaning, entity, modifier, and intent.
5. AI clusters questions into article sections, FAQ blocks, objection themes, and follow-up content opportunities.
6. User gets a content brief with recommended title, search intent, outline, PAA map, cited answer notes, source gaps, and exportable Markdown and JSON.

## MVP Inputs

```json
{
  "topic": "SOC 2 compliance automation",
  "seed_url": "https://example.com/soc-2-automation",
  "audience": "startup founders and security leads",
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "content_format": "long-form SEO article",
  "intent_focus": ["informational", "commercial", "comparison"],
  "include_domains": ["aicpa-cima.com", "secureframe.com", "vanta.com"],
  "exclude_domains": ["reddit.com"],
  "exclusions": ["SOC 2 auditor job listings", "unrelated SOX compliance"]
}
```

## MVP Output

```json
{
  "topic": "SOC 2 compliance automation",
  "brief_summary": "Searchers want to understand what SOC 2 automation software does, whether it replaces auditors, how long implementation takes, and how tools compare with manual evidence collection. The brief should lead with workflow clarity, then cover auditor involvement, costs, timelines, and buyer evaluation criteria.",
  "recommended_title": "SOC 2 Compliance Automation: What It Does, How It Works, and When to Use It",
  "primary_intent": "informational_commercial",
  "question_clusters": [
    {
      "name": "Basics and definitions",
      "intent": "informational",
      "questions": [
        "What is SOC 2 automation?",
        "Can SOC 2 be automated?"
      ],
      "brief_guidance": "Define automation as evidence collection, control monitoring, policy workflows, and audit readiness rather than auditor replacement."
    }
  ],
  "outline": [
    {
      "heading": "What SOC 2 compliance automation means",
      "target_questions": ["What is SOC 2 automation?", "Can SOC 2 be automated?"],
      "answer_notes": [
        {
          "claim": "Automation tools collect evidence and monitor controls, but an independent auditor still performs the audit.",
          "source_url": "https://example.com/soc-2-guide",
          "source_type": "fetched_page"
        }
      ]
    }
  ],
  "faq": [
    {
      "question": "Can SOC 2 be fully automated?",
      "short_answer": "No. Software can automate evidence collection, control monitoring, reminders, and readiness workflows, but the final SOC 2 report still requires an independent CPA firm.",
      "evidence": [
        {
          "source_url": "https://example.com/soc-2-automation",
          "source_type": "serp_result",
          "query": "SOC 2 compliance automation",
          "rank": 2
        }
      ]
    }
  ],
  "source_domains": [
    {
      "domain": "example.com",
      "role": "vendor",
      "serp_mentions": 3,
      "paa_mentions": 2,
      "fetched_pages": 1
    }
  ],
  "content_gaps": [
    "Top-ranking pages answer what automation is, but few explain where auditors still fit in the process."
  ],
  "confidence": "high"
}
```

## Question Scoring

Questions are scored 0-100:

- 25 points: appears in People Also Ask or repeated SERP question features.
- 20 points: direct fit to the seed topic and target audience.
- 15 points: intent value for the requested content format.
- 15 points: source evidence from ranking pages, official pages, docs, or reputable publishers.
- 10 points: commercial or objection-handling usefulness.
- 10 points: freshness and geography/device consistency.
- 5 points: uniqueness after semantic deduplication.

Automatic caps:

- Cap at 60 when a question appears only in AI output and not in SERP or fetched-page evidence.
- Cap at 55 when the question is relevant to the broad category but not the seed topic.
- Cap at 45 when sources conflict or the answer requires legal, medical, or financial expertise beyond a content brief.
- Cap at 35 when the question matches an exclusion.

## First Build

Ship as a CLI that writes JSON and Markdown:

```bash
paa-brief generate \
  --brief paa-brief-input.json \
  --out paa-brief-output.json \
  --brief-md content-brief.md
```

Minimum viable UI after CLI validation:

- Topic and audience setup form
- Query plan preview with estimated credit use
- Run status for SERP, PAA extraction, fetch, and synthesis stages
- Question cluster table with intent and confidence
- Outline editor with linked evidence
- FAQ block preview
- Export buttons for Markdown and JSON

## Massive MCP Usage

- `account_status`: estimate available credits and confirm Google SERP parsing, JS rendering, captcha handling, and targeting capability before a run.
- `web_search`: collect Google SERPs, People Also Ask questions, organic snippets, related searches, and result metadata.
- Google SERP parsing: preserve query, rank, title, snippet, URL, question text, SERP feature type, and localized targeting fields.
- Country, city, and device targeting: compare PAA variants across buyer regions and mobile or desktop results.
- `web_fetch`: fetch ranking pages, competitor posts, official docs, and support pages with JS rendering and captcha handling.
- `ai_chat_completion`: deduplicate questions, classify intent, synthesize answer notes, generate outlines, and draft brief sections with source references.

## Guardrails

- Preserve query, location, device, rank, URL, and fetched-at lineage for every question and claim.
- Do not present People Also Ask results as search-volume data.
- Keep SERP evidence, fetched-page evidence, and AI-synthesized recommendations visibly separate.
- Cite every factual answer note with a SERP result, fetched page, or AI-answer source.
- Label uncertainty when question wording varies across regions or devices.
- Avoid scraping gated reports, private communities, or personal contact data.
- Do not produce medical, legal, or financial advice; frame sensitive topics as editorial research requiring expert review.
