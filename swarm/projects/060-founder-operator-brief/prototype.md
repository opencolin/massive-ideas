# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type BriefPurpose =
  | "investor_diligence"
  | "recruiting"
  | "partnership"
  | "advisor_review"
  | "meeting_prep";

type Depth = "quick" | "standard" | "deep";

type FounderOperatorBriefRequest = {
  person: {
    name: string;
    current_company?: string;
    current_role?: string;
    geo?: {
      country?: string;
      city?: string;
      device?: "desktop" | "mobile";
    };
  };
  brief_purpose: BriefPurpose;
  known_context?: {
    previous_companies?: string[];
    schools?: string[];
    aliases?: string[];
    seed_urls?: string[];
  };
  focus_areas?: string[];
  exclude_domains?: string[];
  depth?: Depth;
};

type QueryIntent =
  | "identity_resolution"
  | "official_bio"
  | "current_company"
  | "previous_role"
  | "education"
  | "interview_or_talk"
  | "funding_or_launch"
  | "publication"
  | "public_reputation"
  | "risk_or_contradiction";

type QueryPlanItem = {
  query: string;
  intent: QueryIntent;
  source: "google" | "ai_answer";
  max_results: number;
};

type SourceQuality =
  | "primary"
  | "authoritative"
  | "news"
  | "event"
  | "profile"
  | "directory"
  | "company_owned"
  | "chatbot"
  | "weak";

type SourceRecord = {
  id: string;
  url: string;
  title?: string;
  domain: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source";
  query?: string;
  rank?: number;
  intent?: QueryIntent;
  snippet?: string;
  excerpt?: string;
  visible_date?: string;
  fetched_at?: string;
  country?: string;
  city?: string;
  device?: "desktop" | "mobile";
  quality: SourceQuality;
};

type PersonClaim = {
  claim: string;
  claim_type:
    | "identity"
    | "role"
    | "timeline"
    | "education"
    | "achievement"
    | "company_building"
    | "reputation"
    | "risk"
    | "interpretation";
  confidence: "high" | "medium" | "low";
  citation_ids: string[];
};

type TimelineEvent = {
  label: string;
  organization?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  confidence: "high" | "medium" | "low";
  citation_ids: string[];
  notes?: string;
};

type BriefSection = {
  name: string;
  confidence: "high" | "medium" | "low";
  findings: PersonClaim[];
  contradictions: PersonClaim[];
  gaps: string[];
};

