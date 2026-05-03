# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type PaaBriefInput = {
  topic: string;
  seed_url?: string;
  audience?: string;
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  content_format?: "blog_post" | "landing_page" | "comparison_page" | "faq" | "guide" | string;
  intent_focus?: QueryIntent[];
  include_domains?: string[];
  exclude_domains?: string[];
  exclusions?: string[];
};

type QueryIntent =
  | "informational"
  | "commercial"
  | "comparison"
  | "problem_aware"
  | "how_to"
  | "definition"
  | "pricing"
  | "faq";

type QueryPlanItem = {
  query: string;
  intent: QueryIntent;
  source: "google" | "ai_answer";
};

type PaaQuestion = {
  question: string;
  normalized_question: string;
  intent: QueryIntent;
  score: number;
  first_seen_query?: string;
  serp_occurrences: number;
  related_urls: string[];
  evidence: Evidence[];
  confidence: "high" | "medium" | "low";
};

type Evidence = {
  claim: string;
  source_url: string;
  source_type: "paa" | "serp_result" | "fetched_page" | "ai_answer_source";
  query?: string;
  prompt?: string;
  rank?: number;
  fetched_at: string;
};

type QuestionCluster = {
  name: string;
  intent: QueryIntent;
  questions: string[];
  brief_guidance: string;
};

type OutlineSection = {
  heading: string;
  target_questions: string[];
  answer_notes: Evidence[];
};

