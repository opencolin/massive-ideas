# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ICP = {
  seller: string;
  best_fit: string[];
  disqualifiers: string[];
  trigger_keywords: string[];
  geo?: string;
};

type CompanyInput = {
  name: string;
  domain?: string;
  yc_url?: string;
};

type Evidence = {
  claim: string;
  source_url: string;
  source_type: "yc" | "company_site" | "careers" | "docs" | "blog" | "news" | "serp";
  fetched_at: string;
};

type LeadBrief = {
  company: string;
  domain?: string;
  fit_score: number;
  fit_tier: "high" | "medium" | "low";
  buying_trigger: string;
  intro_angle: string;
  why_now: string;
  evidence: Evidence[];
  confidence: "high" | "medium" | "low";
  next_action: string;
};
```

## Pipeline

```ts
async function enrichBatch(icp: ICP, companies: CompanyInput[]) {
  const status = await massive.account_status();
  if (!status.ok || status.remaining_credits < companies.length * 5) {
    throw new Error("Insufficient Massive MCP credits for batch");
  }

  const results = [];
  for (const company of companies) {
    results.push(await enrichCompany(icp, company));
  }

  return results.sort((a, b) => b.fit_score - a.fit_score);
}

async function enrichCompany(icp: ICP, company: CompanyInput): Promise<LeadBrief> {
  const discovery = await discoverSources(icp, company);
  const pages = await fetchUsefulPages(discovery);
  return scoreAndDraft(icp, company, discovery, pages);
}
```

## Source Discovery

```ts
async function discoverSources(icp: ICP, company: CompanyInput) {
  const base = company.domain || company.yc_url || company.name;
  const queries = [
    `${company.name} Y Combinator`,
    `${company.name} pricing docs API SDK`,
    `${company.name} careers hiring engineering`,
    `${company.name} launch funding enterprise customers`,
    `${company.name} founder LinkedIn blog interview`
  ];

  const serpResults = [];
  for (const q of queries) {
    serpResults.push(await massive.web_search({
      query: q,
      parse_google_serp: true,
      country: icp.geo === "United States" ? "us" : undefined,
      device: "desktop",
      max_results: 10
    }));
  }

  return {
    company,
    base,
    serpResults,
    candidateUrls: rankCandidateUrls(serpResults)
  };
}
```

## Fetching Pages

```ts
async function fetchUsefulPages(discovery) {
  const selected = discovery.candidateUrls
    .filter(url => isLikelyUseful(url))
    .slice(0, 8);

  const fetched = [];
  for (const url of selected) {
    fetched.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return fetched.filter(page => page.ok && page.text?.length > 200);
}
```

Useful URL patterns:

- YC company profile
- Home page
- Pricing
- Docs
- API reference
- Blog
- Changelog
- Careers
- Security or compliance page
- Recent product/funding/news result

## Scoring And Drafting Prompt

```ts
async function scoreAndDraft(icp: ICP, company: CompanyInput, discovery, pages) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "You enrich YC company leads for a B2B seller.",
          "Use only provided evidence.",
          "Return JSON matching the LeadBrief schema.",
          "Separate facts from inference.",
          "If evidence is weak, lower confidence and score."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          icp,
          company,
          scoring_rubric: {
            icp_match: 35,
            trigger_strength: 25,
            reachability_intro_quality: 20,
            freshness: 10,
            confidence: 10,
            caps: {
              no_official_source: 60,
              disqualifier_match: 50,
              no_trigger: 40
            }
          },
          sources: pages.map(page => ({
            url: page.url,
            title: page.title,
            text: page.text.slice(0, 12000)
          }))
        })
      }
    ]
  });

  return validateLeadBrief(JSON.parse(response.content));
}
```

## Minimal CLI Shape

```bash
node enrich.js \
  --icp ./icp.json \
  --companies ./companies.csv \
  --out ./leads.csv \
  --json ./leads.json
```

CSV columns:

```csv
name,domain,yc_url
ExampleCo,example.com,https://www.ycombinator.com/companies/exampleco
```

Output CSV columns:

```csv
company,domain,fit_score,fit_tier,buying_trigger,intro_angle,confidence,next_action,evidence_urls
```

## MVP Implementation Notes

- Start with sequential processing and a hard limit of 25 companies per run.
- Cache fetched pages by URL for 24 hours to keep costs predictable.
- Persist raw sources and final lead briefs for auditability.
- Add a `--min-score` filter for easy prospect list trimming.
- Add a `--explain` flag that writes a Markdown lead brief per company.

