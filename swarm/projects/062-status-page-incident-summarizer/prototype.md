# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type StatusIncidentBrief = {
  workspace: Workspace;
  vendors: VendorTarget[];
  window: DateWindow;
  targets: MarketTarget[];
  output: OutputPreferences;
};

type Workspace = {
  name: string;
  dependency_stack: string;
};

type VendorTarget = {
  name: string;
  domain: string;
  known_status_urls?: string[];
  watched_components?: string[];
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
  minimum_severity: "informational" | "minor" | "major" | "critical";
  include_unresolved: boolean;
  digest_style: "executive" | "customer_success" | "sre" | "vendor_risk";
};

type StatusSourceCandidate = {
  id: string;
  vendor_name: string;
  url: string;
  source_type:
    | "status_home"
    | "incident_history"
    | "incident_detail"
    | "postmortem"
    | "support_article"
    | "community"
    | "unknown";
  discovered_by: "known_source" | "web_search" | "serp_result";
  title?: string;
  snippet?: string;
  rank?: number;
  confidence: "high" | "medium" | "low";
};

type StatusObservation = {
  id: string;
  source_id: string;
  vendor_name: string;
  url: string;
  source_type: StatusSourceCandidate["source_type"];
  target: MarketTarget;
  fetched_at: string;
  page_title?: string;
  rendered_text_excerpt: string;
  incidents: IncidentSection[];
  component_statuses: ComponentStatus[];
  captcha_detected: boolean;
  fetch_status: "ok" | "blocked" | "error";
};

type IncidentSection = {
  title?: string;
  status?: "investigating" | "identified" | "monitoring" | "resolved" | "scheduled" | "unknown";
  started_at?: string;
  resolved_at?: string;
  updates: IncidentUpdate[];
  affected_components?: string[];
  anchors?: string[];
};

type IncidentUpdate = {
  timestamp?: string;
  state?: string;
  text: string;
};

type ComponentStatus = {
  name: string;
  status: "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance" | "unknown";
  region?: string;
};

type IncidentRecord = {
  id: string;
  vendor_name: string;
  title: string;
  incident_type:
    | "outage"
    | "degradation"
    | "maintenance"
    | "security"
    | "data_delay"
    | "email_delivery"
    | "regional"
    | "third_party_dependency"
    | "resolved_no_impact"
    | "unclear";
  status: "active" | "resolved" | "scheduled" | "unknown";
  severity: "critical" | "major" | "minor" | "informational";
  started_at?: string;
  resolved_at?: string;
  duration_minutes?: number;
  affected_components: string[];
  affected_regions?: string[];
  impact_summary: string;
  source_urls: string[];
  evidence_ids: string[];
  confidence: "high" | "medium" | "low";
};

type VendorIncidentDigest = {
  name: string;
  incident_count: number;
  highest_severity: IncidentRecord["severity"];
  total_reported_duration_minutes?: number;
  narrative: string;
  notable_incidents: IncidentRecord[];
};

type ReliabilityTheme = {
  theme: string;
  vendors: string[];
  supporting_incident_ids: string[];
  confidence: "high" | "medium" | "low";
};

type RecommendedAction = {
  team: "customer_success" | "support" | "sre" | "procurement" | "leadership";
  action: string;
  evidence_ids: string[];
};

type StatusIncidentReport = {
  workspace: Workspace;
  period: DateWindow;
  summary: string;
  vendors: VendorIncidentDigest[];
  incidents: IncidentRecord[];
  themes: ReliabilityTheme[];
  recommended_actions: RecommendedAction[];
  collection_gaps: CollectionGap[];
};

type CollectionGap = {
  vendor_name: string;
  url: string;
  reason: "blocked" | "not_found" | "render_error" | "ambiguous_source" | "insufficient_history";
  detail: string;
};
```

## Pipeline

```ts
async function runStatusIncidentSummary(
  brief: StatusIncidentBrief
): Promise<StatusIncidentReport> {
  const sources = await discoverStatusSources(brief);
  const estimatedCredits = estimateCredits(sources, brief.targets);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for status incident summary run");
  }

  const observations = await fetchStatusObservations(sources, brief.targets);
  const extracted = await extractIncidents(brief, observations);
  const deduped = await deduplicateIncidentUpdates(extracted);
  const filtered = filterIncidentsForOutput(brief, deduped);

  return synthesizeIncidentReport(brief, filtered, observations);
}
```

## Source Discovery

Start with known sources, then expand through search:

```ts
async function discoverStatusSources(
  brief: StatusIncidentBrief
): Promise<StatusSourceCandidate[]> {
  const sources: StatusSourceCandidate[] = [];

  for (const vendor of brief.vendors) {
    for (const url of vendor.known_status_urls || []) {
      sources.push({
        id: makeSourceId(vendor.name, url),
        vendor_name: vendor.name,
        url,
        source_type: classifyStatusUrl(url),
        discovered_by: "known_source",
        confidence: "high"
      });
    }

    for (const query of buildStatusDiscoveryQueries(vendor)) {
      const results = await massive.web_search({
        query,
        parse_google_serp: true,
        country: "us",
        language: "en-US"
      });

      sources.push(...rankOfficialStatusSources(vendor, results));
    }
  }

  return dedupeStatusSources(sources).slice(0, 8 * brief.vendors.length);
}
```

Discovery queries should include:

- `{vendor} status`
- `{vendor} incident history`
- `{vendor} status page`
- `site:{domain} status OR incident OR outage`
- `site:{domain} postmortem OR "service disruption"`
- `{vendor} support outage` when official status history is sparse

## Fetching

Use `web_fetch` with rendering enabled for every candidate because many public status dashboards are JavaScript apps.

```ts
async function fetchStatusObservations(
  sources: StatusSourceCandidate[],
  targets: MarketTarget[]
): Promise<StatusObservation[]> {
  const observations: StatusObservation[] = [];

  for (const source of sources) {
    for (const target of targets) {
      const page = await massive.web_fetch({
        url: source.url,
        render_js: true,
        captcha_handling: true,
        country: target.country,
        city: target.city,
        language: target.language,
        device: target.device
      });

      observations.push(await parseStatusObservation(source, target, page));
    }
  }

  return observations;
}
```

Parsing should preserve:

- Page title, canonical URL, and fetch timestamp.
- Incident titles, statuses, update timestamps, and update text.
- Component names and current component status.
- Region labels and service categories.
- Captcha, blocked, or partial-render indicators.
- Rendered text excerpts for evidence review.

## Incident Extraction

Use `ai_chat_completion` to convert observations into structured incident records. The prompt should require:

- Only source-backed incidents from the requested date window.
- Explicit unknowns for missing start or resolution times.
- No invented customer impact beyond the source text.
- Component mapping against the watched component list.
- Evidence IDs for every incident and every recommended action.
- A confidence score tied to source quality and timeline completeness.

## Deduplication

Merge incident records when they share:

- Same vendor.
- Overlapping start or resolution window.
- Similar title or affected components.
- Shared incident URL or identical status update text.

Keep all evidence URLs on the merged record and prefer the most specific incident-detail URL as primary evidence.

## Output Rules

- Exclude incidents below `minimum_severity`.
- Exclude unresolved active incidents when `include_unresolved` is false.
- Include collection gaps for blocked or ambiguous sources.
- Preserve regional incidents separately when impact differs by geography.
- Never use outage aggregator pages as primary evidence unless no official source exists, and label them as supporting context.
- Markdown export should start with executive summary, then vendor table, incident details, collection gaps, and recommended actions.
