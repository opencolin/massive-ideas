# Conference Attendee Enricher

## MVP

Conference Attendee Enricher turns public sponsor, speaker, and exhibitor pages into a ranked account and contact research sheet for sales, partnerships, recruiting, or investor outreach teams.

The MVP does not try to scrape private attendee lists. It enriches the public surface area around a conference:

- Sponsors and exhibitors: company names, booth numbers, tiers, categories, descriptions, and event URLs.
- Speakers: names, titles, employers, session topics, biographies, and profile links.
- Session and agenda pages: topics, product interests, technologies, regions, and buying signals.
- Company websites and search results: company domain, short description, likely ICP fit, headquarters, size hints, funding/public status hints, and relevant source links.

Massive MCP is useful here because conference websites are often rendered client-side, geographically varied, protected by light bot defenses, and fragmented across many page templates.

## Target User

The first user is a GTM operator preparing outreach before or after a conference. They have a conference URL and want a spreadsheet-style export of high-signal companies and people with evidence-backed notes.

## Inputs

- Required: conference homepage URL.
- Optional: known pages for sponsors, exhibitors, speakers, agenda, or sessions.
- Optional: ICP prompt, for example: "Prioritize Series B-C security infrastructure companies in North America."
- Optional: target country, city, and device profile for Massive MCP rendering.

## Outputs

The MVP returns CSV and JSON:

| Field | Description |
| --- | --- |
| `entity_type` | `company` or `person` |
| `name` | Company or speaker name |
| `role_or_tier` | Speaker title, sponsor tier, or exhibitor category |
| `company` | Employer for a person, or same as name for a company |
| `domain` | Best inferred company domain |
| `conference_source_url` | Page where the entity was found |
| `source_snippet` | Short evidence snippet from the conference page |
| `signals` | Parsed interests, session topics, booth/category, geography, tech keywords |
| `fit_score` | 0-100 score against the ICP prompt |
| `outreach_angle` | One short reason to contact them |
| `supporting_sources` | URLs used for enrichment |

## Massive MCP Usage

- `web_fetch`: render and extract conference pages, including JavaScript-rendered sponsor grids and speaker directories.
- `web_search`: discover hidden or unlinked pages such as "site:exampleconf.com sponsor exhibitor speaker agenda".
- `ai_chat_completion`: normalize extracted entities, classify signals, score ICP fit, and draft concise outreach angles with citations.
- `account_status`: preflight quota and feature availability before bulk crawling.

Useful platform features:

- JS rendering for React/Next.js conference sites.
- Captcha handling for lightly protected directories.
- Country/city/device targeting for region-specific conference pages.
- Google SERP parsing to discover official event subpages and company domains.
- Chatbot answers with sources for evidence-backed enrichment.

## Workflow

1. Check `account_status` and fail early with an actionable quota or feature message.
2. Fetch the homepage with JS rendering enabled.
3. Extract candidate navigation links whose text or URL matches sponsor, exhibitor, speaker, agenda, session, partner, startup, or attendee-adjacent terms.
4. Use `web_search` to find additional official event pages.
5. Fetch the top candidate pages and extract structured entities.
6. Deduplicate entities by normalized name plus domain/employer.
7. Enrich each company with official website and search evidence.
8. Ask `ai_chat_completion` to score against the ICP prompt and produce a short outreach angle.
9. Export CSV and JSON with source URLs for every enriched claim.

## MVP Scope

In scope:

- Public pages only.
- Up to 10 source pages per run.
- Up to 500 extracted entities per conference.
- CSV/JSON export.
- Evidence links for every enriched row.
- Configurable ICP scoring prompt.

Out of scope:

- Private attendee portals.
- Login workflows.
- Email guessing or personal contact-data purchase.
- CRM writeback.
- Fully autonomous outreach.

## Example Run

Input:

```json
{
  "conference_url": "https://example-ai-summit.com",
  "icp": "B2B AI infrastructure companies with engineering or platform leaders speaking",
  "target": {
    "country": "US",
    "city": "San Francisco",
    "device": "desktop"
  }
}
```

Output row:

```json
{
  "entity_type": "person",
  "name": "Rina Patel",
  "role_or_tier": "VP Platform Engineering",
  "company": "VectorForge",
  "domain": "vectorforge.example",
  "conference_source_url": "https://example-ai-summit.com/speakers/rina-patel",
  "source_snippet": "Rina Patel, VP Platform Engineering at VectorForge, speaks on resilient inference platforms.",
  "signals": ["AI infrastructure", "platform engineering", "inference", "speaker"],
  "fit_score": 91,
  "outreach_angle": "Strong fit for infrastructure-led AI conversations because her session focuses on resilient inference platforms.",
  "supporting_sources": [
    "https://example-ai-summit.com/speakers/rina-patel",
    "https://vectorforge.example"
  ]
}
```

## Risks

- Conference pages may omit enough detail to confidently infer domains.
- Sponsor pages can contain marketing agencies, media partners, or vendors that look like target accounts but are not buyers.
- Speaker employers may be stale.
- Search enrichment can drift to similarly named companies unless source evidence is retained.

## Next Build Step

Build a single CLI command:

```bash
conference-enrich run --url https://event.example --icp "security data platforms" --out event-leads.csv
```

The first implementation can store intermediate fetches as JSON files, making crawler mistakes easy to inspect before adding a UI.
