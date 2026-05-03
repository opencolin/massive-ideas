# Prototype

## Prototype Goal

Build a CLI prototype that accepts a procurement research scope and outputs JSON, Markdown, and CSV briefs. The prototype should prove that Massive MCP can discover public procurement records, fetch rendered portal pages, extract opportunity facts, identify eligibility and timing risks, and produce source-backed next-step recommendations.

## Command Shape

```bash
procurement-research run \
  --config procurement-config.json \
  --out opportunities.json \
  --report-md procurement-brief.md \
  --csv opportunity-queue.csv
```

## Config Example

```json
{
  "scope": {
    "name": "Cybersecurity public sector scan",
    "categories": ["cybersecurity", "MDR", "SOC", "incident response"],
    "regions": ["California", "Pacific Northwest"],
    "buyer_domains": ["city.example.gov", "county.example.gov", "university.example.edu"]
  },
  "discovery": {
    "max_results": 50,
    "search_queries": [
      "site:city.example.gov procurement cybersecurity RFP",
      "site:county.example.gov bid incident response",
      "site:university.example.edu purchasing SOC services"
    ],
    "include_award_searches": true,
    "include_supplier_pages": true
  },
  "fetch_options": {
    "render_js": true,
    "country": "us",
    "city": "Los Angeles",
    "device": "desktop"
  },
  "thresholds": {
    "minimum_days_until_due": 5,
    "maximum_closed_age_days": 60,
    "high_priority_terms": ["mandatory", "managed detection", "zero trust", "cloud security"]
  }
}
```

## Pipeline

1. Load config and call `account_status` to estimate available search and fetch budget.
2. Build query variants from category, buyer, geography, and procurement terms such as RFP, RFQ, bid, solicitation, award, addendum, Q&A, and supplier registration.
3. Use `web_search` to collect Google results with structured titles, snippets, dates, URLs, and result ranks.
4. Group candidate URLs by buyer domain and canonical opportunity path.
5. Fetch candidate pages with `web_fetch` using JavaScript rendering, selected country/city, and device profile.
6. Extract title, buyer, department, status, due dates, pre-bid dates, question deadlines, contacts, links, attachments, commodity codes, and status code.
7. Fetch linked public source pages that clarify supplier registration, addenda, awards, policy, or incumbent context.
8. Ask `ai_chat_completion` to extract structured opportunity facts:

```json
{
  "opportunity": {
    "title": "Managed Detection and Response Services",
    "buyer": "Example City",
    "status": "open",
    "due_date": "2026-05-17",
    "category_match": ["MDR", "SOC", "incident response"]
  },
  "requirements": [
    {
      "type": "mandatory_prebid",
      "text": "Attendance at the virtual pre-proposal conference is required.",
      "source_url": "https://city.example.gov/procurement/rfp-2026-042"
    }
  ]
}
```

9. Ask `ai_chat_completion` to compare extracted facts against fetched source pages and reject unsupported deadline, eligibility, or award claims.
10. Score each opportunity and write JSON, Markdown, and CSV outputs.

## Data Model

### Procurement Page Observation

```json
{
  "url": "https://city.example.gov/procurement/rfp-2026-042",
  "canonical_url": "https://city.example.gov/procurement/rfp-2026-042",
  "buyer": "Example City",
  "title": "Managed Detection and Response Services",
  "status_code": 200,
  "body_word_count": 1260,
  "dates": [
    {
      "label": "Proposal due",
      "value": "2026-05-17"
    }
  ],
  "links": [
    {
      "url": "https://city.example.gov/purchasing/vendor-registration",
      "purpose": "supplier_registration"
    }
  ],
  "search_result": {
    "title": "RFP 2026-042 Managed Detection and Response",
    "snippet": "Proposals due May 17. Mandatory pre-proposal conference..."
  }
}
```

### Finding

```json
{
  "opportunity_url": "https://city.example.gov/procurement/rfp-2026-042",
  "type": "registration_required",
  "severity": "medium",
  "confidence": 0.82,
  "observation": "Bidders must register in the supplier portal before submitting.",
  "source_url": "https://city.example.gov/purchasing/vendor-registration",
  "recommended_action": "Create or confirm the supplier portal profile before preparing the response."
}
```

## Markdown Report Layout

- Executive summary.
- Actionable opportunities due soon.
- High-risk requirements and missing facts.
- Opportunities grouped by buyer.
- Supplier registration and eligibility checklist.
- Addenda, Q&A, and attachment inventory.
- Award or incumbent context.
- Source log with fetch settings and confidence.

## Prototype Constraints

- Limit the first run to 50 search results, 25 fetched opportunity pages, and 10 auxiliary source pages.
- Treat AI summaries as research assistance, not legal or contractual interpretation.
- Require fetched source URLs for every deadline, eligibility, addendum, award, and incumbent claim.
- Prefer review-needed over actionable when status or deadline evidence is incomplete.
- Store raw search metadata and rendered fetch metadata so reviewers can reproduce findings.

## Future UI

- Procurement scan setup with category, geography, buyer list, and quota estimate.
- Opportunity queue sorted by due date, fit score, risk, and source confidence.
- Buyer profile view with portal links, supplier instructions, historical awards, and recurring language.
- Opportunity detail view with dates, extracted requirements, addenda, attachments, and citations.
- Filters for status, deadline window, region, buyer type, commodity, eligibility, and mandatory events.
- Export to CSV, Markdown, JSON, CRM notes, or proposal task tracker.
