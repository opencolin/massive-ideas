# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ResearchMode = "quick" | "standard" | "deep";
type Confidence = "high" | "medium" | "low" | "unknown";
type ApplicantType = "student" | "nonprofit" | "school" | "researcher" | "small_business" | "municipality" | "other";
type MatchStatus = "strong_match" | "possible_match" | "unlikely_match" | "closed_or_stale" | "needs_review";

type FinderProfile = {
  id: string;
  applicant_type: ApplicantType;
  country?: string;
  state?: string;
  county?: string;
  city?: string;
  school_or_institution?: string;
  education_level?: string;
  field_or_program_area?: string[];
  organization_type?: string;
  affiliations?: string[];
  citizenship_or_residency?: string;
  deadline_after?: string;
  deadline_before?: string;
  include_sensitive_matching: boolean;
  created_at: string;
};

type ProgramSource = {
  id: string;
  program_id?: string;
  url: string;
  domain: string;
  title?: string;
  source_type: "serp_result" | "fetched_page" | "pdf" | "ai_answer_source" | "seed_url";
  query?: string;
  rank?: number;
  snippet?: string;
  visible_date?: string;
  fetched_at?: string;
  fetch_status?: "pending" | "ok" | "failed" | "blocked";
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
};

type EligibilityCriterion = {
  id: string;
  program_id: string;
  source_id: string;
  field:
    | "applicant_type"
    | "geography"
    | "education"
    | "field"
    | "demographic_or_affiliation"
    | "financial_need"
    | "citizenship_or_residency"
    | "deadline"
    | "award"
    | "documents"
    | "renewal"
    | "other";
  requirement_text: string;
  normalized_value?: string;
  excerpt: string;
  confidence: Confidence;
};

type ProgramRecord = {
  id: string;
  name: string;
  sponsor?: string;
  program_type: "scholarship" | "grant" | "fellowship" | "award" | "unknown";
  homepage_url?: string;
  application_url?: string;
  deadline?: string;
  deadline_status: "open" | "future" | "closed" | "rolling" | "unknown" | "stale";
  award_amount_text?: string;
  criteria: EligibilityCriterion[];
  source_ids: string[];
};

type ProgramMatch = {
  program_id: string;
  profile_id: string;
  status: MatchStatus;
  confidence: Confidence;
  matched_criteria_ids: string[];
  risk_criteria_ids: string[];
  missing_information: string[];
  explanation: string;
  next_review_steps: string[];
};

type FinderRun = {
  id: string;
  profile_id: string;
  mode: ResearchMode;
  run_type: "plan" | "search" | "fetch" | "extract" | "match" | "export";
  input: unknown;
  output_summary: string;
  credits_estimated?: number;
  credits_used?: number;
  created_at: string;
};
```

## Pipeline

```ts
async function runProgramFinder(profile: FinderProfile, mode: ResearchMode) {
  validateProfile(profile);

  const plan = await planProgramResearch(profile, mode);
  const estimate = estimateCredits(plan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimate.total) {
    throw new Error("Insufficient Massive MCP credits for scholarship and grant research");
  }

  const serpSources = await runSearches(profile, plan.search_queries);
  const aiLeads = await collectSourcedProgramLeads(profile, plan.ai_prompts);
  const fetchQueue = rankFetchCandidates([...serpSources, ...aiLeads], profile, mode);
  const fetchedSources = await fetchProgramSources(fetchQueue, profile);
  const programs = await extractProgramsAndCriteria(profile, fetchedSources);
  const matches = await classifyProgramMatches(profile, programs);

  return persistFinderResults({
    profile,
    sources: [...serpSources, ...aiLeads, ...fetchedSources],
    programs,
    matches
  });
}
```

## Search Planning

```ts
async function planProgramResearch(profile: FinderProfile, mode: ResearchMode) {
  const response = await massive.ai_chat_completion({
    model: "research-planner",
    messages: [
      {
        role: "system",
        content: [
          "Create a public-source scholarship and grant discovery plan.",
          "Return JSON only.",
          "Frame results as research, not financial, legal, tax, immigration, admissions, or benefits advice."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ profile, mode })
      }
    ],
    response_schema: "ProgramFinderSearchPlan"
  });

  return sanitizeSearchPlan(response.json);
}
```

The plan should include:

- 8-30 search queries depending on mode.
- Queries for official sources, local foundations, schools, government agencies, associations, and sponsor pages.
- Separate scholarship and grant vocabulary when applicant type is ambiguous.
- Location expansions for city, county, state, region, school district, and country.
- Sourced AI prompts for lead discovery and contradiction checks.
- Exclusion patterns for spam directories, essay farms, paid matching services, and stale aggregator pages.

## Search Capture

```ts
async function runSearches(profile: FinderProfile, queries) {
  const records: ProgramSource[] = [];

  for (const item of queries) {
    const result = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: profile.country,
      city: profile.city,
      device: item.device ?? "desktop",
      max_results: item.max_results
    });

    records.push(...normalizeSerpResults(result, profile, item));
  }

  return dedupeSources(records).filter(source => !isExcludedProgramSource(source));
}
```

Search records must preserve query, rank, result type, title, URL, snippet, visible date, country, city, device, and timestamp. SERP snippets can create leads, but they cannot create accepted eligibility criteria without a fetched or otherwise inspectable source.

## Fetch And Extraction

```ts
async function fetchProgramSources(candidates: ProgramSource[], profile: FinderProfile) {
  const fetched: ProgramSource[] = [];

  for (const source of candidates) {
    const page = await massive.web_fetch({
      url: source.url,
      render_js: true,
      captcha: "auto",
      extract_main_content: true,
      country: profile.country,
      city: profile.city,
      device: source.device ?? "desktop",
      timeout_ms: 15000
    });

    fetched.push(normalizeFetchedProgramSource(source, page));
  }

  return fetched;
}

