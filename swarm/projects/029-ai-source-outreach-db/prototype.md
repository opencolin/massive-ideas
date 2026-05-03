# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions.

## Architecture

```text
outreach_brief.json
   |
   v
validate_and_estimate_run
   |
   v
plan_queries_and_prompts
   |
   v
collect_google_source_surfaces
   |
   v
collect_sourced_chatbot_answers
   |
   v
fetch_and_enrich_cited_sources
   |
   v
normalize_source_records
   |
   v
score_outreach_opportunities
   |
   v
render_exports
```

## File Layout

```text
ai-source-outreach-db/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    brief.ts
    planner.ts
    collectGoogle.ts
    collectChatbot.ts
    fetchSources.ts
    classifySource.ts
    contactPaths.ts
    score.ts
    report.ts
    types.ts
  examples/
    ai-meeting-notes-brief.json
    ai-meeting-notes-report.json
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type Device = "desktop" | "mobile";
export type Priority = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";

export type CitationSurface =
  | "google_ai_overview"
  | "google_organic"
  | "chatbot_answer"
  | "fetched_page_reference";

export type SourceType =
  | "third_party_listicle"
  | "directory"
  | "review_site"
  | "analyst_report"
  | "blog"
  | "docs"
  | "news"
  | "community"
  | "vendor_page"
  | "other";

export interface OutreachBrief {
  category: string;
  product: {
    name: string;
    domain: string;
    aliases?: string[];
  };
  queries: Array<{
    query: string;
    intent: "definition" | "comparison" | "recommendation" | "use_case" | "pricing" | "local";
    priority: Priority;
  }>;
  chatPrompts: Array<{
    prompt: string;
    intent: "definition" | "comparison" | "recommendation" | "use_case";
    priority: Priority;
  }>;
  targets: Array<{
    country?: string;
    city?: string;
    device: Device;
  }>;
  competitors: Array<{
    name: string;
    domain: string;
    aliases?: string[];
  }>;
  blockedDomains: string[];
  maxSources: number;
  outreachGoal: string;
}

export interface CitationObservation {
  id: string;
  surface: CitationSurface;
  queryOrPrompt: string;
  intent: string;
  priority: Priority;
  country?: string;
  city?: string;
  device?: Device;
  collectedAt: string;
  citedUrl: string;
  citedDomain: string;
  title?: string;
  answerExcerpt?: string;
  rank?: number;
  snippet?: string;
}

export interface FetchedSource {
  id: string;
  url: string;
  canonicalUrl?: string;
  domain: string;
  fetchedAt: string;
  status: number;
  title?: string;
  author?: string;
  publisher?: string;
  sourceType: SourceType;
  contentHash: string;
  mentionsProduct: boolean;
  competitorsMentioned: string[];
  contactPaths: ContactPath[];
  staleSignals: string[];
}

export interface ContactPath {
  type:
    | "author_page"
    | "editorial_contact_page"
    | "generic_contact_page"
    | "media_kit"
    | "submission_guidelines"
    | "social_profile";
  url: string;
  label?: string;
  confidence: Confidence;
}

export interface SourceRecord {
  domain: string;
  url: string;
  canonicalUrl?: string;
  title?: string;
  author?: string;
  publisher?: string;
  sourceType: SourceType;
  citationCount: number;
  citedIn: CitationSurface[];
  intents: string[];
  competitorsMentioned: string[];
  ownedProductMentioned: boolean;
  contactPaths: ContactPath[];
  outreachPriority: number;
  pitchAngle: string;
  confidence: Confidence;
  evidence: Array<{
    observationId: string;
    surface: CitationSurface;
    sourceUrl: string;
    observedFact: string;
    collectedAt: string;
  }>;
}

export interface OutreachReport {
  category: string;
  product: OutreachBrief["product"];
  generatedAt: string;
  summary: string;
  sourceRecords: SourceRecord[];
  citationObservations: CitationObservation[];
  fetchedSources: FetchedSource[];
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
    device?: Device;
    parseSerp: true;
  }): Promise<{
    aiOverview?: {
      present: boolean;
      text?: string;
      citations?: Array<{ url: string; title?: string }>;
    };
    organic: Array<{
      rank: number;
      title: string;
      url: string;
      snippet?: string;
    }>;
  }>;
  webFetch(input: {
    url: string;
    renderJs: boolean;
    country?: string;
    city?: string;
    device?: Device;
    captcha?: "auto" | "fail";
  }): Promise<{
    url: string;
    status: number;
    title?: string;
    markdown: string;
  }>;
  aiChatCompletion(input: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    responseFormat?: "json";
  }): Promise<{ content: string }>;
}
```

