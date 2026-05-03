# Procurement Research Assistant

Idea 68 is a procurement research assistant for sourcing, vendor management, revenue, and market intelligence teams. It uses Massive MCP to discover public procurement opportunities, vendor requirements, award notices, buyer pages, supplier portals, and policy documents, then turns them into a sourced research brief that explains what the buyer needs, who may be eligible, and what actions are worth taking next.

The assistant does not bypass login walls, scrape private bid rooms, submit proposals, impersonate vendors, or provide legal advice. The first version focuses on public procurement evidence: government tender pages, university purchasing sites, public RFP PDFs or HTML pages, supplier diversity pages, award databases, meeting notices, vendor registration instructions, and search result snippets.

## Problem

Procurement research is scattered and time-sensitive. A single opportunity may be described across a buyer portal, a PDF attachment, an addendum page, a Q&A notice, an incumbent award record, a supplier registration guide, and a Google result that appears before the portal search catches up. Teams waste hours finding the full context, checking eligibility rules, identifying deadlines, and deciding whether the opportunity is real enough to pursue.

This tool turns public procurement discovery into a repeatable research workflow. It gathers rendered pages and search results, extracts buyer intent and compliance requirements, checks for addenda or award context, and produces a concise opportunity brief with citations instead of a pile of tabs.

## Target Users

- Sourcing and procurement analysts monitoring public opportunities.
- B2B sales teams tracking government, education, healthcare, and enterprise buying signals.
- Proposal teams triaging RFPs before investing writing time.
- Supplier diversity and partner teams finding buyer registration paths.
- Market researchers mapping demand, incumbents, and procurement language by category.

## Core Workflow

1. User enters a category, buyer list, geography, date window, and optional known procurement portals.
2. App checks `account_status` and estimates search and fetch volume.
3. App uses `web_search` and Google SERP parsing to discover RFPs, RFQs, ITBs, award notices, addenda, pre-bid meetings, vendor registration pages, and purchasing policy pages.
4. App uses `web_fetch` with JavaScript rendering to collect opportunity pages, attachments landing pages, portal results, visible deadlines, buyer names, commodity codes, eligibility language, links, status codes, and rendered metadata.
5. App optionally fetches buyer source pages such as procurement calendars, supplier registration guides, award archives, board agendas, contract documents, and category policy pages.
6. App uses `ai_chat_completion` to extract structured opportunity facts, summarize requirements, identify risk flags, compare source pages, and produce answerable research notes with citations.
7. User receives a ranked opportunity and account brief with deadlines, requirements, source evidence, confidence, and recommended next actions.

## MVP Inputs

```json
{
  "research_scope": {
    "name": "Public sector cybersecurity opportunities",
    "categories": ["cybersecurity", "SOC", "managed detection", "incident response"],
    "buyer_domains": ["city.example.gov", "university.example.edu"],
    "regions": ["California", "Oregon"],
    "date_window_days": 30
  },
  "discovery": {
    "max_results": 100,
    "country": "us",
    "city": "Sacramento",
    "device": "desktop",
    "include_awards": true,
    "include_supplier_registration": true
  },
  "opportunity_rules": {
    "minimum_days_until_due": 5,
    "flag_missing_deadline": true,
    "flag_addendum_pages": true,
    "flag_mandatory_prebid": true,
    "flag_registration_required": true,
    "flag_incumbent_mentions": true
  },
  "priority_terms": ["RFP", "cybersecurity", "managed services", "public safety", "cloud", "zero trust"]
}
```

## MVP Output

