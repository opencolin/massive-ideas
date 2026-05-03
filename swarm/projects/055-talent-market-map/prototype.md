# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type TalentBrief = {
  role_family: string;
  seniority?: string;
  skills: string[];
  geographies: GeographyTarget[];
  employment_mode?: "local" | "hybrid" | "remote" | "remote-friendly local hiring" | "contract";
  competitor_employers?: string[];
  exclusions?: string[];
};

type GeographyTarget = {
  country: string;
  city?: string;
  region?: string;
  device?: "desktop" | "mobile";
};

type SignalType =
  | "job_demand"
  | "talent_supply"
  | "employer_competition"
  | "sourcing_channel"
  | "compensation"
  | "community"
  | "noise";

type QueryPlanItem = {
  query: string;
  signal_type: SignalType;
  geography: GeographyTarget;
  priority: "high" | "medium" | "low";
};

type TalentEvidence = {
  query: string;
  signal_type: SignalType;
  geography_key: string;
  rank?: number;
  title: string;
  snippet?: string;
  url: string;
  domain: string;
  source_type: "serp_result" | "fetched_page";
  extracted_skills: string[];
  employer_names: string[];
  location_mentions: string[];
  relevance: "high" | "medium" | "low" | "irrelevant";
  fetched_at: string;
};

type GeographyTalentMap = {
  country: string;
  city?: string;
  region?: string;
  device: "desktop" | "mobile";
  talent_supply_score: number;
  competition_score: number;
  channel_score: number;
  compensation_visibility_score: number;
  recommended_action: string;
  top_signals: {
    signal: string;
    signal_type: SignalType;
    source_urls: string[];
  }[];
  visible_employers: {
    name: string;
    domain?: string;
    mentions: number;
    best_rank?: number;
    source_urls: string[];
  }[];
  sourcing_channels: string[];
  evidence: {
    claim: string;
    source_url: string;
    source_type: "serp_result" | "fetched_page" | "ai_summary_source";
    query?: string;
    rank?: number;
  }[];
  confidence: "high" | "medium" | "low";
};

