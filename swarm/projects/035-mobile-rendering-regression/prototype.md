# Prototype

This is a lightweight implementation blueprint for a one-week MVP. It assumes Massive MCP tools are available to the runtime as callable functions and that baseline snapshots are stored as JSON artifacts.

## Architecture

```text
render_brief.json
   |
   v
validate_and_estimate_run
   |
   v
load_or_capture_baselines
   |
   v
fetch_current_mobile_renders
   |
   v
extract_render_observations
   |
   v
compare_against_baselines
   |
   v
score_page_device_results
   |
   v
render_report_exports
```

## File Layout

```text
mobile-rendering-regression/
  README.md
  prototype.md
  evaluation.md
  src/
    cli.ts
    massiveClient.ts
    brief.ts
    baselineStore.ts
    fetchRenders.ts
    extractObservation.ts
    compareSnapshots.ts
    score.ts
    report.ts
    types.ts
  examples/
    marketing-site-brief.json
    marketing-site-report.json
  baselines/
    .gitkeep
  reports/
    .gitkeep
```

## TypeScript Interfaces

```ts
export type DeviceType = "mobile" | "tablet";
export type Status = "pass" | "warn" | "fail";
export type Severity = "low" | "medium" | "high" | "critical";

export type IgnoreRule =
  | { type: "selector"; value: string }
  | { type: "text_pattern"; value: string }
  | { type: "url_pattern"; value: string };

export type RegressionType =
  | "missing_required_text"
  | "missing_required_selector"
  | "hidden_required_element"
  | "viewport_overflow"
  | "content_similarity_drop"
  | "layout_shift"
  | "resource_failure_spike"
  | "status_or_redirect_change"
  | "mobile_nav_failure"
  | "overlay_blocking_content";

export interface RenderBrief {
  project: {
    name: string;
    environment: "production" | "staging" | "preview";
    releaseId?: string;
  };
  geo: {
    country?: string;
    city?: string;
  };
  devices: Array<{
    id: string;
    label: string;
    type: DeviceType;
  }>;
  pages: Array<{
    label: string;
    url: string;
    baselineSnapshotId?: string;
    requiredText: string[];
    requiredSelectors: string[];
    criticalLinks: string[];
  }>;
  ignoreRules: IgnoreRule[];
  thresholds: {
    minContentSimilarity: number;
    maxLayoutShiftScore: number;
    maxViewportOverflowPx: number;
    maxFailedResources: number;
  };
}

export interface RenderObservation {
  snapshotId: string;
  url: string;
  finalUrl: string;
  pageLabel: string;
  deviceId: string;
  country?: string;
  city?: string;
  collectedAt: string;
  statusCode: number;
  title?: string;
  canonicalUrl?: string;
  renderedText: string;
  textHash: string;
  structuralHash: string;
  visualHash?: string;
  viewport: {
    width: number;
    height: number;
    scrollWidth?: number;
    scrollHeight?: number;
  };
  selectors: Array<{
    selector: string;
    present: boolean;
    visible?: boolean;
    count: number;
  }>;
  links: Array<{
    href: string;
    text?: string;
  }>;
  forms: Array<{
    action?: string;
    method?: string;
    fieldCount: number;
  }>;
  resources: Array<{
    url: string;
    type?: string;
    status?: number;
    failed: boolean;
  }>;
  overlays: Array<{
    selector?: string;
    text?: string;
    coversViewportPct?: number;
  }>;
  fetchWarnings: string[];
}

export interface RegressionFinding {
  type: RegressionType;
  severity: Severity;
  pageLabel: string;
  url: string;
  deviceId: string;
  baselineSnapshotId?: string;
  currentSnapshotId: string;
  selector?: string;
  text?: string;
  baselineObservation: string;
  currentObservation: string;
  recommendedAction: string;
}

export interface RenderRegressionReport {
  project: RenderBrief["project"];
  generatedAt: string;
  overallStatus: Status;
  summary: string;
  results: Array<{
    pageLabel: string;
    url: string;
    deviceId: string;
    status: Status;
    severity?: Severity;
    healthScore: number;
    regressions: RegressionFinding[];
    evidence: {
      currentSnapshotId: string;
      baselineSnapshotId?: string;
      statusCode: number;
      finalUrl: string;
      renderedTitle?: string;
    };
  }>;
}
```

## Massive MCP Adapter

```ts
export interface MassiveClient {
  accountStatus(): Promise<{ ok: boolean; remaining?: number }>;
  webFetch(input: {
    url: string;
    renderJs: true;
    country?: string;
    city?: string;
    device: string;
    captcha?: "auto" | "fail";
  }): Promise<{
    url: string;
    finalUrl?: string;
    status: number;
    title?: string;
    markdown: string;
    html?: string;
    screenshotUrl?: string;
    resources?: Array<{ url: string; type?: string; status?: number; failed?: boolean }>;
  }>;
  aiChatCompletion(input: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    responseFormat?: "json";
  }): Promise<{ content: string }>;
}
```