type FounderOperatorBrief = {
  person: string;
  generated_at: string;
  resolved_identity: {
    current_company?: string;
    current_role?: string;
    confidence: "high" | "medium" | "low";
    same_name_risks: string[];
  };
  summary: string;
  timeline: TimelineEvent[];
  sections: BriefSection[];
  open_questions: string[];
  source_inventory: SourceRecord[];
};
```

## Pipeline

```ts
async function buildFounderOperatorBrief(
  request: FounderOperatorBriefRequest
): Promise<FounderOperatorBrief> {
  const queryPlan = createQueryPlan(request);
  const estimatedCredits = estimateCredits(queryPlan, request.depth || "standard");
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for founder/operator brief run");
  }

  const serpRecords = await collectSerpSources(request, queryPlan);
  const aiAnswers = await collectSourcedAnswers(request, queryPlan);
  const fetchedPages = await fetchCandidateSources(request, serpRecords, aiAnswers);
  const sourceInventory = normalizeSources(request, serpRecords, aiAnswers, fetchedPages);
  const identity = await resolveIdentity(request, sourceInventory);
  const extractedClaims = await extractPersonClaims(request, identity, sourceInventory);
  const draft = await synthesizeBrief(request, identity, extractedClaims, sourceInventory);
  const checked = await verifyClaimsAgainstSources(request, draft, sourceInventory);

  return enforceBriefPolicy(checked, sourceInventory);
}
```

## Query Planning

```ts
function createQueryPlan(request: FounderOperatorBriefRequest): QueryPlanItem[] {
  const name = request.person.name;
  const company = request.person.current_company || "";
  const role = request.person.current_role || "";
  const context = [
    ...(request.known_context?.previous_companies || []),
    ...(request.known_context?.schools || [])
  ].join(" ");

  const base: QueryPlanItem[] = [
    { query: `"${name}" "${company}" ${role}`, intent: "identity_resolution", source: "google", max_results: 10 },
    { query: `"${name}" official bio ${company}`, intent: "official_bio", source: "google", max_results: 10 },
    { query: `"${name}" "${company}" founder OR executive OR operator`, intent: "current_company", source: "google", max_results: 10 },
    { query: `"${name}" previous company ${context}`, intent: "previous_role", source: "google", max_results: 10 },
    { query: `"${name}" interview podcast talk`, intent: "interview_or_talk", source: "google", max_results: 10 },
    { query: `"${name}" launch funding acquisition`, intent: "funding_or_launch", source: "google", max_results: 10 },
    { query: `"${name}" publication blog patent GitHub paper`, intent: "publication", source: "google", max_results: 10 },
    { query: `"${name}" controversy lawsuit complaint risk`, intent: "risk_or_contradiction", source: "google", max_results: 10 }
  ];

  const education = request.known_context?.schools?.length
    ? [{ query: `"${name}" ${request.known_context.schools.join(" OR ")}`, intent: "education" as const, source: "google" as const, max_results: 10 }]
    : [];

  const aiAnswerQueries: QueryPlanItem[] = [
    {
      query: `Create a sourced public professional background outline for ${name} at ${company}. Separate facts from inferences.`,
      intent: "identity_resolution",
      source: "ai_answer",
      max_results: 0
    },
    {
      query: `What same-name collisions, stale claims, or contradictions should be checked for ${name} ${company}? Return sources.`,
      intent: "risk_or_contradiction",
      source: "ai_answer",
      max_results: 0
    }
  ];

  return [...base, ...education, ...aiAnswerQueries];
}
```

## Source Collection

```ts
async function collectSerpSources(request: FounderOperatorBriefRequest, plan: QueryPlanItem[]) {
  const googleQueries = plan.filter(item => item.source === "google");
  const records = [];

  for (const item of googleQueries) {
    const result = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: request.person.geo?.country,
      city: request.person.geo?.city,
      device: request.person.geo?.device || "desktop",
      max_results: item.max_results
    });

    records.push(...normalizeSerpResult(result, item, request.person.geo));
  }

  return records.filter(record => !isExcluded(record.url, request.exclude_domains));
}
```

Preserve these fields from SERPs:

- Query text and query intent
- Result rank, URL, domain, title, snippet, and visible date
- Result type, profile metadata, and rich-result fields when available
- Country, city, and device
- Search timestamp

## Fetching Evidence

```ts
async function fetchCandidateSources(request, serpRecords, aiAnswers) {
  const candidateUrls = dedupeUrls([
    ...(request.known_context?.seed_urls || []),
    ...topUrlsByIntent(serpRecords, "identity_resolution", 12),
    ...topUrlsByIntent(serpRecords, "official_bio", 12),
    ...topUrlsByIntent(serpRecords, "current_company", 12),
    ...topUrlsByIntent(serpRecords, "previous_role", 20),
    ...topUrlsByIntent(serpRecords, "interview_or_talk", 20),
    ...topUrlsByIntent(serpRecords, "funding_or_launch", 20),
    ...topUrlsByIntent(serpRecords, "publication", 20),
    ...topUrlsByIntent(serpRecords, "risk_or_contradiction", 20),
    ...aiAnswers.flatMap(answer => answer.source_urls || [])
  ])
    .filter(url => !isExcluded(url, request.exclude_domains))
    .slice(0, request.depth === "deep" ? 120 : request.depth === "quick" ? 35 : 75);

  const pages = [];
  for (const url of candidateUrls) {
    pages.push(await massive.web_fetch({
      url,
      render_js: true,
      captcha: "auto",
      timeout_ms: 15000,
      extract_main_content: true
    }));
  }

  return pages.filter(page => page.ok && page.text && page.text.length > 250);
}
```

## Identity Resolution

Identity resolution runs before synthesis. It clusters sources by person/company signals:

- Exact name, aliases, current company, and current role.
- Previous employers, schools, location, domain-specific terminology, and profile URLs.
- Page context such as team page, speaker bio, author page, podcast guest page, or news article.
- Conflicts where the same name appears in a different role, city, company, industry, or education path.

The output is a resolved identity object plus a `same_name_risks` list. If identity confidence is low, the brief should become a gap-heavy disambiguation memo rather than a polished background profile.

## Synthesis Prompt Shape

Use `ai_chat_completion` in three passes:

1. Extract structured person claims and timeline events from normalized sources only.
2. Draft the brief with citations, confidence, gaps, and same-name risks.
3. Verify claim coverage and downgrade or remove unsupported claims.

System rules for all passes:

- Every material claim must include one or more citation IDs.
- Do not cite a source unless the source record directly supports the claim.
- Do not infer dates, schools, outcomes, funding, exits, or achievements from weak profile snippets.
- Mark interpretation separately from source-observed facts.
- Move unsupported but useful ideas into `gaps` or `open_questions`.
- Cap confidence at `low` for SERP-only evidence.
- Cap confidence at `medium` for company-owned-only evidence unless independently corroborated.
- Exclude private personal details and sensitive personal attributes.

## Claim Verification

```ts
function enforceBriefPolicy(brief: FounderOperatorBrief, sources: SourceRecord[]) {
  const sourceIds = new Set(sources.map(source => source.id));

  for (const section of brief.sections) {
    for (const claim of [...section.findings, ...section.contradictions]) {
      if (!claim.citation_ids.length) {
        section.gaps.push(`Unsupported claim moved to gaps: ${claim.claim}`);
        claim.confidence = "low";
      }

      claim.citation_ids = claim.citation_ids.filter(id => sourceIds.has(id));

      if (!claim.citation_ids.length) {
        section.gaps.push(`No valid citation remained for: ${claim.claim}`);
      }

      if (claim.citation_ids.every(id => sourceById(sources, id).source_type === "serp_result")) {
        claim.confidence = "low";
      }
    }
  }

  brief.timeline = brief.timeline.filter(event => event.citation_ids.every(id => sourceIds.has(id)));
  return brief;
}
```

## Output Formats

Markdown export:

- One-page summary
- Identity resolution and same-name risks
- Timeline table
- Evidence-backed sections
- Risk flags and contradictions
- Open questions for reference calls or diligence
- Source inventory

JSON export:

- Full normalized request
- Brief object
- Source inventory
- Raw query and fetch metadata
- Credit estimate and actual credit usage

CSV export:

- `source_id`
- `claim`
- `section`
- `url`
- `domain`
- `source_type`
- `quality`
- `query`
- `rank`
- `country`
- `city`
- `device`
- `fetched_at`
