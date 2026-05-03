# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
config.yaml
   |
   v
discover_funding_events
   |
   v
normalize_companies
   |
   v
collect_company_pages
   |
   v
extract_signals_with_ai
   |
   v
score_records
   |
   v
render_report
```

## File Layout

```text
funded-company-monitor/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    discover.ts
    collect.ts
    extract.ts
    score.ts
    report.ts
    types.ts
  examples/
    config.devtools-security.yaml
    companies.csv
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type SourceType =
  | "funding_announcement"
  | "company_site"
  | "careers_page"
  | "job_post"
  | "engineering_blog"
  | "docs"
  | "status_page"
  | "search_result";

export interface Source {
  url: string;
  title?: string;
  type: SourceType;
  fetchedAt: string;
  snippet?: string;
}

export interface CompanyRecord {
  name: string;
  website?: string;
  hq?: string;
  fundingRound?: string;
  fundingAmountUsd?: number;
  announcementDate?: string;
  investors: string[];
  sources: Source[];
}

export interface SignalRecord {
  company: CompanyRecord;
  hiring: {
    openRoles: number;
    roleClusters: string[];
    notableRoles: string[];
    locations: string[];
  };
  stack: {
    languages: string[];
    frameworks: string[];
    infrastructure: string[];
    vendors: string[];
  };
  pain: Array<{
    label: string;
    observedEvidence: string;
    inferredNeed: string;
    confidence: number;
    sourceUrls: string[];
  }>;
  score: {
    fit: number;
    components: Record<string, number>;
  };
}
```

## Massive MCP Adapter

```ts
export interface MassiveClient {
  accountStatus(): Promise<{ ok: boolean; remaining?: number }>;
  webSearch(input: {
    query: string;
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
    parseSerp?: boolean;
  }): Promise<Array<{ title: string; url: string; snippet?: string }>>;
  webFetch(input: {
    url: string;
    renderJs?: boolean;
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
    captcha?: "auto" | "fail";
  }): Promise<{ url: string; title?: string; markdown: string; status: number }>;
  aiChatCompletion(input: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    responseFormat?: "json";
  }): Promise<{ content: string }>;
}
```

## Discovery Flow

```ts
export async function discoverFundingEvents(
  client: MassiveClient,
  queries: string[],
  opts: { days: number; country: string; city?: string }
): Promise<CompanyRecord[]> {
  const status = await client.accountStatus();
  if (!status.ok) throw new Error("Massive account is not ready");

  const results = [];
  for (const query of queries) {
    const serp = await client.webSearch({
      query: `${query} after:${daysAgo(opts.days)}`,
      country: opts.country,
      city: opts.city,
      device: "desktop",
      parseSerp: true
    });
    results.push(...serp.map(toFundingSource));
  }

  const pages = await fetchTopFundingPages(client, dedupeByUrl(results));
  return extractCompanyRecords(client, pages);
}
```

Discovery should fetch only the top 20-50 relevant results per run for the MVP. Deduplication is by canonical URL, company name, and announcement title similarity.

## Collection Flow

For each company:

1. Search for official website:
   - `{company} official website`
   - `{company} careers`
   - `{company} jobs`
2. Fetch the website and careers pages with JS rendering enabled.
3. Search for evidence pages:
   - `{company} engineering blog`
   - `{company} docs API`
   - `{company} status page`
   - `{company} SOC 2 security trust`
   - `{company} hiring Kubernetes`
   - `{company} "we're hiring" "Python"`
4. Fetch up to 12 pages per company in MVP mode.

```ts
export async function collectCompanyPages(
  client: MassiveClient,
  company: CompanyRecord,
  config: MonitorConfig
): Promise<Source[]> {
  const queries = [
    `${company.name} careers jobs`,
    `${company.name} engineering blog`,
    `${company.name} docs API`,
    `${company.name} status page`,
    `${company.name} security trust SOC 2`,
    `${company.name} hiring ${config.stackKeywords.slice(0, 4).join(" OR ")}`
  ];

  const searchResults = await searchAll(client, queries, config.market);
  const selected = selectBestUrls(searchResults, {
    maxUrls: 12,
    preferOfficialDomain: company.website
  });

  return fetchAsSources(client, selected, {
    renderJs: true,
    captcha: "auto",
    country: config.market.country,
    city: config.market.city,
    device: "desktop"
  });
}
```

## Extraction Prompt

System:

```text
You extract sales intelligence from sourced public web pages.
Return strict JSON only. Do not invent facts.
Separate observed evidence from inference. Every pain signal must cite source URLs.
If evidence is weak or absent, use empty arrays and low confidence.
```

User:

```text
Persona: devtools_security
Company: Acme AI
Known funding context: Series A, $18M, announced 2026-04-27.

