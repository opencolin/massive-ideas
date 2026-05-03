# Prototype

This implementation sketch assumes a Node or Python service with a Massive MCP client exposing `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type Market = {
  country: string;
  city?: string;
  currency?: string;
};

type Monitor = {
  competitor: string;
  domain: string;
  pricing_url?: string;
  discovery_query?: string;
  markets: Market[];
  devices: Array<"desktop" | "mobile">;
  cadence: "daily" | "weekly" | "monthly";
  watch_terms: string[];
};

type SnapshotContext = {
  country: string;
  city?: string;
  device: "desktop" | "mobile";
  fetched_at: string;
  final_url: string;
  status_code: number;
  js_rendered: boolean;
  captcha_status?: "none" | "solved" | "blocked";
};

type PlanPrice = {
  name: string;
  amount?: number;
  currency?: string;
  billing_period?: "month" | "year" | "one_time" | "custom";
  billing_basis?: string;
  trial?: string;
  discount?: string;
  notable_limits: string[];
  raw_text: string;
};

type PricingSnapshot = {
  monitor_id: string;
  competitor: string;
  context: SnapshotContext;
  plans: PlanPrice[];
  page_hash: string;
  evidence_url: string;
  confidence: "high" | "medium" | "low";
};

type PricingChange = {
  competitor: string;
  context: SnapshotContext;
  type: "price_change" | "new_plan" | "removed_plan" | "currency_change" | "trial_change" | "limit_change" | "copy_change";
  plan?: string;
  previous?: unknown;
  current?: unknown;
  delta_percent?: number;
  confidence: "high" | "medium" | "low";
  evidence_url: string;
  summary: string;
};
```

## Pipeline

```ts
async function runMonitors(monitors: Monitor[]) {
  const status = await massive.account_status();
  const estimatedFetches = monitors.reduce(
    (sum, monitor) => sum + monitor.markets.length * monitor.devices.length,
    0
  );

  if (!status.ok || status.remaining_credits < estimatedFetches * 2) {
    throw new Error("Insufficient Massive MCP credits for pricing monitor run");
  }

  const changes: PricingChange[] = [];
  for (const monitor of monitors) {
    const url = await resolvePricingUrl(monitor);
    for (const market of monitor.markets) {
      for (const device of monitor.devices) {
        const snapshot = await captureSnapshot(monitor, url, market, device);
        const previous = await loadPreviousSnapshot(monitor, market, device);
        changes.push(...compareSnapshots(previous, snapshot));
        await saveSnapshot(snapshot);
      }
    }
  }

  return changes.sort((a, b) => severityRank(b) - severityRank(a));
}
```

## Pricing URL Discovery

```ts
async function resolvePricingUrl(monitor: Monitor): Promise<string> {
  if (monitor.pricing_url) return monitor.pricing_url;

  const query = monitor.discovery_query ||
    `${monitor.competitor} ${monitor.domain} pricing plans`;

  const serp = await massive.web_search({
    query,
    parse_google_serp: true,
    country: "us",
    device: "desktop",
    max_results: 10
  });

  return pickBestPricingUrl(serp.results, monitor.domain);
}
```

Rank URLs highest when they are on the competitor domain and include path terms like `pricing`, `plans`, `compare`, `subscription`, `editions`, or localized equivalents.

## Snapshot Capture

```ts
async function captureSnapshot(
  monitor: Monitor,
  url: string,
  market: Market,
  device: "desktop" | "mobile"
): Promise<PricingSnapshot> {
  const page = await massive.web_fetch({
    url,
    render_js: true,
    captcha: "auto",
    country: market.country,
    city: market.city,
    device,
    timeout_ms: 20000,
    extract_main_content: true
  });

  const extracted = await extractPricing(monitor, page, market, device);

  return {
    monitor_id: stableMonitorId(monitor),
    competitor: monitor.competitor,
    context: {
      country: market.country,
      city: market.city,
      device,
      fetched_at: new Date().toISOString(),
      final_url: page.final_url || url,
      status_code: page.status_code,
      js_rendered: true,
      captcha_status: page.captcha_status
    },
    plans: extracted.plans,
    page_hash: hashComparablePricingText(extracted.comparable_text),
    evidence_url: page.final_url || url,
    confidence: extracted.confidence
  };
}
```

## Extraction Prompt

```ts
async function extractPricing(monitor, page, market, device) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Extract competitor pricing facts from rendered page text.",
          "Use only the supplied page content.",
          "Return normalized JSON.",
          "Preserve raw text for every extracted price.",
          "Mark confidence low when price depends on hidden state or custom quote."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          competitor: monitor.competitor,
          market,
          device,
          watch_terms: monitor.watch_terms,
          url: page.final_url,
          title: page.title,
          text: page.text.slice(0, 16000),
          expected_schema: {
            plans: "PlanPrice[]",
            comparable_text: "string",
            confidence: "high | medium | low"
          }
        })
      }
    ]
  });

  return validateExtractedPricing(JSON.parse(response.content));
}
```

## Change Detection

```ts
function compareSnapshots(previous?: PricingSnapshot, current: PricingSnapshot) {
  if (!previous) {
    return [{
      competitor: current.competitor,
      context: current.context,
      type: "new_plan",
      current: current.plans,
      confidence: current.confidence,
      evidence_url: current.evidence_url,
      summary: "Initial pricing snapshot captured."
    }];
  }

  const previousByPlan = indexPlans(previous.plans);
  const currentByPlan = indexPlans(current.plans);
  const changes = [];

  for (const [plan, now] of Object.entries(currentByPlan)) {
    const before = previousByPlan[plan];
    if (!before) changes.push(newPlanChange(current, plan, now));
    else changes.push(...diffPlan(previous, current, plan, before, now));
  }

  for (const [plan, before] of Object.entries(previousByPlan)) {
    if (!currentByPlan[plan]) changes.push(removedPlanChange(current, plan, before));
  }

  return changes.filter(change => change.confidence !== "low" || isMaterial(change));
}
```

## Minimal CLI Shape

```bash
node tracker.js \
  --config ./monitors.json \
  --snapshots ./data/snapshots.jsonl \
  --changes ./data/changes.csv
```

Change CSV columns:

```csv
competitor,country,city,device,type,plan,previous,current,delta_percent,confidence,evidence_url,summary
```

## MVP Implementation Notes

- Store snapshots as JSONL so repeated scheduled runs append cleanly.
- Compare only within the same competitor, country, city, device, and normalized pricing URL.
- Require two consecutive identical extractions before sending high-severity alerts for low-confidence pages.
- Cache discovery SERPs for seven days; never cache pricing fetches across scheduled runs.
- Add a `--dry-run` mode that shows estimated fetches and credits before the run.
- Add a `--market` filter for quick reruns of one country or city.

