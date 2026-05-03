# Prototype

This is a lightweight implementation sketch for a TypeScript app that scans restaurant menu pages, normalizes items, and reports city-level menu price changes. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type TrackingPanel = {
  panel_name: string;
  restaurants: RestaurantSeed[];
  markets: MarketTarget[];
  tracked_items: string[];
  fetch_options: FetchOptions;
  alert_rules: AlertRules;
};

type RestaurantSeed = {
  brand: string;
  domains: string[];
  seed_queries: string[];
  known_menu_urls?: string[];
};

type MarketTarget = {
  country: string;
  city: string;
  device: "desktop" | "mobile";
};

type FetchOptions = {
  render_js: boolean;
  handle_captcha: boolean;
  extract_main_content: boolean;
};

type AlertRules = {
  price_change_pct: number;
  new_item: boolean;
  removed_item: boolean;
};

type SourceType = "official" | "marketplace" | "search_result" | "store_locator" | "unknown";
type SnapshotStatus = "complete" | "partial" | "blocked" | "failed";
type Confidence = "high" | "medium" | "low";

type MenuSource = {
  brand: string;
  source_type: SourceType;
  url: string;
  final_url?: string;
  title?: string;
  discovered_by: "seed" | "web_search" | "prior_snapshot";
  rank?: number;
  snippet?: string;
  confidence: Confidence;
};

type MenuItem = {
  brand: string;
  market_key: string;
  source_url: string;
  category?: string;
  raw_name: string;
  normalized_name: string;
  description?: string;
  raw_price?: string;
  price?: number;
  currency?: string;
  size?: string;
  modifiers?: string[];
  availability: "available" | "unavailable" | "unknown";
  match_confidence: Confidence;
  extraction_confidence: Confidence;
};

type MenuSnapshot = {
  snapshot_id: string;
  panel_name: string;
  brand: string;
  market: MarketTarget;
  market_key: string;
  status: SnapshotStatus;
  fetched_at: string;
  source: MenuSource;
  render_js: boolean;
  captcha_status: "not_encountered" | "solved" | "blocked" | "unknown";
  items: MenuItem[];
  errors?: string[];
};

type PriceChange = {
  brand: string;
  market_key: string;
  item: string;
  previous_price?: number;
  current_price?: number;
  change_pct?: number;
  previous_snapshot_id?: string;
  current_snapshot_id: string;
  source_url: string;
  confidence: Confidence;
};

type AvailabilityChange = {
  brand: string;
  market_key: string;
  item: string;
  previous_status?: MenuItem["availability"];
  current_status: MenuItem["availability"];
  source_url: string;
  confidence: Confidence;
};

type MenuAlert = {
  severity: "low" | "medium" | "high";
  market_key: string;
  brand?: string;
  message: string;
  evidence_urls: string[];
};

type MarketReport = {
  market_key: string;
  restaurants_checked: number;
  menu_sources: number;
  items_extracted: number;
  price_changes: PriceChange[];
  availability_changes: AvailabilityChange[];
};

type ScanReport = {
  run_id: string;
  panel_name: string;
  created_at: string;
  summary: string;
  snapshots: MenuSnapshot[];
  market_reports: MarketReport[];
  alerts: MenuAlert[];
};
```

## Pipeline

```ts
async function runMenuPriceScan(panel: TrackingPanel): Promise<ScanReport> {
  validatePanel(panel);

  const estimatedCredits = estimateScanCredits(panel);
  const account = await massive.account_status();
  if (!account.ok || account.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for menu pricing scan");
  }

  const runId = createRunId("menu-prices", panel);
  const sources = await discoverMenuSources(panel);
  const snapshots = await fetchMenuSnapshots(panel, sources);
  const previousSnapshots = await loadPreviousComparableSnapshots(panel);
  const marketReports = buildMarketReports(panel, snapshots, previousSnapshots);
  const alerts = buildAlerts(panel.alert_rules, marketReports);
  const summary = await summarizeScan(panel, marketReports, alerts);

  return {
    run_id: runId,
    panel_name: panel.panel_name,
    created_at: new Date().toISOString(),
    summary,
    snapshots,
    market_reports: marketReports,
    alerts
  };
}
```

## Source Discovery

```ts
async function discoverMenuSources(panel: TrackingPanel): Promise<MenuSource[]> {
  const discovered: MenuSource[] = [];

  for (const restaurant of panel.restaurants) {
    for (const knownUrl of restaurant.known_menu_urls ?? []) {
      discovered.push({
        brand: restaurant.brand,
        source_type: "official",
        url: knownUrl,
        discovered_by: "seed",
        confidence: "high"
      });
    }

    for (const market of panel.markets) {
      for (const queryTemplate of restaurant.seed_queries) {
        const query = queryTemplate.replace("{city}", market.city);
        const response = await massive.web_search({
          query,
          country: market.country,
          city: market.city,
          device: market.device,
          parse_google_serp: true,
          max_results: 8,
          include_snippets: true
        });

        for (const result of response.results ?? []) {
          discovered.push({
            brand: restaurant.brand,
            source_type: classifySource(result.url, restaurant.domains),
            url: result.url,
            title: result.title,
            discovered_by: "web_search",
            rank: result.rank,
            snippet: result.snippet,
            confidence: scoreSourceCandidate(result, restaurant)
          });
        }
      }
    }
  }

  return dedupeAndRankSources(discovered);
}
```

## Fetch and Extraction

```ts
async function fetchMenuSnapshots(
  panel: TrackingPanel,
  sources: MenuSource[]
): Promise<MenuSnapshot[]> {
  const tasks = [];

  for (const market of panel.markets) {
    for (const restaurant of panel.restaurants) {
      const restaurantSources = sources
        .filter((source) => source.brand === restaurant.brand)
        .slice(0, 3);

      for (const source of restaurantSources) {
        tasks.push(fetchOneMenuSnapshot(panel, restaurant.brand, market, source));
      }
    }
  }

  return Promise.all(tasks);
}

