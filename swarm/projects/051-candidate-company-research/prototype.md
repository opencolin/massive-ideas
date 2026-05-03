# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type CandidateBriefInput = {
  company: {
    name: string;
    url?: string;
    geo?: {
      country?: string;
      city?: string;
      device?: "desktop" | "mobile";
    };
  };
  role: {
    title: string;
    function?: string;
    seniority?: string;
    job_posting_url?: string;
  };
  candidate_priorities: Array<
    | "company stability"
    | "career growth"
    | "manager quality"
    | "compensation"
    | "remote flexibility"
    | "mission"
    | "work-life balance"
    | "learning"
  >;
  risk_tolerance?: "low" | "medium" | "high";
  time_horizon?: "application" | "recruiter screen" | "next interview" | "offer negotiation";
};

type QueryIntent =
  | "company_identity"
  | "job_posting"
  | "business_health"
  | "product_market"
  | "culture"
  | "compensation"
  | "interview"
  | "risk";

type QueryPlanItem = {
  query: string;
  intent: QueryIntent;
  source: "google" | "fetch" | "ai_answer";
  max_results: number;
};

type Evidence = {
  source_url: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source";
  query?: string;
  rank?: number;
  fetched_at: string;
  title?: string;
  excerpt?: string;
  visible_date?: string;
};

type CandidateFinding = {
  claim: string;
  candidate_takeaway: string;
  confidence: "high" | "medium" | "low";
  evidence: Evidence[];
};

type CandidateSection = {
  name: string;
  score: number;
  confidence: "high" | "medium" | "low";
  findings: CandidateFinding[];
  gaps: string[];
};

