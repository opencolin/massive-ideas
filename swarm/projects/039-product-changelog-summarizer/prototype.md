# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ChangelogBrief = {
  workspace: Workspace;
  competitors: CompetitorTarget[];
  watchlist: Watchlist;
  window: DateWindow;
  targets: MarketTarget[];
  output: OutputPreferences;
};

type Workspace = {
  name: string;
  category: string;
};

type CompetitorTarget = {
  name: string;
  domain: string;
  known_sources?: string[];
};

type Watchlist = {
  product_areas: string[];
  buyer_segments?: string[];
  keywords?: string[];
};

type DateWindow = {
  start_date: string;
  end_date: string;
};

type MarketTarget = {
  country?: string;
  city?: string;
  language?: string;
  device: "desktop" | "mobile";
};

type OutputPreferences = {
  digest_style: "executive" | "sales_enablement" | "product_strategy";
  minimum_impact: "low" | "medium" | "high" | "critical";
  include_low_confidence: boolean;
};

type SourceCandidate = {
  id: string;
  competitor_name: string;
  url: string;
  source_type:
    | "changelog"
    | "release_notes"
    | "docs"
    | "blog"
    | "pricing"
    | "help_center"
    | "app_store"
    | "community"
    | "unknown";
  discovered_by: "known_source" | "web_search" | "serp_result";
  title?: string;
  snippet?: string;
  rank?: number;
  confidence: "high" | "medium" | "low";
};

type SourceObservation = {
  id: string;
  source_id: string;
  competitor_name: string;
  url: string;
  source_type: SourceCandidate["source_type"];
  target: MarketTarget;
  fetched_at: string;
  page_title?: string;
  rendered_text_excerpt: string;
  dated_sections: DatedSection[];
  captcha_detected: boolean;
  fetch_status: "ok" | "blocked" | "error";
};

type DatedSection = {
  heading?: string;
  date?: string;
  text: string;
  anchors?: string[];
};

type ProductChange = {
  id: string;
  competitor_name: string;
  title: string;
  date?: string;
  change_type:
    | "feature_launch"
    | "feature_expansion"
    | "ai_capability"
    | "pricing_packaging"
    | "integration"
    | "admin_security"
    | "ux_quality"
    | "deprecation"
    | "docs_only"
    | "unclear";
  product_area?: string;
  impact: "critical" | "high" | "medium" | "low";
  audience?: string;
  summary: string;
  source_urls: string[];
  evidence_ids: string[];
  confidence: "high" | "medium" | "low";
};

type CompetitorDigest = {
  name: string;
  change_count: number;
  highest_impact: ProductChange["impact"];
  narrative: string;
  notable_changes: ProductChange[];
};

type ChangelogTheme = {
  theme: string;
  competitors: string[];
  supporting_change_ids: string[];
  confidence: "high" | "medium" | "low";
};

type RecommendedAction = {
  team: "product" | "sales_enablement" | "marketing" | "leadership";
  action: string;
  evidence_ids: string[];
};