```json
{
  "research_scope": "Public sector cybersecurity opportunities",
  "generated_at": "2026-05-02T19:15:00Z",
  "summary": "18 public procurement records were reviewed. Four appear actionable this week, including one high-priority RFP with a mandatory pre-bid meeting and vendor registration requirement.",
  "overall_status": "actionable_opportunities_found",
  "opportunities": [
    {
      "buyer": "Example City IT Department",
      "title": "Managed Detection and Response Services",
      "url": "https://city.example.gov/procurement/rfp-2026-042",
      "status": "open",
      "due_date": "2026-05-17",
      "fit_score": 84,
      "priority": "high",
      "signals": [
        {
          "type": "mandatory_prebid",
          "observation": "The rendered RFP page lists a mandatory virtual pre-proposal conference on 2026-05-06.",
          "source_url": "https://city.example.gov/procurement/rfp-2026-042"
        },
        {
          "type": "registration_required",
          "observation": "The supplier guide says bidders must be registered in the city vendor portal before submission.",
          "source_url": "https://city.example.gov/purchasing/vendor-registration"
        }
      ],
      "recommended_action": "Confirm eligibility, register in the portal, and review addendum page daily until submission.",
      "evidence": {
        "opportunity_fetch_url": "https://city.example.gov/procurement/rfp-2026-042",
        "source_fetch_urls": [
          "https://city.example.gov/purchasing/vendor-registration",
          "https://city.example.gov/procurement/addenda"
        ]
      }
    }
  ]
}
```

## Research Signals

- `open_opportunity`: public page indicates the RFP, RFQ, ITB, or solicitation is active.
- `deadline_detected`: due date, pre-bid date, question deadline, or intent-to-bid deadline is visible.
- `mandatory_prebid`: attendance or site visit appears required for eligibility.
- `registration_required`: buyer requires vendor portal, commodity code, certification, or supplier profile setup.
- `addendum_present`: addenda, Q&A, amendments, or revised documents are linked.
- `incumbent_or_award_signal`: prior award, current contract, or named incumbent appears in public records.
- `eligibility_constraint`: location, certification, contract vehicle, insurance, bonding, or socioeconomic requirement appears material.
- `portal_render_issue`: procurement portal renders incomplete content, captcha, empty results, or blocked attachments.
- `serp_portal_mismatch`: Google result title or snippet indicates a record that the rendered portal page does not expose clearly.

## Scoring

Each opportunity receives a 0-100 fit score:

- 25 points: opportunity appears open and deadline is actionable.
- 20 points: category, commodity, and requirement language match the research scope.
- 15 points: eligibility and registration requirements are clear.
- 15 points: addenda, attachments, and source pages are discoverable.
- 10 points: buyer, department, contact path, and location are identifiable.
- 10 points: incumbent, award, or historical context improves pursuit judgment.
- 5 points: evidence quality is strong enough for a reviewer to reproduce.

Automatic caps:

- Cap at 80 when deadline or status is missing.
- Cap at 70 when attachments are referenced but unavailable publicly.
- Cap at 65 when JavaScript rendering fails but search snippets remain useful.
- Cap at 55 when mandatory eligibility language is ambiguous.
- Cap at 40 when the page is closed, awarded, canceled, or rendered empty.

## Massive MCP Fit

- `web_search`: discover public opportunities, buyer pages, awards, addenda, supplier guides, and procurement calendars.
- Google SERP parsing: capture titles, snippets, dates, and portal records that native site search may hide.
- `web_fetch`: retrieve procurement pages, buyer portals, policy pages, and rendered JavaScript-heavy listings.
- Country, city, and device targeting: catch region-specific portals, localized buyer pages, and mobile rendering differences.
- Captcha handling: distinguish challenge pages from missing opportunities or broken portals.
- `ai_chat_completion`: extract requirements, classify procurement signals, summarize opportunity fit, and write cited briefs.
- `account_status`: keep monitoring jobs quota-aware across many buyers and categories.

## Guardrails

- Use public pages or explicitly authorized sources only.
- Do not bypass authentication, paywalls, bid-room access controls, robots restrictions, or procurement portal terms.
- Do not submit bids, register vendors, message buyers, or certify eligibility automatically.
- Require source URLs for deadlines, eligibility requirements, addenda, award claims, and incumbent mentions.
- Label legal, contractual, insurance, bonding, and compliance interpretation as reviewer-needed.
- Preserve fetched URLs, rendered timestamps, search snippets, status codes, and confidence scores for auditability.