type CandidateCompanyBrief = {
  company: string;
  role: string;
  generated_at: string;
  summary: string;
  confidence: "high" | "medium" | "low";
  sections: CandidateSection[];
  red_flags: {
    risk: string;
    severity: "high" | "medium" | "low";
    evidence: Evidence[];
    question_to_ask: string;
  }[];
  interview_questions: string[];
  negotiation_notes: string[];
  source_inventory: {
    domain: string;
    source_count: number;
    section_names: string[];
  }[];
};
```

## Pipeline

```ts
async function buildCandidateCompanyBrief(input: CandidateBriefInput): Promise<CandidateCompanyBrief> {
  const queryPlan = createQueryPlan(input);
  const estimatedCredits = estimateCredits(queryPlan, input.role.job_posting_url);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for candidate company research");
  }

  const fetchedSeedPages = await fetchSeedPages(input);
  const serpResults = await collectSerps(input, queryPlan);
  const answerResults = await collectSourcedAiAnswers(input, queryPlan);
  const fetchedEvidence = await fetchEvidencePages(input, serpResults, answerResults);
  const evidenceGraph = normalizeEvidence(input, fetchedSeedPages, serpResults, answerResults, fetchedEvidence);
  const sections = await buildCandidateSections(input, evidenceGraph);

  return synthesizeBrief(input, sections, evidenceGraph);
}
```

## Query Planning

```ts
function createQueryPlan(input: CandidateBriefInput): QueryPlanItem[] {
  const company = input.company.name;
  const role = input.role.title;
  const city = input.company.geo?.city ? ` ${input.company.geo.city}` : "";
  const priorities = input.candidate_priorities.join(" ");

  return [
    { query: `${company} official site company about leadership`, intent: "company_identity", source: "google", max_results: 8 },
    { query: `${company} ${role} jobs careers`, intent: "job_posting", source: "google", max_results: 8 },
    { query: `${company} funding revenue growth customers`, intent: "business_health", source: "google", max_results: 10 },
    { query: `${company} layoffs restructuring hiring freeze`, intent: "risk", source: "google", max_results: 10 },
    { query: `${company} product customers competitors`, intent: "product_market", source: "google", max_results: 10 },
    { query: `${company} employee reviews culture work life balance${city}`, intent: "culture", source: "google", max_results: 10 },
    { query: `${company} ${role} salary compensation benefits${city}`, intent: "compensation", source: "google", max_results: 10 },
    { query: `${company} interview questions ${role}`, intent: "interview", source: "google", max_results: 10 },
    {
      query: `Create a sourced candidate research brief for ${company} and the ${role} role. Focus on ${priorities}.`,
      intent: "company_identity",
      source: "ai_answer",
      max_results: 0
    },
    {
      query: `What red flags should a candidate investigate before interviewing at ${company}? Cite sources.`,
      intent: "risk",
      source: "ai_answer",
      max_results: 0
    }
  ];
}
```

## Seed Fetching

```ts
async function fetchSeedPages(input: CandidateBriefInput): Promise<Evidence[]> {
  const urls = dedupeUrls([
    input.company.url,
    input.role.job_posting_url,
    input.company.url && new URL("/careers", input.company.url).toString(),
    input.company.url && new URL("/about", input.company.url).toString(),
    input.company.url && new URL("/benefits", input.company.url).toString()
  ]).filter(Boolean);

  const pages = [];
  for (const url of urls) {
    pages.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      country: input.company.geo?.country,
      city: input.company.geo?.city,
      device: input.company.geo?.device || "desktop",
      extract_main_content: true,
      timeout_ms: 15000
    }));
  }

  return pages.filter(page => page.ok && page.text?.length > 300).map(pageToEvidence);
}
```

## SERP Collection

```ts
async function collectSerps(input: CandidateBriefInput, queryPlan: QueryPlanItem[]) {
  const googleQueries = queryPlan.filter(item => item.source === "google");
  const results = [];

  for (const item of googleQueries) {
    results.push(await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: input.company.geo?.country,
      city: input.company.geo?.city,
      device: input.company.geo?.device || "desktop",
      max_results: item.max_results
    }));
  }

  return normalizeSerpResults(results, googleQueries);
}
```

Preserve these fields:

- Query text and intent
- Result rank, title, snippet, URL, and domain
- Visible dates, review counts, rating snippets, salary ranges, and job metadata
- SERP feature type, including jobs, reviews, news, videos, and People Also Ask

## Evidence Fetching

```ts
async function fetchEvidencePages(input, serpResults, answerResults) {
  const candidateUrls = dedupeUrls([
    input.role.job_posting_url,
    ...topUrlsByIntent(serpResults, "job_posting", 10),
    ...topUrlsByIntent(serpResults, "business_health", 15),
    ...topUrlsByIntent(serpResults, "product_market", 15),
    ...topUrlsByIntent(serpResults, "culture", 20),
    ...topUrlsByIntent(serpResults, "compensation", 15),
    ...topUrlsByIntent(serpResults, "interview", 12),
    ...topUrlsByIntent(serpResults, "risk", 20),
    ...answerResults.flatMap(answer => answer.source_urls || [])
  ]).filter(Boolean).slice(0, 70);

  const fetched = [];
  for (const url of candidateUrls) {
    fetched.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      country: input.company.geo?.country,
      city: input.company.geo?.city,
      device: input.company.geo?.device || "desktop",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return fetched.filter(page => page.ok && page.text?.length > 300);
}
```

## Synthesis Prompt

`ai_chat_completion` should receive only normalized evidence and a strict instruction:

```text
You are helping a job candidate evaluate a company and role.
Use only the supplied evidence.
Every material claim must cite one or more source ids.
Separate facts from candidate takeaways.
Anonymous reviews, salary pages, and chatbot answers are directional unless confirmed by stronger sources.
If evidence is weak, say what is unknown and provide a question the candidate can ask.
Return valid JSON matching CandidateCompanyBrief.
```

## Scoring

Section scores use a 0-100 scale:

- Start at 40 when at least one relevant source exists.
- Add up to 20 for official company or job-posting evidence.
- Add up to 20 for credible third-party sources.
- Add up to 10 for sources updated within the last 12 months.
- Add up to 10 for role-specific relevance.
- Cap anonymous-review-only sections at 65.
- Cap chatbot-only sections at 50.
- Cap salary-estimate-only sections at 60 unless a job-posted range exists.

## MVP UI

The first interface can be a single page:

- Input form for company, URL, role, job posting URL, location, priorities, and research depth.
- Progress log showing account check, searches, fetches, and synthesis.
- Brief preview with confidence badges and citations.
- Tabs for overview, role fit, culture, compensation, interview prep, and red flags.
- Export buttons for Markdown and JSON.
