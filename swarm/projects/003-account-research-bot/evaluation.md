# Evaluation

## Success Criteria

A good brief is useful in the first 60 seconds before a sales call. It should be concise, sourced, current, and specific to the target persona.

Score each run from 1-5 on:

- Source coverage: includes official site, at least one search result, and recent third-party context when available.
- Citation discipline: every factual claim has a URL or source id.
- Recency: recent triggers include dates or explicitly state when no recent trigger was found.
- Persona relevance: pains and questions are tailored to the requested buyer.
- Actionability: conversation hooks are natural, specific, and usable in a call.
- Risk handling: ambiguity, stale sources, blocked pages, and conflicting claims are visible.

## Test Cases

### 1. Public SaaS Account

Input:

```json
{
  "company_name": "Datadog",
  "website_url": "https://www.datadoghq.com",
  "target_persona": "VP Engineering",
  "seller_context": "We sell incident response automation.",
  "depth": "standard"
}
```

Good looks like:

- Brief identifies observability, cloud monitoring, security, and developer/ops audiences from official pages.
- Recent triggers include current launches, earnings/product news, or hiring signals from search.
- Discovery questions connect incident response to reliability, alert fatigue, and engineering workflows.

### 2. Mid-Market Private Company

Input:

```json
{
  "company_name": "Vanta",
  "website_url": "https://www.vanta.com",
  "target_persona": "Head of Security",
  "seller_context": "We sell vendor risk review automation.",
  "depth": "standard"
}
```

Good looks like:

- Brief separates official positioning from third-party news and profiles.
- Pain hypotheses reflect security/compliance workflows rather than generic growth claims.
- Source table includes fetched site pages and search results for funding, customers, or product updates.

### 3. Ambiguous Company Name

Input:

```json
{
  "company_name": "Mercury",
  "website_url": "https://mercury.com",
  "target_persona": "Controller",
  "seller_context": "We sell finance operations analytics.",
  "depth": "fast"
}
```

Good looks like:

- Bot resolves the account to Mercury the banking platform using the provided domain.
- Risk flags mention that "Mercury" is ambiguous in search and show how the provided URL was used to disambiguate.
- Brief avoids mixing facts from unrelated Mercury companies.

## Failure Modes To Catch

- Hallucinated claims with no source link.
- Overlong generic summaries that could apply to any SaaS company.
- Stale news presented as recent.
- Search evidence from the wrong company because the company name is ambiguous.
- Captcha or JS-rendering failures hidden from the user.
- People Also Ask content treated as definitive without source validation.

## Manual Review Checklist

1. Open every cited URL and verify the cited fact appears there.
2. Confirm at least one official-domain source is included.
3. Confirm the first three bullets would help the requested persona.
4. Confirm the brief can be read in under five minutes.
5. Confirm risk flags are shown when evidence is thin, blocked, stale, or ambiguous.

## MVP Metrics

- 90% of generated factual bullets have valid source URLs in manual review.
- Median brief generation completes within 90 seconds in standard mode.
- At least 4 of 5 evaluator-rated briefs score 4+ on actionability.
- Ambiguous-name test case produces no cross-company factual contamination.

