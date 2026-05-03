# Prototype

This implementation sketch assumes a Node or Python service with a Massive MCP client exposing `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type Market = {
  country: string;
  city?: string;
  language?: string;
};

type Device = "desktop" | "mobile";

type Brand = {
  name: string;
  domain: string;
  aliases: string[];
  approved_claims: string[];
};

type Competitor = {
  name: string;
  domain?: string;
  aliases?: string[];
};

type PromptPack = {
  name: string;
  prompts: string[];
};

type VisibilityConfig = {
  workspace: string;
  brands: Brand[];
  competitors: Competitor[];
  markets: Market[];
  devices: Device[];
  prompt_packs: PromptPack[];
  search_queries: string[];
};

type AnswerRun = {
  run_id: string;
  brand_name: string;
  prompt_pack: string;
  prompt: string;
  market: Market;
  device: Device;
  generated_at: string;
  answer_text: string;
  citations: Citation[];
  raw_response: unknown;
};

type Citation = {
  url: string;
  title?: string;
  domain?: string;
  cited_text?: string;
  source_type: "brand_owned" | "competitor_owned" | "third_party" | "unknown";
  fetched?: SourceFetch;
};

type SourceFetch = {
  final_url: string;
  fetched_at: string;
  status?: number;
  render_status: "rendered" | "captcha" | "blocked" | "failed";
  main_text?: string;
};

type SerpObservation = {
  query: string;
  market: Market;
  device: Device;
  captured_at: string;
  result_url: string;
  title?: string;
  snippet?: string;
  rank?: number;
  result_type: "organic" | "sitelink" | "people_also_ask" | "ai_module" | "other";
  mentioned_brands: string[];
};

type VisibilityClassification = {
  run_id: string;
  brand_name: string;
  brand_mentioned: boolean;
  brand_cited: boolean;
  answer_position?: number;
  mentioned_competitors: string[];
  cited_competitors: string[];
  sentiment: "positive" | "neutral" | "mixed" | "negative" | "not_mentioned";
  claim_checks: ClaimCheck[];
  source_quality: "high" | "medium" | "low" | "none";
  confidence: "high" | "medium" | "low";
  rationale: string;
};

type ClaimCheck = {
  claim: string;
  status: "accurate" | "inaccurate" | "unsupported" | "unclear";
  evidence_url?: string;
  severity: "high" | "medium" | "low";
};
```

## Pipeline

```ts
async function runVisibilityScan(config: VisibilityConfig) {
  const status = await massive.account_status();
  const answerRunsNeeded =
    config.brands.length *
    config.prompt_packs.reduce((sum, pack) => sum + pack.prompts.length, 0) *
    config.markets.length *
    config.devices.length;
  const searchRunsNeeded = config.search_queries.length * config.markets.length * config.devices.length;

  if (!status.ok || status.remaining_credits < answerRunsNeeded + searchRunsNeeded) {
    throw new Error("Insufficient Massive MCP credits for AI visibility scan");
  }

  const answerRuns: AnswerRun[] = [];
  const serpObservations: SerpObservation[] = [];

  for (const market of config.markets) {
    for (const device of config.devices) {
      answerRuns.push(...await runPromptMatrix(config, market, device));
      serpObservations.push(...await captureSerpMatrix(config, market, device));
    }
  }

  const enrichedRuns = await fetchCitedSources(answerRuns, config);
  const classifications = await classifyAnswerRuns(config, enrichedRuns);
  return buildVisibilityReport(config, enrichedRuns, serpObservations, classifications);
}
```

## Prompt Execution

```ts
async function runPromptMatrix(config: VisibilityConfig, market: Market, device: Device): Promise<AnswerRun[]> {
  const runs: AnswerRun[] = [];

  for (const brand of config.brands) {
    for (const pack of config.prompt_packs) {
      for (const prompt of pack.prompts) {
        const response = await massive.ai_chat_completion({
          model: "grounded-answer-with-sources",
          country: market.country,
          city: market.city,
          language: market.language,
          device,
          include_sources: true,
          messages: [
            {
              role: "system",
              content: "Answer as a neutral buyer research assistant. Use sources when available."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        });

        runs.push({
          run_id: createRunId(brand.name, pack.name, prompt, market, device),
          brand_name: brand.name,
          prompt_pack: pack.name,
          prompt,
          market,
          device,
          generated_at: new Date().toISOString(),
          answer_text: response.answer_text,
          citations: normalizeCitations(response.sources, brand, config.competitors),
          raw_response: response
        });
      }
    }
  }

  return runs;
}
```

## SERP Capture

