# Prototype

## Input Contract

```json
{
  "seller": {
    "company": "Acme Analytics",
    "website": "https://acme.example",
    "offer": "Revenue analytics for founder-led B2B SaaS teams",
    "ideal_buyer": "Technical founders between seed and Series B",
    "pain_points": [
      "manual board reporting",
      "unclear expansion signals",
      "messy CRM and billing data"
    ],
    "proof_points": [
      "cuts reporting prep from days to hours",
      "connects CRM, billing, and warehouse data"
    ],
    "tone": "warm, concise, peer-to-peer",
    "cta": "ask for 15 minutes next week"
  },
  "target": {
    "company_name": "Vanta",
    "domain": "vanta.com",
    "founder_name": "Christina Cacioppo",
    "founder_role": "CEO",
    "known_urls": []
  },
  "research_depth": "standard",
  "country": "US",
  "city": "San Francisco",
  "device": "desktop"
}
```

## Output Contract

```json
{
  "research_summary": {
    "target_company": "Vanta",
    "target_person": "Christina Cacioppo",
    "best_angle": "compliance automation expansion",
    "confidence": "high"
  },
  "facts": [
    {
      "fact_id": "f1",
      "claim": "Source-grounded public fact.",
      "source_title": "Page title",
      "source_url": "https://example.com/source",
      "source_type": "official_site",
      "published_at": "2026-01-15",
      "fetched_at": "2026-05-02T18:00:00Z",
      "relevance_score": 86,
      "used_in_email": true
    }
  ],
  "email": {
    "subject": "short subject",
    "body": "Founder-ready email body.",
    "citation_map": [
      {
        "span": "specific phrase in the email",
        "fact_ids": ["f1"]
      }
    ]
  },
  "alternates": [],
  "risk_flags": [],
  "run_log": []
}
```

## Orchestration Sketch

```ts
type ResearchDepth = "fast" | "standard" | "deep";

type PersonalizerInput = {
  seller: SellerProfile;
  target: FounderTarget;
  research_depth: ResearchDepth;
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
};

async function draftFounderEmail(input: PersonalizerInput) {
  const status = await massive.account_status();
  const budget = chooseResearchBudget(input.research_depth, status.remaining_credits);

  const sourceCandidates = await discoverSources(input, budget);
  const fetchedSources = await fetchSources(sourceCandidates, input, budget);
  const evidence = normalizeAndDeduplicate(fetchedSources);

  const facts = await massive.ai_chat_completion({
    model: "source-grounded-chat-model",
    messages: [
      { role: "system", content: factExtractionSystemPrompt },
      { role: "user", content: buildFactPrompt(input, evidence) }
    ]
  });

  const rankedFacts = rankFactsForSeller(facts, input.seller);

  const draft = await massive.ai_chat_completion({
    model: "source-grounded-chat-model",
    messages: [
      { role: "system", content: emailDraftSystemPrompt },
      { role: "user", content: buildEmailPrompt(input, rankedFacts) }
    ]
  });

  return validateCitations(draft, rankedFacts);
}
```

## Discovery Plan

Search queries:

```txt
{founder_name} {company_name} founder interview
{founder_name} {company_name} podcast
{company_name} launch funding partnership customers
{company_name} blog founder
{company_name} careers hiring go to market
site:{domain} blog OR news OR customers OR careers OR changelog
```

Source priorities:

1. Founder-authored posts, official company pages, launch posts, changelogs, and press pages.
2. Reputable news, funding announcements, podcasts, conference pages, and interviews.
3. Hiring pages and job descriptions when they reveal business priorities.
4. Company profiles only as fallback context, not primary personalization evidence.

Use Google SERP parsing to keep result titles, snippets, dates, sitelinks, People Also Ask, result position, and source domain. Use `web_fetch` with JS rendering for pages that require client-side rendering. Record captcha outcomes in `run_log`.

## Prompt Shape

Fact extraction prompt:

```txt
Extract only public, business-relevant facts that can be cited from the supplied evidence.

Rules:
- Use only supplied evidence.
- Every fact must include one or more source ids.
- Separate direct facts from inferred sales relevance.
- Exclude personal, sensitive, private, or purely biographical details unless clearly business-relevant.
- Mark stale, ambiguous, or conflicting evidence as risk flags.

Return JSON matching the facts portion of the output contract.
```

Email drafting prompt:

```txt
Write a first-touch founder email using the seller profile and ranked facts.

Rules:
- Maximum 120 words.
- Use at most one sourced personalization line.
- Every factual phrase must map to a fact_id.
- Do not overstate the source.
- Avoid flattery, fake familiarity, and generic "noticed you are growing" phrasing.
- End with the requested CTA.

Return JSON containing subject, body, citation_map, alternates, and risk_flags.
```

## Validation

`validateCitations` checks:

- Every factual span in the email has at least one `fact_id`.
- Every `fact_id` exists in the normalized evidence set.
- No email claim is stronger than the cited source claim.
- The final body stays under 120 words.
- The subject does not contain unsupported factual claims.
- Risk flags are emitted when source confidence is low, stale, blocked, or ambiguous.

## UI Sketch

- Left panel: seller profile, CTA, tone, and proof points.
- Center panel: target list, research depth, status, and source fetch log.
- Right panel: selected target's public facts, ranked angles, email draft, and citation chips.
- Actions: regenerate angle, remove fact, shorten, make warmer, export markdown, export CSV.

## Batch Behavior

- Fast mode: 3 searches, 3 fetches, 1 draft.
- Standard mode: 6 searches, 8 fetches, 2 angle variants.
- Deep mode: 10 searches, 15 fetches, 3 angle variants plus contradiction check.
- If credits are low, downgrade depth and list skipped source classes in `run_log`.