## Collection Plan

Keep the MVP cheap and explainable:

```ts
export function planCollection(brief: OutreachBrief) {
  const googleJobs = brief.targets.flatMap((target) =>
    brief.queries.map((query) => ({
      kind: "google" as const,
      query,
      target
    }))
  );

  const chatbotJobs = brief.chatPrompts.map((chatPrompt) => ({
    kind: "chatbot" as const,
    chatPrompt
  }));

  return { googleJobs, chatbotJobs };
}
```

## Normalization Rules

- Canonicalize URLs before grouping records.
- Group by canonical URL first, then domain and normalized path when canonical tags are missing.
- Keep each citation observation even when multiple observations point to the same source.
- Exclude blocked domains from outreach scoring, but keep them in evidence counts.
- Mark vendor-owned pages separately from third-party opportunities.
- Separate organic SERP visibility from AI answer citation surfaces.
- Do not promote a source to contactable unless a fetched page exposes an explicit contact path.

## Source Classification Prompt

Use `ai_chat_completion` with fetched markdown and strict JSON output:

```text
Classify this cited source for an outreach database.
Return JSON with sourceType, author, publisher, productMentioned,
competitorsMentioned, contactPaths, staleSignals, and pitchAngle.
Only use facts visible in the page text. Do not invent contacts.
```

## Scoring Function

```ts
export function scoreSource(record: SourceRecord): number {
  let score = 0;

  if (record.citedIn.includes("google_ai_overview")) score += 15;
  if (record.citedIn.includes("chatbot_answer")) score += 15;
  if (record.citationCount >= 3) score += 15;
  if (record.intents.some((intent) => ["comparison", "recommendation"].includes(intent))) score += 15;
  if (!record.ownedProductMentioned && record.competitorsMentioned.length > 0) score += 15;
  if (["third_party_listicle", "directory", "review_site", "analyst_report", "blog"].includes(record.sourceType)) score += 10;
  if (record.contactPaths.length > 0) score += 10;
  if (record.evidence.length >= 2) score += 5;

  if (record.contactPaths.length === 0) score = Math.min(score, 60);
  if (record.sourceType === "community") score = Math.min(score, 50);
  if (!record.citedIn.some((surface) => surface !== "google_organic")) score = Math.min(score, 30);

  return Math.max(0, Math.min(100, score));
}
```

## Export Formats

JSON should preserve all observations and evidence. CSV should be CRM-ready:

```text
priority,domain,url,title,source_type,cited_in,citation_count,intents,competitors_mentioned,owned_product_mentioned,contact_url,contact_type,pitch_angle,evidence_urls
```

Markdown should be readable as an outreach plan:

- Summary and run metadata
- Top 20 outreach opportunities
- Competitor-mentioned sources where product is absent
- Contactable sources
- Blocked or low-confidence sources
- Evidence appendix by query, prompt, and target

## Implementation Sequence

1. Parse and validate `OutreachBrief`.
2. Check `account_status` and print estimated jobs.
3. Run `web_search` for each query-target pair.
4. Run `ai_chat_completion` for each sourced prompt.
5. Extract citation observations from Google and chatbot responses.
6. Deduplicate and cap source URLs by `maxSources`.
7. Fetch source pages with JS rendering and captcha handling.
8. Classify source type, mentions, contacts, and pitch angle.
9. Score and sort source records.
10. Render JSON, CSV, and Markdown exports.
