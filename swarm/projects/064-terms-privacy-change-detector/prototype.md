# Prototype

## Prototype Goal

Build a lightweight monitor that accepts a domain or policy URL list, discovers public legal pages, captures rendered snapshots, compares current text with a previous snapshot, and produces a concise, source-backed change report.

The prototype should prove that Massive MCP can detect meaningful terms and privacy changes without private access, legal conclusions, or noisy line-by-line diff output.

## User Flow

1. User enters a company domain or list of policy URLs.
2. System discovers likely public legal, privacy, cookie, subprocessor, and trust pages.
3. System fetches each page with rendering and optional country, city, and device profiles.
4. System normalizes visible text and stores a timestamped snapshot.
5. System compares the new snapshot with the prior snapshot for that URL and targeting profile.
6. System classifies changed clauses by topic and estimated review priority.
7. System emits a Markdown or JSON report with source URLs, old text, new text, and review prompts.

## Discovery Strategy

Initial search and URL patterns:

```text
site:{domain} privacy policy
site:{domain} privacy notice
site:{domain} terms of service OR terms of use
site:{domain} cookie policy OR cookie notice
site:{domain} data processing agreement OR DPA
site:{domain} subprocessors OR sub-processors
site:{domain} acceptable use policy
site:{domain} legal OR trust OR compliance
site:{domain} California privacy OR CCPA OR CPRA
site:{domain} GDPR OR data subject rights
```

Common first-party paths:

```text
/legal
/privacy
/privacy-policy
/terms
/terms-of-service
/cookie-policy
/subprocessors
/data-processing-addendum
/acceptable-use-policy
/trust
```

The prototype should canonicalize URLs, deduplicate pages, prefer first-party sources, and keep a small crawl budget. External URLs are allowed only when they are official company-controlled policy hosts.

## Fetch Policy

Allowed:

- Public `GET` requests for official public pages.
- JavaScript rendering for policy centers, cookie banners, and client-rendered legal pages.
- Country, city, and device targeting to observe public regional notices.
- Captcha handling only when it enables ordinary public-page access.

Disallowed:

- Login, signup, authenticated portals, private trust centers, or customer dashboards.
- Form submission beyond ordinary public navigation or consent UI needed to view public text.
- Any attempt to bypass access controls, paid access, rate limits, or private documents.
- Vulnerability scanning, exploit probing, endpoint fuzzing, or security testing.

## Data Model

```json
{
  "domain": "example.com",
  "run_id": "policy_change_2026_05_02_001",
  "targeting_profile": {
    "country": "US",
    "city": "San Francisco",
    "device": "desktop"
  },
  "pages": [
    {
      "url": "https://example.com/privacy",
      "canonical_url": "https://example.com/privacy",
      "page_type": "privacy_policy",
      "title": "Privacy Policy",
      "status": 200,
      "rendered": true,
      "fetched_at": "2026-05-02T12:00:00-07:00",
      "snapshot_hash": "sha256:current",
      "previous_snapshot_hash": "sha256:previous"
    }
  ],
  "changes": [
    {
      "topic": "ai_data_use",
      "priority": "high",
      "source_url": "https://example.com/privacy",
      "old_excerpt": "We use usage data to improve our services.",
      "new_excerpt": "We use usage data to improve our services and develop AI features.",
      "summary": "The privacy policy added AI feature development to usage-data purposes.",
      "review_prompt": "Review whether this change affects customer commitments or opt-out language.",
      "confidence": "high"
    }
  ],
  "unchanged_pages": [
    "https://example.com/terms"
  ],
  "inconclusive_pages": []
}
```

## Change Topics

Suggested classifier labels:

| Topic | Example signal |
| --- | --- |
| Data collection | New or expanded categories of collected data. |
| Data sharing | New sharing purposes, affiliates, partners, advertisers, or vendors. |
| AI and automation | Training, model improvement, automated decisions, AI feature language. |
| Cookies and tracking | New trackers, consent language, analytics, ads, preference changes. |
| Subprocessors | Added, removed, renamed, or region-shifted subprocessors. |
| Retention | Changed deletion, backup, retention, or account closure periods. |
| International transfers | SCCs, adequacy, transfer mechanisms, data residency, regional hosting. |
| User rights | Data subject rights, opt-out rights, appeal rights, notice channels. |
| Children and sensitive data | Age thresholds, child data handling, health, biometric, or financial data. |
| Contract terms | Fees, renewals, cancellations, arbitration, venue, liability, termination. |

## Priority Rubric

High priority:

- Adds or expands data use, sharing, AI training, tracking, or sensitive-data language.
- Changes dispute resolution, venue, liability, cancellation, or payment terms.
- Adds subprocessors, international transfers, or retention changes that may trigger notice duties.

Medium priority:

- Clarifies existing language without obvious expansion.
- Changes regional privacy rights, contact channels, or consent procedures.
- Moves policy text to new pages while preserving meaning.

Low priority:

- Formatting, navigation, grammar, page structure, or date-only changes.
- Cosmetic edits with no apparent policy meaning.

## Report Format

```text
Terms and Privacy Change Report

Company: {domain}
Run date: {date}
Scope: Public first-party policy pages

Summary
{3-6 bullets of material changes}

Changes
| Priority | Topic | Page | What changed | Source |

Ignored noise
{Formatting or timestamp changes}

Inconclusive pages
{Blocked, missing, changed status, or render failures}

Disclaimer
This report identifies public text changes. It is not legal advice or a compliance determination.
```

## MVP Implementation Notes

- Store raw rendered text and normalized text separately.
- Hash normalized page text to skip unchanged pages quickly.
- Use structured diffs before sending candidate changes to `ai_chat_completion`.
- Require the summarizer to cite old and new excerpts for each reported change.
- Keep exact old and new excerpts short enough for review while linking to full snapshots.
- Mark pages as inconclusive when status codes, redirects, geoblocks, or captchas prevent a reliable comparison.

## Future Extensions

- Scheduled monitoring and email or Slack alerts.
- Batch watchlists for vendors, competitors, and portfolio companies.
- Side-by-side regional comparison, such as US desktop versus EU mobile.
- Legal-team approval workflow and issue tracker export.
- Screenshot capture for cookie banners and consent UI changes.
- Historical timeline of policy posture by company and topic.
