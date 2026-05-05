# Massive MCP Ideas

Executable starter kit for 103 product ideas built around the Massive MCP server.

This repo started as a swarm-generated catalog of ideas, then became a runnable CLI that can list, inspect, and run every concept through a shared Massive-style research pipeline. Each idea has its own product brief, prototype sketch, and evaluation plan, while the CLI provides one consistent way to test the whole set.

## Highlights

- 103 Massive MCP product concepts, from lead enrichment to AI citation scoring.
- 309 project docs: one `README.md`, `prototype.md`, and `evaluation.md` per idea.
- Shared Node.js CLI for listing, inspecting, and running ideas.
- Static idea atlas in `docs/` for browsing, searching, filtering, and opening project docs.
- Deterministic mock mode for local demos without a Massive token.
- Live mode that calls Massive Web Render endpoints when `MASSIVE_TOKEN` is set.
- No runtime package dependencies; Node 20+ is enough.

## Massive Capabilities Used

The ideas and runner are built around four Massive MCP primitives:

- `account_status`: check credit balance before a run.
- `web_search`: run Google searches and return structured SERP evidence.
- `web_fetch`: fetch public pages as Markdown, rendered HTML, or raw HTML.
- `ai_chat_completion`: synthesize source-backed answers from ChatGPT, Gemini, Perplexity, or Copilot.

The briefs also assume Massive Web Render features such as JS rendering, captcha handling, country/city targeting, and device emulation.

## Quick Start

Run the tests:

```bash
npm test
```

List all 103 ideas:

```bash
npm run list
```

Inspect a single idea:

```bash
node src/cli.js show --idea 088
```

Run one idea in mock mode:

```bash
node src/cli.js run \
  --idea 001 \
  --mode mock \
  --input examples/sample-input.json \
  --format markdown
```

Generate mock reports for all 103 ideas:

```bash
npm run run:all
```

Build the static idea atlas:

```bash
npm run build:web
open docs/index.html
```

## Live Massive Runs

Set a Massive API token, then use `--mode live`:

```bash
export MASSIVE_TOKEN=...

node src/cli.js run \
  --idea 100 \
  --mode live \
  --input examples/sample-input.json \
  --out runs/100-live.json
```

Live mode calls:

- `/users` for account status
- `/search` for SERP evidence
- `/browser` for rendered page fetches
- `/ai` for chatbot completions with sources

Use mock mode for development and live mode only when you want real Massive calls and credit usage.

## CLI Commands

```bash
node src/cli.js list [--json]
node src/cli.js show --idea 001
node src/cli.js run --idea 001 [--input examples/sample-input.json] [--mode mock|live] [--format json|markdown]
node src/cli.js run-all [--mode mock|live] [--out runs/mock-all]
```

Useful options:

- `--idea`: idea id, slug, or full folder name, such as `001`, `massive-mcp-playground`, or `100-massive-mcp-playground`.
- `--mode`: `mock` for deterministic local fixtures, `live` for Massive API calls.
- `--input`: JSON payload with query, category, target country/city/device, URLs, and model.
- `--format`: `json` or `markdown` for single-idea runs.
- `--out`: output file for `run`, or output directory for `run-all`.

## Repo Layout

```text
.
|-- examples/
|   `-- sample-input.json
|-- docs/
|   |-- index.html
|   |-- styles.css
|   |-- app.js
|   `-- ideas-data.js
|-- src/
|   |-- cli.js
|   |-- ideas.js
|   |-- massive-client.js
|   |-- prompts.js
|   |-- report.js
|   `-- runner.js
|-- swarm/
|   |-- SWARM.md
|   `-- projects/
|       |-- 001-yc-lead-enricher/
|       |-- ...
|       `-- 103-massive-meetup-finder/
`-- test/
    `-- ideas.test.js
```

Each project folder contains:

- `README.md`: product framing, target user, workflow, Massive MCP usage, and guardrails.
- `prototype.md`: data model, CLI/UI/API shape, prompts, pipeline, and implementation notes.
- `evaluation.md`: test cases, metrics, failure modes, acceptance criteria, and launch gates.

## Idea Categories

The first 100 ideas cover:

- Sales and lead enrichment
- Market research and competitive intelligence
- SEO, content, and AI Overview tracking
- Product, docs, onboarding, pricing, and QA workflows
- Finance, diligence, investing, and analyst workflows
- Recruiting, hiring signals, and talent-market research
- Vendor, procurement, compliance-claims, and public-docs monitoring
- Local, geo-targeted, travel, ecommerce, and listing research
- AI answer comparison, citation quality, hallucination checks, and demos
- Personal research tools for deals, events, buying decisions, and itinerary freshness

The newest additions turn three existing Massive repos into documented idea entries:

- `101-massive-brand-visibility-tracker`: daily AI brand visibility tracking based on `opencolin/massive`.
- `102-massive-consensus-engine`: multi-LLM consensus and lead enrichment based on `opencolin/massive-consensus`.
- `103-massive-meetup-finder`: city/topic meetup calendar discovery based on `opencolin/massive-meetup`.

## Good Starting Points

- `001-yc-lead-enricher`: closest to the original YC lead-enrichment test.
- `088-mcp-demo-app`: best developer-facing showcase of fetch/search/chat differences.
- `100-massive-mcp-playground`: best foundation for a tool-call playground.
- `101-massive-brand-visibility-tracker`: strongest existing app-shaped example for recurring brand monitoring.
- `102-massive-consensus-engine`: best example for comparing Massive MCP with direct API orchestration.
- `103-massive-meetup-finder`: best local-search example with contact enrichment and CSV output.
- `082-source-citation-quality-scorer`: useful for evaluating chatbot source quality.
- `011-pricing-tracker`: practical geo/device-targeted web-rendering use case.

## Validation

The repo currently verifies that:

- All 103 named idea folders are present.
- Every idea has the required three docs.
- The generated idea atlas contains 103 ideas.
- Idea lookup works by id and slug.
- A representative idea can run in mock mode.
- Mock `run-all` can generate reports for all 103 ideas.

Run:

```bash
npm test
node src/cli.js run-all --mode mock --input examples/sample-input.json --out /tmp/massive-ideas-smoke
```

## Current Scope

This is a shared executable starter kit, not 103 fully separate production apps. The runner proves that every idea can be loaded, prompted, sourced, synthesized, and reported through one Massive-style workflow.

The next step is to promote the strongest ideas into dedicated products with real UI, persistence, richer schemas, and tighter evaluation harnesses.