type ChangelogSummaryReport = {
  workspace: Workspace;
  summary: string;
  period: DateWindow;
  competitors: CompetitorDigest[];
  changes: ProductChange[];
  themes: ChangelogTheme[];
  recommended_actions: RecommendedAction[];
};
```

## Pipeline

```ts
async function runProductChangelogSummary(
  brief: ChangelogBrief
): Promise<ChangelogSummaryReport> {
  const sourcePlan = await discoverSources(brief);
  const estimatedCredits = estimateCredits(sourcePlan, brief.targets);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for changelog monitoring run");
  }

  const observations = await fetchSourceObservations(sourcePlan, brief.targets);
  const rawChanges = await extractChanges(brief, observations);
  const dedupedChanges = await deduplicateChanges(rawChanges);
  const filteredChanges = filterChangesForOutput(brief, dedupedChanges);

  return synthesizeReport(brief, filteredChanges, observations);
}
```

## Source Discovery

Start with known sources, then expand through search:

```ts
async function discoverSources(brief: ChangelogBrief): Promise<SourceCandidate[]> {
  const sources: SourceCandidate[] = [];

  for (const competitor of brief.competitors) {
    for (const url of competitor.known_sources || []) {
      sources.push({
        id: makeSourceId(competitor.name, url),
        competitor_name: competitor.name,
        url,
        source_type: classifySourceUrl(url),
        discovered_by: "known_source",
        confidence: "high"
      });
    }

    const queries = buildDiscoveryQueries(competitor, brief.watchlist);
    for (const query of queries) {
      const results = await massive.web_search({
        query,
        parse_google_serp: true,
        country: "us",
        language: "en-US"
      });

      sources.push(...rankOfficialSourceCandidates(competitor, results));
    }
  }

  return dedupeSourceCandidates(sources).slice(0, 12 * brief.competitors.length);
}
```

Discovery queries should include:

- `{competitor} changelog`
- `{competitor} release notes`
- `site:{domain} changelog OR "release notes" OR "what's new"`
- `site:{domain} docs release notes`
- `site:{domain} pricing update`
- `{competitor} app store release notes` when mobile apps matter

Prefer official domains and subdomains. Treat community posts, newsletters, or social posts as supporting evidence unless the brief explicitly allows non-official sources.

## Fetching

Fetch every source for each requested market target:

```ts
async function fetchSourceObservations(
  sources: SourceCandidate[],
  targets: MarketTarget[]
): Promise<SourceObservation[]> {
  const observations: SourceObservation[] = [];

  for (const source of sources) {
    for (const target of targets) {
      const page = await massive.web_fetch({
        url: source.url,
        render_js: true,
        country: target.country,
        city: target.city,
        device: target.device,
        language: target.language,
        captcha_handling: true
      });

      observations.push({
        id: makeObservationId(source, target),
        source_id: source.id,
        competitor_name: source.competitor_name,
        url: source.url,
        source_type: source.source_type,
        target,
        fetched_at: new Date().toISOString(),
        page_title: page.title,
        rendered_text_excerpt: trimForStorage(page.rendered_text),
        dated_sections: extractDatedSections(page.rendered_text),
        captcha_detected: page.captcha_detected,
        fetch_status: page.ok ? "ok" : page.captcha_detected ? "blocked" : "error"
      });
    }
  }

  return observations;
}
```

Keep raw rendered text and screenshots in evidence storage, but pass compact excerpts and section snippets into AI classification to control token usage.

## Extraction Prompt Shape

Use `ai_chat_completion` with a strict JSON schema:

```text
You extract competitor product changes from official changelog evidence.
Only report changes supported by the provided observations.
Do not invent dates, availability, pricing, or product claims.
Prefer direct changelog evidence over blog or docs evidence.
Classify each change by type, product area, impact, audience, confidence, and evidence IDs.
Ignore generic marketing copy, duplicated navigation text, cookie banners, and unrelated docs.
```

The model should return `ProductChange[]`. Validate every returned `evidence_id` against stored observations before accepting the change.

## Deduplication

Deduplicate changes when:

- Titles are semantically equivalent.
- Source URLs differ but evidence points to the same dated release.
- A blog post and docs page describe the same release.
- Localized pages repeat the same announcement in different language or market targets.

Keep the strongest evidence set and merge source URLs. Prefer the earliest official release date inside the requested window.

## Report Synthesis

Generate:

- One paragraph executive summary.
- One competitor digest per monitored competitor.
- Notable changes sorted by impact, date, and watchlist relevance.
- Category themes that span competitors or product areas.
- Recommended actions for product, sales enablement, marketing, or leadership.

Every generated claim should reference one or more accepted `ProductChange` IDs or evidence IDs. If the source set is thin, say so in the summary rather than padding the digest.

## Exports

JSON is the canonical output. CSV contains one row per accepted change:

```csv
competitor,title,date,change_type,product_area,impact,audience,confidence,source_urls,evidence_ids,summary
```

Markdown contains:

- Period and monitored competitors
- Executive summary
- Notable changes by competitor
- Cross-competitor themes
- Recommended actions
- Evidence appendix

## Guardrails

- Never include a change without at least one evidence ID.
- Never treat a page crawl date as a release date.
- Never merge competitor evidence across different companies.
- Label non-official sources as supporting context.
- Preserve country, language, and device context when localized copy differs.
- Mark blocked or captcha-only pages as collection gaps, not product changes.
