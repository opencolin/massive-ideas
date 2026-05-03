# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
accounts.csv + config.yaml
   |
   v
build_trigger_queries
   |
   v
search_recent_events
   |
   v
select_and_fetch_sources
   |
   v
extract_trigger_cards
   |
   v
score_and_dedupe_feed
   |
   v
render_exports
```

## File Layout

```text
sales-trigger-feed/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    queries.ts
    collect.ts
    extract.ts
    score.ts
    report.ts
    types.ts
  examples/
    accounts.csv
    config.security.yaml
    config.devtools.yaml
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type TriggerType =
  | "launch"
  | "hiring"
  | "funding"
  | "outage"
  | "regulation"
  | "business_change";

export type SourceType =
  | "company_blog"
  | "changelog"
  | "careers_page"
  | "job_post"
  | "funding_article"
  | "status_page"
  | "government_page"
  | "news_article"
  | "search_result";

export interface Account {
  name: string;
  website?: string;
  market?: string;
  country?: string;
  city?: string;
  owner?: string;
  crmId?: string;
}

export interface Source {
  url: string;
  title?: string;
  type: SourceType;
  snippet?: string;
  fetchedAt?: string;
  markdown?: string;
  status?: number;
}

export interface TriggerCard {
  account: Account;
  triggerType: TriggerType;
  eventDate?: string;
  observedEvidence: string;
  whyNow: string;
  suggestedAngle: string;
  affectedTeams: string[];
  disqualifiers: string[];
  confidence: number;
  sourceUrls: string[];
  score: {
    urgency: number;
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

## Query Builder

Each account generates a small query bundle by trigger type:

```ts
export function buildTriggerQueries(account: Account, config: TriggerConfig): string[] {
  const name = account.name;
  const market = account.market ?? "";
  return [
    `${name} launch changelog integration after:${config.afterDate}`,
    `${name} careers hiring engineer security data after:${config.afterDate}`,
    `${name} raised funding acquisition partnership after:${config.afterDate}`,
    `${name} outage incident postmortem status after:${config.afterDate}`,
    `${market} regulation deadline compliance ${account.country ?? ""} after:${config.afterDate}`,
    `${name} executive hire expansion new market after:${config.afterDate}`
  ];
}
```

For MVP cost control, search up to 6 queries per account, keep the top 8 URLs per account, and fetch at most 5 pages after deduplication.

## Collection Flow

```ts
export async function collectSourcesForAccount(
  client: MassiveClient,
  account: Account,
  config: TriggerConfig
): Promise<Source[]> {
  const status = await client.accountStatus();
  if (!status.ok) throw new Error("Massive account is not ready");

  const queries = buildTriggerQueries(account, config);
  const serpResults = await searchAll(client, queries, {
    country: account.country ?? config.country,
    city: account.city,
    device: "desktop",
    parseSerp: true
  });

  const selected = selectTriggerUrls(serpResults, {
    accountWebsite: account.website,
    maxUrls: config.maxFetchesPerAccount
  });

  return fetchAsSources(client, selected, {
    renderJs: true,
    captcha: "auto",
    country: account.country ?? config.country,
    city: account.city,
    device: "desktop"
  });
}
```

URL selection should prefer official domains for launches, careers, changelogs, docs, and status pages. It should allow authoritative third-party sources for funding, news, and regulation.

## Extraction Prompt

System:

```text
You extract sales timing triggers from public web evidence.
Return strict JSON only. Do not invent facts.
Every trigger must cite source URLs.
Separate observed evidence from the sales interpretation.
Use cautious language for outages, regulation, layoffs, and compliance.
If evidence is weak or stale, lower confidence or return no trigger.
```

User:

```text
Seller persona: devtools_security
Account: Acme Health
Account market: US healthcare
Recency window: last 14 days

Sources:
[
  {
    "url": "https://example.com/changelog",
    "title": "Admin audit log launch",
    "type": "changelog",
    "content": "..."
  }
]

Return:
{
  "triggers": [
    {
      "triggerType": "launch",
      "eventDate": "YYYY-MM-DD or null",
      "observedEvidence": "fact visible in the sources",
      "whyNow": "short timing rationale",
      "suggestedAngle": "one sales-relevant outreach angle",
      "affectedTeams": ["security", "platform"],
      "disqualifiers": [],
      "confidence": 0.0,
      "sourceUrls": ["https://..."]
    }
  ]
}
```

## Scoring

```ts
export function scoreTrigger(card: TriggerCard, config: TriggerConfig): TriggerCard {
  const recency = scoreRecency(card.eventDate, config.now);
  const triggerStrength = scoreTriggerStrength(card.triggerType, card.observedEvidence);
  const accountFit = scoreAccountFit(card.account, config.icp);
  const sourceQuality = scoreSourceQuality(card.sourceUrls);
  const actionability = scoreActionability(card.suggestedAngle, card.disqualifiers);

  card.score = {
    urgency: recency + triggerStrength + accountFit + sourceQuality + actionability,
    components: { recency, triggerStrength, accountFit, sourceQuality, actionability }
  };
  return card;
}
```

The first version can use deterministic rules. LLM output should never directly set the final score.

## Report Format

The Markdown report should be scan-friendly:

```text
# Daily Sales Trigger Feed

## Top Triggers

### Acme Health - Regulation - 86

Why now: ...
Observed evidence: ...
Suggested angle: ...
Sources:
- https://...
```

CSV export fields:

```text
account_name,website,owner,trigger_type,event_date,urgency,why_now,suggested_angle,source_urls
```

## Implementation Notes

- Cache by URL and search query for the duration of a run.
- Validate every AI response against a schema before scoring.
- Drop trigger cards without source URLs.
- Keep source excerpts short in prompts to control token usage.
- Log fetch errors separately from "no trigger found" outcomes.
