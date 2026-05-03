# Broken JS Page Detector

Idea 40 in the Massive MCP rolling swarm: a detector for public pages that appear healthy in raw HTML but break after JavaScript renders.

## Problem

Modern public websites often ship critical content through client-side JavaScript. Standard uptime checks and simple HTTP fetches can miss failures such as empty product grids, broken hydration, blocked assets, consent overlays covering the page, region-specific rendering bugs, and mobile-only script errors. These pages may return `200 OK` while real users and search crawlers see a blank, incomplete, or unusable page.

## Product

Broken JS Page Detector audits public URLs by comparing the raw fetch, rendered DOM, screenshot-visible content, and search-facing expectations. It produces a clear pass/fail report with evidence, severity, and likely root cause.

## Why Massive MCP

Massive MCP is a strong fit because it already exposes the primitives needed to inspect JS-heavy pages from several angles:

- `web_fetch` can retrieve raw HTML and render JavaScript to compare pre-render and post-render states.
- Country, city, and device targeting can reveal regional, local, and mobile-only rendering failures.
- Captcha handling helps separate true page breakage from bot mitigation noise.
- Google SERP parsing can compare indexed snippets and titles against what the page currently renders.
- `ai_chat_completion` can summarize evidence into a human-readable diagnosis with sources.

## Core Checks

- Blank render detection: visible text, DOM node count, viewport screenshot entropy, and main content selectors.
- Hydration mismatch: raw HTML promises content that disappears, changes, or never hydrates.
- Critical asset failure: failed scripts, blocked bundles, missing API data, or CORS/CSP errors inferred from rendered state.
- Overlay obstruction: cookie banners, captchas, modals, or geoblocks hiding primary content.
- Device and region drift: desktop works while mobile fails, or US works while another market breaks.
- Search mismatch: SERP title/snippet indicate content that no longer appears after rendering.

## User

The first users are growth, SEO, web operations, and QA teams that own public marketing pages, product pages, documentation, comparison pages, and localized landing pages.

## Output

Each audit returns:

- Overall status: healthy, degraded, broken, blocked, or inconclusive.
- Evidence: raw HTML signals, rendered page signals, targeting context, screenshots or extracted text, and SERP references when available.
- Likely cause: client render failure, data dependency failure, bot block, geo/device issue, or content mismatch.
- Recommended next step: reproduce conditions, inspect a specific bundle/API, whitelist monitoring, or fix content parity.

## MVP Scope

The MVP takes a URL list, runs a small matrix of render profiles, scores each page, and emits a Markdown or JSON report. It does not need authenticated sessions, private crawl access, or deep browser devtools integration to prove value.

