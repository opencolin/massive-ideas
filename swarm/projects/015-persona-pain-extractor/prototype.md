# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type PersonaBrief = {
  persona: string;
  problem_space: string;
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  known_products?: string[];
  source_types: Array<"forums" | "reviews" | "support_pages" | "community_posts">;
  excluded_topics?: string[];
};

type QueryPlanItem = {
  query: string;
  intent: "complaint" | "workaround" | "review" | "support" | "forum" | "comparison" | "persona_language";
  source_type: "google" | "ai_answer";
};

type RawSource = {
  url: string;
  domain: string;
  title?: string;
  source_type: "forum" | "review" | "support_page" | "community_post" | "publisher" | "unknown";
  query?: string;
  rank?: number;
  fetched_at: string;
  text: string;
};

type Evidence = {
  claim: string;
  source_url: string;
  source_type: RawSource["source_type"];
  query?: string;
  rank?: number;
  fetched_at: string;
};

type VerbatimSnippet = {
  text: string;
  source_url: string;
  source_type: RawSource["source_type"];
  fetched_at: string;
};

type PainPoint = {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  frequency_score: number;
  persona_fit: "high" | "medium" | "low";
  trigger_events: string[];
  workarounds: string[];
  verbatim_snippets: VerbatimSnippet[];
  evidence: Evidence[];
  confidence: "high" | "medium" | "low";
};

type PainMap = {
  persona: string;
  problem_space: string;
  summary: string;
  pain_points: PainPoint[];
  language_patterns: string[];
  source_mix: Record<string, number>;
  gaps: string[];
};
```

## Pipeline

```ts
async function extractPersonaPains(brief: PersonaBrief): Promise<PainMap> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for persona pain extraction");
  }

  const serpResults = await collectDiscoverySerps(brief, queryPlan);
  const answerSeeds = await collectAiSeedAnswers(brief, queryPlan);
  const pages = await fetchCandidatePages(brief, serpResults, answerSeeds);
  const sourceNotes = await extractSourceNotes(brief, pages);

  return synthesizePainMap(brief, sourceNotes);
}
```

## Query Planning

```ts
function createQueryPlan(brief: PersonaBrief): QueryPlanItem[] {
  const persona = brief.persona;
  const problem = brief.problem_space;
  const exclusions = brief.excluded_topics?.join(" ") || "";

  const base: QueryPlanItem[] = [
    { query: `"${problem}" complaints "${persona}"`, intent: "complaint", source_type: "google" },
    { query: `"${problem}" workaround "${persona}"`, intent: "workaround", source_type: "google" },
    { query: `"${problem}" forum pain points`, intent: "forum", source_type: "google" },
    { query: `"${problem}" reviews problems`, intent: "review", source_type: "google" },
    { query: `"${problem}" support community issue`, intent: "support", source_type: "google" },
    { query: `What pains does ${persona} have with ${problem}? Cite sources. Exclude: ${exclusions}`, intent: "persona_language", source_type: "ai_answer" }
  ];

  return base.concat(productQueries(brief));
}