async function fetchOneMenuSnapshot(
  panel: TrackingPanel,
  brand: string,
  market: MarketTarget,
  source: MenuSource
): Promise<MenuSnapshot> {
  const response = await massive.web_fetch({
    url: source.url,
    country: market.country,
    city: market.city,
    device: market.device,
    render_js: panel.fetch_options.render_js,
    handle_captcha: panel.fetch_options.handle_captcha,
    extract_main_content: panel.fetch_options.extract_main_content
  });

  const extracted = extractMenuCandidates(response.main_content ?? response.text ?? "");
  const normalized = await normalizeMenuItems({
    brand,
    market,
    source_url: source.url,
    tracked_items: panel.tracked_items,
    candidates: extracted
  });

  return {
    snapshot_id: createSnapshotId(brand, market, source.url),
    panel_name: panel.panel_name,
    brand,
    market,
    market_key: makeMarketKey(market),
    status: response.blocked ? "blocked" : normalized.length ? "complete" : "partial",
    fetched_at: new Date().toISOString(),
    source: {
      ...source,
      final_url: response.final_url,
      title: response.title
    },
    render_js: panel.fetch_options.render_js,
    captcha_status: response.captcha_status ?? "unknown",
    items: normalized,
    errors: response.error ? [response.error] : undefined
  };
}
```

## AI Normalization

```ts
async function normalizeMenuItems(input: {
  brand: string;
  market: MarketTarget;
  source_url: string;
  tracked_items: string[];
  candidates: RawMenuCandidate[];
}): Promise<MenuItem[]> {
  const response = await massive.ai_chat_completion({
    answer_with_sources: true,
    citation_required: true,
    max_sources: 4,
    messages: [
      {
        role: "system",
        content: "Normalize restaurant menu items into strict JSON. Preserve raw names and prices. Do not infer a price that is not visible in the source."
      },
      {
        role: "user",
        content: JSON.stringify(input)
      }
    ]
  });

  return parseNormalizedItems(response.answer).map((item) => ({
    ...item,
    brand: input.brand,
    market_key: makeMarketKey(input.market),
    source_url: input.source_url
  }));
}
```

## Change Detection

```ts
function buildMarketReports(
  panel: TrackingPanel,
  current: MenuSnapshot[],
  previous: MenuSnapshot[]
): MarketReport[] {
  return panel.markets.map((market) => {
    const marketKey = makeMarketKey(market);
    const currentItems = current.flatMap((snapshot) =>
      snapshot.market_key === marketKey ? snapshot.items : []
    );
    const previousItems = previous.flatMap((snapshot) =>
      snapshot.market_key === marketKey ? snapshot.items : []
    );

    return {
      market_key: marketKey,
      restaurants_checked: countRestaurants(current, marketKey),
      menu_sources: countSources(current, marketKey),
      items_extracted: currentItems.length,
      price_changes: comparePrices(currentItems, previousItems),
      availability_changes: compareAvailability(currentItems, previousItems)
    };
  });
}

function buildAlerts(rules: AlertRules, reports: MarketReport[]): MenuAlert[] {
  const alerts: MenuAlert[] = [];

  for (const report of reports) {
    for (const change of report.price_changes) {
      if ((change.change_pct ?? 0) >= rules.price_change_pct && change.confidence !== "low") {
        alerts.push({
          severity: change.change_pct && change.change_pct >= 10 ? "high" : "medium",
          market_key: report.market_key,
          brand: change.brand,
          message: `${change.brand} ${change.item} changed by ${change.change_pct?.toFixed(1)}%.`,
          evidence_urls: [change.source_url]
        });
      }
    }
  }

  return alerts;
}
```

## Storage

Minimum viable persistence:

- `panels/*.json` for tracking panel definitions.
- `snapshots/{panel}/{date}/{market}/{brand}.json` for raw snapshot records.
- `reports/{panel}/latest.json` for the newest scan report.
- `exports/{panel}/{date}.csv` for item-level analysis.

## Implementation Notes

- Fetch official restaurant pages first, then marketplace and SERP-discovered pages as secondary evidence.
- Cache search discovery results per brand and market to reduce repeated MCP usage.
- Keep raw fetch excerpts and normalized item records together so every price can be audited.
- Use deterministic rules for price-change alerts and AI only for extraction cleanup and narrative summaries.
- Treat item matching as versioned logic because menu naming conventions vary by brand and city.
