# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type JobAnalyzerRequest = {
  targets: {
    company: string;
    career_url?: string;
    ats_domains?: string[];
    role_keywords?: string[];
    locations?: string[];
    geo?: {
      country?: string;
      city?: string;
      device?: "desktop" | "mobile";
    };
  }[];
  direct_job_urls?: string[];
  analysis_lens: Array<"role_scope" | "skills" | "remote_policy" | "compensation" | "urgency">;
  max_posts: number;
  exclude_terms?: string[];
};

type SearchIntent =
  | "career_page"
  | "role_keyword"
  | "ats_listing"
  | "location_variant"
  | "remote_policy"
  | "compensation";

type QueryPlanItem = {
  query: string;
  intent: SearchIntent;
  company: string;
  max_results: number;
};

type SourceCitation = {
  source_url: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source";
  query?: string;
  rank?: number;
  fetched_at: string;
  title?: string;
  excerpt?: string;
};

type ExtractedSkill = {
  name: string;
  type: "technical_skill" | "tool" | "method" | "domain" | "credential" | "soft_skill";
  requirement_level: "required" | "preferred" | "unclear";
  evidence: SourceCitation[];
};

type JobPostAnalysis = {
  company: string;
  canonical_url: string;
  raw_title: string;
  role_title: string;
  team?: string;
  seniority: "intern" | "entry" | "mid" | "senior" | "staff" | "principal" | "manager" | "director" | "executive" | "unknown";
  locations: string[];
  remote_policy: {
    label: "onsite" | "hybrid" | "remote" | "remote_region_limited" | "flexible" | "unclear" | "conflicting";
    evidence_text?: string;
    confidence: "high" | "medium" | "low";
  };
  required_skills_tools: ExtractedSkill[];
  responsibilities: {
    text: string;
    confidence: "high" | "medium" | "low";
    evidence: SourceCitation[];
  }[];
  urgency_signals: {
    signal: string;
    confidence: "high" | "medium" | "low";
    evidence: SourceCitation[];
  }[];
  compensation_clues: {
    type: "posted_range" | "bonus" | "equity" | "benefits" | "location_pay_note" | "snippet_only";
    value: string;
    confidence: "high" | "medium" | "low";
    evidence: SourceCitation[];
  }[];
  source_citations: SourceCitation[];
  field_confidence: Record<string, "high" | "medium" | "low">;
};

