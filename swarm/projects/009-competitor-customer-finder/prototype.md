# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type CompetitorInput = {
  name: string;
  domain?: string;
  category?: string;
  known_sources?: string[];
};

type FinderFilters = {
  target_industries?: string[];
  company_size?: string;
  geo?: string;
  exclude?: string[];
  priority_signals?: SignalType[];
};

type SignalType =
  | "case_study"
  | "testimonial"
  | "review"
  | "marketplace"
  | "integration"
  | "partner"
  | "customer_blog"
  | "procurement"
  | "docs"
  | "serp";

type Evidence = {
  claim: string;
  source_url: string;
  source_type: SignalType;
  fetched_at: string;
  quote?: string;
};

type CompetitorAccount = {
  company: string;
  domain?: string;
  relationship: "customer" | "user" | "evaluator" | "integration_partner" | "service_partner" | "ambiguous";
  signal_type: SignalType;
  confidence: "high" | "medium" | "low";
  fit_score: number;
  evidence: Evidence[];
  competitive_angle: string;
  next_action: string;
};
```

## Pipeline

```ts
async function findCompetitorCustomers(competitor: CompetitorInput, filters: FinderFilters) {
  const status = await massive.account_status();
  if (!status.ok || status.remaining_credits < 50) {
    throw new Error("Insufficient Massive MCP credits for competitor discovery");
  }

  const sources = await discoverSources(competitor, filters);
  const pages = await fetchSources(sources);
  const extracted = await extractAccounts(competitor, filters, pages);
  const merged = mergeDuplicateAccounts(extracted);

  return merged.sort((a, b) => b.fit_score - a.fit_score);
}
```

## Source Discovery

```ts
async function discoverSources(competitor: CompetitorInput, filters: FinderFilters) {
  const quoted = `"${competitor.name}"`;
  const category = competitor.category || "software";
  const queries = [
    `${quoted} customers case study testimonial`,
    `${quoted} "case study" "${category}"`,
    `${quoted} reviews customer company`,
    `${quoted} integration marketplace customers`,
    `${quoted} implementation partner case study`,
    `${quoted} "uses" OR "using" "${category}"`
  ];

  const serpResults = [];
  for (const query of queries) {
    serpResults.push(await massive.web_search({
      query,
      parse_google_serp: true,
      country: filters.geo === "United States" ? "us" : undefined,
      device: "desktop",
      max_results: 10
    }));
  }

  return rankCandidateSources([
    ...(competitor.known_sources || []),
    ...flattenSerpUrls(serpResults)
  ]);
}
```

## Fetching Pages

```ts
async function fetchSources(candidateUrls: string[]) {
  const selected = candidateUrls
    .filter(url => isAllowedSource(url))
    .slice(0, 30);

  const fetched = [];
  for (const url of selected) {
    fetched.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 20000,
      extract_main_content: true
    }));
  }

  return fetched.filter(page => page.ok && page.text?.length > 300);
}
```

Useful URL patterns:

- `/customers`
- `/case-studies`
- `/customer-stories`
- `/testimonials`
- Review product pages
- Marketplace app listings
- Integration directory pages
- Partner or agency case studies
- Public customer blogs and help docs

## Extraction Prompt

```ts
async function extractAccounts(competitor: CompetitorInput, filters: FinderFilters, pages) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Extract likely competitor customer accounts from public sources.",
          "Use only provided evidence.",
          "Return JSON array matching CompetitorAccount.",
          "Do not call an account a customer unless the source directly supports usage, purchase, implementation, or customer status.",
          "Separate customer, evaluator, integration partner, service partner, and ambiguous mentions."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          competitor,
          filters,
          scoring_rubric: {
            evidence_strength: 35,
            icp_fit: 25,
            relationship_clarity: 20,
            freshness: 10,
            outreach_usefulness: 10,
            caps: {
              inferred_relationship: 70,
              weak_single_third_party_source: 60,
              excluded_segment: 50,
              mere_mention: 40
            }
          },
          sources: pages.map(page => ({
            url: page.url,
            title: page.title,
            text: page.text.slice(0, 14000)
          }))
        })
      }
    ]
  });

  return validateAccounts(JSON.parse(response.content));
}
```

## Deduping And Normalization

```ts
function mergeDuplicateAccounts(accounts: CompetitorAccount[]) {
  const byName = new Map();

  for (const account of accounts) {
    const key = normalizeCompanyName(account.company);
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, account);
      continue;
    }

    byName.set(key, {
      ...existing,
      fit_score: Math.max(existing.fit_score, account.fit_score),
      confidence: maxConfidence(existing.confidence, account.confidence),
      evidence: uniqueEvidence([...existing.evidence, ...account.evidence]),
      competitive_angle: existing.competitive_angle || account.competitive_angle
    });
  }

  return [...byName.values()];
}
```

## Minimal CLI Shape

```bash
node find.js \
  --competitor ./competitor.json \
  --filters ./filters.json \
  --out ./accounts.csv \
  --json ./accounts.json
```

CSV columns:

```csv
company,domain,relationship,signal_type,confidence,fit_score,competitive_angle,next_action,evidence_urls
```

## MVP Implementation Notes

- Start with a 30-source limit and a 200-account extraction cap per run.
- Cache fetched pages by URL for 7 days because source pages change slowly.
- Persist raw fetched pages, extracted accounts, and merged results for auditability.
- Add `--source-type` to limit runs to high-signal sources such as case studies or reviews.
- Add `--min-confidence` and `--min-score` filters for sales-ready exports.
- Write one Markdown evidence brief per top account when `--explain` is enabled.
