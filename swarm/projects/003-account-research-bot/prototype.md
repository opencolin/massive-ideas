# Prototype

## Input Contract

```json
{
  "company_name": "Ramp",
  "website_url": "https://ramp.com",
  "target_persona": "VP Finance",
  "seller_context": "We sell spend-management workflow automation for finance teams.",
  "depth": "standard",
  "country": "US",
  "city": "New York",
  "device": "desktop"
}
```

## Output Contract

```json
{
  "account": {
    "name": "Ramp",
    "website": "https://ramp.com",
    "summary": "One sourced paragraph.",
    "industry": "Fintech",
    "confidence": "high"
  },
  "brief": {
    "what_they_sell": [],
    "recent_triggers": [],
    "pain_hypotheses": [],
    "conversation_hooks": [],
    "discovery_questions": [],
    "risk_flags": []
  },
  "sources": [
    {
      "title": "Ramp homepage",
      "url": "https://ramp.com",
      "source_type": "official_site",
      "facts": ["Fact extracted from fetched page."],
      "confidence": "high"
    }
  ],
  "run_log": []
}
```

## Orchestration Sketch

```ts
type ResearchInput = {
  company_name: string;
  website_url: string;
  target_persona: string;
  seller_context?: string;
  depth: "fast" | "standard" | "deep";
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
};

async function researchAccount(input: ResearchInput) {
  const status = await massive.account_status();
  const budget = chooseBudget(input.depth, status.remaining_credits);

  const officialPages = await fetchOfficialPages(input, budget);
  const searchEvidence = await runSearches(input, budget);
  const evidencePack = normalizeEvidence([...officialPages, ...searchEvidence]);

  const draft = await massive.ai_chat_completion({
    model: "perplexity-or-chatgpt-with-sources",
    messages: [
      { role: "system", content: synthesisSystemPrompt },
      { role: "user", content: buildSynthesisPrompt(input, evidencePack) }
    ]
  });

  return validateBrief(draft, evidencePack);
}
```

## Fetch Plan

Official-site fetches:

1. Homepage via `web_fetch({ url, render_js: true, country, city, device })`.
2. Extract links from rendered HTML or markdown.
3. Prioritize URLs containing `pricing`, `customers`, `case-studies`, `about`, `careers`, `blog`, `news`, `docs`, `security`, and `integrations`.
4. Fetch at most:
   - fast: homepage plus 2 official pages
   - standard: homepage plus 5 official pages
   - deep: homepage plus 10 official pages

Search queries:

```txt
{company_name} company latest news
{company_name} funding partnership launch
{company_name} careers hiring
{company_name} customers case study
site:{domain} pricing OR customers OR careers
```

Use `web_search` with Google SERP parsing enabled. Capture organic results, AI overview facts, People Also Ask, result date, snippet, URL, and whether the result is official-domain, news, profile, job, review, or competitor content.

## Synthesis Prompt

```txt
You are preparing a pre-call account brief for a seller.

Rules:
- Use only the supplied evidence.
- Every factual bullet must include a source id.
- Mark unsupported or conflicting claims as risk flags.
- Prefer recent, official, and primary sources over generic profile pages.
- Keep the brief specific enough that a salesperson can use it on a live call.

Input:
- Company: {{company_name}}
- Website: {{website_url}}
- Target persona: {{target_persona}}
- Seller context: {{seller_context}}
- Evidence: {{evidence_json}}

Return JSON matching the output contract.
```

## UI Sketch

- Left panel: account URL, company name, persona, seller context, depth, region, device.
- Center panel: progress log showing account status, fetched pages, search queries, and skipped sources.
- Right panel: generated brief with citation chips and confidence labels.
- Export actions: copy markdown, download JSON, create CRM note.

## Guardrails

- No source URL means the claim is omitted or moved to risk flags.
- If the website requires captcha, keep the captcha outcome in the run log and rely more heavily on search results.
- If search results appear to reference multiple companies with the same name, require user confirmation before synthesis.
- If the status check shows low credits, downgrade to fast mode and explain which fetches were skipped.