type JobAnalyzerReport = {
  generated_at: string;
  query_summary: {
    companies: string[];
    posts_discovered: number;
    posts_analyzed: number;
    confidence: "high" | "medium" | "low";
  };
  job_posts: JobPostAnalysis[];
  cross_post_insights: {
    insight: string;
    confidence: "high" | "medium" | "low";
    supporting_post_count: number;
    evidence: SourceCitation[];
  }[];
  source_inventory: {
    domain: string;
    source_count: number;
    companies: string[];
  }[];
  gaps: string[];
};
```

## Pipeline

```ts
async function analyzePublicJobPosts(request: JobAnalyzerRequest): Promise<JobAnalyzerReport> {
  const queryPlan = createQueryPlan(request);
  const estimatedCredits = estimateCredits(queryPlan, request.direct_job_urls || []);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for job-post analysis run");
  }

  const serpResults = await collectJobSerps(request, queryPlan);
  const candidateUrls = selectCandidateJobUrls(request, serpResults);
  const fetchedPages = await fetchJobPages(candidateUrls);
  const normalizedPosts = await extractJobFacts(request, serpResults, fetchedPages);
  const dedupedPosts = dedupeJobPosts(normalizedPosts);
  const crossPostInsights = await synthesizeCrossPostInsights(dedupedPosts);

  return buildReport(request, dedupedPosts, crossPostInsights, serpResults, fetchedPages);
}
```

## Query Planning

```ts
function createQueryPlan(request: JobAnalyzerRequest): QueryPlanItem[] {
  return request.targets.flatMap(target => {
    const roleKeywords = target.role_keywords?.length ? target.role_keywords : ["jobs", "careers"];
    const locations = target.locations?.length ? target.locations : [target.geo?.city, target.geo?.country].filter(Boolean);
    const atsDomains = target.ats_domains || ["greenhouse.io", "lever.co", "ashbyhq.com", "workdayjobs.com"];

    const baseQueries: QueryPlanItem[] = [
      {
        query: `${target.company} careers jobs`,
        intent: "career_page",
        company: target.company,
        max_results: 10
      }
    ];

    const roleQueries = roleKeywords.map(keyword => ({
      query: `${target.company} ${keyword} job`,
      intent: "role_keyword" as const,
      company: target.company,
      max_results: 10
    }));

    const locationQueries = locations.map(location => ({
      query: `${target.company} ${roleKeywords[0]} ${location} job`,
      intent: "location_variant" as const,
      company: target.company,
      max_results: 10
    }));

    const atsQueries = atsDomains.map(domain => ({
      query: `site:${domain} ${target.company} ${roleKeywords[0]}`,
      intent: "ats_listing" as const,
      company: target.company,
      max_results: 10
    }));

    const policyQueries: QueryPlanItem[] = [
      {
        query: `${target.company} remote hybrid job ${roleKeywords[0]}`,
        intent: "remote_policy",
        company: target.company,
        max_results: 10
      },
      {
        query: `${target.company} salary compensation job ${roleKeywords[0]}`,
        intent: "compensation",
        company: target.company,
        max_results: 10
      }
    ];

    return [...baseQueries, ...roleQueries, ...locationQueries, ...atsQueries, ...policyQueries];
  });
}
```

## SERP Collection

```ts
async function collectJobSerps(request: JobAnalyzerRequest, queryPlan: QueryPlanItem[]) {
  const results = [];

  for (const item of queryPlan) {
    const target = request.targets.find(candidate => candidate.company === item.company);
    results.push(await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: target?.geo?.country,
      city: target?.geo?.city,
      device: target?.geo?.device || "desktop",
      max_results: item.max_results
    }));
  }

  return normalizeSerpResults(results, queryPlan);
}
```

Preserve these SERP fields:

- Query text, intent, company, rank, title, snippet, URL, and domain.
- Visible posting date, salary range, location, remote tag, employer, and job-result metadata when present.
- Whether evidence is from a job-result block, normal organic result, company career page, ATS page, or snippet-only clue.

## Fetching And Extraction

```ts
async function fetchJobPages(candidateUrls: string[]) {
  const fetched = [];

  for (const url of candidateUrls.slice(0, 120)) {
    fetched.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return fetched.filter(page => page.ok && page.text?.length > 250);
}

async function extractJobFacts(request, serpResults, fetchedPages): Promise<JobPostAnalysis[]> {
  const extractionPrompt = {
    task: "Extract structured recruiting job-post facts from public job-post evidence.",
    fields: [
      "role_title",
      "team",
      "seniority",
      "location",
      "remote_policy",
      "required_skills_tools",
      "responsibilities",
      "urgency_signals",
      "compensation_clues",
      "source_citations"
    ],
    rules: [
      "Cite each material field to a source URL or SERP result.",
      "Separate explicit page text from inference.",
      "Mark snippet-only compensation or location clues as low or medium confidence.",
      "Do not use or request private candidate, employee, credential, or internal ATS data."
    ]
  };

  return massive.ai_chat_completion({
    model: "source-grounded-extractor",
    input: {
      request,
      serpResults,
      fetchedPages,
      extractionPrompt
    },
    response_format: "json_schema"
  });
}
```

## Normalization Heuristics

- Canonicalize common ATS URLs and remove tracking parameters before deduplication.
- Use requisition IDs when visible, then URL, then title plus company plus location plus text similarity.
- Normalize seniority from title tokens, years-of-experience text, management scope, and explicit level language.
- Split required and preferred skills based on nearby section headings and modal verbs.
- Treat compensation ranges from fetched pages as high-confidence, SERP snippets as snippet-only, and third-party estimates as low-confidence unless corroborated.
- Treat urgency as an inferred signal unless the post explicitly says immediate, priority, fast-growing team, multiple openings, reposted, or includes a fresh visible date.
- Preserve conflicts, such as a page title saying remote while body text limits the role to a city.

## Exports

The MVP should export:

- JSON report for downstream workflows.
- Markdown brief for recruiters and hiring managers.
- CSV table with one row per job post and citation URLs.
- Skills matrix with normalized skill/tool frequencies by company, team, seniority, and location.
