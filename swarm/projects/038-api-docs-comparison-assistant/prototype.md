# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ApiDocsBrief = {
  category: string;
  audience?: string;
  apis: {
    name: string;
    domain?: string;
    docs_url?: string;
    version?: string;
    seed_urls?: string[];
  }[];
  capabilities: string[];
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  exclusions?: string[];
};

type SourceRecord = {
  api: string;
  url: string;
  title?: string;
  source_type:
    | "api_reference"
    | "guide"
    | "sdk_docs"
    | "changelog"
    | "migration_guide"
    | "pricing_page"
    | "status_page"
    | "third_party"
    | "unknown";
  version?: string;
  query?: string;
  rank?: number;
  fetched_at: string;
  geo?: ApiDocsBrief["geo"];
  text: string;
};

type Evidence = {
  source_url: string;
  source_type: SourceRecord["source_type"];
  claim: string;
  quote?: string;
  version?: string;
  query?: string;
  rank?: number;
  fetched_at: string;
};

type CapabilityCell = {
  status: "exact" | "equivalent" | "partial" | "absent" | "deprecated" | "gated" | "unknown";
  details: string;
  migration_impact?: "none" | "low" | "medium" | "high";
  confidence: "high" | "medium" | "low";
  evidence: Evidence[];
};

type CapabilityRow = {
  capability: string;
  normalized_capability: string;
  apis: Record<string, CapabilityCell>;
};

type ApiDocsComparison = {
  category: string;
  generated_at: string;
  summary: string;
  comparison: CapabilityRow[];
  source_inventory: {
    api: string;
    url: string;
    source_type: SourceRecord["source_type"];
    capabilities_found: string[];
  }[];
  migration_notes: string[];
  review_notes: string[];
};
```

## Pipeline

```ts
async function buildApiDocsComparison(brief: ApiDocsBrief): Promise<ApiDocsComparison> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan, brief.apis.length);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for API docs comparison run");
  }

  const discovered = await discoverSources(brief, queryPlan);
  const fetched = await fetchSources(brief, discovered);
  const extracted = await extractApiClaims(brief, fetched);

  return synthesizeComparison(brief, fetched, extracted);
}
```

## Query Planning

```ts
function createQueryPlan(brief: ApiDocsBrief) {
  return brief.apis.flatMap(api => {
    const apiTerm = api.domain || api.name;
    const versionTerm = api.version ? ` ${api.version}` : "";
    const capabilityQueries = brief.capabilities.flatMap(capability => [
      {
        api: api.name,
        intent: "api_reference",
        query: `site:${apiTerm} ${capability} API reference${versionTerm}`
      },
      {
        api: api.name,
        intent: "guide",
        query: `site:${apiTerm} ${capability} developer docs${versionTerm}`
      }
    ]);

    return [
      {
        api: api.name,
        intent: "api_reference",
        query: `${api.name} API reference ${brief.category}${versionTerm}`
      },
      {
        api: api.name,
        intent: "changelog",
        query: `${api.name} API changelog deprecated migration${versionTerm}`
      },
      {
        api: api.name,
        intent: "sdk_docs",
        query: `${api.name} SDK docs ${brief.category}`
      },
      ...capabilityQueries
    ];
  });
}
```

Limit the first MVP to 2-5 APIs and 8-20 capabilities. Larger comparisons should batch by API and capability family so a failed docs fetch does not invalidate the whole run.

## Source Discovery

```ts
async function discoverSources(brief: ApiDocsBrief, queryPlan) {
  const results = [];

  for (const item of queryPlan) {
    const serp = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: 8
    });

    results.push(...normalizeSerpResults(item, serp));
  }

  const seedUrls = brief.apis.flatMap(api =>
    [api.docs_url, ...(api.seed_urls || [])].filter(Boolean).map(url => ({
      api: api.name,
      url,
      source_type: classifyUrl(url),
      version: api.version,
      priority: 1
    }))
  );

  return rankAndDedupeSources([...seedUrls, ...results]).slice(0, 80);
}
```

Source ranking should prefer:

- Official API reference pages
- Developer guides and quickstarts
- SDK documentation and generated reference pages
- Changelogs, deprecation notices, and migration guides
- Pricing, quota, and rate-limit pages
- Status and incident pages for reliability claims
- Recent reputable third-party tutorials only as secondary context

## Fetching

```ts
async function fetchSources(brief: ApiDocsBrief, sources): Promise<SourceRecord[]> {
  const fetched = [];

  for (const source of sources) {
    const page = await massive.web_fetch({
      url: source.url,
      render_js: true,
      captcha: "auto",
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      timeout_ms: 15000,
      extract_main_content: true
    });

    if (page.ok && page.text?.length > 250) {
      fetched.push({
        api: source.api,
        url: page.final_url || source.url,
        title: page.title,
        source_type: source.source_type || classifyUrl(page.final_url || source.url),
        version: source.version,
        query: source.query,
        rank: source.rank,
        fetched_at: new Date().toISOString(),
        geo: brief.geo,
        text: page.text
      });
    }
  }

  return fetched;
}
```

## Extraction Prompt

```text
You are extracting API documentation facts for a technical comparison.

Brief:
{{brief_json}}

Source:
- API: {{source.api}}
- URL: {{source.url}}
- Type: {{source.source_type}}
- Version: {{source.version}}
- Fetched at: {{source.fetched_at}}

Return JSON only with:
- matched_capabilities: requested capabilities supported by this source
- endpoint_facts: method, path, request body fields, response fields, pagination, auth, idempotency, errors
- operational_facts: rate limits, quotas, regions, retries, SLAs, SDKs, webhooks, changelog/deprecation details
- evidence: concise claims with source URL and short quote when available
- uncertainty: ambiguity, stale docs, missing version, or gated access notes

Rules:
- Do not infer support from absence.
- Label generated SDK docs separately from human-authored docs.
- Prefer official docs over third-party tutorials.
- Preserve version and deprecation context.
```

## Synthesis

```ts
async function synthesizeComparison(brief, sources, extracted): Promise<ApiDocsComparison> {
  const result = await massive.ai_chat_completion({
    model: "source-grounded",
    temperature: 0,
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Create a conservative, evidence-backed API docs comparison. Unknown is better than unsupported without evidence."
      },
      {
        role: "user",
        content: JSON.stringify({ brief, sources: summarizeSources(sources), extracted })
      }
    ]
  });

  return validateAndRepairComparison(JSON.parse(result.content));
}
```

## Output Renderers

- Markdown: executive summary, matrix, endpoint/schema notes, migration notes, review queue, and source inventory.
- JSON: complete structured output for downstream automation.
- CSV: one row per capability and API with status, confidence, details, and evidence URL.

## Implementation Notes

- Use deterministic schemas for extraction and synthesis to keep comparisons diffable.
- Cache fetched docs by URL, geo, device, and timestamp window.
- Keep raw page text separate from normalized claims so reviewers can audit extraction errors.
- Run schema validation after every AI step.
- Downgrade unsupported-looking claims to `unknown` unless explicit negative evidence exists.
