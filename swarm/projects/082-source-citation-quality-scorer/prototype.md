# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type CitationAuditBrief = {
  project: string;
  target_entity?: TargetEntity;
  questions: CitationQuestion[];
  targets: GeoDeviceTarget[];
  models: string[];
  source_rules?: SourceRules;
  scoring_weights?: ScoringWeights;
  supplied_answers?: SuppliedAnswer[];
};

type TargetEntity = {
  name: string;
  preferred_domains: string[];
  competitor_domains?: string[];
  disallowed_domains?: string[];
};

type CitationQuestion = {
  question: string;
  intent:
    | "factual_verification"
    | "category_recommendation"
    | "comparison"
    | "how_to"
    | "definition"
    | "troubleshooting"
    | "other";
  required_claims?: string[];
  must_not_claim?: string[];
  preferred_sources?: string[];
};

type GeoDeviceTarget = {
  country: string;
  city?: string;
  device: "desktop" | "mobile" | "tablet";
};

type SourceRules = {
  prefer_official_sources: boolean;
  allow_review_sites: boolean;
  disallow_forums_for_factual_claims: boolean;
  max_source_age_days?: number;
  required_domains_for_claims?: Record<string, string[]>;
};

type ScoringWeights = {
  claim_support: number;
  source_relevance: number;
  authority: number;
  freshness: number;
  accessibility: number;
  citation_diversity: number;
  citation_specificity: number;
};

type SuppliedAnswer = {
  question: string;
  model?: string;
  target?: GeoDeviceTarget;
  answer_text: string;
  citations: CitationRef[];
  answered_at?: string;
};

type CitationRef = {
  url: string;
  title?: string;
  snippet?: string;
  cited_text?: string;
  source_index?: number;
};

type AnswerObservation = {
  observation_id: string;
  question: string;
  model: string;
  target: GeoDeviceTarget;
  answered_at: string;
  answer_text: string;
  citations: CitationRef[];
  extracted_claims: AnswerClaim[];
};

type AnswerClaim = {
  claim_id: string;
  text: string;
  claim_type: "factual" | "comparative" | "recommendation" | "pricing" | "temporal" | "legal" | "other";
  importance: "critical" | "high" | "medium" | "low";
  linked_citation_urls: string[];
};

type SourceObservation = {
  source_id: string;
  source_url: string;
  final_url?: string;
  status_code?: number;
  target: GeoDeviceTarget;
  fetched_at: string;
  render_state: "ok" | "captcha" | "cookie_wall" | "login" | "paywall" | "timeout" | "blocked" | "error";
  screenshot_ref?: string;
  html_ref?: string;
  metadata: SourceMetadata;
  extracted_text_excerpt?: string;
  authority_signals: AuthoritySignals;
};

type SourceMetadata = {
  title?: string;
  canonical?: string;
  meta_description?: string;
  language?: string;
  published_date?: string;
  modified_date?: string;
  version_label?: string;
  headings: { level: number; text: string }[];
};

type AuthoritySignals = {
  domain: string;
  is_preferred_domain: boolean;
  is_competitor_domain: boolean;
  is_official_source: boolean;
  source_type: "official" | "news" | "review" | "forum" | "docs" | "blog" | "academic" | "unknown";
};

type ClaimSupportJudgment = {
  claim_id: string;
  citation_url: string;
  support: "entailed" | "partially_supported" | "contradicted" | "not_found" | "not_accessible";
  evidence_excerpt?: string;
  reasoning: string;
  confidence: "high" | "medium" | "low";
};

type CitationIssue = {
  issue_id: string;
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "unsupported_claim"
    | "contradicted_claim"
    | "irrelevant_source"
    | "stale_source"
    | "inaccessible_source"
    | "weak_authority"
    | "missing_official_source"
    | "overbroad_citation"
    | "citation_cluster_duplication";
  title: string;
  question: string;
  answer_claim?: string;
  cited_url?: string;
  evidence: {
    answer_observation_id: string;
    source_id?: string;
    text_excerpt?: string;
    fetched_at?: string;
  };
  recommendation: string;
  confidence: "high" | "medium" | "low";
};

type CitationQualityReport = {
  project: string;
  generated_at: string;
  summary: string;
  overall_score: number;
  answer_scores: AnswerScore[];
  citation_issues: CitationIssue[];
  answer_observations: AnswerObservation[];
  source_observations: SourceObservation[];
};

