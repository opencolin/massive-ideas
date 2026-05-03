# Evaluation

## Success Criteria

A good founder email feels specific, honest, and lightweight. It should use one relevant public fact, connect that fact to the seller's offer, and make a clear ask without sounding automated.

Score each run from 1-5 on:

- Citation discipline: every factual email claim maps to a valid source URL.
- Source quality: facts come from official, founder-authored, reputable news, or other high-confidence public sources.
- Relevance: the selected fact naturally connects to the seller's product and the founder's likely priorities.
- Specificity: the email references a concrete event, quote, launch, hiring signal, customer segment, or product detail.
- Brevity: the email is readable on mobile and stays under 120 words.
- Tone: the draft is plainspoken, respectful, and not overfamiliar.
- Risk handling: stale, ambiguous, blocked, or weak evidence is visible rather than hidden.

## Test Cases

### 1. Founder With Recent Company Launch

Input:

```json
{
  "seller": {
    "company": "Acme DevTools",
    "offer": "API monitoring for B2B platforms",
    "ideal_buyer": "technical founders",
    "pain_points": ["customer-facing API incidents", "slow enterprise debugging"],
    "proof_points": ["alerts on customer-impacting API errors"],
    "tone": "concise",
    "cta": "ask whether API reliability is on their roadmap"
  },
  "target": {
    "company_name": "Stripe",
    "domain": "stripe.com",
    "founder_name": "Patrick Collison",
    "founder_role": "CEO"
  },
  "research_depth": "standard"
}
```

Good looks like:

- Uses a recent, source-backed product or developer-platform fact.
- Connects the fact to API reliability without exaggerating Stripe's needs.
- Includes citation mapping for the personalization phrase.

### 2. Founder Interview Angle

Input:

```json
{
  "seller": {
    "company": "BoardPack",
    "offer": "Automated board reporting for startups",
    "ideal_buyer": "seed to Series B founders",
    "pain_points": ["manual metrics prep", "investor update scramble"],
    "proof_points": ["creates board-ready SaaS metrics from finance and CRM data"],
    "tone": "warm",
    "cta": "ask for 15 minutes next week"
  },
  "target": {
    "company_name": "Vanta",
    "domain": "vanta.com",
    "founder_name": "Christina Cacioppo",
    "founder_role": "CEO"
  },
  "research_depth": "deep"
}
```

Good looks like:

- Finds a founder interview, official post, or reputable article with a business-relevant fact.
- Avoids generic praise about leadership or growth.
- Produces a short email that ties compliance or scaling operations to reporting pain only when evidence supports the bridge.

### 3. Sparse Evidence Target

Input:

```json
{
  "seller": {
    "company": "PipelineOps",
    "offer": "CRM hygiene automation",
    "ideal_buyer": "founders selling founder-led",
    "pain_points": ["stale CRM data", "manual follow-up tracking"],
    "proof_points": ["keeps opportunity fields current from email and calendar signals"],
    "tone": "direct",
    "cta": "ask if pipeline hygiene is worth comparing notes on"
  },
  "target": {
    "company_name": "Example Stealth AI",
    "domain": "examplestealth.ai",
    "founder_name": "Alex Morgan",
    "founder_role": "Founder"
  },
  "research_depth": "fast"
}
```

Good looks like:

- Does not invent recent funding, hiring, or product facts.
- Uses only the company website if that is all that exists.
- Emits risk flags about sparse evidence and suggests a lower-personalization fallback.

### 4. Ambiguous Founder Or Company

Input:

```json
{
  "seller": {
    "company": "SecureFlow",
    "offer": "Security questionnaire automation",
    "ideal_buyer": "B2B SaaS founders",
    "pain_points": ["slow security reviews", "repeated customer questionnaires"],
    "proof_points": ["reduces questionnaire turnaround time"],
    "tone": "plain",
    "cta": "ask if security reviews are slowing deals"
  },
  "target": {
    "company_name": "Mercury",
    "domain": "mercury.com",
    "founder_name": "Immad Akhund",
    "founder_role": "CEO"
  },
  "research_depth": "standard"
}
```

Good looks like:

- Resolves Mercury using the provided domain.
- Avoids mixing in facts from unrelated Mercury companies.
- Shows any ambiguous search results in risk flags.

## Failure Modes To Catch

- Hallucinated personalization lines with no citation.
- Email claims based only on SERP snippets when the destination page contradicts or does not support the claim.
- Stale articles presented as recent.
- Over-personalization using personal life details, sensitive information, or irrelevant biography.
- Generic emails that could be sent to any founder.
- Overlong drafts with multiple unrelated facts.
- Ambiguous company or founder matches contaminating the draft.
- Captcha, JS-rendering, or fetch failures hidden from the user.

## Manual Review Checklist

1. Open every cited source and confirm the cited fact appears there.
2. Confirm the source refers to the intended company and founder.
3. Confirm the email contains no unsupported factual claim in subject or body.
4. Confirm the personalization fact is business-relevant to the seller's offer.
5. Confirm the email is under 120 words and has one clear CTA.
6. Confirm risk flags are present when evidence is thin, stale, blocked, or ambiguous.

## MVP Metrics

- 95% of factual email claims have valid source URLs in manual review.
- 90% of generated emails stay under 120 words.
- At least 4 of 5 evaluator-rated emails score 4+ on relevance and tone.
- Ambiguous-target test cases produce no cross-company factual contamination.
- Sparse-evidence cases emit risk flags instead of fabricated personalization.

## Automated Checks

- JSON schema validation for input and output contracts.
- Citation coverage check for subject and body factual spans.
- Word count check for email body.
- Source-domain deduplication and blocked-fetch logging.
- Recency labeling for sources older than 180 days and older than two years.
