# Prototype

## Prototype Goal

Build a lightweight monitor that accepts a company domain, API name, developer portal URL, or documentation URL list, discovers public API documentation surfaces, captures rendered snapshots, compares them with previous snapshots, and produces a concise, source-backed availability and docs-change report.

The prototype should prove that Massive MCP can support public API availability research without endpoint testing, probing, credential use, or private portal access.

## User Flow

1. User enters a company, product, API name, domain, or known public documentation URLs.
2. System discovers official public API documentation, SDK docs, changelogs, status components, and indexed reference pages.
3. System fetches each public page with rendering and optional country, city, and device profiles.
4. System normalizes visible documentation text and stores a timestamped snapshot.
5. System compares current text with the prior snapshot for the same URL and targeting profile.
6. System classifies availability language, API resource changes, deprecations, and inconclusive sources.
7. System emits a Markdown or JSON report with source URLs, old text, new text, and research prompts.

## Discovery Strategy

Initial search and URL patterns:

```text
site:{domain} API documentation
site:{domain} developer docs OR developer portal
site:{domain} API reference OR reference
site:{domain} OpenAPI OR Swagger OR Postman
site:{domain} GraphQL API OR schema
site:{domain} SDK OR client library
site:{domain} changelog API OR release notes API
site:{domain} API deprecation OR migration guide
site:{domain} rate limits OR authentication scopes
site:{domain} status API OR incident API
```

Common first-party paths:

```text
/developers
/developer
/docs
/api
/api-reference
/reference
/changelog
/release-notes
/status
/openapi.json
/swagger.json
/postman
/sdk
```

The prototype should canonicalize URLs, deduplicate pages, prefer first-party and officially linked sources, and keep a conservative crawl budget. External hosts are allowed only when they are official documentation, status, package, repository, or docs-platform locations linked by the company.

## Fetch Policy

Allowed:

- Public `GET` requests for official public documentation pages.
- JavaScript rendering for docs frameworks, generated references, and developer portals.
- Country, city, and device targeting to observe public regional documentation.
- Captcha handling only when it enables ordinary public-page access.
- Fetching public static spec files when they are linked from public docs.

Disallowed:

- Calling API endpoints to verify behavior or availability.
- Login, signup, token use, partner portals, private beta docs, or customer dashboards.
- Form submission, synthetic transactions, mutation requests, or workflow automation.
- Parameter probing, endpoint fuzzing, scanning, exploit checks, or security testing.
- Attempts to bypass access controls, paid access, private documentation, or rate limits.

## Data Model

```json
{
  "company": "ExamplePay",
  "run_id": "api_docs_2026_05_02_001",
  "scope": "public_documentation_only",
  "targeting_profile": {
    "country": "US",
    "city": "San Francisco",
    "device": "desktop"
  },
  "sources": [
    {
      "url": "https://example.com/docs/api/transfers",
      "canonical_url": "https://example.com/docs/api/transfers",
      "source_type": "api_reference",
      "title": "Transfers API",
      "status": 200,
      "rendered": true,
      "fetched_at": "2026-05-02T12:00:00-07:00",
      "snapshot_hash": "sha256:current",
      "previous_snapshot_hash": "sha256:previous"
    }
  ],
  "availability_findings": [
    {
      "api": "Transfers API",
      "availability": "generally_available",
      "previous_availability": "beta",
      "source_url": "https://example.com/docs/api/transfers",
      "old_excerpt": "The Transfers API is available in beta.",
      "new_excerpt": "The Transfers API is generally available.",
      "confidence": "high"
    }
  ],
  "doc_changes": [
    {
      "change_type": "new_webhook_event",
      "api": "Webhooks",
      "source_url": "https://example.com/docs/api/webhooks",
      "old_excerpt": "Supported events include payment.created.",
      "new_excerpt": "Supported events include payment.created and subscription.updated.",
      "summary": "The public webhook reference added subscription.updated.",
      "research_prompt": "Check whether integration docs or sample apps need updates.",
      "confidence": "high"
    }
  ],
  "inconclusive_sources": []
}
```

