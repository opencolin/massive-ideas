# Prototype

## Prototype Goal

Build a lightweight writer that accepts a role and target candidate segment, researches public company context with Massive MCP, and returns source-backed recruiting outreach variants. The prototype should prove that public context can improve message relevance without drifting into private candidate profiling or unsupported claims.

## User Flow

1. Recruiter enters company, role, job posting URL, target segment, channel, tone, and location.
2. System checks `account_status` and estimates research cost.
3. System fetches seed pages from the company site and job posting.
4. System runs Google SERP discovery for recent company, product, hiring, and location context.
5. System fetches the highest-value discovered pages with JavaScript rendering and captcha handling.
6. System extracts evidence-backed context and maps it to candidate motivators.
7. System generates outreach drafts, source notes, and review warnings.
8. Recruiter approves, edits, or rejects the generated copy outside the MCP workflow.

## Data Model

```ts
type RecruitingWriterInput = {
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
    function?: "engineering" | "product" | "sales" | "marketing" | "design" | "operations" | "finance" | "legal" | "people" | "other";
    seniority?: string;
    job_posting_url?: string;
  };
  candidate_segment: {
    persona: string;
    motivators?: string[];
    avoid_topics?: string[];
  };
  outreach: {
    channel: "email" | "linkedin" | "sms" | "sequence_step";
    tone: "direct" | "warm" | "technical" | "executive" | "founder-led";
    variants: number;
    max_words: number;
  };
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
  confidence: "high" | "medium" | "low";
};

type PersonalizationAngle = {
  angle: string;
  candidate_relevance: string;
  claim_type: "fact" | "inference" | "question";
  confidence: "high" | "medium" | "low";
  evidence: Evidence[];
};

type OutreachDraft = {
  channel: RecruitingWriterInput["outreach"]["channel"];
  subject?: string;
  body: string;
  personalization_angles: string[];
  source_notes: string[];
  review_warnings: string[];
};

type RecruitingPersonalizationPack = {
  company: string;
  role: string;
  generated_at: string;
  confidence: "high" | "medium" | "low";
  personalization_angles: PersonalizationAngle[];
  drafts: OutreachDraft[];
  do_not_say: string[];
  evidence_inventory: {
    domain: string;
    source_count: number;
    angle_count: number;
  }[];
};
```

## Pipeline

```ts
async function buildRecruitingPersonalizationPack(
  input: RecruitingWriterInput
): Promise<RecruitingPersonalizationPack> {
  const queryPlan = createQueryPlan(input);
  const estimatedCredits = estimateCredits(input, queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for recruiting personalization research");
  }

  const seedPages = await fetchSeedPages(input);
  const serpEvidence = await collectSearchEvidence(input, queryPlan);
  const answerEvidence = await collectSourcedAnswers(input, queryPlan);
  const fetchedPages = await fetchDiscoveredPages(input, serpEvidence, answerEvidence);
  const evidence = normalizeAndDedupeEvidence([...seedPages, ...serpEvidence, ...answerEvidence, ...fetchedPages]);
  const angles = await extractPersonalizationAngles(input, evidence);
  const drafts = await writeOutreachDrafts(input, angles);

  return assemblePack(input, angles, drafts, evidence);
}
```

## Query Strategy

```ts
function createQueryPlan(input: RecruitingWriterInput) {
  const company = input.company.name;
  const role = input.role.title;
  const city = input.company.geo?.city ? ` ${input.company.geo.city}` : "";
  const persona = input.candidate_segment.persona;

  return [
    { intent: "company_identity", query: `${company} official site about product customers leadership`, max_results: 8 },
    { intent: "role_context", query: `${company} ${role} careers job posting`, max_results: 8 },
    { intent: "why_now", query: `${company} product launch customer win funding expansion hiring`, max_results: 10 },
    { intent: "market_context", query: `${company} competitors customers market category`, max_results: 10 },
    { intent: "location_context", query: `${company} careers office remote${city}`, max_results: 8 },
    { intent: "risk_context", query: `${company} layoffs restructuring leadership change lawsuit outage`, max_results: 10 },
    {
      intent: "ai_sourced_context",
      query: `Create sourced recruiting outreach angles for ${company}'s ${role} role for ${persona}.`,
      max_results: 0
    }
  ];
}
```

The prototype should prefer official company, ATS, investor, product, docs, blog, customer, and press pages. Third-party sources can provide context, but company-specific claims in final outreach should cite fetchable public evidence.

## Fetch Policy

Allowed:

- Public company pages, career pages, job postings, customer stories, press releases, documentation, public filings, and public news pages.
- JavaScript rendering for modern company sites and ATS pages.
- Country, city, and device targeting for localized role and office context.
- Captcha handling when it reflects ordinary public browsing.

Disallowed:

- Authenticated recruiter systems, candidate databases, resume sites, private profiles, or email inboxes.
- Circumventing access controls, paywalls, robots restrictions, or rate limits.
- Inferring sensitive traits about candidates or targeting messages based on protected characteristics.
- Claims that the candidate is looking, unhappy, qualified, or personally motivated unless the user supplied lawful context.

## Angle Extraction

Use `ai_chat_completion` with structured output to produce candidate-safe angles:

```json
{
  "angles": [
    {
      "angle": "Technical depth in production robotics",
      "candidate_relevance": "Relevant to backend engineers who want distributed systems tied to physical operations.",
      "claim_type": "inference",
      "confidence": "medium",
      "evidence_indexes": [0, 3]
    }
  ],
  "rejected_angles": [
    {
      "angle": "Great remote flexibility",
      "reason": "Remote policy was not visible in current public sources."
    }
  ]
}
```

Angle quality rules:

- At least one evidence item is required for every angle.
- Official sources outrank third-party snippets.
- Stale sources older than 24 months lower confidence unless they are evergreen product pages.
- Culture claims from reviews should be framed as public-review themes, not facts.
- Compensation and flexibility claims require direct job-posting or official benefits evidence.

## Drafting Rules

For each requested variant:

- Use one or two source-backed personalization angles.
- Keep the message within `max_words`.
- Avoid flattery that depends on private candidate data.
- Include a natural call to action.
- Do not include citations inline in the candidate-facing body unless requested.
- Put source notes and review warnings in recruiter-only metadata.

Email output may include a subject line. LinkedIn, SMS, and sequence-step output should usually omit the subject.

## MVP Implementation Notes

- Store raw SERP and fetch records separately from generated drafts.
- Canonicalize URLs to deduplicate tracking parameters and ATS mirrors.
- Track source recency, source type, query, rank, and fetch timestamp for every material claim.
- Maintain a controlled list of disallowed outreach claims.
- Provide an empty-state response when public context is too thin: write a generic role-forward message and warn that personalization is weak.
- Export both JSON and recruiter-readable Markdown.

## Future Extensions

- ATS or CRM enrichment after explicit user authorization.
- Recruiter-specific voice profiles and approved phrase libraries.
- A/B test tracking for response rates by angle, channel, and segment.
- Localization for region-specific outreach norms and compliance requirements.
- Team-level talent brand pages generated from the same source-backed context.