Pages:
[
  {
    "url": "https://example.com/careers",
    "type": "careers_page",
    "markdown": "...truncated page text..."
  }
]

Extract:
1. open role count and role clusters
2. notable senior or urgent roles
3. technologies, vendors, infrastructure, compliance terms
4. observed pain signals
5. inferred needs relevant to the persona
```

Expected JSON:

```json
{
  "hiring": {
    "openRoles": 13,
    "roleClusters": ["engineering", "data", "security"],
    "notableRoles": ["Security Engineer", "Staff Infrastructure Engineer"],
    "locations": ["San Francisco", "Remote US"]
  },
  "stack": {
    "languages": ["Python", "TypeScript"],
    "frameworks": ["React", "FastAPI"],
    "infrastructure": ["AWS", "Kubernetes", "Postgres"],
    "vendors": ["Datadog"]
  },
  "pain": [
    {
      "label": "security_compliance",
      "observedEvidence": "Company is hiring a Security Engineer and advertises SOC 2 work.",
      "inferredNeed": "Likely needs security automation and compliance readiness support.",
      "confidence": 0.76,
      "sourceUrls": ["https://example.com/careers/security-engineer"]
    }
  ]
}
```

## Scoring Rules

```ts
export function score(record: SignalRecord, persona: PersonaConfig) {
  const fundingRecency = daysSince(record.company.announcementDate) <= 14 ? 25 : 12;
  const hiringIntensity = Math.min(25, record.hiring.openRoles * 2);
  const stackMatch = countMatches(record.stack, persona.stackKeywords) * 4;
  const painRelevance = record.pain
    .filter((pain) => persona.painLabels.includes(pain.label))
    .reduce((sum, pain) => sum + Math.round(pain.confidence * 10), 0);
  const sourceQuality = Math.min(10, officialSourceCount(record.company.sources) * 2);

  const components = {
    fundingRecency,
    hiringIntensity,
    stackMatch: Math.min(20, stackMatch),
    painRelevance: Math.min(20, painRelevance),
    sourceQuality
  };

  return {
    fit: Object.values(components).reduce((a, b) => a + b, 0),
    components
  };
}
```

## Markdown Report Shape

```md
# Newly Funded Company Monitor

Run date: 2026-05-02
Persona: devtools_security

## Top Accounts

### 1. Acme AI - Fit 84

- Funding: Series A, $18M, announced 2026-04-27
- Hiring: 13 roles; engineering, data, security
- Stack: Python, TypeScript, React, AWS, Kubernetes, Postgres
- Pain: security/compliance expansion; first dedicated security role
- Why now: fresh capital plus active infra/security hiring
- Sources: funding article, careers page, security role
```

## MVP Run Constraints

- Cap discovery at 50 funding URLs per run.
- Cap enrichment at 25 companies per run.
- Cap fetched pages at 12 per company.
- Cache fetched pages for 24 hours by normalized URL.
- Store raw fetch text locally for debugging, but report only extracted summaries and citations.

## Practical First Build

Day 1:

- CLI scaffolding, config loading, output folders.
- Massive MCP client wrapper and account status check.

Day 2:

- Funding discovery through web search and funding-page extraction.
- URL dedupe and company normalization.

Day 3:

- Company page collection and JS-rendered fetches.
- Basic cache and retry handling.

Day 4:

- AI extraction prompt and JSON validation.
- Scoring rules.

Day 5:

- Markdown/CSV/JSON reports.
- Hand evaluation on 25 companies.
