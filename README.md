# Massive MCP Ideas

This repository contains 100 buildable product concepts for the Massive MCP server. Each idea was expanded into a small MVP package with a product README, implementation sketch, and evaluation plan, then wired into a shared CLI runner.

The work is organized as a swarm output: one project folder per idea, each scoped around Massive MCP primitives for web fetch, search, chatbot answers with sources, geo targeting, JS rendering, captcha handling, and account status checks. The CLI turns those project briefs into runnable Massive-style research workflows.

## What Is In This Repo

- `swarm/SWARM.md`: the original 100-idea assignment manifest.
- `swarm/projects/001-...` through `swarm/projects/100-...`: one folder per concept.
- `src/`: the shared runner, CLI, Massive client adapters, prompt builder, and report renderer.
- `examples/sample-input.json`: a reusable input payload for mock and live runs.
- `test/`: coverage tests for loading and running the idea set.
- Each project folder contains:
  - `README.md`: product framing, target user, workflow, Massive MCP usage, and guardrails.
  - `prototype.md`: data model, CLI/UI/API shape, prompts, pipeline, and implementation notes.
  - `evaluation.md`: test cases, metrics, failure modes, acceptance criteria, and launch gates.

## Massive MCP Assumptions

The project briefs assume the Massive MCP server exposes these tools:

- `web_fetch`: fetch a URL as Markdown, rendered HTML, or raw HTML, with country, city, and device targeting.
- `web_search`: run Google searches and return structured SERP data, including organic results, AI overview, and People Also Ask data.
- `ai_chat_completion`: query ChatGPT, Gemini, Perplexity, or Copilot and return an answer with sources.
- `account_status`: check remaining credits before running larger jobs.

Many concepts also rely on Massive Web Render capabilities such as JS rendering, captcha handling, and localized browsing.

## Idea Categories

The 100 ideas cover:

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

## Quick Start

Run the tests:

```bash
npm test
```

List all ideas:

```bash
npm run list
```

Inspect one idea:

```bash
node src/cli.js show --idea 088
```

Run one idea in deterministic mock mode:

```bash
node src/cli.js run \
  --idea 001 \
  --mode mock \
  --input examples/sample-input.json \
  --format markdown
```

Generate mock reports for all 100 ideas:

```bash
npm run run:all
```

Run against the live Massive Web Render API:

```bash
export MASSIVE_TOKEN=...
node src/cli.js run \
  --idea 100 \
  --mode live \
  --input examples/sample-input.json \
  --out runs/100-live.json
```

The live adapter calls the same Massive endpoints used by the MCP server:

- `/users` for `account_status`
- `/browser` for `web_fetch`
- `/search` for `web_search`
- `/ai` for `ai_chat_completion`

## Repository Browsing

Browse the manifest:

```bash
sed -n '1,140p' swarm/SWARM.md
```

Open one project:

```bash
ls swarm/projects/088-mcp-demo-app
sed -n '1,120p' swarm/projects/088-mcp-demo-app/README.md
```

Check repo coverage:

```bash
find swarm/projects -mindepth 1 -maxdepth 1 -type d -name '???-*' | wc -l
find swarm/projects -mindepth 2 -maxdepth 2 -type f | wc -l
```

Expected counts:

- 100 named project folders
- 300 project files

## Review Notes

This repository is now an executable starter kit, not 100 fully separate production apps. The implementation deliberately uses one shared runner so every idea can be listed, inspected, and run with the same command shape.

The review pass confirmed:

- All 100 named project folders are present.
- Every project has `README.md`, `prototype.md`, and `evaluation.md`.
- Empty setup placeholder folders were removed.
- `.DS_Store` is ignored.
- `npm test` passes.
- Mock mode can generate reports for all 100 ideas without requiring a Massive token.

The main gap is intentional: the shared runner is a foundation. The best next step is to promote the strongest ideas into dedicated product implementations, starting with `088-mcp-demo-app`, `001-yc-lead-enricher`, or `100-massive-mcp-playground`.
