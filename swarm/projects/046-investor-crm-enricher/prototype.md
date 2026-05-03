# Prototype

## Thin Architecture

The prototype is a CLI with small modules around Massive MCP calls and deterministic normalization:

```text
investor_crm_enricher/
  cli.ts
  input.ts
  massive.ts
  discover.ts
  extract.ts
  score.ts
  export.ts
```

Each run writes a timestamped audit directory:

```text
runs/acme-data-seed-2026-05-02/
  input.normalized.json
  searches.jsonl
  raw_pages.jsonl
  investor_evidence.json
  enriched_rows.json
  enriched_investors.csv
  shortlist.md
  warnings.json
```

## CLI Shape

```bash
investor-crm-enrich run \
  --input investors.csv \
  --brief founder-brief.json \
  --lookback-days 180 \
  --country US \
  --city "San Francisco" \
  --device desktop \
  --max-results-per-row 8 \
  --out enriched-investors.csv \
  --report shortlist.md
```

## Core Types

```ts
type FounderBrief = {
  name: string;
  sector: string;
  stage: string;
  geo?: string;
  customers?: string;
  raise?: string;
  exclusions?: string[];
};

type InputInvestorRow = {
  rowId: string;
  investorName?: string;
  firm?: string;
  profileUrl?: string;
  firmDomain?: string;
  linkedInUrl?: string;
  notes?: string;
  original: Record<string, string>;
};

type EvidenceSource = {
  url: string;
  title?: string;
  snippet: string;
  sourceType:
    | "firm_site"
    | "team_profile"
    | "portfolio"
    | "announcement"
    | "blog"
    | "podcast"
    | "serp"
    | "other";
  fetchedAt: string;
};

type RecentActivity = {
  type:
    | "investment_announcement"
    | "portfolio_update"
    | "thesis_post"
    | "podcast_or_talk"
    | "fund_announcement"
    | "hiring_or_platform"
    | "other";
  title: string;
  observedDate?: string;
  sourceUrl: string;
  snippet: string;
};

type EnrichedInvestorRow = InputInvestorRow & {
  normalizedInvestorName?: string;
  normalizedFirm?: string;
  role?: string;
  firmDomain?: string;
  sectors: string[];
  stages: string[];
  geographies: string[];
  recentActivity: RecentActivity[];
  fitScore: number;
  fitReasons: string[];
  outreachAngle: string;
  confidence: "high" | "medium" | "low";
  sourceUrls: string[];
  sourceSnippets: string[];
  warnings: string[];
};
```

## Massive MCP Adapter

```ts
async function fetchEvidencePage(url: string, target: MassiveTarget): Promise<EvidenceSource> {
  const page = await massive.web_fetch({
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

  return {
    url: page.url,
    title: page.title,
    snippet: page.text.slice(0, 700),
    sourceType: classifySourceType(page.url, page.title, page.text),
    fetchedAt: new Date().toISOString()
  };
}

async function searchInvestorSources(row: InputInvestorRow, lookbackDays: number) {
  const identity = [row.investorName, row.firm].filter(Boolean).join(" ");
  const firm = row.firm ?? row.firmDomain ?? "";
  const queries = [
    `"${identity}" investor`,
    `"${firm}" portfolio sectors stage`,
    `"${identity}" portfolio`,
    `"${identity}" investment announced`,
    `"${identity}" thesis OR blog OR podcast`
  ];

  return Promise.all(
    queries.map((q) =>
      massive.web_search({
        q,
        parse_serp: true,
        limit: 8,
        recency_days: lookbackDays
      })
    )
  );
}
```

## Discovery Rules

For each row, rank candidate URLs before fetching:

| Signal | Weight |
| --- | ---: |
| Official firm domain matches input | 8 |
| URL path includes team, people, portfolio, companies, thesis, blog, news | 5 |
| SERP title includes investor name and firm | 5 |
| Recent result within lookback window | 4 |
| LinkedIn or social profile | 2 |
| Generic listicle, database mirror, or unrelated news | -4 |
| Same investor name but different firm context | -8 |

Fetch the top 3 to 8 URLs per row depending on confidence and run budget.

## Extraction Prompt

Use `ai_chat_completion` per investor row with strict JSON output and all source snippets attached.