type AnswerScore = {
  question: string;
  model: string;
  target: GeoDeviceTarget;
  score: number;
  status: "well_supported" | "partially_supported" | "weakly_supported" | "unsupported" | "failed";
  supported_claims: string[];
  unsupported_claims: string[];
  contradicted_claims: string[];
  best_citations: string[];
  weak_citations: string[];
};
```

## Pipeline

```ts
async function runCitationQualityScorer(brief: CitationAuditBrief): Promise<CitationQualityReport> {
  const estimatedCredits = estimateCredits(brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for citation quality audit");
  }

  const answers = await collectAnswerObservations(brief);
  const citedUrls = uniqueCitationUrls(answers);
  const sources = await collectSourceObservations(citedUrls, brief.targets);
  const alternatives = await collectAlternativeSourcesWhenNeeded(brief, answers);

  const claimJudgments = await judgeClaimSupport(brief, answers, sources);
  const deterministicIssues = runDeterministicCitationChecks(brief, answers, sources);
  const supportIssues = buildSupportIssues(answers, sources, claimJudgments);

  return synthesizeCitationQualityReport(brief, answers, sources, alternatives, [
    ...deterministicIssues,
    ...supportIssues
  ]);
}
```

## Collection

Answer collection can use generated answers or supplied answer fixtures:

```ts
async function collectAnswerObservations(brief: CitationAuditBrief): Promise<AnswerObservation[]> {
  const supplied = normalizeSuppliedAnswers(brief.supplied_answers ?? []);
  const generated = [];

  for (const question of brief.questions) {
    for (const target of brief.targets) {
      for (const model of brief.models) {
        generated.push(await massive.ai_chat_completion({
          model,
          prompt: question.question,
          country: target.country,
          city: target.city,
          device: target.device,
          include_sources: true
        }));
      }
    }
  }

  return [...supplied, ...generated].map(extractClaimsAndCitationRefs);
}
```

Source collection fetches every cited URL with the same target context used for the answer:

```ts
async function collectSourceObservations(urls: string[], targets: GeoDeviceTarget[]) {
  const runs = [];

  for (const url of urls) {
    for (const target of targets) {
      runs.push(massive.web_fetch({
        url,
        render_js: true,
        country: target.country,
        city: target.city,
        device: target.device,
        capture_screenshot: true
      }));
    }
  }

  return Promise.all(runs).then(results => results.map(normalizeSourceObservation));
}
```

## Scoring

Default answer score is 0-100:

- 35 points: material claims are supported by cited source text.
- 20 points: citations are topically relevant and point to specific useful pages.
- 15 points: sources have appropriate authority for the claim type.
- 10 points: sources are current enough for the question and not superseded.
- 10 points: cited pages are accessible, rendered, and readable.
- 5 points: citations include enough source diversity for broad recommendations.
- 5 points: citations are specific rather than generic homepages or vague roundups.

Automatic caps:

- Cap at 30 when a critical claim is contradicted by a cited source.
- Cap at 45 when no cited source is accessible.
- Cap at 55 when factual claims rely only on forums, scraped snippets, or generic review pages.
- Cap at 65 when official sources exist but are absent for official product, pricing, policy, or docs claims.
- Cap at 75 when answer text has citations but claim-to-citation mapping is ambiguous.
- Cap at 80 when sources are relevant but stale beyond the configured source age limit.

## Issue Rules

Deterministic checks should fire before AI judgment:

- Inaccessible citation: `web_fetch` returns login, paywall, captcha, blocked, timeout, or error.
- Stale citation: source date exceeds `max_source_age_days` for temporal or product claims.
- Missing official source: target entity has preferred domains, but answer cites only non-official sources for factual claims.
- Duplicate cluster: citations resolve to the same canonical URL, syndicated copy, or repeated source domain.
- Overbroad citation: cited URL is a homepage, category page, or search page when the claim needs a specific page.

AI-assisted checks compare claim text to fetched source excerpts:

- Entailed: source directly supports the claim.
- Partially supported: source supports a weaker or narrower version of the claim.
- Contradicted: source states an incompatible fact.
- Not found: source is accessible but evidence is absent.
- Not accessible: source could not be inspected.

## Artifacts

The CLI should write:

- `citation-quality-report.json`
- `citation-quality-issues.csv`
- `citation-quality-report.md`
- `answer-observations.jsonl`
- `source-observations.jsonl`
- screenshots and rendered HTML excerpts for cited pages

Example command:

```bash
citation-quality-scorer run \
  --brief citation-audit-brief.json \
  --out citation-quality-report.json \
  --issues-csv citation-quality-issues.csv \
  --report-md citation-quality-report.md \
  --artifacts-dir artifacts
```
