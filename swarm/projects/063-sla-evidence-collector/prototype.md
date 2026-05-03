# Prototype

## Concept

Build a command-line research assistant that accepts a vendor name and optional product name, discovers public SLA-related documents, fetches the most relevant pages, extracts structured terms, and writes a cited evidence report.

The first version can be a thin orchestration layer around Massive MCP:

1. Check `account_status` for available usage and limits.
2. Generate targeted search queries with `ai_chat_completion`.
3. Run `web_search` against official domains and general SERPs.
4. Fetch candidate pages with `web_fetch`, enabling JavaScript rendering when docs content is not visible in static HTML.
5. Ask `ai_chat_completion` to extract SLA fields into JSON using only fetched source text.
6. Rank and deduplicate evidence.
7. Write Markdown and JSON outputs.

## Inputs

```json
{
  "vendor": "ExampleCloud",
  "product": "Managed Database",
  "domains": ["example.com", "docs.example.com", "status.example.com"],
  "regions": ["US", "EU"],
  "as_of_date": "2026-05-02"
}
```

## Query Strategy

Searches should prefer official sources and contract-like language:

- `{vendor} SLA`
- `{vendor} service level agreement`
- `{vendor} uptime commitment`
- `{vendor} service credits`
- `{vendor} support response times`
- `{vendor} maintenance policy`
- `{vendor} status page incidents`
- `site:{official_domain} SLA service credits`
- `site:{docs_domain} uptime availability`
- `site:{legal_domain} terms service level`

## Extraction Schema

```json
{
  "vendor": "string",
  "product_scope": "string|null",
  "sources": [
    {
      "url": "string",
      "title": "string|null",
      "source_type": "legal|docs|support|trust|status|marketing|unknown",
      "fetched_at": "datetime",
      "rendered_js": true,
      "confidence": "high|medium|low"
    }
  ],
  "sla_terms": {
    "availability_commitment": "string|null",
    "measurement_window": "string|null",
    "exclusions": ["string"],
    "remedies": ["string"],
    "service_credit_process": "string|null",
    "claim_deadline": "string|null",
    "maintenance_policy": "string|null",
    "support_targets": ["string"],
    "document_hierarchy": "string|null"
  },
  "evidence": [
    {
      "field": "string",
      "claim": "string",
      "source_url": "string",
      "quote": "short excerpt",
      "confidence": "high|medium|low",
      "review_flag": "string|null"
    }
  ],
  "unknowns": ["string"],
  "contradictions": ["string"],
  "watch_urls": ["string"]
}
```

## Guardrails

- Fetch only public pages.
- Do not use credentials or customer-specific portals.
- Keep excerpts short and cite source URLs.
- Preserve uncertainty when sources disagree.
- Prefer official legal or product documentation over blogs and third-party summaries.
- Record SERP evidence so reviewers can see how pages were discovered.
- Respect rate limits and crawl delay expectations.

## Minimal CLI Flow

```bash
sla-evidence collect \
  --vendor "ExampleCloud" \
  --product "Managed Database" \
  --domain example.com \
  --out evidence/examplecloud-managed-database
```

Expected files:

- `sources.json`: raw source inventory and metadata.
- `extraction.json`: structured SLA terms.
- `report.md`: reviewer-friendly cited evidence pack.
- `review_flags.md`: contradictions, missing fields, and manual follow-up questions.

## Report Shape

```markdown
# ExampleCloud Managed Database SLA Evidence

As of: 2026-05-02

## Summary

- Availability commitment: 99.9% monthly uptime, high confidence.
- Remedy: service credits, medium confidence.
- Claim deadline: not found in public docs.

## Evidence

| Field | Finding | Source | Confidence |
| --- | --- | --- | --- |
| Availability | 99.9% monthly uptime | https://example.com/legal/sla | High |

## Review Flags

- Public docs mention maintenance exclusions, but no detailed maintenance window was found.
```

## First Prototype Milestone

Support a curated list of five vendors, run one batch collection, and compare extracted fields against a hand-built answer key. The goal is not breadth; it is proving that the evidence chain is useful and reviewable.