## Availability Labels

Suggested classifier labels:

| Label | Example public-doc signal |
| --- | --- |
| Public | Docs describe open signup, public access, or available API usage. |
| Generally available | Docs use GA, stable, production-ready, or v1 availability language. |
| Beta or preview | Docs use beta, preview, experimental, limited preview, or early access. |
| Waitlisted | Docs mention request access, waitlist, or approval before use. |
| Partner-only by docs | Public docs say access requires partner approval or contract terms. |
| Region-limited | Docs name supported or unsupported countries, states, cities, or regions. |
| Deprecated | Docs provide retirement, migration, legacy, or sunset language. |
| Removed from docs | Previously documented public resource no longer appears in comparable docs. |
| Inconclusive | Source is blocked, contradictory, unstable, gated, or not comparable. |

## Change Topics

Suggested classifier topics:

| Topic | Example signal |
| --- | --- |
| Endpoint/resource docs | New, removed, renamed, or restructured documented resources. |
| Auth and scopes | Changed OAuth scopes, API keys, token rules, or permission language. |
| Rate limits | New limits, quota units, throttling guidance, or usage tiers. |
| Versioning | New API versions, migration guides, default-version changes, sunset dates. |
| SDKs and examples | New SDKs, package names, languages, examples, or code snippets. |
| Regions | New countries, blocked regions, data residency, or localized availability. |
| Status components | Public status page adds, removes, or renames API components. |
| Changelog signals | Release notes announce public API launches, changes, or deprecations. |
| Pricing or access | Docs mention free tier, paid plan, enterprise-only, or partner approval. |

## Priority Rubric

High priority:

- Public docs change an API from beta/preview to GA, or add a deprecation date.
- Public docs add or remove a major API family, auth requirement, region, version, or SDK.
- Status or changelog pages introduce a new API component or retirement notice.

Medium priority:

- Docs add new fields, webhook events, examples, scopes, rate-limit details, or migration notes.
- Docs clarify access requirements without changing the apparent availability category.
- Regional documentation differs across country or device profiles.

Low priority:

- Formatting, navigation, generated-doc ordering, typo fixes, or date-only changes.
- Moved pages where canonical content remains materially unchanged.

## Report Format

```text
Public API Docs Monitor Report

Company: {company}
Run date: {date}
Scope: Public documentation and availability statements only

Summary
{3-6 bullets of material public-doc changes}

Availability
| API | Current label | Previous label | Confidence | Source |

Changes
| Priority | Topic | Page | What changed | Source |

Ignored noise
{Formatting, navigation, generated-order, or timestamp changes}

Inconclusive sources
{Blocked, gated, missing, redirected, unstable, or non-comparable pages}

Boundary
No API endpoints were called, probed, fuzzed, scanned, or tested.
```

## MVP Implementation Notes

- Store raw rendered text, normalized text, page metadata, targeting profile, and snapshot hash.
- Separate documentation discovery from documentation comparison.
- Treat live endpoint URLs that appear in docs as text references only.
- Use structured diffs before sending candidate changes to `ai_chat_completion`.
- Require the summarizer to cite old and new excerpts for every material change.
- Mark pages as inconclusive when docs require login, partner approval, unstable rendering, or incompatible localization.
- Keep a clear report-level boundary statement that findings are based on public docs only.

## Future Extensions

- Scheduled watchlists for competitor APIs, partner APIs, and ecosystem dependencies.
- Slack or email alerts for deprecations, GA launches, and new public SDKs.
- OpenAPI schema-aware docs diffing for publicly linked specs.
- Status-page component timeline for public API availability incidents.
- Integration matrix exports for product marketing and solutions engineering.
- Evidence browser with side-by-side old and new public documentation snapshots.
