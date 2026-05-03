# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type PricingMonitorBrief = {
  owned_company: {
    name: string;
    domain: string;
    category?: string;
  };
  competitors: CompetitorPricingTarget[];
  geo?: GeoTarget;
  cadence: "daily" | "weekly" | "monthly" | "manual";
  sensitivity: "all_visible" | "commercial_only" | "major_only";
  exclude_selectors_or_text?: string[];
  alert_thresholds?: AlertThresholds;
};

type CompetitorPricingTarget = {
  name: string;
  domain: string;
  pricing_urls: string[];
  notes?: string;
};

type GeoTarget = {
  country: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type AlertThresholds = {
  price_change_percent?: number;
  feature_change_severity?: "low" | "medium" | "high";
  notify_on_trial_change?: boolean;
  notify_on_contact_sales_change?: boolean;
};

type PricingSnapshot = {
  snapshot_id: string;
  competitor: string;
  domain: string;
  url: string;
  final_url?: string;
  geo: GeoTarget;
  fetched_at: string;
  fetch_status: "ok" | "blocked" | "partial" | "failed";
  content_hash: string;
  visible_text_hash: string;
  structured_facts: PricingFacts;
  raw_excerpts: EvidenceExcerpt[];
  warnings: string[];
};

type PricingFacts = {
  currency?: string;
  billing_periods: string[];
  plans: PricingPlan[];
  trials: TrialFact[];
  discounts: DiscountFact[];
  faqs: FaqFact[];
  ctas: CtaFact[];
};

type PricingPlan = {
  name: string;
  normalized_name: string;
  price_text?: string;
  amount?: number;
  unit?: string;
  billing_period?: string;
  is_contact_sales?: boolean;
  included_features: string[];
  limits: PricingLimit[];
  evidence_selector?: string;
};

type PricingLimit = {
  label: string;
  value: string;
  applies_to_plan?: string;
};

type TrialFact = {
  text: string;
  days?: number;
  requires_credit_card?: boolean;
};

type DiscountFact = {
  text: string;
  percent?: number;
  billing_period?: string;
};

type FaqFact = {
  question: string;
  answer: string;
};

type CtaFact = {
  text: string;
  target?: string;
  plan?: string;
};

type EvidenceExcerpt = {
  source_type: "web_fetch" | "snapshot_diff" | "serp_result";
  url: string;
  fetched_at?: string;
  excerpt?: string;
  selector?: string;
  field?: string;
  previous_snapshot_id?: string;
  current_snapshot_id?: string;
};

type PricingChange = {
  competitor: string;
  url: string;
  change_type: ChangeType;
  severity: "high" | "medium" | "low";
  severity_score: number;
  confidence: "high" | "medium" | "low";
  observed_at: string;
  before?: unknown;
  after?: unknown;
  evidence: EvidenceExcerpt[];
  recommended_follow_up: string;
};

type ChangeType =
  | "price_increase"
  | "price_decrease"
  | "new_plan"
  | "removed_plan"
  | "renamed_plan"
  | "billing_period_change"
  | "free_trial_change"
  | "discount_or_promo_change"
  | "usage_limit_change"
  | "seat_limit_change"
  | "feature_gating_change"
  | "enterprise_contact_sales_change"
  | "cta_or_positioning_change"
  | "currency_or_region_variant"
  | "cosmetic_or_uncertain_change";

type PricingChangeReport = {
  run_id: string;
  summary: string;
  changes: PricingChange[];
  unchanged: {
    competitor: string;
    url: string;
    confidence: "high" | "medium" | "low";
  }[];
  warnings: string[];
};
```

## Pipeline

```ts
async function detectPricingChanges(
  brief: PricingMonitorBrief
): Promise<PricingChangeReport> {
  validateBrief(brief);

  const targets = flattenPricingTargets(brief);
  const estimatedCredits = estimateCredits(targets, brief.geo);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for pricing monitor run");
  }

  const previousSnapshots = await loadPreviousSnapshots(brief);
  const currentSnapshots = await fetchAndExtractSnapshots(brief, targets);
  const rawDiffs = diffPricingSnapshots(previousSnapshots, currentSnapshots);
  const classifiedChanges = await classifyCommercialChanges(brief, rawDiffs);
  const report = await synthesizePricingReport(brief, classifiedChanges, currentSnapshots);

  await saveSnapshots(currentSnapshots);
  await saveReport(report);
  return report;
}
```

## Fetching

Use `web_fetch` as the primary collection method because pricing pages often render plan cards, toggles, and localized prices in JavaScript.

```ts
async function fetchPricingPage(
  target: CompetitorPricingTarget,
  url: string,
  geo: GeoTarget
): Promise<PricingSnapshot> {
  const response = await massive.web_fetch({
    url,
    render_js: true,
    captcha: "solve",
    country: geo.country,
    city: geo.city,
    device: geo.device || "desktop",
    wait_for_network_idle: true,
    extract_visible_text: true,
    include_html: true
  });

  const cleaned = removeExcludedContent(response, [
    "cookie",
    "footer",
    "copyright",
    "newsletter"
  ]);

  const structured_facts = await extractPricingFacts(cleaned.visible_text, cleaned.html);

  return {
    snapshot_id: createSnapshotId(target.domain, url, geo),
    competitor: target.name,
    domain: target.domain,
    url,
    final_url: response.final_url,
    geo,
    fetched_at: new Date().toISOString(),
    fetch_status: response.ok ? "ok" : "partial",
    content_hash: stableHash(cleaned.html),
    visible_text_hash: stableHash(cleaned.visible_text),
    structured_facts,
    raw_excerpts: createEvidenceExcerpts(url, response, structured_facts),
    warnings: response.warnings || []
  };
}
```

## Fact Extraction

`ai_chat_completion` converts rendered text and compact HTML fragments into structured pricing facts. The prompt should require exact excerpts for every extracted fact and should reject unsupported inference.

```ts
async function extractPricingFacts(visibleText: string, html: string): Promise<PricingFacts> {
  return massive.ai_chat_completion({
    model: "fast",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Extract pricing facts from a public pricing page.",
          "Return only facts visible in the supplied page content.",
          "Every price, plan, trial, discount, feature gate, CTA, and limit needs evidence text.",
          "Do not infer revenue, strategy, customer segments, or private intent."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          visible_text: truncate(visibleText, 30000),
          html_fragments: selectPricingHtmlFragments(html)
        })
      }
    ]
  });
}
```

## Diffing

Diff structured facts before comparing raw text. Raw text changes are useful for context, but alerts should be driven by normalized facts whenever possible.

```ts
function diffPricingSnapshots(
  previous: PricingSnapshot[],
  current: PricingSnapshot[]
): RawPricingDiff[] {
  const diffs: RawPricingDiff[] = [];

  for (const currentSnapshot of current) {
    const prior = findMatchingSnapshot(previous, currentSnapshot);
    if (!prior) {
      diffs.push(markAllFactsAsNew(currentSnapshot));
      continue;
    }

    diffs.push(
      ...diffPlanPrices(prior, currentSnapshot),
      ...diffPlanAvailability(prior, currentSnapshot),
      ...diffFeatureGates(prior, currentSnapshot),
      ...diffLimits(prior, currentSnapshot),
      ...diffTrialsAndDiscounts(prior, currentSnapshot),
      ...diffCtas(prior, currentSnapshot)
    );

    if (prior.visible_text_hash !== currentSnapshot.visible_text_hash) {
      diffs.push(createRawTextDiff(prior, currentSnapshot));
    }
  }

  return dedupeAndNormalizeDiffs(diffs);
}
```

## Optional URL Discovery

If users provide only domains, use `web_search` to discover likely pricing pages:

```ts
async function discoverPricingUrls(domain: string, companyName: string): Promise<string[]> {
  const results = await massive.web_search({
    query: `${companyName} pricing OR plans site:${domain}`,
    parse_google_serp: true,
    country: "us",
    device: "desktop"
  });

  return results.organic
    .map((result) => result.url)
    .filter((url) => /pricing|plans|packages|billing/i.test(url))
    .slice(0, 5);
}
```

## Alert Synthesis

`ai_chat_completion` should turn normalized diffs into business-readable alerts while preserving uncertainty.

Rules:

- Separate observed facts from recommendations.
- Include before and after values for every high-severity alert.
- Include URL, fetch time, geo, and device in evidence.
- Label raw-text-only changes as uncertain.
- Suppress footer, legal, cookie, navigation, and minor copy edits under `commercial_only`.
- Never claim market strategy, revenue impact, or customer migration unless the page explicitly says it.

## Storage

Store one JSON snapshot per target, date, geo, and device:

```text
snapshots/
  metricflow.example/
    pricing__us_san-francisco_desktop__2026-05-02.json
reports/
  pricing-change-report__2026-05-02.json
  pricing-change-report__2026-05-02.md
  pricing-changes__2026-05-02.csv
```

## CLI Commands

```bash
pricing-change-detector discover \
  --domain metricflow.example \
  --company "MetricFlow" \
  --out discovered-pricing-urls.json

pricing-change-detector run \
  --brief pricing-monitor-brief.json \
  --snapshot-dir snapshots \
  --out pricing-change-report.json \
  --report-md pricing-change-report.md \
  --changes-csv pricing-changes.csv

pricing-change-detector diff \
  --previous snapshots/metricflow/pricing__2026-04-25.json \
  --current snapshots/metricflow/pricing__2026-05-02.json \
  --out pricing-diff.json
```
