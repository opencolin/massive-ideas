# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type SkillCitySearch = {
  skill: SkillDefinition;
  location: LocationTarget;
  filters?: SearchFilters;
  source_preferences?: SourceType[];
};

type SkillDefinition = {
  name: string;
  aliases?: string[];
  exclude_terms?: string[];
};

type LocationTarget = {
  city: string;
  region?: string;
  country: string;
  device?: "desktop" | "mobile";
  language?: string;
};

type SearchFilters = {
  seniority?: string[];
  workplace?: ("remote" | "hybrid" | "onsite")[];
  functions?: string[];
  lookback_days: number;
  include_staffing_agencies?: boolean;
  min_confidence?: "low" | "medium" | "high";
};

type SourceType =
  | "company_careers"
  | "ats"
  | "job_board"
  | "local_news"
  | "company_blog"
  | "serp";

type JobObservation = {
  observation_id: string;
  source_type: SourceType;
  url: string;
  title?: string;
  final_url?: string;
  serp_rank?: number;
  observed_at: string;
  posted_at?: string;
  company?: string;
  company_domain?: string;
  role_title?: string;
  location_text?: string;
  workplace?: "remote" | "hybrid" | "onsite" | "unknown";
  fetch_status: "ok" | "blocked" | "partial" | "failed";
  excerpt: string;
  warnings: string[];
};

type CompanyHiringSignal = {
  company_id: string;
  company: string;
  domain?: string;
  city_match: string;
  hiring_score: number;
  confidence: "high" | "medium" | "low";
  urgency: "high" | "medium" | "low" | "unknown";
  matched_roles: number;
  skill_match: string;
  evidence: EvidenceExcerpt[];
  suppressed: boolean;
  suppression_reason?: string;
  warnings: string[];
};

type EvidenceExcerpt = {
  source_type: SourceType;
  url: string;
  title?: string;
  observed_at: string;
  posted_at?: string;
  excerpt: string;
};

type SkillCityCompanyReport = {
  run_id: string;
  skill: string;
  city: string;
  summary: string;
  companies: CompanyHiringSignal[];
  suppressed_sources: { url: string; reason: string }[];
  warnings: string[];
};
```

## Pipeline

```ts
async function findCompaniesHiringForSkill(
  search: SkillCitySearch
): Promise<SkillCityCompanyReport> {
  validateSearch(search);

  const estimatedCredits = estimateCredits(search);
  const status = await massive.account_status();
  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for skill-city company search");
  }

  const observations = await collectJobObservations(search);
  const normalized = await normalizeJobObservations(search, observations);
  const grouped = groupObservationsByCompany(normalized);
  const classified = await classifyCompanyHiringSignals(search, grouped);
  const scored = scoreCompanySignals(search, classified);

  return synthesizeReport(search, scored);
}
```

## Collection

Use `web_search` for discovery, but require `web_fetch` evidence before a company can receive medium or high confidence.

```ts
async function collectJobObservations(search: SkillCitySearch): Promise<JobObservation[]> {
  const observations: JobObservation[] = [];

  for (const query of buildJobQueries(search)) {
    const serp = await massive.web_search({
      query,
      parse_google_serp: true,
      country: search.location.country,
      city: search.location.city,
      device: search.location.device || "desktop",
      language: search.location.language || "en",
      time_range_days: search.filters?.lookback_days || 30
    });

    for (const result of serp.results.slice(0, 15)) {
      if (matchesExcludedTerm(result, search.skill.exclude_terms || [])) continue;

      const fetched = await massive.web_fetch({
        url: result.url,
        render_js: true,
        captcha: "solve",
        country: search.location.country,
        city: search.location.city,
        device: search.location.device || "desktop",
        wait_for_network_idle: true,
        extract_visible_text: true
      });

      observations.push(normalizeObservation(result, fetched, search));
    }
  }

  return dedupeObservations(observations);
}
```

## Query Strategy

```ts
function buildJobQueries(search: SkillCitySearch): string[] {
  const skillTerms = [search.skill.name, ...(search.skill.aliases || [])]
    .map(term => `"${term}"`)
    .join(" OR ");
  const city = `"${search.location.city}"`;
  const region = search.location.region ? `"${search.location.region}"` : "";
  const seniority = (search.filters?.seniority || []).map(term => `"${term}"`).join(" OR ");
  const functions = (search.filters?.functions || []).map(term => `"${term}"`).join(" OR ");

  return [
    `(${skillTerms}) ${city} ${region} jobs`,
    `(${skillTerms}) ${city} careers "apply"`,
    `(${skillTerms}) ${city} site:greenhouse.io OR site:lever.co OR site:ashbyhq.com`,
    `(${skillTerms}) ${city} "we are hiring"`,
    `(${skillTerms}) ${city} "senior" "engineer"`,
    seniority ? `(${skillTerms}) ${city} (${seniority}) jobs` : "",
    functions ? `(${skillTerms}) ${city} (${functions}) careers` : "",
    `(${skillTerms}) ${city} "hybrid" OR "onsite" OR "remote"`
  ].filter(Boolean);
}
```

## Classification Prompt

Use `ai_chat_completion` to classify grouped job evidence, not to invent companies.

```text
You are classifying whether a company is currently hiring for a specific skill in a specific city.

Skill:
{{skill_definition}}

Target location:
{{location_target}}

Evidence group:
{{job_observations}}

Return JSON with:
- company and domain
- whether the skill is required, preferred, adjacent, or absent
- whether the location is exact city, metro area, remote-with-city, ambiguous, or mismatch
- matched role count
- urgency
- confidence
- suppression_reason, if this is a staffing agency, course provider, stale job, resume page, duplicate, or snippet-only source
- evidence excerpts and source URLs
- warnings

Rules:
- Treat SERP snippets as discovery only.
- Require fetched job or careers page evidence for medium or high confidence.
- Do not count a company if the skill appears only in unrelated benefits, blogs, resumes, ads, or training pages.
- Do not infer headcount, budget, or internal strategy from a single posting.
- Preserve exact source URLs for every claim.
```

## API Sketch

```http
POST /runs
Content-Type: application/json

{
  "skill": { "name": "Rust", "aliases": ["rustlang"] },
  "location": { "city": "Denver", "region": "Colorado", "country": "us" },
  "filters": { "lookback_days": 45, "workplace": ["hybrid", "onsite"] }
}
```

```http
GET /runs/{run_id}
```

Returns the full `SkillCityCompanyReport`, plus links to JSON, CSV, and Markdown exports.
