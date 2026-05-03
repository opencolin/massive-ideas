# Public API Availability and Docs Monitor

Idea 70 in the Massive MCP rolling swarm: a monitor that watches public API documentation, status pages, changelogs, SDK docs, OpenAPI specs, and developer portals for signs that an API is available, deprecated, region-limited, newly launched, or materially changed.

This is public documentation and availability research only. It does not test live endpoints, probe infrastructure, fuzz parameters, bypass access controls, or make claims from private account-only behavior.

## Problem

Teams often learn about public API changes too late. Docs can quietly add beta features, remove endpoints, change authentication requirements, introduce regional limits, rename SDKs, update rate-limit guidance, or mark APIs as deprecated before a formal announcement reaches customers.

Manual monitoring is fragile because API information is spread across developer portals, reference docs, changelogs, status pages, GitHub repositories, help centers, and search snippets. This product turns public API documentation monitoring into a source-backed research feed.

## Product

Public API Availability and Docs Monitor accepts a company, product, domain, API name, or known documentation URL list. It discovers public documentation surfaces, captures rendered snapshots, classifies availability signals, and summarizes material changes with citations.

The output is intended for product, partnerships, developer relations, platform strategy, sales engineering, and market research teams that need to understand what a company publicly says about its APIs.

## Target Users

- Product and platform teams tracking competitor or partner API launches.
- Developer relations teams watching ecosystem docs, SDKs, changelogs, and deprecations.
- Partnerships and business development teams researching integration readiness.
- Sales engineering and solutions teams maintaining integration battlecards.
- Analysts and investors following public platform strategy.
- Internal API governance teams monitoring public docs for consistency.

## Public Sources

Primary public sources:

- API reference pages, developer portals, quickstarts, guides, tutorials, and migration docs.
- OpenAPI, Swagger, Postman, AsyncAPI, GraphQL schema, or SDK documentation when publicly linked.
- Changelogs, release notes, roadmap posts, blog announcements, and developer newsletters.
- Status pages and incident histories that mention public API components.
- GitHub repositories, package registries, SDK docs, examples, and generated reference docs.
- Help center articles describing public integration limits, auth flows, and rate limits.
- Search results and snippets that reveal indexed public documentation pages.

Excluded sources:

- Authenticated dashboards, private partner portals, customer-only docs, paid documentation, or beta programs behind access control.
- Live endpoint tests, synthetic transactions, parameter probing, fuzzing, scanning, or security testing.
- Credential use, leaked docs, unpublished files, account scraping, or bypassing rate limits and access controls.

## Core Checks

- Documentation discovery: find official public API docs, SDKs, status components, changelogs, and indexed reference pages.
- Availability classification: label APIs as public, beta, preview, deprecated, removed, waitlisted, region-limited, partner-only by docs, or inconclusive.
- Change detection: compare current and previous public documentation snapshots for meaningful API availability and behavior changes.
- Capability extraction: capture endpoints, resources, SDK names, auth methods, scopes, rate-limit statements, regions, versioning, deprecation dates, and launch language.
- Regional and device comparison: detect publicly documented differences by country, city, desktop, and mobile profile.
- Source-backed summary: cite every finding with source URL, page title, fetch context, and short evidence excerpts.

## Why Massive MCP

- `web_search` discovers developer portals, indexed docs, changelogs, SDK pages, and status-page components.
- Google SERP parsing helps find public API pages that are not linked from current navigation.
- `web_fetch` captures public pages with JavaScript rendering for modern docs frameworks.
- Country, city, and device targeting reveals public regional availability language and localized developer docs.
- Captcha handling supports ordinary access to public documentation when a normal visitor would encounter a challenge.
- `ai_chat_completion` converts public documentation diffs into grounded availability summaries with citations.
- `account_status` supports quota planning for scheduled monitoring across large watchlists.

## Output

Each monitoring run returns:

- Availability summary by API, product, version, region, and source confidence.
- Material documentation changes, including old excerpt, new excerpt, source URL, and snapshot metadata.
- New, removed, deprecated, or renamed public API resources found in docs.
- Auth, scope, rate-limit, pricing, region, and versioning statements extracted from public text.
- Status-page and changelog signals linked to affected API components.
- Inconclusive page list for blocked, missing, redirected, gated, or unstable documentation.
- Exportable Markdown, JSON, and CSV artifacts.

## Guardrails

- Frame findings as public documentation and availability research, not proof of live endpoint behavior.
- Never call, probe, fuzz, scan, or test API endpoints.
- Never use credentials, tokens, leaked docs, private portals, or access-controlled partner materials.
- Never bypass authentication, paywalls, robots restrictions, private docs, or rate limits.
- Do not infer security posture or vulnerability status from documentation.
- Label gated, missing, blocked, or contradictory pages as inconclusive.
- Require source URLs and evidence excerpts for every reported claim.

## Example Summary

```text
Company: ExamplePay
Run date: 2026-05-02
Scope: Public API documentation and availability statements only

Material public-doc changes:
- Transfers API: Docs now describe the API as "generally available" instead of "beta."
- Webhooks: A new "subscription.updated" event appears in the public webhook reference.
- Legacy payouts: Migration guide added a deprecation date of 2026-09-30.
- EU availability: Public docs now say card issuing APIs are available in Germany and France.

Review prompts:
- Update integration inventory for newly documented webhook coverage.
- Ask partner team whether GA language changes integration positioning.
- Review customer migration timelines for the legacy payouts deprecation.

Boundary:
- No live API endpoints were called or tested.
```