async function extractProgramsAndCriteria(profile: FinderProfile, sources: ProgramSource[]) {
  const response = await massive.ai_chat_completion({
    model: "eligibility-extractor",
    messages: [
      {
        role: "system",
        content: [
          "Extract public scholarship and grant program records from provided sources.",
          "For every eligibility criterion, include source_id, concise excerpt, normalized field, and confidence.",
          "Do not infer advice or guarantee eligibility."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ profile, sources })
      }
    ],
    response_schema: "ProgramAndEligibilityList"
  });

  return sanitizePrograms(response.json, sources);
}
```

## Match Classification

```ts
async function classifyProgramMatches(profile: FinderProfile, programs: ProgramRecord[]) {
  const response = await massive.ai_chat_completion({
    model: "program-match-reviewer",
    messages: [
      {
        role: "system",
        content: [
          "Classify program fit using only provided profile fields and extracted criteria.",
          "Use strong_match only when all known required criteria appear satisfied.",
          "Use needs_review when criteria involve legal, tax, immigration, financial need, or ambiguous documentation questions.",
          "Return JSON only with citations to criterion IDs."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ profile, programs })
      }
    ],
    response_schema: "ProgramMatchList"
  });

  return sanitizeMatches(response.json, programs);
}
```

Confidence rules:

- `high`: official or sponsor-owned page is fetched, deadline is current, and key criteria are explicit.
- `medium`: source is likely authoritative but one important field is ambiguous or missing.
- `low`: source is an aggregator, old PDF, snippet-only lead, or weakly tied to the program.
- `unknown`: source does not allow a defensible match classification.

## Ranking

Rank programs by:

- Match status, with `strong_match` first and `closed_or_stale` last.
- Deadline urgency within the user's requested window.
- Source authority and successful fetch status.
- Completeness of eligibility extraction.
- Award relevance to applicant type, geography, field, and program area.
- Lower risk of disqualifiers or missing critical documentation.

The ranking must not imply that the user should apply, will qualify, or will receive funds.

## Exports

Markdown export sections:

- Search profile and research disclaimer.
- Ranked shortlist.
- Eligibility table by program.
- Deadline and stale-source notes.
- Disqualifiers and human-review questions.
- Source inventory with query, rank, region, device, and fetched timestamp.

CSV exports:

- `programs.csv`
- `eligibility_criteria.csv`
- `matches.csv`
- `sources.csv`

JSON export preserves the full graph of profile, runs, sources, programs, criteria, and matches.
