# Prototype

## Prototype goal

Build a lightweight evidence mapper that accepts a public company domain, discovers relevant public pages, extracts compliance-related claims, and returns a structured, source-backed report. The prototype should prove that Massive MCP can reliably gather public evidence across legal, trust, docs, pricing, and help center surfaces without security testing or private access.

## User flow

1. User enters a domain and optional market or vertical lens.
2. System generates safe public-page search queries.
3. System fetches likely source pages and renders JavaScript when needed.
4. System extracts candidate claims, source snippets, and page metadata.
5. System classifies each claim into compliance consideration categories.
6. System produces an evidence map, summary, and review checklist.

## Query strategy

Initial discovery queries:

```text
site:{domain} privacy policy
site:{domain} terms
site:{domain} security OR trust OR compliance
site:{domain} SOC 2 OR ISO 27001
site:{domain} GDPR OR DPA OR subprocessors
site:{domain} HIPAA OR BAA
site:{domain} FERPA OR COPPA
site:{domain} PCI OR financial services
site:{domain} data residency OR data processing
site:{domain} help center privacy security compliance
```

The prototype should deduplicate URLs, prefer first-party pages, and keep the crawl shallow. External sources are allowed only when they are official company-controlled pages, such as hosted docs, status pages, trust centers, or subprocessor portals.

## Fetch policy

Allowed:

- Public `GET` requests for ordinary pages.
- JavaScript rendering for pages that require client-side rendering.
- Region and device targeting to observe public regional notices.
- Captcha handling only to access a public page in the same way a normal visitor would.

Disallowed:

- Login, signup, authenticated trials, or private portals.
- Form submission beyond ordinary public search or navigation.
- Vulnerability scanning, exploit checks, port scanning, endpoint fuzzing, or auth testing.
- Any attempt to bypass access controls, hidden content restrictions, or rate limits.

## Data model

```json
{
  "domain": "example.com",
  "run_id": "regmap_2026_05_02_001",
  "source_pages": [
    {
      "url": "https://example.com/security",
      "title": "Security at Example",
      "page_type": "security",
      "fetched_at": "2026-05-02T12:00:00-07:00",
      "rendered": true,
      "status": 200
    }
  ],
  "claims": [
    {
      "claim": "SOC 2 Type II report is available under NDA.",
      "category": "soc2_security_assurance",
      "source_url": "https://example.com/security",
      "evidence_excerpt": "SOC 2 Type II report available under NDA",
      "confidence": "high",
      "review_implication": "Confirm report period, scope, auditor, and product coverage."
    }
  ],
  "gaps": [
    {
      "category": "hipaa_healthcare",
      "finding": "Healthcare marketing was observed, but no public BAA availability claim was found.",
      "recommended_review": "Ask vendor whether it signs a BAA before processing PHI."
    }
  ]
}
```

## Classification rubric

High confidence:

- Claim uses explicit regulatory, certification, or contract language.
- Claim appears on legal, security, trust, compliance, or official docs pages.
- Claim has a direct source URL and short evidence excerpt.

Medium confidence:

- Claim strongly implies a regulated context, such as marketing to hospitals, banks, or schools.
- Claim is on a first-party page but lacks explicit legal or certification wording.
- Claim requires human review to confirm whether the regulation applies.

Low confidence:

- Claim is vague, promotional, outdated, or found only in an indirect page.
- Claim mentions a regulated industry but not a specific obligation or assurance.

## Report format

The report should be concise and readable by non-specialists:

```text
Public Compliance Evidence Map

Company: {domain}
Run date: {date}
Scope: Public first-party pages only

Summary
{3-6 bullets of major observed considerations}

Evidence
| Category | Claim | Confidence | Source | Review implication |

Gaps and ambiguity
{Claims that need human confirmation}

Source inventory
{Grouped list of pages}

Non-goals
This report is not a legal opinion, certification, audit, vulnerability assessment, or penetration test.
```

## MVP implementation notes

- Use deterministic extraction prompts that require source URLs and evidence excerpts.
- Store raw fetched text separately from model summaries for auditability.
- Keep one claim per row; do not merge multiple regulatory topics into one claim.
- Mark stale pages when source text contains old report dates, expired certification dates, or deprecated product names.
- Include a "no public evidence found" state for categories with no observed claims.

## Future extensions

- Batch comparison across a list of vendors.
- Change monitoring for privacy policy, security page, or subprocessor updates.
- Regional view comparison, such as US desktop versus EU mobile privacy notice.
- Export to CSV, JSON, and procurement questionnaire notes.
- Human approval workflow for legal and compliance teams.

