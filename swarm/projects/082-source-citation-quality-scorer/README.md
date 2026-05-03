# Source Citation Quality Scorer

Idea 82 is a source citation quality scorer for chatbot answers. It uses Massive MCP to ask answer engines controlled questions, inspect the cited sources, fetch the cited pages with rendering, and grade whether the answer is actually supported by accessible, current, authoritative evidence.

The first version focuses on public answers with citations: AI search responses, chatbot answers that expose source URLs, answer boxes generated from search results, and internal assistant evaluations where the answer and citation list can be supplied as input.

## Problem

Citation presence is not the same as citation quality. A chatbot can cite a source that is irrelevant, stale, inaccessible, unofficial, contradicted by the answer, or only loosely related to the claim it supposedly supports. Teams evaluating AI answer visibility need a repeatable way to separate "we were cited" from "we were cited correctly and usefully."

This tool turns answer citation review into a scored, source-backed audit. It checks each cited URL, extracts evidence from the rendered page, compares answer claims against source text, and produces a quality score with concrete citation failures and recommended fixes.

## Target Users

- SEO and answer engine optimization teams tracking how brands are cited in AI answers.
- Content teams improving pages so chatbots can cite them accurately.
- Trust and safety teams evaluating source-backed answer quality.
- Product marketing teams monitoring category questions and competitor citations.
- Research and analyst teams validating generated briefs before publication.
- AI application teams measuring groundedness of their own assistant responses.

## Core Workflow

1. User defines an evaluation brief:
   - Questions or prompts to ask
   - Target brand, product, domain, or source set
   - Required facts or claims that should be supported
   - Preferred and disallowed source domains
   - Country, city, device, and model targets
   - Scoring weights and severity rules
2. App checks `account_status` and estimates run cost.
3. Massive MCP runs:
   - `ai_chat_completion` to collect chatbot answers, cited URLs, source titles, snippets, and answer text
   - `web_fetch` with JavaScript rendering to collect cited pages, canonical URLs, visible text, metadata, screenshots, and blocked states
   - `web_search` with Google SERP parsing when the evaluator needs source alternatives or answer-box context
   - country, city, and device targeting to detect localized answer and source differences
   - captcha handling so inaccessible citations are scored separately from weak citations
4. App extracts answer claims, citation anchors, source authority signals, page freshness, quoted or paraphrased evidence, contradictions, and unsupported statements.
5. App scores citation quality across relevance, authority, support strength, freshness, accessibility, source diversity, and claim-to-citation alignment.
6. User receives a report with answer-level scores, citation-level grades, unsupported claims, better source recommendations, and JSON, CSV, and Markdown exports.

## MVP Inputs

```json
{
  "project": "cloud-database-answer-citation-audit",
  "target_entity": {
    "name": "ExampleDB",
    "preferred_domains": ["exampledb.com", "docs.exampledb.com"],
    "competitor_domains": ["benchmarkdb.example", "legacydb.example"]
  },
  "questions": [
    {
      "question": "What is the best managed Postgres database for startups?",
      "intent": "category_recommendation",
      "required_claims": ["pricing model", "backup support", "scaling limits"],
      "must_not_claim": ["free unlimited storage"]
    },
    {
      "question": "Does ExampleDB support point-in-time recovery?",
      "intent": "factual_verification",
      "required_claims": ["PITR availability", "retention window", "plan limitations"]
    }
  ],
  "targets": [
    { "country": "us", "city": "San Francisco", "device": "desktop" },
    { "country": "gb", "city": "London", "device": "mobile" }
  ],
  "models": ["default_answer_engine"],
  "source_rules": {
    "prefer_official_sources": true,
    "allow_review_sites": true,
    "disallow_forums_for_factual_claims": true,
    "max_source_age_days": 730
  },
  "scoring_weights": {
    "claim_support": 35,
    "source_relevance": 20,
    "authority": 15,
    "freshness": 10,
    "accessibility": 10,
    "citation_diversity": 5,
    "citation_specificity": 5
  }
}
```

## MVP Output

```json
{
  "project": "cloud-database-answer-citation-audit",
  "generated_at": "2026-05-02T19:30:00Z",
  "summary": "12 answers and 47 citations were reviewed. Citation quality averaged 74/100. Official docs supported factual feature claims, but category recommendations relied on stale comparison pages and two cited sources did not support the pricing claims.",
  "overall_score": 74,
  "answer_scores": [
    {
      "question": "Does ExampleDB support point-in-time recovery?",
      "model": "default_answer_engine",
      "target": { "country": "us", "city": "San Francisco", "device": "desktop" },
      "score": 88,
      "status": "well_supported",
      "supported_claims": ["PITR availability", "retention window"],
      "unsupported_claims": ["plan limitations"],
      "best_citations": ["https://docs.exampledb.com/backups/pitr"],
      "weak_citations": ["https://old.exampledb.com/blog/backup-launch"]
    }
  ],
  "citation_issues": [
    {
      "issue_id": "cite-001",
      "severity": "high",
      "category": "unsupported_claim",
      "title": "Pricing claim is not supported by cited comparison page",
      "question": "What is the best managed Postgres database for startups?",
      "answer_claim": "ExampleDB includes unlimited storage on all paid plans.",
      "cited_url": "https://exampledb.com/pricing",
      "evidence": {
        "source_url": "https://exampledb.com/pricing",
        "text_excerpt": "Paid plans include 100 GB storage with usage-based overages.",
        "fetched_at": "2026-05-02T19:30:00Z"
      },
      "recommendation": "Flag the answer as unsupported and prefer the current pricing page when evaluating storage limits.",
      "confidence": "high"
    }
  ]
}
```

## Scoring Dimensions

- Claim support: each material answer claim is entailed, contradicted, partially supported, or absent in cited sources.
- Source relevance: cited page topic, section, and visible text match the answer claim.
- Authority: source is official, primary, expert, reputable, or clearly secondary for the claim type.
- Freshness: source date, changelog context, canonical URL, and visible version labels are appropriate.
- Accessibility: page fetches successfully, renders readable text, avoids login walls, and is not a challenge page.
- Citation diversity: answer avoids overreliance on duplicate, syndicated, or low-quality source clusters.
- Citation specificity: citation points to a page or section that can reasonably verify the claim.

## Massive MCP Fit

- `ai_chat_completion`: collect answer text, citations, source URLs, and model-specific citation behavior.
- `web_fetch`: render cited pages, screenshots, metadata, canonical URLs, source text, and page state.
- `web_search`: find alternative authoritative sources and compare cited sources against Google-visible evidence.
- Google SERP parsing: preserve result rank, snippet, title, and source context for discoverability checks.
- Country, city, and device targeting: detect regional citation drift and mobile-specific source accessibility.
- Captcha handling: classify blocked citations without mislabeling them as unsupported.
- `account_status`: estimate credits before multi-question, multi-model, multi-region citation audits.

## Guardrails

- Do not treat missing citations as proof that an answer is false; classify as unsupported until checked.
- Require source evidence for every high or critical citation issue.
- Separate answer correctness, citation quality, and brand visibility scores.
- Preserve exact question, answer text excerpt, cited URL, fetched timestamp, target, and model.
- Do not bypass authentication, paywalls, or source access controls.
- Label legal, medical, financial, and safety-sensitive claims as requiring human review.