## Baseline Strategy

Baselines are plain JSON observations keyed by project, URL, device, geo, and release label.

```ts
export function snapshotKey(input: {
  projectName: string;
  environment: string;
  url: string;
  deviceId: string;
  country?: string;
  city?: string;
}): string {
  return [
    input.projectName,
    input.environment,
    input.country ?? "global",
    input.city ?? "any-city",
    input.deviceId,
    new URL(input.url).hostname,
    new URL(input.url).pathname || "/"
  ]
    .join("__")
    .replace(/[^a-zA-Z0-9._-]+/g, "_");
}
```

Baseline capture mode should run the same fetch and extraction pipeline, then store observations without comparing them. Comparison mode requires an explicit baseline ID or resolves the latest approved baseline for the same page-device-geo key.

## Comparison Logic

```ts
export function compareObservation(
  brief: RenderBrief,
  page: RenderBrief["pages"][number],
  baseline: RenderObservation | undefined,
  current: RenderObservation
): RegressionFinding[] {
  const findings: RegressionFinding[] = [];

  for (const text of page.requiredText) {
    if (!current.renderedText.includes(text)) {
      findings.push({
        type: "missing_required_text",
        severity: "high",
        pageLabel: page.label,
        url: page.url,
        deviceId: current.deviceId,
        baselineSnapshotId: baseline?.snapshotId,
        currentSnapshotId: current.snapshotId,
        text,
        baselineObservation: baseline
          ? "Required text was present in the accepted baseline."
          : "No baseline was available; this is a presence check.",
        currentObservation: `Required text was not found after rendering: ${text}`,
        recommendedAction: "Check responsive content, personalization rules, and hydration state for this breakpoint."
      });
    }
  }

  for (const selector of page.requiredSelectors) {
    const observed = current.selectors.find((item) => item.selector === selector);
    if (!observed?.present) {
      findings.push({
        type: "missing_required_selector",
        severity: "high",
        pageLabel: page.label,
        url: page.url,
        deviceId: current.deviceId,
        baselineSnapshotId: baseline?.snapshotId,
        currentSnapshotId: current.snapshotId,
        selector,
        baselineObservation: baseline
          ? "Required selector was present in the accepted baseline."
          : "No baseline was available; this is a presence check.",
        currentObservation: `Required selector was not found after rendering: ${selector}`,
        recommendedAction: "Inspect mobile markup, CSS breakpoints, and client-side rendering errors."
      });
    }
  }

  const overflowPx = Math.max(0, (current.viewport.scrollWidth ?? 0) - current.viewport.width);
  if (overflowPx > brief.thresholds.maxViewportOverflowPx) {
    findings.push({
      type: "viewport_overflow",
      severity: overflowPx > 120 ? "critical" : "medium",
      pageLabel: page.label,
      url: page.url,
      deviceId: current.deviceId,
      baselineSnapshotId: baseline?.snapshotId,
      currentSnapshotId: current.snapshotId,
      baselineObservation: baseline
        ? `Baseline overflow was ${Math.max(0, (baseline.viewport.scrollWidth ?? 0) - baseline.viewport.width)}px.`
        : "No baseline was available; threshold-only overflow check applied.",
      currentObservation: `Current render overflows the viewport by ${overflowPx}px.`,
      recommendedAction: "Look for fixed-width modules, tables, images, embeds, or sticky elements exceeding the viewport."
    });
  }

  return findings;
}
```

## Run Plan

1. Validate URLs, devices, thresholds, required selectors, and ignore rules.
2. Call `account_status` and estimate one `web_fetch` per page-device pair.
3. Resolve baselines or switch to baseline capture mode.
4. Fetch current renders with `web_fetch({ renderJs: true, device, country, city, captcha: "auto" })`.
5. Extract observation JSON from fetched markdown, HTML, metadata, resources, and screenshot hashes.
6. Apply ignore rules before text and structural comparison.
7. Produce findings, health scores, and overall status.
8. Use `ai_chat_completion` only after deterministic findings exist, so summaries never invent evidence.
9. Write JSON, Markdown, and CSV reports.

## Guardrails

- Never compare desktop baselines against mobile current renders.
- Keep country, city, and device as part of the baseline identity.
- Treat captcha and consent overlays as fetch conditions unless they block required content.
- Do not classify expected dynamic copy as regression when an ignore rule covers it.
- Preserve raw snapshot IDs so every finding can be rechecked.
- Require deterministic evidence before asking the model to summarize likely causes.
