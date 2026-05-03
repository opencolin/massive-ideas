# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ICP = {
  offer: string;
  best_fit: string[];
  need_signals: string[];
  disqualifiers: string[];
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  freshness_days?: number;
};

type Target = {
  company?: string;
  domain?: string;
};

type Evidence = {
  claim: string;
  source_url: string;
  source_type:
    | "homepage"
    | "pricing"
    | "docs"
    | "blog"
    | "changelog"
    | "careers"
    | "security"
    | "status"
    | "customers"
    | "serp";
  snippet?: string;
  fetched_at: string;
};

type IntentBrief = {
  company: string;
  domain: string;
  intent_score: number;
  intent_tier: "high" | "medium" | "low";
  need_summary: string;
  why_now: string;
  matched_signals: string[];
  disqualifiers: string[];
  recommended_angle: string;
  evidence: Evidence[];
  confidence: "high" | "medium" | "low";
};
```

## Pipeline

```ts
async function classifyBatch(icp: ICP, targets: Target[]) {
  const status = await massive.account_status();
  if (!status.ok) throw new Error("Massive MCP account is unavailable");

  const estimatedCredits = targets.length * 7;
  if (status.remaining_credits < estimatedCredits) {
    throw new Error(`Need about ${estimatedCredits} credits for this batch`);
  }

  const results = [];
  for (const target of targets.slice(0, 100)) {
    results.push(await classifyTarget(icp, target));
  }

  return results.sort((a, b) => b.intent_score - a.intent_score);
}

async function classifyTarget(icp: ICP, target: Target): Promise<IntentBrief> {
  const discovery = await discoverIntentSources(icp, target);
  const pages = await fetchIntentPages(icp, discovery);
  return scoreIntent(icp, target, discovery, pages);
}
```

## Source Discovery

```ts
async function discoverIntentSources(icp: ICP, target: Target) {
  const nameOrDomain = target.domain || target.company;
  const signalQuery = icp.need_signals.slice(0, 8).join(" OR ");

  const queries = [
    `${nameOrDomain} official website`,
    `site:${target.domain} pricing OR customers OR security OR docs`,
    `site:${target.domain} careers OR hiring OR changelog OR status`,
    `${nameOrDomain} ${signalQuery}`,
    `${nameOrDomain} launch funding expansion enterprise customers`
  ].filter(Boolean);

  const serpResults = [];
  for (const query of queries) {
    serpResults.push(await massive.web_search({
      query,
      parse_google_serp: true,
      country: icp.geo?.country,
      city: icp.geo?.city,
      device: icp.geo?.device || "desktop",
      max_results: 10
    }));
  }

  return {
    target,
    serpResults,
    candidateUrls: rankCandidateUrls(target, serpResults)
  };
}
```

URL scoring should prefer:

- Official domain pages.
- Product, pricing, docs, API, integration, customer, case study, security, status, blog, changelog, and careers pages.
- Recent news or official launch pages.
- Pages whose snippets contain the seller's configured need signals.

## Fetching Pages

```ts
async function fetchIntentPages(icp: ICP, discovery) {
  const selected = discovery.candidateUrls
    .filter(url => isPublicHttpUrl(url))
    .filter(url => isLikelyOfficialOrHighSignal(url, discovery.target))
    .slice(0, 10);

  const fetched = [];
  for (const url of selected) {
    fetched.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      country: icp.geo?.country,
      city: icp.geo?.city,
      device: icp.geo?.device || "desktop",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return fetched.filter(page => page.ok && page.text?.length > 200);
}
```

## Scoring Prompt

```ts
async function scoreIntent(icp: ICP, target: Target, discovery, pages) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "You classify whether a company is likely to need the seller's offer.",
          "Use only provided search and fetched-page evidence.",
          "Return JSON matching the IntentBrief schema.",
          "Separate observed facts from inference.",
          "Apply score caps when evidence is missing, stale, or disqualifying.",
          "Never invent source URLs or unsupported claims."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          icp,
          target,
          scoring_rubric: {
            icp_fit: 30,
            need_evidence: 25,
            urgency: 20,
            source_quality: 15,
            confidence: 10,
            caps: {
              no_official_source: 60,
              no_clear_need_signal: 55,
              stale_or_generic_signals: 45,
              major_disqualifier: 40
            }
          },
          search_results: compactSerpEvidence(discovery.serpResults),
          pages: pages.map(page => ({
            url: page.url,
            title: page.title,
            text: page.text.slice(0, 12000),
            fetched_at: page.fetched_at
          }))
        })
      }
    ]
  });

  return validateIntentBrief(JSON.parse(response.content));
}
```

## Minimal CLI Shape

```bash
node classify.js \
  --icp ./icp.json \
  --domains ./domains.csv \
  --out ./intent.csv \
  --json ./intent.json
```

Input CSV columns:

```csv
company,domain
ExampleCo,example.com
```

Output CSV columns:

```csv
company,domain,intent_score,intent_tier,need_summary,why_now,matched_signals,disqualifiers,recommended_angle,confidence,evidence_urls
```

## Implementation Notes

- Cache fetched pages and search results by normalized URL for 24 hours.
- Store raw evidence alongside final JSON for auditability.
- Start with sequential processing and visible progress logs.
- Add a `--max-pages-per-domain` flag, defaulting to 10.
- Add a `--min-score` flag for easy export filtering.
- Add a `--markdown-dir` flag that writes one evidence brief per account.
- Treat SERP snippets as weaker evidence than fetched official pages.