type ContentBrief = {
  topic: string;
  brief_summary: string;
  recommended_title: string;
  primary_intent: QueryIntent | "mixed";
  question_clusters: QuestionCluster[];
  outline: OutlineSection[];
  faq: {
    question: string;
    short_answer: string;
    evidence: Evidence[];
  }[];
  source_domains: {
    domain: string;
    role: "official" | "vendor" | "publisher" | "documentation" | "review" | "forum" | "unknown";
    serp_mentions: number;
    paa_mentions: number;
    fetched_pages: number;
  }[];
  content_gaps: string[];
  confidence: "high" | "medium" | "low";
};
```

## Pipeline

```ts
async function generatePaaContentBrief(input: PaaBriefInput): Promise<ContentBrief> {
  const queryPlan = createQueryPlan(input);
  const estimatedCredits = estimateCredits(queryPlan, input.seed_url);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for PAA content brief run");
  }

  const serpResults = await collectSerps(input, queryPlan);
  const aiAnswers = await collectAiAnswers(input, queryPlan);
  const fetchedPages = await fetchEvidencePages(input, serpResults, aiAnswers);
  const questions = await extractAndScoreQuestions(input, serpResults, aiAnswers, fetchedPages);

  return synthesizeBrief(input, questions, serpResults, aiAnswers, fetchedPages);
}
```

## Query Planning

```ts
function createQueryPlan(input: PaaBriefInput): QueryPlanItem[] {
  const topic = input.topic;
  const audience = input.audience ? ` for ${input.audience}` : "";

  const base: QueryPlanItem[] = [
    { query: topic, intent: "informational", source: "google" },
    { query: `what is ${topic}`, intent: "definition", source: "google" },
    { query: `how does ${topic} work`, intent: "how_to", source: "google" },
    { query: `${topic} benefits${audience}`, intent: "commercial", source: "google" },
    { query: `${topic} alternatives`, intent: "comparison", source: "google" },
    { query: `${topic} pricing`, intent: "pricing", source: "google" },
    { query: `What questions do buyers ask about ${topic}${audience}? Cite sources.`, intent: "faq", source: "ai_answer" },
    { query: `What should a content brief for ${topic}${audience} cover? Cite sources.`, intent: "informational", source: "ai_answer" }
  ];

  const focused = (input.intent_focus || []).flatMap(intent => [
    { query: `${topic} ${intent.replace("_", " ")}`, intent, source: "google" as const },
    { query: `${topic} questions ${intent.replace("_", " ")}`, intent, source: "google" as const }
  ]);

  return dedupeQueryPlan([...base, ...focused]);
}
```

## SERP And PAA Collection

```ts
async function collectSerps(input: PaaBriefInput, queryPlan: QueryPlanItem[]) {
  const googleQueries = queryPlan.filter(item => item.source === "google");
  const results = [];

  for (const item of googleQueries) {
    results.push(await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      include_serp_features: ["people_also_ask", "related_searches", "organic_results"],
      country: input.geo?.country,
      city: input.geo?.city,
      device: input.geo?.device || "desktop",
      max_results: 10
    }));
  }

  return normalizeSerpResults(results, googleQueries);
}
```

Preserve:

- Query text and intent
- People Also Ask question text and position
- Organic rank, title, snippet, URL, and domain
- Related searches and SERP feature metadata
- Local targeting fields
- Whether the result is official, vendor, publisher, documentation, review, forum, or unknown

## AI Answer Collection

```ts
async function collectAiAnswers(input: PaaBriefInput, queryPlan: QueryPlanItem[]) {
  const prompts = queryPlan.filter(item => item.source === "ai_answer");
  const answers = [];

  for (const item of prompts) {
    answers.push(await massive.ai_chat_completion({
      model: "grounded-answer-with-sources",
      messages: [
        {
          role: "system",
          content: "Answer as an SEO content strategist. Cite sources for question, outline, and answer-angle recommendations."
        },
        {
          role: "user",
          content: JSON.stringify({
            topic: input.topic,
            seed_url: input.seed_url,
            audience: input.audience,
            content_format: input.content_format,
            include_domains: input.include_domains,
            exclude_domains: input.exclude_domains,
            exclusions: input.exclusions,
            question: item.query
          })
        }
      ]
    }));
  }

  return normalizeAnswerResults(answers, prompts);
}
```

## Fetching Evidence

```ts
async function fetchEvidencePages(input: PaaBriefInput, serpResults, aiAnswers) {
  const urls = dedupeUrls([
    input.seed_url,
    ...serpResults.flatMap(result => result.organic_urls.slice(0, 6)),
    ...serpResults.flatMap(result => result.paa_source_urls || []),
    ...aiAnswers.flatMap(answer => answer.source_urls || [])
  ].filter(Boolean))
    .filter(url => !isExcludedDomain(url, input.exclude_domains))
    .slice(0, 50);

  const pages = [];
  for (const url of urls) {
    pages.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return pages.filter(page => page.ok && page.text?.length > 300);
}
```

## Question Extraction And Deduplication

```ts
async function extractAndScoreQuestions(input, serpResults, aiAnswers, fetchedPages): Promise<PaaQuestion[]> {
  const rawQuestions = [
    ...serpResults.flatMap(result => result.people_also_ask || []),
    ...serpResults.flatMap(result => extractQuestionsFromSnippets(result)),
    ...fetchedPages.flatMap(page => extractHeadingsAndFaqQuestions(page)),
    ...aiAnswers.flatMap(answer => answer.questions || [])
  ];

  const normalized = semanticDedupe(rawQuestions, {
    topic: input.topic,
    exclusions: input.exclusions || []
  });

  return normalized
    .map(question => ({
      ...question,
      score: scoreQuestion(question, input),
      confidence: confidenceForQuestion(question)
    }))
    .sort((a, b) => b.score - a.score);
}
```

Deduplication should merge:

- Singular and plural variants
- Punctuation and capitalization variants
- Same meaning with different modifier order
- "What is X?" and "What does X mean?" when the answer target is identical

Do not merge:

- Pricing, cost, and ROI questions unless the wording targets the same answer
- Comparison questions against different competitors
- Legal, compliance, or medical questions that imply different risk levels

## Brief Synthesis

```ts
async function synthesizeBrief(input, questions, serpResults, aiAnswers, fetchedPages): Promise<ContentBrief> {
  const answer = await massive.ai_chat_completion({
    model: "grounded-answer-with-sources",
    messages: [
      {
        role: "system",
        content: "Create a practical content brief. Every factual answer note must point to provided evidence."
      },
      {
        role: "user",
        content: JSON.stringify({
          input,
          top_questions: questions.slice(0, 40),
          serp_summary: summarizeSerps(serpResults),
          fetched_evidence: summarizeFetchedPages(fetchedPages),
          ai_answer_sources: summarizeAiAnswers(aiAnswers)
        })
      }
    ]
  });

  return validateAndNormalizeBrief(answer);
}
```

## Output Writers

- JSON: full structured brief with all evidence lineage.
- Markdown: editor-friendly title, intent summary, outline, FAQ, source notes, and content gaps.
- CSV later: one row per question for editorial planning and topic clustering.

## Implementation Notes

- Store raw SERP, PAA, AI-answer, and fetch artifacts separately from synthesized brief output.
- Cache by query, country, city, device, and date to avoid accidental duplicate credit spend.
- Keep source-domain exclusions active during fetch and synthesis.
- Treat AI-only questions as suggestions until confirmed by SERP or fetched-page evidence.
- Add schema validation before writing outputs so malformed AI responses fail loudly.
