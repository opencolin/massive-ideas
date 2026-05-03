# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type Device = "desktop" | "mobile";
type Confidence = "high" | "medium" | "low" | "unknown";
type EventCategory = "music" | "comedy" | "art" | "food" | "family" | "sports" | "civic" | "nightlife" | "other";

type DiscoveryScope = {
  country: string;
  city: string;
  region?: string;
  device?: Device;
  start_date: string;
  end_date: string;
  categories: EventCategory[];
  seed_venues: string[];
  include_domains?: string[];
  exclude_domains?: string[];
};

type CalendarProject = {
  id: string;
  name: string;
  scope: DiscoveryScope;
  status: "active" | "paused" | "archived";
  created_at: string;
  updated_at: string;
};

type SourceRecord = {
  id: string;
  calendar_id: string;
  url: string;
  domain: string;
  title?: string;
  source_type: "venue_calendar" | "ticketing_page" | "aggregator" | "community_calendar" | "local_serp" | "seed_url";
  query?: string;
  rank?: number;
  snippet?: string;
  visible_date?: string;
  fetched_at?: string;
  fetch_status?: "pending" | "ok" | "failed" | "blocked";
  country: string;
  city: string;
  device: Device;
};

type Venue = {
  id: string;
  name: string;
  address?: string;
  neighborhood?: string;
  website?: string;
  confidence: Confidence;
  source_ids: string[];
};

type EventCandidate = {
  id: string;
  calendar_id: string;
  source_id: string;
  title: string;
  starts_at?: string;
  ends_at?: string;
  timezone?: string;
  venue_name?: string;
  venue_address?: string;
  ticket_url?: string;
  price_text?: string;
  age_limit?: string;
  category: EventCategory;
  confidence: Confidence;
  confidence_note: string;
  extraction_notes: string[];
};

type EventCluster = {
  id: string;
  calendar_id: string;
  canonical_title: string;
  starts_at: string;
  ends_at?: string;
  venue_id?: string;
  category: EventCategory;
  ticket_url?: string;
  price_text?: string;
  source_ids: string[];
  candidate_ids: string[];
  confidence: Confidence;
  confidence_note: string;
  status: "published" | "needs_review" | "rejected" | "duplicate";
};

type DiscoveryRun = {
  id: string;
  calendar_id: string;
  run_type: "plan" | "search" | "fetch" | "extract" | "dedupe" | "export";
  input: unknown;
  output_summary: string;
  credits_estimated?: number;
  credits_used?: number;
  created_at: string;
};
```

## Pipeline

```ts
async function discoverEvents(calendar: CalendarProject) {
  const plan = await planDiscovery(calendar);
  const estimate = estimateCredits(plan);
  const account = await massive.account_status();

  if (!account.ok || account.remaining_credits < estimate.total) {
    throw new Error("Insufficient Massive MCP credits for event discovery run");
  }

  const serpSources = await searchLocalSerps(calendar, plan.queries);
  const sourceQueue = rankSources([...serpSources, ...seedVenueSources(calendar)], calendar);
  const fetchedSources = await fetchEventSources(calendar, sourceQueue);
  const candidates = await extractEventCandidates(calendar, fetchedSources);
  const clusters = await dedupeAndNormalize(calendar, candidates);
  const reviewed = await reviewEventConfidence(calendar, clusters, candidates, fetchedSources);

  return persistDiscoveryResults({
    sources: [...serpSources, ...fetchedSources],
    candidates,
    clusters: reviewed
  });
}
```

## Discovery Planning

```ts
async function planDiscovery(calendar: CalendarProject) {
  const response = await massive.ai_chat_completion({
    model: "event-discovery-planner",
    messages: [
      {
        role: "system",
        content: "Create a local event discovery plan. Return JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          city: calendar.scope.city,
          region: calendar.scope.region,
          country: calendar.scope.country,
          date_range: [calendar.scope.start_date, calendar.scope.end_date],
          categories: calendar.scope.categories,
          seed_venues: calendar.scope.seed_venues
        })
      }
    ],
    response_schema: "EventDiscoveryPlan"
  });

  return sanitizeDiscoveryPlan(response.json);
}
```

The plan should include:

- Venue-calendar queries for each seed venue.
- Category queries like `Oakland live music May 2026`.
- Aggregator queries for ticketing, community, tourism, university, and neighborhood calendars.
- Required source types for each category.
- Device targeting choice and whether to compare mobile against desktop.
- Known ambiguity risks, such as recurring events, postponed dates, and similarly named venues.

## Search Capture

```ts
async function searchLocalSerps(calendar: CalendarProject, queries) {
  const records: SourceRecord[] = [];

  for (const item of queries) {
    const result = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: calendar.scope.country,
      city: calendar.scope.city,
      device: calendar.scope.device || "desktop",
      max_results: item.max_results || 10
    });

    records.push(...normalizeSerpResults(result, calendar, item));
  }

  return records.filter(record => !isExcluded(record.url, calendar.scope.exclude_domains));
}
```

Each search record must preserve query, rank, URL, title, snippet, visible date, result type, country, city, device, and search timestamp.

## Fetch And Extraction

```ts
async function fetchEventSources(calendar: CalendarProject, sources: SourceRecord[]) {
  const fetched = [];

  for (const source of sources) {
    const page = await massive.web_fetch({
      url: source.url,
      render_js: true,
      captcha: "auto",
      extract_main_content: true,
      country: calendar.scope.country,
      city: calendar.scope.city,
      device: calendar.scope.device || "desktop",
      timeout_ms: 15000
    });

    fetched.push(normalizeFetchedSource(source, page));
  }

  return fetched;
}

async function extractEventCandidates(calendar: CalendarProject, fetchedSources: SourceRecord[]) {
  const response = await massive.ai_chat_completion({
    model: "event-extractor",
    messages: [
      {
        role: "system",
        content: "Extract local event candidates from fetched event sources. Return JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          scope: calendar.scope,
          sources: fetchedSources.map(compactFetchedSourceForExtraction)
        })
      }
    ],
    response_schema: "EventCandidateList"
  });

  return validateCandidates(response.json.events, calendar);
}
```

Extraction rules:

- Require a title and at least one date signal.
- Prefer ISO timestamps with timezone.
- Keep original date and price text when parsing is uncertain.
- Attach every candidate to a source ID.
- Mark recurring, cancelled, postponed, or ambiguous events for review.
- Ignore private, invite-only, or past events unless the user explicitly includes them.

## Deduplication And Confidence

```ts
async function dedupeAndNormalize(calendar: CalendarProject, candidates: EventCandidate[]) {
  const response = await massive.ai_chat_completion({
    model: "event-dedupe",
    messages: [
      {
        role: "system",
        content: "Cluster duplicate event candidates and select canonical fields. Return JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({ scope: calendar.scope, candidates })
      }
    ],
    response_schema: "EventClusterList"
  });

  return validateClusters(response.json.clusters, candidates);
}
```

Confidence policy:

- High: title, date, venue, and source URL agree on a fetched venue, organizer, or ticket page.
- Medium: date and venue are clear from one fetched source or two SERP/aggregator sources.
- Low: date comes only from a snippet, page title, or stale aggregator.
- Unknown: missing date, missing venue, conflicting dates, or page fetch failed.

## Exports

Initial exports:

- JSON for API consumers.
- CSV for editorial review.
- iCal for calendars.
- RSS for city-guide feeds.
- Markdown for newsletter and weekend-guide drafts.

Exports should include source URLs, confidence, review status, and generated timestamps so downstream users can audit freshness.
