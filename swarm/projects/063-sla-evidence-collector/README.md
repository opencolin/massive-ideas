# SLA Evidence Collector From Vendor Docs

Idea 63 is a public contract and documentation research workflow that collects, cites, and compares vendor SLA claims from public sources. It is designed for procurement, vendor risk, and customer success teams that need evidence-backed summaries without logging into customer portals or scraping private contract systems.

## Problem

SLA language is often scattered across marketing pages, legal terms, support docs, trust centers, status pages, API documentation, and PDFs. Buyers need to know what a vendor publicly promises, what exclusions or service-credit rules apply, and whether the vendor's docs have changed since the last review.

Manual review is slow and easy to misquote. A useful collector should preserve the source URL, capture retrieval metadata, distinguish official contractual language from explanatory docs, and produce an auditable evidence pack.

## Massive MCP Fit

Massive MCP can support this workflow with:

- `web_search` to discover official SLA, uptime, legal, support, trust, and status-page documents.
- `web_fetch` with JavaScript rendering for docs sites that hydrate content client-side.
- Country, city, and device targeting to detect region-specific terms or mobile-rendering differences.
- Google SERP parsing to capture the query path that found each public source.
- `ai_chat_completion` to extract structured SLA fields with source-grounded notes.
- `account_status` to check crawler capacity and runtime limits before a batch collection.

## Scope

The collector only uses public documentation and public contract pages. It should not attempt to bypass authentication, collect customer-specific agreements, solve paywalled access, or infer private negotiated terms. Captcha handling may be used only where the target content is otherwise public and the collection remains compliant with site policies.

## Target Output

For each vendor, the prototype should produce:

- Vendor name and product/service scope.
- Public source inventory with URL, title, fetch timestamp, status code, and rendering mode.
- Extracted SLA terms: uptime commitment, measurement window, exclusions, remedies, service-credit process, claim deadline, support response targets, maintenance policy, and governing document hierarchy.
- Evidence snippets with citations and confidence levels.
- Change-watch candidates for future monitoring.
- Unknowns and human-review flags.

## Example Users

- Procurement teams preparing renewal packets.
- Vendor risk teams validating resilience claims.
- Legal operations teams comparing public terms before contract review.
- Customer success teams answering enterprise security questionnaires.

## Non-Goals

- Replace legal review.
- Interpret customer-specific contracts.
- Access non-public portals or confidential deal terms.
- Produce final legal advice.
- Scrape at a rate that burdens vendor documentation sites.

## Success Criteria

- Finds at least three official public sources per supported vendor when available.
- Extracts SLA fields into a consistent schema with citations.
- Separates contractual terms from help-center or marketing claims.
- Flags contradictory or stale sources instead of resolving ambiguity silently.
- Produces a compact evidence pack that a reviewer can verify in under ten minutes.

