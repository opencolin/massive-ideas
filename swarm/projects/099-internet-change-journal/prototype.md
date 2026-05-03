# Prototype

This is a lightweight implementation sketch for a TypeScript app that scans a watchlist weekly, stores page and SERP snapshots, compares them with prior snapshots, and produces a sourced internet change journal. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type JournalConfig = {
  journal_name: string;
  cadence: "weekly";
  targets: JournalTarget[];
  markets: MarketTarget[];
  watch_rules: WatchRules;
  fetch_options: FetchOptions;
};

type JournalTarget = {
  label: string;
  brand?: string;
  category?: string;
  domains?: string[];
  known_urls?: string[];
  seed_queries?: string[];
};

type MarketTarget = {
  country: string;
  city?: string;
  device: "desktop" | "mobile";
};

type WatchRules = {
  copy_changes: boolean;
  new_or_removed_pages: boolean;
  serp_rank_changes: boolean;
  pricing_language: boolean;
  navigation_changes: boolean;
  minimum_change_score: number;
};

type FetchOptions = {
  render_js: boolean;
  handle_captcha: boolean;
  extract_main_content: boolean;
};

type SourceKind = "known_url" | "discovered_url" | "serp_result";
type SnapshotStatus = "complete" | "partial" | "blocked" | "failed";
type ChangeType =
  | "copy_change"
  | "navigation_change"
  | "pricing_language_change"
  | "new_page"
  | "removed_page"
  | "serp_change"
  | "technical_change";
type Confidence = "high" | "medium" | "low";

type SourceCandidate = {
  target_label: string;
  source_kind: SourceKind;
  url?: string;
  query?: string;
  rank?: number;
  title?: string;
  snippet?: string;
  domain?: string;
  discovered_at: string;
  confidence: Confidence;
};

type PageSnapshot = {
  snapshot_id: string;
  journal_name: string;
  target_label: string;
  market_key: string;
  week: string;
  status: SnapshotStatus;
  source_kind: SourceKind;
  requested_url: string;
  final_url?: string;
  fetched_at: string;
  render_js: boolean;
  captcha_status: "not_encountered" | "solved" | "blocked" | "unknown";
  title?: string;
  meta_description?: string;
  headings: string[];
  navigation_text: string[];
  ctas: string[];
  pricing_mentions: string[];
  main_content_excerpt: string;
  content_hash: string;
  extraction_confidence: Confidence;
  errors?: string[];
};

type SerpSnapshot = {
  snapshot_id: string;
  journal_name: string;
  target_label: string;
  market_key: string;
  week: string;
  query: string;
  searched_at: string;
  results: SerpResult[];
};

type SerpResult = {
  rank: number;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  result_type?: string;
};

type ChangeEvent = {
  change_id: string;
  target_label: string;
  market_key: string;
  change_type: ChangeType;
  severity: "low" | "medium" | "high";
  previous_snapshot_id?: string;
  current_snapshot_id?: string;
  previous_evidence_url?: string;
  current_evidence_url?: string;
  headline: string;
  what_changed: string;
  old_value?: string;
  new_value?: string;
  change_score: number;
  confidence: Confidence;
};

