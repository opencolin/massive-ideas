# AI Hallucination Verifier

Idea 86 is an AI hallucination verifier that checks generated answers against fetched source pages. It uses Massive MCP to collect an AI answer, render the pages it cites or that the user supplies, extract checkable claims, and report which claims are supported, contradicted, missing from the evidence, or not verifiable because the source could not be accessed.

The first version focuses on practical evidence review for research, marketing, product, policy, and support answers where source pages are available. It is not a universal truth oracle; it is a groundedness audit against the pages Massive MCP can fetch.

## Problem

AI answers often sound precise even when they invent details, overstate source material, or mix true facts with unsupported claims. Manual review is slow because a reviewer has to open every cited page, wait for JavaScript-heavy pages to render, find the relevant sections, and compare the answer sentence by sentence.

This tool turns that review into a repeatable workflow. It fetches source pages with rendering and targeting, extracts source evidence, decomposes the AI answer into claims, and produces a verifier report with clear hallucination risk, source excerpts, and recommended fixes.

## Target Users

- AI product teams evaluating grounded answers before launch.
- Content and SEO teams checking AI-generated drafts against current pages.
- Research teams validating generated briefs and summaries.
- Support and docs teams auditing chatbot answers against product documentation.
- Trust and safety reviewers triaging high-risk unsupported claims.
- Agencies producing source-backed client deliverables.

## Core Workflow

1. User submits a verification brief:
   - AI answer text or prompt to run
   - Source URLs to verify against, or permission to use cited URLs from the answer
   - Optional search query for finding corroborating source pages
   - Claim types and domains that require stricter review
   - Country, city, device, and rendering targets
   - Output format and scoring thresholds
2. App checks `account_status` and estimates credits before fetching or asking models.
3. Massive MCP runs:
   - `ai_chat_completion` when the answer should be generated from a prompt
   - `web_fetch` with JavaScript rendering for every cited or supplied source page
   - `web_search` with Google SERP parsing when the user wants source discovery or alternate evidence
   - country, city, and device targeting for localized source text and answer behavior
   - captcha handling so blocked pages are classified as not verifiable instead of hallucinated
4. App extracts material claims from the answer and normalizes fetched source text, metadata, headings, canonical URLs, dates, and render states.
5. App judges each claim against the fetched evidence as supported, partially supported, contradicted, not found, or not checkable.
6. User receives a report with hallucination risk, claim-level judgments, evidence snippets, source fetch states, correction guidance, and JSON, CSV, and Markdown exports.

## MVP Inputs

```json
{
  "project": "support-answer-grounding-check",
  "mode": "verify_supplied_answer",
  "answer": {
    "prompt": "Does ExampleCloud support SAML SSO on the Pro plan?",
    "answer_text": "ExampleCloud supports SAML SSO on every paid plan, including Pro, and includes audit logs for all users.",
    "citations": [
      "https://examplecloud.com/pricing",
      "https://docs.examplecloud.com/security/sso"
    ]
  },
  "source_urls": [
    "https://examplecloud.com/pricing",
    "https://docs.examplecloud.com/security/sso"
  ],
  "targets": [
    { "country": "us", "city": "San Francisco", "device": "desktop" }
  ],
  "verification_rules": {
    "require_official_sources_for": ["pricing", "plan_limits", "security"],
    "high_stakes_claim_types": ["legal", "medical", "financial", "safety"],
    "max_source_age_days": 365,
    "allow_search_for_alternatives": true
  },
  "scoring_weights": {
    "claim_support": 45,
    "contradiction_severity": 25,
    "source_accessibility": 10,
    "source_authority": 10,
    "freshness": 5,
    "citation_alignment": 5
  }
}
```

## MVP Output

```json
{
  "project": "support-answer-grounding-check",
  "generated_at": "2026-05-02T19:30:00Z",
  "overall_score": 61,
  "hallucination_risk": "high",
  "summary": "The answer contains two material claims. SAML SSO on Pro is contradicted by the pricing page, while audit logs are only partially supported because the source limits them to Business and Enterprise plans.",
  "claim_judgments": [
    {
      "claim_id": "claim-001",
      "claim": "ExampleCloud supports SAML SSO on every paid plan, including Pro.",
      "claim_type": "plan_limits",
      "importance": "high",
      "judgment": "contradicted",
      "confidence": "high",
      "evidence": {
        "source_url": "https://examplecloud.com/pricing",
        "fetched_at": "2026-05-02T19:30:00Z",
        "excerpt": "SAML SSO is available on Business and Enterprise plans."
      },
      "recommendation": "Revise the answer to say SAML SSO starts on Business, unless a newer official source says otherwise."
    }
  ],
  "source_observations": [
    {
      "source_url": "https://examplecloud.com/pricing",
      "final_url": "https://examplecloud.com/pricing",
      "render_state": "ok",
      "status_code": 200,
      "canonical_url": "https://examplecloud.com/pricing",
      "fetched_at": "2026-05-02T19:30:00Z"
    }
  ],
  "issues": [
    {
      "severity": "high",
      "category": "contradicted_claim",
      "title": "Plan availability claim conflicts with official pricing page",
      "claim_id": "claim-001",
      "source_url": "https://examplecloud.com/pricing"
    }
  ]
}
```

## Verification Dimensions

- Claim support: source evidence entails, partially supports, contradicts, omits, or cannot verify the claim.
- Materiality: claims affecting decisions, pricing, availability, compliance, safety, or instructions receive higher severity.
- Source accessibility: render states include ok, captcha, login, paywall, blocked, timeout, error, and empty rendered text.
- Source authority: official docs, pricing pages, changelogs, primary sources, secondary sources, forums, and reviews are separated.
- Freshness: source dates, version labels, canonical redirects, and stale pages are considered for time-sensitive claims.
- Citation alignment: cited URLs should be specific enough to verify the exact claim.
- Local variance: country, city, and device targeting can reveal different source text or answer behavior.

## Massive MCP Fit

- `web_fetch`: render source pages, capture visible text, metadata, canonical URLs, screenshots, and inaccessible states.
- `ai_chat_completion`: generate the answer under test, extract claims, and perform evidence-aware support classification.
- `web_search`: discover likely official or corroborating pages when user-supplied citations are missing or weak.
- Google SERP parsing: preserve result title, snippet, rank, and URL for alternate evidence recommendations.
- Country, city, and device targeting: verify regional claims and mobile/desktop page differences.
- Captcha handling: classify blocked evidence cleanly without treating challenge pages as source text.
- `account_status`: estimate and guard credit usage before multi-source verification runs.

## Guardrails

- Do not claim a statement is false unless fetched source evidence contradicts it.
- Use "not found" or "not checkable" when source evidence is absent or inaccessible.
- Every high or critical issue must include answer text, source URL, fetch state, timestamp, and evidence excerpt or blocked-state proof.
- Separate source-grounded verification from broader web consensus.
- Label legal, medical, financial, safety, and compliance claims for human review.
- Preserve raw answer text and fetched source artifacts for reproducibility.
