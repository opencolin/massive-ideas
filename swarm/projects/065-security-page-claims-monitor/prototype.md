# Prototype

## Prototype Goal

Build a lightweight recurring monitor that accepts one or more company domains, discovers public trust and compliance pages, extracts SOC 2, HIPAA, and GDPR claims, and compares each run against the previous snapshot. The prototype should prove that Massive MCP can track public claims over time without performing security testing or accessing private content.

## User Flow

1. User enters a domain and optional known trust/security/legal URLs.
2. System runs safe public discovery queries for SOC 2, HIPAA, GDPR, trust, privacy, DPA, BAA, and subprocessor pages.
3. System fetches public pages with JavaScript rendering and optional regional/device targeting.
4. System extracts claim candidates with source snippets and page metadata.
5. System normalizes claims into stable categories and confidence levels.
6. System compares the current snapshot to the previous snapshot.
7. System returns a change report with sources, review questions, and non-goals.

## Discovery Queries

```text
site:{domain} security OR trust OR compliance
site:{domain} SOC 2 OR "SOC 2 Type II" OR "audit report"
site:{domain} HIPAA OR BAA OR "business associate"
site:{domain} GDPR OR DPA OR "data processing agreement"
site:{domain} subprocessors OR "sub-processors"
site:{domain} privacy policy OR cookie policy
site:{domain} "data subject rights" OR SCCs OR "standard contractual clauses"
site:{domain} "trust center" OR "security whitepaper"
site:{domain} help center security privacy compliance
```

The prototype should prefer first-party URLs, deduplicate canonical pages, and keep crawling shallow. Official hosted trust centers, docs portals, and legal policy systems are allowed when controlled by the target company.

## Fetch Policy

Allowed:

- Public `GET` requests for ordinary pages.
- JavaScript rendering for public trust centers and docs pages.
- Country, city, and device targeting for public regional privacy or cookie notices.
- Captcha handling only when it mirrors ordinary public visitor access.

Disallowed:

- Login, signup, private trust portal access, or customer-only document retrieval.
- Form submissions requesting private SOC 2 reports, BAAs, DPAs, or sales contact.
- Vulnerability scanning, exploit checks, endpoint fuzzing, auth testing, or hidden route enumeration.
- Attempts to bypass access controls, rate limits, robots restrictions, or paywalls.

## Data Model

```json
{
  "domain": "example.com",
  "run_id": "claims_2026_05_02_001",
  "scope": "public_first_party_pages",
  "source_pages": [
    {
      "url": "https://example.com/security",
      "canonical_url": "https://example.com/security",
      "title": "Security at Example",
      "page_type": "security",
      "fetched_at": "2026-05-02T12:00:00-07:00",
      "rendered": true,
      "country": "US",
      "device": "desktop",
      "status": 200,
      "content_hash": "sha256:..."
    }
  ],
  "claims": [
    {
      "claim_id": "soc2_report_available",
      "category": "soc2",
      "normalized_claim": "SOC 2 Type II report is available under NDA.",
      "claim_text": "SOC 2 Type II report available upon request under NDA.",
      "source_url": "https://example.com/security",
      "evidence_excerpt": "SOC 2 Type II report available upon request under NDA",
      "confidence": "high",
      "first_seen": "2026-05-02",
      "last_seen": "2026-05-02",
      "review_implication": "Confirm report period, audit scope, auditor, and product coverage."
    }
  ],
  "changes": [
    {
      "change_type": "added",
      "category": "soc2",
      "claim_id": "soc2_report_available",
      "summary": "Security page added SOC 2 Type II report availability language.",
      "source_url": "https://example.com/security"
    }
  ]
}
```

## Claim Normalization

Normalize one public claim per row. Keep contract, certification, privacy, and security-control claims separate even when they appear in the same paragraph.

High confidence:

- Explicit SOC 2, HIPAA, BAA, GDPR, DPA, SCC, subprocessor, or data subject rights wording.
- Appears on a first-party trust, security, legal, privacy, docs, or help center page.
- Includes direct evidence excerpt and source URL.

Medium confidence:

- Strong regulated-context language, such as healthcare customer support or EU data transfer language, without an explicit compliance artifact.
- First-party marketing or docs page that implies a review topic.

Low confidence:

- Vague assurance language, stale announcements, indirect third-party references, or promotional wording without operational detail.

## Change Detection

Track:

- Added claims: new public claim appears.
- Removed claims: previously observed claim no longer appears at its source.
- Modified claims: same topic with changed wording, report period, availability, or region.
- Moved claims: same claim appears at a new canonical URL.
- Stale claims: report period, certification date, or page timestamp appears old.
- Contradictions: active pages make conflicting public claims.

Do not treat a removed public claim as proof that support or compliance ended. Phrase it as a public evidence change requiring review.

## Report Format

```text
Public Trust Claims Monitor

Company: {domain}
Run date: {date}
Scope: Public first-party pages only

Changes
| Type | Category | Claim | Source | Review question |

Current claim inventory
| Category | Claim | Confidence | First seen | Last seen | Source |

Gaps and ambiguity
{No public claim observed, stale wording, contradictions, or source access changes}

Non-goals
This report is not a legal opinion, compliance certification, audit, vulnerability assessment, or penetration test.
```

## MVP Implementation Notes

- Store raw fetched text, rendered HTML text, content hash, and extraction output for auditability.
- Use deterministic extraction prompts that require source URLs and excerpts.
- Preserve both exact claim text and normalized claim text.
- Use conservative diffing: exact text changes, semantic changes, and source moves should be labeled separately.
- Include a "no public claim observed" state for SOC 2, HIPAA, and GDPR categories.
- Make the safety boundary visible in UI copy, API responses, and exported reports.

## Future Extensions

- Batch vendor portfolio monitoring.
- Slack, email, or webhook alerts for material public-claim changes.
- CSV, JSON, and vendor-risk-platform exports.
- Region comparison view for US, EU, UK, Canada, and Australia privacy pages.
- Human review queue with accepted, dismissed, and needs-counsel states.
- Claim history timeline by category and URL.
