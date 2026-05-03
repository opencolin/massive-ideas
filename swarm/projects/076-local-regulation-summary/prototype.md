# Prototype

## Prototype Goal

Build a lightweight bot that accepts a location and business activity, finds relevant public regulatory sources, and returns a plain-language summary with source links. The prototype should prove that Massive MCP can collect official local rules from fragmented government sites while preserving a strict non-legal-advice boundary.

## User Flow

1. User enters a jurisdiction and activity.
2. System normalizes location into likely city, county, state, and country levels.
3. System calls `account_status` to estimate whether the run fits available quota.
4. System generates official-source search queries.
5. System collects Google results with country, city, and device targeting when useful.
6. System fetches public official pages, forms, PDFs, FAQs, and code pages with JavaScript rendering when needed.
7. System extracts rule-like statements, source excerpts, dates, agency names, and links.
8. System summarizes findings as public information and creates verification questions.

## Query Strategy

Initial discovery queries:

```text
site:.gov "{city}" "{activity}" permit
site:.gov "{city}" "{activity}" license
site:.gov "{city}" "{activity}" zoning
site:.gov "{county}" "{activity}" health department
site:.gov "{state}" "{activity}" registration
site:.gov "{city}" municipal code "{activity}"
site:.gov "{city}" ordinance "{activity}"
"{city}" "{activity}" official permit
"{city}" "{activity}" fee schedule
"{city}" "{activity}" application checklist
```

For non-US jurisdictions, the prototype should adapt official-domain patterns instead of assuming `.gov`, such as `.gov.uk`, `.gc.ca`, `.gov.au`, city portals, national gazettes, or official agency domains.

## Source Ranking

Highest priority:

- Official permitting, licensing, zoning, code, tax, labor, health, fire, police, transportation, environment, and consumer protection pages.
- Official forms, checklists, application instructions, fee schedules, public notices, and PDFs.

Medium priority:

- Official state or national pages that may interact with local rules.
- Official municipal code publishers when the page is clearly the adopted public code source.

Low priority:

- Secondary explainers from chambers, nonprofits, universities, law firms, consultants, or marketplaces.

Secondary sources can fill context gaps, but the report must label them and avoid treating them as authoritative.

## Data Model

```json
{
  "run_id": "local_reg_2026_05_02_001",
  "location": {
    "city": "Portland",
    "county": "Multnomah County",
    "state": "Oregon",
    "country": "US"
  },
  "activity": "sidewalk cafe permit",
  "scope": "Public official sources only where available",
  "sources": [
    {
      "url": "https://www.portland.gov/example/sidewalk-cafe",
      "title": "Sidewalk Cafe Permits",
      "agency": "City of Portland",
      "jurisdiction_level": "city",
      "source_type": "permit_page",
      "fetched_at": "2026-05-02T12:00:00-07:00",
      "rendered": true,
      "status": 200
    }
  ],
  "findings": [
    {
      "topic": "Permit required",
      "summary": "The public city page says sidewalk cafes require a permit before operation.",
      "source_url": "https://www.portland.gov/example/sidewalk-cafe",
      "evidence_excerpt": "A sidewalk cafe permit is required before operating...",
      "confidence": "high",
      "applies_to_user": "not_determined",
      "verification_question": "Confirm whether the specific address and layout require this permit."
    }
  ],
  "gaps": [
    {
      "topic": "Processing time",
      "finding": "No current official processing time was found in public sources.",
      "recommended_verification": "Ask the permitting office for current review timelines."
    }
  ],
  "disclaimer": "This is a public information summary, not legal advice."
}
```

## Summary Rubric

High confidence:

- Source is official and current.
- Statement is explicit, narrow, and supported by a direct excerpt.
- Jurisdiction and activity match the user query.

Medium confidence:

- Source is official but the statement may depend on address, thresholds, dates, or business facts.
- Source is official but cross-references another rule or form.
- Page date is unclear but content appears operational.

Low confidence:

- Source is secondary, stale, indirect, or partially matched.
- Search results suggest relevance but fetched content lacks a clear statement.
- Different official pages appear to conflict.

## Report Format

```text
Local Regulation Public Information Summary

Location: {city, county, state, country}
Activity: {activity}
Collected: {date}
Scope: Public sources only

Important note:
This is a public information summary, not legal advice. It does not determine whether any rule applies to you.

Summary
{3-6 bullets grounded in official sources}

Source-backed findings
| Topic | Public source says | Source | Confidence | Verify |

Official source inventory
{Grouped by city, county, state, national agency}

Gaps and ambiguity
{Missing, stale, conflicting, or fact-dependent items}

Suggested next checks
{Agency contact, address-specific confirmation, professional review}
```

## MVP Implementation Notes

- Keep every finding tied to one source URL and one excerpt.
- Store raw fetched text separately from generated summaries.
- Include collection date because local rules and fees change.
- Use deterministic prompts that ban legal conclusions and require "public source says" phrasing.
- Include a hard disclaimer in every report and export.
- Support Markdown and JSON output first; CSV can follow for source inventories.
- Treat forms and PDFs as first-class sources because many local rules live there.

## Future Extensions

- Multi-city comparison for marketplace launches.
- Monitoring for changes to fee schedules, permits, and ordinance pages.
- Address-specific zoning source discovery without making applicability conclusions.
- Agency-contact extraction for phone, email, and portal links.
- Human review workflow for counsel, operators, or compliance owners.
- Saved jurisdiction playbooks for recurring business types.
