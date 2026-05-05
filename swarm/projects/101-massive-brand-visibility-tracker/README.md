# Massive Brand Visibility Tracker

MVP for a daily AI brand-visibility tracker based on [`opencolin/massive`](https://github.com/opencolin/massive). It queries ChatGPT, Gemini, Perplexity, and Copilot, extracts brand mentions, and tracks share-of-voice drift.

The key idea is generative engine optimization measurement: when buyers ask AI assistants for recommendations, which brands appear, where do they rank, and how does that change day to day?

## Target User

Marketing, growth, and founder-led sales teams that care about AI assistant visibility for their category.

## Core Workflow

1. User defines a category, prompts, tracked brands, and aliases.
2. Runner checks `account_status` before the daily job.
3. For each prompt and model, `ai_chat_completion` collects the assistant answer with sources.
4. Extractor finds brand mentions by first occurrence and maps aliases to canonical brands.
5. Reporter compares today against the previous run and writes:
   - Per-model rankings
   - New, dropped, up, and down movements
   - Cross-model consensus table
   - Share-of-voice CSV
6. User reviews a daily Markdown report and trend file.

## MVP Inputs

```json
{
  "category": "AI coding tools",
  "prompts": [
    "What are the best AI coding tools for software teams?",
    "Which AI coding assistants should engineering teams evaluate?"
  ],
  "brands": [
    {
      "name": "Cursor",
      "aliases": ["Cursor", "cursor.com"]
    },
    {
      "name": "GitHub Copilot",
      "aliases": ["Copilot", "GitHub Copilot"]
    }
  ],
  "models": ["chatgpt", "gemini", "perplexity", "copilot"]
}
```

## MVP Output

```json
{
  "date": "2026-05-05",
  "category": "AI coding tools",
  "rankings": [
    {
      "model": "perplexity",
      "prompt": "What are the best AI coding tools for software teams?",
      "brands": [
        { "brand": "Cursor", "rank": 1, "first_index": 42 },
        { "brand": "GitHub Copilot", "rank": 2, "first_index": 81 }
      ],
      "sources": [
        { "url": "https://example.com/review", "title": "AI coding tools review" }
      ]
    }
  ],
  "movements": [
    { "brand": "Cursor", "model": "perplexity", "delta": 1 }
  ]
}
```

## Massive MCP Usage

- `account_status`: fail early when a scheduled run lacks credits.
- `ai_chat_completion`: collect model answers and structured sources.
- `web_search`: optional baseline for comparing AI visibility against Google visibility.
- `web_fetch`: verify cited pages when a movement looks meaningful.

## Guardrails

- Treat model answers as visibility measurements, not factual endorsements.
- Preserve raw responses for reprocessing with improved aliases.
- Keep extraction deterministic and auditable.
- Report source coverage separately from ranking position.
- Never infer market share from AI mention share without clear caveats.

## Next Build Steps

- Port the existing repo's config-driven collector into this shared runner.
- Add a small dashboard for day-over-day movement and share-of-voice.
- Add alert rules for rank drops, new competitor mentions, and missing source coverage.