```text
You enrich one investor CRM row using only the supplied evidence.

Return JSON:
{
  "normalizedInvestorName": string | null,
  "normalizedFirm": string | null,
  "role": string | null,
  "firmDomain": string | null,
  "sectors": string[],
  "stages": string[],
  "geographies": string[],
  "recentActivity": [
    {
      "type": string,
      "title": string,
      "observedDate": string | null,
      "sourceUrl": string,
      "snippet": string
    }
  ],
  "warnings": string[]
}

Rules:
- Use only supplied evidence.
- Do not infer emails, phone numbers, or private contact data.
- Do not claim an investor owns a deal unless the source says so.
- Keep sectors and stages specific, not generic.
- If there are same-name conflicts, add a warning and lower confidence.
- Every recentActivity item must include a source URL.
```

## Fit Scoring Prompt

Batch enriched rows in groups of 10 to 20 so scores are calibrated across the list.

```text
Score each investor for the founder brief.

Founder brief:
{{founderBrief}}

For each investor row, return:
{
  "rowId": string,
  "fitScore": number,
  "fitReasons": string[],
  "outreachAngle": string,
  "confidence": "high" | "medium" | "low"
}

Scoring guidance:
- 80-100: strong stage, sector, geo, and recent-activity match.
- 60-79: plausible fit with one missing or weak dimension.
- 40-59: partial relevance but weak evidence.
- 0-39: poor fit, stale evidence, wrong stage, wrong sector, or insufficient support.

Do not reward broad VC marketing language unless it is supported by portfolio or recent activity.
```

## Pseudocode

```ts
async function run(input: RunInput) {
  const status = await massive.account_status();
  assertRunBudget(status, input.rows.length);

  const rows = normalizeInputRows(input.inputPath);
  const brief = readFounderBrief(input.briefPath);

  const enriched = await mapWithConcurrency(rows, 4, async (row) => {
    const searched = await searchInvestorSources(row, input.lookbackDays ?? 180);
    const candidateUrls = rankCandidateUrls(row, searched)
      .slice(0, input.maxResultsPerRow ?? 8);

    const pages = await mapWithConcurrency(candidateUrls, 3, (url) =>
      fetchEvidencePage(url, input.target)
    );

    const extracted = await extractInvestorEvidence(row, pages);
    return { row, pages, extracted };
  });

  const scored = await scoreFitInBatches(enriched, brief);
  const finalRows = mergeScores(enriched, scored);

  await writeJson("enriched_rows.json", finalRows);
  await writeCsv(input.out, finalRows);
  await writeMarkdownReport(input.report, finalRows, brief);
}
```

## MVP Error Handling

- If quota is low, process the first N rows and emit a skipped-row report with estimated credits needed.
- If a page is blocked after captcha handling, store the URL in `warnings.json` and continue with SERP snippets.
- If a firm domain conflicts with search evidence, keep the original value and add a conflict warning.
- If the model returns invalid JSON, retry once with a repair prompt and then store raw output for inspection.
- If recent activity is absent, score from static thesis and portfolio evidence but mark recency confidence low.

## Export Design

The CSV should preserve every original column and append enrichment columns:

```text
original columns..., normalized_investor_name, normalized_firm, role,
firm_domain, sectors, stages, geographies, recent_activity,
fit_score, fit_reasons, outreach_angle, confidence, source_urls, warnings
```

The Markdown report should include:

- Top 25 investors by fit score.
- Best recent activity hooks.
- Rows with high ambiguity or same-name conflicts.
- Rows where missing information should be manually researched.

## Lightweight Test Fixtures

Create local fixtures before live runs:

- `firm-team.html`: investor profile with role, sectors, and stage language.
- `portfolio.html`: portfolio cards with categories and geographies.
- `news.html`: recent investment announcement with date and company sector.
- `ambiguous-serp.json`: same investor name at two different firms.
- `broad-thesis.html`: generic "we invest in exceptional founders" language.

Expected behavior:

- Extract investor and firm fields from official pages.
- Avoid domains or roles when only weak SERP evidence exists.
- Down-score generic thesis pages without portfolio support.
- Preserve original CRM columns in the final CSV.
- Include source URLs and snippets for every appended claim.
