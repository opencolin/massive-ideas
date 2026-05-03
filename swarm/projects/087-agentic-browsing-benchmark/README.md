# Agentic Browsing Benchmark

Idea 87 in the Massive MCP rolling swarm: a public rendering and research benchmark for agentic browsing on JavaScript-heavy websites.

## Problem

Agents increasingly use the web as a live research surface, but many important public sites are difficult to understand with plain HTML fetches. Content may require JavaScript hydration, delayed API calls, consent handling, client-side routing, localized redirects, mobile layouts, or search-result context before the page can be interpreted correctly.

Existing benchmarks often reward final answer quality without measuring the browsing substrate: whether the agent actually observed the rendered page, handled public page friction responsibly, preserved sources, and distinguished unavailable content from content that simply needed rendering.

## Product

Agentic Browsing Benchmark is a repeatable test suite for evaluating how well browser-capable research agents complete public information tasks on JS-heavy websites. It is framed as a rendering, retrieval, and citation benchmark. It does not test intrusion, private data access, account takeover, vulnerability discovery, or bypassing protected systems.

The benchmark runs a curated set of tasks against public pages, captures tool traces, and scores each agent on observation quality, task completion, source grounding, and responsible handling of access friction.

## Target Users

- AI agent builders comparing browser, fetch, search, and chatbot retrieval strategies.
- Research teams measuring whether model answers are grounded in rendered public web evidence.
- QA teams validating Massive MCP integrations against realistic JS-heavy pages.
- Product teams choosing browsing agents for market research, SEO, ecommerce, travel, civic, or documentation workflows.

## Core Workflow

1. Maintainer defines a benchmark pack with public target URLs, task prompts, allowed tools, geographic/device profiles, and expected evidence.
2. Runner checks `account_status` and estimates required fetch/search/chat volume.
3. Runner executes each task with a fixed tool budget and records every `web_fetch`, `web_search`, and `ai_chat_completion` call.
4. Massive MCP renders JS-heavy pages with the requested country, city, and device settings.
5. Evaluator compares the final answer, cited sources, rendered observations, and trace quality against a rubric.
6. Report exports leaderboard-ready JSON plus a human-readable research summary.

## Massive MCP Tools Used

- `web_fetch`: fetch raw HTML, rendered HTML, markdown, and page evidence for public URLs.
- JS rendering: evaluate hydrated content, client-side routing, lazy loading, and dynamically populated sections.
- Captcha handling: classify benchmark attempts as observed, blocked, or inconclusive without treating access friction as failure to be bypassed.
- Country/city/device targeting: test localized and mobile-only rendering behavior.
- `web_search`: gather Google SERP context, structured organic results, AI overview, and People Also Ask when the task begins from a query.
- Google SERP parsing: compare answerable public snippets against rendered-page evidence.
- `ai_chat_completion`: collect multi-assistant answers with sources for baseline comparison or assisted judging.
- `account_status`: estimate cost before benchmark runs and stop gracefully when credits are low.

## Benchmark Dimensions

- Render fidelity: did the agent observe the post-JS page state rather than raw shell HTML?
- Navigation competence: did it follow public links, tabs, filters, pagination, and client-side routes needed for the task?
- Localization awareness: did it respect requested country, city, and device contexts?
- Evidence grounding: are final claims tied to pages the agent actually fetched or searched?
- Friction handling: did it label captcha, consent, geoblock, paywall, or unavailable states honestly?
- Answer usefulness: is the answer concise, correct, and actionable for a public research user?

## MVP Scope

The MVP is a CLI-style benchmark runner spec plus fixture format. It supports a small benchmark pack of public research tasks, records Massive MCP tool traces, and produces JSON/Markdown evaluation reports. It intentionally avoids authenticated websites, private content, scraping circumvention, vulnerability checks, or security-oriented scoring.

## Next Implementation Steps

- Build the benchmark pack schema and three seed task packs.
- Implement a trace recorder around Massive MCP calls.
- Add deterministic scoring helpers for source coverage, rendered evidence, and answer completeness.
- Add an optional LLM judge prompt constrained to the captured evidence.
- Publish example reports and a public leaderboard format.
