# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type DiligenceBrief = {
  company: {
    name: string;
    url?: string;
    category?: string;
    geo?: {
      country?: string;
      city?: string;
      device?: "desktop" | "mobile";
    };
  };
  known_competitors?: string[];
  memo_notes?: string;
  focus_areas: Array<"company" | "product" | "market" | "competition" | "traction" | "pricing" | "hiring" | "risks">;
  exclude?: string[];
};

type QueryIntent =
  | "company_background"
  | "product_claims"
  | "customer_signal"
  | "competitor_discovery"
  | "market_signal"
  | "pricing"
  | "hiring"
  | "funding"
  | "risk";

type QueryPlanItem = {
  query: string;
  intent: QueryIntent;
  source: "google" | "ai_answer";
  max_results: number;
};

type Evidence = {
  source_url: string;
  source_type: "serp_result" | "fetched_page" | "ai_answer_source";
  query?: string;
  rank?: number;
  fetched_at: string;
  excerpt?: string;
};

type Finding = {
  claim: string;
  inference?: string;
  confidence: "high" | "medium" | "low";
  evidence: Evidence[];
};

type DiligenceSection = {
  name: string;
  score: number;
  confidence: "high" | "medium" | "low";
  findings: Finding[];
  gaps: string[];
};

type DiligencePack = {
  company: string;
  generated_at: string;
  summary: string;
  confidence: "high" | "medium" | "low";
  sections: DiligenceSection[];
  risks: {
    risk: string;
    severity: "high" | "medium" | "low";
    evidence: Evidence[];
    next_step: string;
  }[];
  open_questions: string[];
  source_inventory: {
    domain: string;
    source_count: number;
    section_names: string[];
  }[];
};
```

## Pipeline

```ts
async function buildDiligencePack(brief: DiligenceBrief): Promise<DiligencePack> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for diligence pack run");
  }

  const serpResults = await collectSerps(brief, queryPlan);
  const answerResults = await collectAiAnswers(brief, queryPlan);
  const pages = await fetchEvidencePages(brief, serpResults, answerResults);
  const evidenceGraph = await normalizeEvidence(brief, serpResults, answerResults, pages);
  const sections = await buildSections(brief, evidenceGraph);

  return synthesizePack(brief, sections, evidenceGraph);
}
```

## Query Planning

```ts
function createQueryPlan(brief: DiligenceBrief): QueryPlanItem[] {
  const name = brief.company.name;
  const url = brief.company.url ? ` ${brief.company.url}` : "";
  const category = brief.company.category || "";
  const geo = brief.company.geo?.city ? ` ${brief.company.geo.city}` : "";
  const competitors = brief.known_competitors || [];

  const baseQueries: QueryPlanItem[] = [
    { query: `${name}${url}`, intent: "company_background", source: "google", max_results: 10 },
    { query: `${name} customers case study testimonials`, intent: "customer_signal", source: "google", max_results: 10 },
    { query: `${name} pricing`, intent: "pricing", source: "google", max_results: 10 },
    { query: `${name} jobs careers hiring`, intent: "hiring", source: "google", max_results: 10 },
    { query: `${name} funding founders investors`, intent: "funding", source: "google", max_results: 10 },
    { query: `${name} reviews complaints security outage`, intent: "risk", source: "google", max_results: 10 }
  ];

  const marketQueries: QueryPlanItem[] = category
    ? [
        { query: `${category} market competitors${geo}`, intent: "market_signal", source: "google", max_results: 10 },
        { query: `${category} software pricing`, intent: "pricing", source: "google", max_results: 10 },
        { query: `${category} alternatives`, intent: "competitor_discovery", source: "google", max_results: 10 }
      ]
    : [];

  const competitorQueries = competitors.flatMap(competitor => [
    { query: `${name} vs ${competitor}`, intent: "competitor_discovery", source: "google", max_results: 10 },
    { query: `${competitor} pricing customers`, intent: "competitor_discovery", source: "google", max_results: 10 }
  ]);

  const answerQueries: QueryPlanItem[] = [
    {
      query: `Create a sourced diligence outline for ${name}. Identify public evidence and missing claims.`,
      intent: "company_background",
      source: "ai_answer",
      max_results: 0
    },
    {
      query: `What are the main risks and competitors for ${name} in ${category}? Cite sources.`,
      intent: "risk",
      source: "ai_answer",
      max_results: 0
    }
  ];

  return [...baseQueries, ...marketQueries, ...competitorQueries, ...answerQueries];
}
```

## SERP Collection

```ts
async function collectSerps(brief: DiligenceBrief, queryPlan: QueryPlanItem[]) {
  const googleQueries = queryPlan.filter(item => item.source === "google");
  const results = [];

  for (const item of googleQueries) {
    results.push(await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.company.geo?.country,
      city: brief.company.geo?.city,
      device: brief.company.geo?.device || "desktop",
      max_results: item.max_results
    }));
  }

  return normalizeSerpResults(results, googleQueries);
}
```

Preserve these fields:

- Query text and intent
- Result rank
- Title and snippet
- URL and domain
- SERP feature type, when available
- Visible dates, review counts, pricing snippets, job metadata, and funding mentions

## Evidence Fetching

```ts
async function fetchEvidencePages(brief, serpResults, answerResults) {
  const candidateUrls = dedupeUrls([
    brief.company.url,
    ...topUrlsByIntent(serpResults, "company_background", 12),
    ...topUrlsByIntent(serpResults, "product_claims", 12),
    ...topUrlsByIntent(serpResults, "customer_signal", 20),
    ...topUrlsByIntent(serpResults, "competitor_discovery", 25),
    ...topUrlsByIntent(serpResults, "pricing", 15),
    ...topUrlsByIntent(serpResults, "hiring", 15),
    ...topUrlsByIntent(serpResults, "risk", 20),
    ...answerResults.flatMap(answer => answer.source_urls || [])
  ]).filter(Boolean).slice(0, 80);

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

- Company homepage, product pages, docs, pricing, blog, and customer pages
- Competitor homepages, pricing pages, comparison pages, and docs
- Review sites, marketplaces, directories, job boards, and funding announcements
- Public source pages that mention customer names, integrations, or product limitations
- Sources with dates, concrete claims, and inspectable URLs

## Section Scoring

Each section gets a 0-100 score:

- 30 points: Direct company or competitor sources fetched successfully.
- 20 points: Independent third-party evidence supports or challenges claims.
- 15 points: Freshness and visible dates.
- 15 points: Source diversity across domains and result types.
- 10 points: Relevance to the requested category, geography, and focus areas.
- 10 points: Clear gaps and next diligence steps.

Automatic caps:

- Cap at 70 when only company-owned sources are available.
- Cap at 65 when evidence is mostly SERP snippets without fetched-page confirmation.
- Cap at 55 when the category is ambiguous and exclusions are unresolved.
- Cap at 45 when material traction or customer claims come only from notes supplied by the user.

## Export

The first build can ship as a CLI:

```bash
diligence-pack build \
  --brief diligence-brief.json \
  --out diligence-pack.json \
  --markdown diligence-pack.md \
  --sources sources.csv
```

Minimum viable UI after CLI validation:

- Brief input form
- Query plan and credit estimate
- Run status by diligence section
- Evidence table with filters by source type, section, confidence, and domain
- Memo view with inline citations
- Risk register and next-question checklist
- Export buttons for Markdown, JSON, and CSV