type TalentMarketReport = {
  role_family: string;
  summary: string;
  geographies: GeographyTalentMap[];
  cross_geo_insights: string[];
};
```

## Pipeline

```ts
async function buildTalentMarketMap(brief: TalentBrief): Promise<TalentMarketReport> {
  const queryPlan = await createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for talent market map run");
  }

  const serpEvidence = await collectLocalizedEvidence(queryPlan);
  const fetchedPages = await fetchEvidencePages(serpEvidence);
  const classifiedEvidence = await classifyTalentEvidence(brief, serpEvidence, fetchedPages);

  return synthesizeTalentMarketReport(brief, queryPlan, classifiedEvidence);
}
```

## Query Planning

```ts
async function createQueryPlan(brief: TalentBrief): Promise<QueryPlanItem[]> {
  const skillQuery = brief.skills.slice(0, 4).join(" ");
  const seniority = brief.seniority ? `${brief.seniority} ` : "";

  const baseQueries = brief.geographies.flatMap(geography => {
    const place = [geography.city, geography.region].filter(Boolean).join(" ");
    const placeSuffix = place ? ` ${place}` : "";
    const role = `${seniority}${brief.role_family}`;

    return [
      { query: `${role} ${skillQuery}${placeSuffix}`, signal_type: "job_demand", geography, priority: "high" },
      { query: `${role} jobs ${skillQuery}${placeSuffix}`, signal_type: "employer_competition", geography, priority: "high" },
      { query: `${brief.role_family} meetup ${place}`, signal_type: "community", geography, priority: "medium" },
      { query: `${brief.role_family} community ${place}`, signal_type: "sourcing_channel", geography, priority: "medium" },
      { query: `${brief.role_family} salary ${place}`, signal_type: "compensation", geography, priority: "medium" },
      { query: `${skillQuery} ${brief.role_family} ${place}`, signal_type: "talent_supply", geography, priority: "low" }
    ] as QueryPlanItem[];
  });

  const competitorQueries = brief.geographies.flatMap(geography =>
    (brief.competitor_employers || []).map(employer => ({
      query: `${employer} ${brief.role_family} jobs ${geography.city || geography.country}`,
      signal_type: "employer_competition",
      geography,
      priority: "medium"
    } as QueryPlanItem))
  );

  return dedupeQueryPlan([...baseQueries, ...competitorQueries]);
}
```

Optional query expansion via `ai_chat_completion`:

```ts
async function expandTalentQueries(brief: TalentBrief) {
  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Generate localized talent-market search queries. Avoid private profiles, personal contact discovery, and excluded job titles."
      },
      {
        role: "user",
        content: JSON.stringify({
          role_family: brief.role_family,
          seniority: brief.seniority,
          skills: brief.skills,
          geographies: brief.geographies,
          employment_mode: brief.employment_mode,
          exclusions: brief.exclusions
        })
      }
    ]
  });
}
```

## Localized Evidence Collection

```ts
async function collectLocalizedEvidence(queryPlan: QueryPlanItem[]): Promise<TalentEvidence[]> {
  const evidence: TalentEvidence[] = [];

  for (const item of queryPlan) {
    const response = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: item.geography.country,
      city: item.geography.city,
      device: item.geography.device || "desktop",
      max_results: item.priority === "high" ? 10 : 6
    });

    evidence.push(...normalizeTalentSerp(response, item));
  }

  return evidence;
}
```

Keep these fields for audit and scoring:

- Query text and planned signal type
- Country, city, region, and device target
- Result rank, title, snippet, URL, and domain
- SERP feature flags, when available
- Collection timestamp
- Whether the result appears to be a job page, community, salary page, employer page, directory, or unrelated result

## Fetching Pages

```ts
async function fetchEvidencePages(serpEvidence: TalentEvidence[]) {
  const urls = chooseFetchCandidates(serpEvidence, {
    perGeography: 16,
    perDomain: 3,
    includeTopRanks: 5,
    preferSignalTypes: ["job_demand", "community", "sourcing_channel", "compensation"]
  });

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

  return pages.filter(page => page.ok && page.text && page.text.length > 300);
}
```

Prioritize direct employer, job-board, salary, event, and community pages. Deprioritize thin reposting pages, generic listicles, expired job pages, and sources that only repeat national information without a local signal.

## Classification

Use `ai_chat_completion` to classify evidence into structured records:

```ts
async function classifyTalentEvidence(brief: TalentBrief, serpEvidence: TalentEvidence[], pages: unknown[]) {
  return massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "Classify public web evidence for a geography-level talent market map.",
          "Return only claims supported by supplied SERP or fetched-page sources.",
          "Do not identify or infer individual people, protected traits, or private contact data."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          serpEvidence,
          pages
        })
      }
    ]
  });
}
```

Required classification outputs:

- Relevance to requested role, seniority, and skills
- Signal type
- Employer names and normalized domains
- Location mentions
- Skill mentions
- Source strength
- Exclusion hits
- Evidence-backed claims

## Scoring

```ts
function scoreGeography(evidence: TalentEvidence[]): GeographyTalentMap {
  const relevant = evidence.filter(item => item.relevance !== "irrelevant");
  const supply = scoreSupplySignals(relevant);
  const competition = scoreCompetitionSignals(relevant);
  const channels = scoreSourcingChannels(relevant);
  const compensation = scoreCompensationVisibility(relevant);
  const confidence = scoreEvidenceConfidence(relevant);

  return applyCaps({
    talent_supply_score: weightedAverage([
      [supply, 0.45],
      [channels, 0.25],
      [confidence, 0.20],
      [compensation, 0.10]
    ]),
    competition_score: competition,
    channel_score: channels,
    compensation_visibility_score: compensation
  }, relevant);
}
```

Ranking should prefer high supply, strong channels, and sufficient evidence, while treating employer competition as context rather than a pure negative. A geography with high talent supply and high competition may still be attractive if sourcing channels are rich.

## Exports

Produce:

- `talent-market-map.json`: full report with evidence lineage.
- `geographies.csv`: one row per geography with scores and recommended action.
- `evidence.csv`: one row per source claim with query, rank, URL, domain, and signal type.
- `talent-market-map.md`: readable report for recruiting and leadership review.

## Implementation Notes

- Cache SERP and fetched-page responses by query, geography, device, and URL.
- Normalize company names with domain-first matching.
- Keep job-demand evidence separate from supply proxies.
- Record exclusions and noise reasons so reviewers can improve future briefs.
- Do not store personal candidate data in the MVP.
