# Prototype

This is a lightweight implementation sketch for a Node.js or Python MVP. It assumes Massive MCP tools are available behind a local client wrapper.

## Request Shape

```json
{
  "city": "Austin",
  "country": "US",
  "industry": "healthcare software",
  "hiring_keywords": ["account executive", "sales director", "revops"],
  "max_accounts": 50,
  "device": "desktop"
}
```

## Core Data Model

```ts
type Source = {
  url: string;
  title?: string;
  snippet?: string;
  kind: "serp" | "company_site" | "careers" | "ats" | "directory";
};

type Account = {
  name: string;
  domain?: string;
  cityEvidence?: string;
  industryEvidence?: string;
  hiringEvidence?: string;
  openRoles: string[];
  score: number;
  confidence: "low" | "medium" | "high";
  outreachAngle: string;
  sources: Source[];
};
```

## Query Generation

```ts
function buildQueries(input) {
  const city = input.city;
  const industry = input.industry;
  const roles = input.hiring_keywords.map((role) => `"${role}"`).join(" OR ");

  return [
    `${city} ${industry} companies hiring`,
    `${city} ${industry} careers ${roles}`,
    `${city} ${industry} startups jobs`,
    `site:greenhouse.io ${city} ${industry} ${roles}`,
    `site:lever.co ${city} ${industry} ${roles}`,
    `site:ashbyhq.com ${city} ${industry} ${roles}`,
    `${city} ${industry} company directory`,
    `${city} ${industry} "careers"`
  ];
}
```

## Execution Pseudocode

```ts
async function planTerritory(input, massive) {
  const status = await massive.account_status();
  if (!status.ready) throw new Error("Massive MCP account is not ready");

  const queries = buildQueries(input);
  const serpResults = [];

  for (const query of queries) {
    const result = await massive.web_search({
      query,
      country: input.country,
      city: input.city,
      device: input.device || "desktop",
      parse_google_serp: true
    });
    serpResults.push(...result.results);
  }

  const candidates = dedupeByDomain(serpResults).slice(0, 120);
  const fetched = [];

  for (const candidate of candidates) {
    const page = await massive.web_fetch({
      url: candidate.url,
      render_js: true,
      handle_captcha: true,
      country: input.country,
      city: input.city,
      device: input.device || "desktop"
    });
    fetched.push({ candidate, page });
  }

  const extraction = await massive.ai_chat_completion({
    model: "fast-source-grounded",
    messages: [
      {
        role: "system",
        content: "Extract sales territory accounts from web evidence. Return JSON only. Include source URLs for every claim."
      },
      {
        role: "user",
        content: JSON.stringify({ input, evidence: fetched })
      }
    ]
  });

  const accounts = JSON.parse(extraction.content);
  return accounts
    .map(scoreAccount)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.max_accounts);
}
```

## Minimal UI

First screen:

- Left panel: city, industry, hiring keywords, max accounts, run button.
- Main table: account, score, open roles, evidence badges, source count.
- Right detail drawer: selected account evidence, extracted claims, outreach angle.
- Footer controls: export CSV, export JSON, rerun with stricter filters.

## Example Output Row

```json
{
  "name": "Example Health AI",
  "domain": "examplehealth.ai",
  "cityEvidence": "Careers page lists Austin, TX for revenue roles.",
  "industryEvidence": "Company describes itself as healthcare workflow software.",
  "hiringEvidence": "Open Account Executive and RevOps Manager roles found.",
  "openRoles": ["Account Executive", "RevOps Manager"],
  "score": 86,
  "confidence": "high",
  "outreachAngle": "Lead with hiring velocity around revenue operations and Austin market expansion.",
  "sources": [
    {
      "url": "https://examplehealth.ai/careers",
      "kind": "careers"
    }
  ]
}
```

## Build Notes

- Store raw SERP and fetch responses for reproducibility.
- Cap fetches per run to avoid runaway credit usage.
- Treat AI extraction as untrusted until every output claim maps to at least one source URL.
- Use a stable domain normalizer so ATS links can be associated with company domains.
- Make confidence conservative when evidence only comes from snippets.