```ts
async function captureSerpMatrix(config: VisibilityConfig, market: Market, device: Device): Promise<SerpObservation[]> {
  const observations: SerpObservation[] = [];
  const brandNames = [
    ...config.brands.flatMap((brand) => [brand.name, ...brand.aliases]),
    ...config.competitors.flatMap((competitor) => [competitor.name, ...(competitor.aliases || [])])
  ];

  for (const query of config.search_queries) {
    const serp = await massive.web_search({
      query,
      parse_google_serp: true,
      country: market.country,
      city: market.city,
      language: market.language,
      device,
      max_results: 20
    });

    for (const result of serp.results) {
      observations.push({
        query,
        market,
        device,
        captured_at: new Date().toISOString(),
        result_url: result.url,
        title: result.title,
        snippet: result.snippet,
        rank: result.rank,
        result_type: result.type || "organic",
        mentioned_brands: detectNames(`${result.title || ""}\n${result.snippet || ""}`, brandNames)
      });
    }
  }

  return observations;
}
```

## Citation Fetching

```ts
async function fetchCitedSources(runs: AnswerRun[], config: VisibilityConfig): Promise<AnswerRun[]> {
  for (const run of runs) {
    for (const citation of run.citations) {
      const fetched = await massive.web_fetch({
        url: citation.url,
        render_js: true,
        captcha: "auto",
        country: run.market.country,
        city: run.market.city,
        device: run.device,
        timeout_ms: 25000,
        extract_main_content: true
      });

      citation.fetched = {
        final_url: fetched.final_url || citation.url,
        fetched_at: new Date().toISOString(),
        status: fetched.status,
        render_status: classifyRenderStatus(fetched),
        main_text: fetched.main_text
      };
    }
  }

  return runs;
}
```

## Classification Prompt

```ts
async function classifyAnswerRuns(config: VisibilityConfig, runs: AnswerRun[]) {
  const classifications: VisibilityClassification[] = [];

  for (const run of runs) {
    const brand = config.brands.find((candidate) => candidate.name === run.brand_name);

    const response = await massive.ai_chat_completion({
      model: "fast-grounded-json",
      response_format: "json",
      messages: [
        {
          role: "system",
          content: [
            "Classify AI brand visibility from supplied answer and source evidence only.",
            "Return strict JSON.",
            "Do not infer citation support unless the cited page text supports it.",
            "Mark confidence low when the answer has no sources or sources could not be fetched."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            tracked_brand: brand,
            competitors: config.competitors,
            prompt: run.prompt,
            market: run.market,
            device: run.device,
            answer_text: run.answer_text,
            citations: run.citations.map((citation) => ({
              url: citation.url,
              source_type: citation.source_type,
              main_text: citation.fetched?.main_text?.slice(0, 12000),
              render_status: citation.fetched?.render_status
            }))
          })
        }
      ]
    });

    classifications.push({ run_id: run.run_id, brand_name: run.brand_name, ...response.json });
  }

  return classifications;
}
```

## Scoring

```ts
function buildVisibilitySummary(classifications: VisibilityClassification[]) {
  const total = classifications.length || 1;
  const mentioned = classifications.filter((item) => item.brand_mentioned);
  const cited = classifications.filter((item) => item.brand_cited);
  const positions = mentioned.map((item) => item.answer_position).filter(Boolean) as number[];

  return {
    prompt_runs: classifications.length,
    brand_mention_rate: mentioned.length / total,
    brand_citation_rate: cited.length / total,
    average_answer_position: positions.length
      ? positions.reduce((sum, position) => sum + position, 0) / positions.length
      : null,
    positive_or_neutral_sentiment_rate:
      classifications.filter((item) => ["positive", "neutral"].includes(item.sentiment)).length / total,
    claim_accuracy_rate: calculateClaimAccuracy(classifications)
  };
}
```

## Report Shape

The report should include:

- Workspace, run timestamp, config hash, and Massive MCP account status snapshot.
- Brand-level visibility summary.
- Prompt-level answer observations.
- Market and device visibility matrix.
- Competitor share-of-answer comparison.
- Citation source leaderboard grouped by brand-owned, competitor-owned, and third-party sources.
- Claim accuracy queue with severity, evidence URL, and reviewer action.
- SERP context for the same categories and markets.
- Recommended source-content opportunities tied to missing citations or weak third-party coverage.

## Storage

Minimum storage tables:

- `visibility_runs`: config snapshot, start time, finish time, status, credit estimate.
- `answer_runs`: prompt, market, device, answer text, raw response, timestamp.
- `citations`: answer run, URL, source type, fetch status, rendered text hash.
- `serp_observations`: query, market, device, rank, URL, title, snippet, result type.
- `classifications`: structured visibility labels, claim checks, confidence, rationale.
- `reports`: JSON, CSV, Markdown artifact locations.

## CLI Commands

```bash
ai-visibility validate --config visibility-targets.json
ai-visibility run --config visibility-targets.json --out report.json --csv observations.csv --markdown brief.md
ai-visibility diff --before last-report.json --after report.json --markdown changes.md
```
