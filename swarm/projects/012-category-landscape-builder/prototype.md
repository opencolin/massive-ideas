# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type CategoryBrief = {
  category: string;
  buyer?: string;
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  seed_companies?: string[];
  intents: string[];
  exclusions?: string[];
};

type QueryPlanItem = {
  query: string;
  intent: "category" | "alternatives" | "best_of" | "pricing" | "use_case" | "problem" | "buyer_question";
  source: "google" | "ai_answer";
};

type Evidence = {
  claim: string;
  source_url: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source";
  query?: string;
  rank?: number;
  fetched_at: string;
};

type Vendor = {
  name: string;
  domain?: string;
  positioning: string;
  serp_presence_score: number;
  ai_answer_presence_score: number;
  evidence: Evidence[];
  confidence: "high" | "medium" | "low";
};

type Landscape = {
  category: string;
  landscape_summary: string;
  vendors: Vendor[];
  themes: string[];
  source_domains: {
    domain: string;
    role: "official" | "review" | "comparison" | "publisher" | "analyst" | "community" | "unknown";
    serp_mentions: number;
    ai_answer_citations: number;
  }[];
  gaps: string[];
};
```

## Pipeline

```ts
async function buildLandscape(brief: CategoryBrief): Promise<Landscape> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for category landscape run");
  }

  const serpResults = await collectSerps(brief, queryPlan);
  const answerResults = await collectAiAnswers(brief, queryPlan);
  const pages = await fetchEvidencePages(serpResults, answerResults);

  return synthesizeLandscape(brief, serpResults, answerResults, pages);
}
```

## Query Planning

```ts
function createQueryPlan(brief: CategoryBrief): QueryPlanItem[] {
  const category = brief.category;
  const buyer = brief.buyer ? ` for ${brief.buyer}` : "";

  return [
    { query: `best ${category}${buyer}`, intent: "best_of", source: "google" },
    { query: `${category} alternatives`, intent: "alternatives", source: "google" },
    { query: `${category} pricing comparison`, intent: "pricing", source: "google" },
    { query: `${category} use cases${buyer}`, intent: "use_case", source: "google" },
    { query: `what is ${category}`, intent: "category", source: "google" },
    { query: `What are the best ${category}${buyer}? Cite sources.`, intent: "best_of", source: "ai_answer" },
    { query: `What vendors compete in ${category}? Cite sources.`, intent: "alternatives", source: "ai_answer" },
    { query: `What should buyers ask before choosing ${category}? Cite sources.`, intent: "buyer_question", source: "ai_answer" }
  ];
}
```

Seed companies can add targeted queries:

```ts
function seedCompanyQueries(brief: CategoryBrief): QueryPlanItem[] {
  return (brief.seed_companies || []).flatMap(company => [
    { query: `${company} alternatives ${brief.category}`, intent: "alternatives", source: "google" },
    { query: `${company} vs competitors ${brief.category}`, intent: "alternatives", source: "google" }
  ]);
}
```

## SERP Collection

```ts
async function collectSerps(brief: CategoryBrief, queryPlan: QueryPlanItem[]) {
  const googleQueries = queryPlan.filter(item => item.source === "google");
  const results = [];

  for (const item of googleQueries) {
    results.push(await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: 10
    }));
  }

  return normalizeSerpResults(results, googleQueries);
}
```

Keep these fields for scoring and audit:

- Query text
- Intent
- Result rank
- Title
- Snippet
- URL
- Domain
- SERP features, when available

## AI Answer Collection

```ts
async function collectAiAnswers(brief: CategoryBrief, queryPlan: QueryPlanItem[]) {
  const answerPrompts = queryPlan.filter(item => item.source === "ai_answer");
  const answers = [];

  for (const item of answerPrompts) {
    answers.push(await massive.ai_chat_completion({
      model: "grounded-answer-with-sources",
      messages: [
        {
          role: "system",
          content: "Answer as a category analyst. Cite sources for vendors, category claims, and buyer criteria."
        },
        {
          role: "user",
          content: JSON.stringify({
            category: brief.category,
            buyer: brief.buyer,
            exclusions: brief.exclusions,
            question: item.query
          })
        }
      ]
    }));
  }

  return normalizeAnswerResults(answers, answerPrompts);
}
```

## Fetching Evidence

```ts
async function fetchEvidencePages(serpResults, answerResults) {
  const candidateUrls = dedupeUrls([
    ...serpResults.flatMap(result => result.urls.slice(0, 5)),
    ...answerResults.flatMap(answer => answer.source_urls || [])
  ]).slice(0, 40);

  const fetched = [];
  for (const url of candidateUrls) {
    fetched.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return fetched.filter(page => page.ok && page.text?.length > 300);
}
```

Prioritize:

- Vendor home, category, product, pricing, and comparison pages
- Review and marketplace category pages
- Analyst or publisher explainers
- High-ranking listicles and alternatives pages
- AI-answer cited sources

## Synthesis Prompt

```ts
async function synthesizeLandscape(brief, serpResults, answerResults, pages) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "You build category landscapes from search results and AI answers.",
          "Use only provided evidence.",
          "Separate Google SERP visibility from AI-answer visibility.",
          "Return JSON matching the Landscape schema.",
          "Lower confidence for unsupported, stale, or ambiguous claims."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          serp_results: serpResults,
          ai_answers: answerResults,
          fetched_pages: pages.map(page => ({
            url: page.url,
            title: page.title,
            text: page.text.slice(0, 10000)
          })),
          scoring_rubric: {
            serp_visibility: 30,
            ai_answer_visibility: 25,
            source_quality: 20,
            positioning_clarity: 15,
            freshness_geo_relevance: 10,
            caps: {
              ai_only_no_fetched_source: 60,
              single_appearance: 55,
              ambiguous_or_excluded_meaning: 40
            }
          }
        })
      }
    ]
  });

  return validateLandscape(JSON.parse(response.content));
}
```

## Minimal CLI Shape

```bash
node landscape.js \
  --brief ./category.json \
  --out ./landscape.json \
  --csv ./vendors.csv \
  --brief-md ./landscape.md
```

CSV columns:

```csv
vendor,domain,serp_presence_score,ai_answer_presence_score,confidence,positioning,evidence_urls
```

## MVP Implementation Notes

- Start with 8 to 12 Google queries and 3 AI-answer prompts per category.
- Cache SERP, answer, and fetch results for 24 hours by query, prompt, URL, geo, and device.
- Limit the first run to 40 fetched pages.
- Store raw SERP rank and AI citation data for auditability.
- Add `--compare-ai-google` to show vendors that appear in one surface but not the other.
- Add `--min-confidence` for export filtering.