type JournalReport = {
  run_id: string;
  journal_name: string;
  period: {
    current_week: string;
    previous_week?: string;
  };
  summary: string;
  page_snapshots: PageSnapshot[];
  serp_snapshots: SerpSnapshot[];
  entries: ChangeEvent[];
  snapshot_counts: {
    pages_fetched: number;
    queries_checked: number;
    blocked_or_partial: number;
    material_changes: number;
  };
};
```

## Pipeline

```ts
async function runInternetChangeJournal(config: JournalConfig): Promise<JournalReport> {
  validateJournalConfig(config);

  const estimatedCredits = estimateJournalCredits(config);
  const account = await massive.account_status();
  if (!account.ok || account.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for internet change journal scan");
  }

  const currentWeek = getCurrentIsoWeek();
  const previousWeek = getPreviousComparableWeek(config);
  const runId = createRunId("internet-change-journal", config, currentWeek);

  const sourceCandidates = await discoverSources(config);
  const pageSnapshots = await fetchPageSnapshots(config, sourceCandidates, currentWeek);
  const serpSnapshots = await fetchSerpSnapshots(config, currentWeek);
  const prior = await loadPriorSnapshots(config.journal_name, previousWeek);
  const rawChanges = detectChanges(config, prior, { pageSnapshots, serpSnapshots });
  const entries = await classifyAndSummarizeChanges(config, rawChanges);
  const summary = await summarizeJournal(config, currentWeek, previousWeek, entries);

  return {
    run_id: runId,
    journal_name: config.journal_name,
    period: { current_week: currentWeek, previous_week: previousWeek },
    summary,
    page_snapshots: pageSnapshots,
    serp_snapshots: serpSnapshots,
    entries,
    snapshot_counts: buildSnapshotCounts(pageSnapshots, serpSnapshots, entries)
  };
}
```

## Source Discovery

```ts
async function discoverSources(config: JournalConfig): Promise<SourceCandidate[]> {
  const candidates: SourceCandidate[] = [];

  for (const target of config.targets) {
    for (const url of target.known_urls ?? []) {
      candidates.push({
        target_label: target.label,
        source_kind: "known_url",
        url,
        domain: new URL(url).hostname,
        discovered_at: new Date().toISOString(),
        confidence: "high"
      });
    }

    for (const market of config.markets) {
      for (const query of target.seed_queries ?? []) {
        const response = await massive.web_search({
          query,
          country: market.country,
          city: market.city,
          device: market.device,
          parse_google_serp: true,
          max_results: 10,
          include_snippets: true
        });

        for (const result of response.results ?? []) {
          candidates.push({
            target_label: target.label,
            source_kind: "discovered_url",
            url: result.url,
            query,
            rank: result.rank,
            title: result.title,
            snippet: result.snippet,
            domain: hostname(result.url),
            discovered_at: new Date().toISOString(),
            confidence: scoreSourceCandidate(target, result)
          });
        }
      }
    }
  }

  return dedupeAndRankCandidates(candidates);
}
```

## Page Fetching

```ts
async function fetchPageSnapshots(
  config: JournalConfig,
  candidates: SourceCandidate[],
  week: string
): Promise<PageSnapshot[]> {
  const snapshots: PageSnapshot[] = [];

  for (const market of config.markets) {
    for (const candidate of candidates.filter((item) => item.url).slice(0, 50)) {
      const response = await massive.web_fetch({
        url: candidate.url,
        country: market.country,
        city: market.city,
        device: market.device,
        render_js: config.fetch_options.render_js,
        handle_captcha: config.fetch_options.handle_captcha,
        extract_main_content: config.fetch_options.extract_main_content
      });

      snapshots.push({
        snapshot_id: createSnapshotId(candidate.target_label, candidate.url!, market, week),
        journal_name: config.journal_name,
        target_label: candidate.target_label,
        market_key: marketKey(market),
        week,
        status: toSnapshotStatus(response),
        source_kind: candidate.source_kind,
        requested_url: candidate.url!,
        final_url: response.final_url,
        fetched_at: new Date().toISOString(),
        render_js: config.fetch_options.render_js,
        captcha_status: response.captcha_status ?? "unknown",
        title: response.title,
        meta_description: response.meta_description,
        headings: extractHeadings(response),
        navigation_text: extractNavigation(response),
        ctas: extractCtas(response),
        pricing_mentions: extractPricingMentions(response),
        main_content_excerpt: response.main_content?.slice(0, 12000) ?? "",
        content_hash: stableContentHash(response.main_content ?? ""),
        extraction_confidence: scoreExtraction(response),
        errors: response.errors
      });
    }
  }

  return snapshots;
}
```

## SERP Snapshots

```ts
async function fetchSerpSnapshots(
  config: JournalConfig,
  week: string
): Promise<SerpSnapshot[]> {
  const snapshots: SerpSnapshot[] = [];

  for (const target of config.targets) {
    for (const query of target.seed_queries ?? []) {
      for (const market of config.markets) {
        const response = await massive.web_search({
          query,
          country: market.country,
          city: market.city,
          device: market.device,
          parse_google_serp: true,
          max_results: 10,
          include_snippets: true
        });

        snapshots.push({
          snapshot_id: createSerpSnapshotId(target.label, query, market, week),
          journal_name: config.journal_name,
          target_label: target.label,
          market_key: marketKey(market),
          week,
          query,
          searched_at: new Date().toISOString(),
          results: (response.results ?? []).map((result) => ({
            rank: result.rank,
            title: result.title,
            url: result.url,
            domain: hostname(result.url),
            snippet: result.snippet,
            result_type: result.result_type
          }))
        });
      }
    }
  }

  return snapshots;
}
```

## Change Detection

```ts
function detectChanges(
  config: JournalConfig,
  prior: { pageSnapshots: PageSnapshot[]; serpSnapshots: SerpSnapshot[] },
  current: { pageSnapshots: PageSnapshot[]; serpSnapshots: SerpSnapshot[] }
): ChangeEvent[] {
  const changes: ChangeEvent[] = [];

  for (const snapshot of current.pageSnapshots) {
    const previous = findComparablePageSnapshot(prior.pageSnapshots, snapshot);
    if (!previous) {
      changes.push(newPageChange(snapshot));
      continue;
    }

    changes.push(...detectPageCopyChanges(config, previous, snapshot));
    changes.push(...detectNavigationChanges(config, previous, snapshot));
    changes.push(...detectPricingLanguageChanges(config, previous, snapshot));
  }

  changes.push(...detectRemovedPages(prior.pageSnapshots, current.pageSnapshots));

  for (const snapshot of current.serpSnapshots) {
    const previous = findComparableSerpSnapshot(prior.serpSnapshots, snapshot);
    if (previous) changes.push(...detectSerpRankChanges(config, previous, snapshot));
  }

  return changes.filter((change) => change.change_score >= config.watch_rules.minimum_change_score);
}
```

## AI Summary

```ts
async function classifyAndSummarizeChanges(
  config: JournalConfig,
  changes: ChangeEvent[]
): Promise<ChangeEvent[]> {
  if (changes.length === 0) return [];

  const response = await massive.ai_chat_completion({
    model: "default",
    messages: [
      {
        role: "system",
        content:
          "You write concise weekly internet change journal entries. Preserve evidence URLs, distinguish material change from noise, and do not invent facts."
      },
      {
        role: "user",
        content: JSON.stringify({
          journal_name: config.journal_name,
          watch_rules: config.watch_rules,
          candidate_changes: changes
        })
      }
    ],
    response_format: "json"
  });

  return mergeAiClassifications(changes, response.entries);
}
```

## Storage Layout

```text
data/
  journals/
    ai-support-category/
      config.json
      snapshots/
        2026-W17.json
        2026-W18.json
      reports/
        2026-W18.json
        2026-W18.md
```

Persist snapshots before summary generation so partial runs still leave auditable evidence. Reports should be reproducible from saved snapshots and config.
