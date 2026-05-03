# Prototype

## Thin Architecture

The prototype is a CLI plus three small modules:

```text
conference_enricher/
  cli.ts
  massive.ts
  discover.ts
  extract.ts
  score.ts
  export.ts
```

No database is required for the MVP. Each run writes artifacts into a timestamped output directory:

```text
runs/example-ai-summit-2026/
  raw_pages.jsonl
  discovered_urls.json
  entities.raw.json
  entities.enriched.json
  leads.csv
```

## CLI Shape

```bash
conference-enrich run \
  --url "https://example-ai-summit.com" \
  --icp "B2B AI infrastructure companies with platform leaders" \
  --country US \
  --city "San Francisco" \
  --device desktop \
  --max-pages 10 \
  --max-entities 500 \
  --out leads.csv
```

## Core Types

```ts
type MassiveTarget = {
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type SourcePage = {
  url: string;
  title?: string;
  text: string;
  html?: string;
  fetchedAt: string;
};

type RawEntity = {
  entityType: "company" | "person";
  name: string;
  company?: string;
  roleOrTier?: string;
  sourceUrl: string;
  sourceSnippet: string;
};

type EnrichedEntity = RawEntity & {
  domain?: string;
  signals: string[];
  fitScore: number;
  outreachAngle: string;
  supportingSources: string[];
};
```

## Massive MCP Adapter

```ts
async function fetchPage(url: string, target: MassiveTarget): Promise<SourcePage> {
  return massive.web_fetch({
    url,
    render_js: true,
    captcha: "solve_if_needed",
    country: target.country,
    city: target.city,
    device: target.device ?? "desktop",
    extract: {
      text: true,
      links: true,
      metadata: true
    }
  });
}

async function searchOfficialPages(conferenceUrl: string): Promise<string[]> {
  const host = new URL(conferenceUrl).hostname;
  const queries = [
    `site:${host} sponsors OR sponsor`,
    `site:${host} exhibitors OR expo`,
    `site:${host} speakers OR agenda OR sessions`
  ];

  const results = await Promise.all(
    queries.map((q) => massive.web_search({ q, parse_serp: true, limit: 10 }))
  );

  return unique(results.flatMap((r) => r.results.map((item) => item.url)))
    .filter((url) => new URL(url).hostname.endsWith(host));
}
```

## Discovery Heuristic

Start with homepage links and SERP results. Score candidate URLs with a simple keyword table:

| Keyword | Weight |
| --- | ---: |
| sponsor, sponsors, partner, partners | 5 |
| exhibitor, exhibitors, expo, marketplace | 5 |
| speaker, speakers, agenda, session, sessions | 4 |
| startup, showcase, directory | 3 |
| venue, hotel, travel, privacy, terms | -5 |

Fetch the highest scoring pages until `maxPages` is reached.

## Extraction Prompt

Use `ai_chat_completion` once per page with strict JSON output.

```text
You extract public conference entities from one page.

Return JSON with:
{
  "entities": [
    {
      "entityType": "company" | "person",
      "name": string,
      "company": string | null,
      "roleOrTier": string | null,
      "sourceSnippet": string
    }
  ]
}

Rules:
- Use only the supplied page text.
- Extract sponsors, exhibitors, speakers, partners, and session participants.
- Do not invent emails, phone numbers, private attendee names, or missing employers.
- Keep sourceSnippet under 240 characters and make it directly support the entity.
```

## Enrichment Prompt

Batch 10 to 25 entities at a time so the model can compare duplicates while preserving source attribution.

```text
Given conference entities and search/fetch evidence, return normalized enriched records.

For each entity:
- infer the company domain only when evidence is strong
- list 2-6 concrete signals
- score fit from 0-100 against this ICP: {{icp}}
- write one outreach angle under 180 characters
- include supporting source URLs

If evidence is weak, lower confidence and do not guess.
```

## Pseudocode

```ts
async function run(input: RunInput) {
  const status = await massive.account_status();
  assertUsable(status);

  const homepage = await fetchPage(input.url, input.target);
  const discovered = [
    ...linksFromPage(homepage),
    ...(await searchOfficialPages(input.url))
  ];

  const sourceUrls = rankCandidateUrls(discovered)
    .slice(0, input.maxPages ?? 10);

  const pages = await mapWithConcurrency(sourceUrls, 3, (url) =>
    fetchPage(url, input.target)
  );

  const rawEntities = await extractEntities(pages);
  const deduped = dedupeEntities(rawEntities)
    .slice(0, input.maxEntities ?? 500);

  const searchEvidence = await gatherCompanyEvidence(deduped);
  const enriched = await scoreAndEnrich(deduped, searchEvidence, input.icp);

  await writeJson("entities.enriched.json", enriched);
  await writeCsv(input.out, enriched);
}
```

## MVP Error Handling

- If `account_status` indicates quota is low, run discovery only and report required estimated credits.
- If a fetch hits unsolved captcha or blocks, keep the URL in `blocked_urls.json` and continue.
- If extraction returns invalid JSON, retry once with a repair prompt; then store the raw model answer for inspection.
- If domain inference conflicts, leave `domain` empty and include both supporting URLs in notes.

## Lightweight Test Fixtures

Create three static HTML fixtures:

- `sponsors.html`: tiered sponsor cards with JS-like duplicated text.
- `speakers.html`: speaker cards with names, titles, employers, and session links.
- `agenda.html`: sessions that mention companies without sponsor cards.

Expected behavior:

- Extract companies from all three fixture types.
- Deduplicate the same company across sponsor and speaker pages.
- Keep speaker-person rows separate from company-account rows.
- Produce valid CSV with source URLs and snippets.