function productQueries(brief: PersonaBrief): QueryPlanItem[] {
  return (brief.known_products || []).flatMap(product => [
    { query: `"${product}" "${brief.problem_space}" complaints`, intent: "complaint", source_type: "google" },
    { query: `"${product}" support community "${brief.problem_space}"`, intent: "support", source_type: "google" },
    { query: `"${product}" reviews "${brief.problem_space}"`, intent: "review", source_type: "google" }
  ]);
}
```

## SERP Collection

```ts
async function collectDiscoverySerps(brief: PersonaBrief, queryPlan: QueryPlanItem[]) {
  const googleQueries = queryPlan.filter(item => item.source_type === "google");
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

Keep these fields for audit:

- Query text
- Intent
- Result rank
- Title
- Snippet
- URL and domain
- Source-type guess
- Country, city, and device targeting values

## AI Seed Collection

```ts
async function collectAiSeedAnswers(brief: PersonaBrief, queryPlan: QueryPlanItem[]) {
  const prompts = queryPlan.filter(item => item.source_type === "ai_answer");
  const answers = [];

  for (const item of prompts) {
    answers.push(await massive.ai_chat_completion({
      model: "grounded-answer-with-sources",
      messages: [
        {
          role: "system",
          content: [
            "You are a user-research analyst.",
            "List only public-source-backed persona pains.",
            "Return source URLs for every concrete claim."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            persona: brief.persona,
            problem_space: brief.problem_space,
            excluded_topics: brief.excluded_topics,
            question: item.query
          })
        }
      ]
    }));
  }

  return normalizeAnswerSources(answers, prompts);
}
```

## Fetching Candidate Pages

```ts
async function fetchCandidatePages(brief: PersonaBrief, serpResults, answerSeeds): Promise<RawSource[]> {
  const candidateUrls = dedupeUrls([
    ...serpResults.flatMap(result => result.urls.slice(0, 6)),
    ...answerSeeds.flatMap(answer => answer.source_urls || [])
  ]).slice(0, 60);

  const fetched = [];
  for (const url of candidateUrls) {
    fetched.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 20000,
      extract_main_content: true
    }));
  }

  return fetched
    .filter(page => page.ok && page.text?.length > 300)
    .map(page => classifyRawSource(page));
}
```

Prioritize:

- Public forum and community threads with first-person complaints
- Review pages with pros, cons, and workflow details
- Official support communities and troubleshooting pages
- Help-center articles with comment sections or issue language
- Competitor community posts that mention migration, setup, pricing, or limitations

## Source Note Extraction

```ts
async function extractSourceNotes(brief: PersonaBrief, pages: RawSource[]) {
  const notes = [];

  for (const page of pages) {
    notes.push(await massive.ai_chat_completion({
      model: "fast-grounded-json",
      response_format: "json",
      messages: [
        {
          role: "system",
          content: [
            "Extract persona pain evidence from one source.",
            "Use only the provided page text.",
            "Keep short verbatim snippets under 30 words.",
            "Mark persona fit as inferred when the role is not explicit."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            brief,
            source: {
              url: page.url,
              title: page.title,
              source_type: page.source_type,
              fetched_at: page.fetched_at,
              text: page.text.slice(0, 12000)
            }
          })
        }
      ]
    }));
  }

  return normalizeSourceNotes(notes, pages);
}
```

Expected source-note shape:

```json
{
  "source_url": "https://example.com/thread",
  "source_type": "forum",
  "persona_fit": "medium",
  "pain_candidates": [
    {
      "title": "Stale fields before forecast calls",
      "description": "The poster describes manual CRM cleanup before recurring forecast meetings.",
      "severity_signals": ["time cost", "manager escalation"],
      "trigger_events": ["forecast meeting"],
      "workarounds": ["manual reminders"],
      "snippets": ["Every forecast call starts with chasing reps"],
      "confidence": "medium"
    }
  ]
}
```

## Synthesis Prompt

```ts
async function synthesizePainMap(brief: PersonaBrief, sourceNotes): Promise<PainMap> {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "You build sourced persona pain maps.",
          "Use only provided source notes.",
          "Merge duplicate pains, but preserve evidence diversity.",
          "Separate first-person complaints from vendor-authored support content.",
          "Return JSON matching the PainMap schema."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          source_notes: sourceNotes,
          scoring_rubric: {
            frequency: 30,
            severity: 25,
            persona_fit: 20,
            evidence_quality: 15,
            recency_relevance: 10
          }
        })
      }
    ]
  });

  return validatePainMap(JSON.parse(response.content));
}
```

## Export Shape

CSV columns:

- `pain_title`
- `severity`
- `frequency_score`
- `persona_fit`
- `confidence`
- `trigger_events`
- `workarounds`
- `top_snippet`
- `source_urls`

Markdown sections:

- Executive summary
- Top pain points
- Persona language patterns
- Workarounds and trigger events
- Evidence appendix
- Gaps and low-confidence areas
