# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type VerificationBrief = {
  project: string;
  mode: "verify_supplied_answer" | "generate_and_verify";
  answer?: SuppliedAnswer;
  prompt?: string;
  model?: string;
  source_urls?: string[];
  search_queries?: string[];
  targets: GeoDeviceTarget[];
  verification_rules?: VerificationRules;
  scoring_weights?: ScoringWeights;
};

type SuppliedAnswer = {
  prompt?: string;
  answer_text: string;
  citations?: string[];
  answered_at?: string;
  model?: string;
};

type GeoDeviceTarget = {
  country: string;
  city?: string;
  device: "desktop" | "mobile" | "tablet";
};

type VerificationRules = {
  require_official_sources_for?: ClaimType[];
  high_stakes_claim_types?: ClaimType[];
  max_source_age_days?: number;
  allow_search_for_alternatives?: boolean;
  allowed_domains?: string[];
  disallowed_domains?: string[];
};

type ScoringWeights = {
  claim_support: number;
  contradiction_severity: number;
  source_accessibility: number;
  source_authority: number;
  freshness: number;
  citation_alignment: number;
};

type ClaimType =
  | "pricing"
  | "plan_limits"
  | "product_feature"
  | "policy"
  | "legal"
  | "medical"
  | "financial"
  | "safety"
  | "how_to"
  | "comparison"
  | "temporal"
  | "other";

type AnswerObservation = {
  answer_id: string;
  prompt?: string;
  answer_text: string;
  model?: string;
  target?: GeoDeviceTarget;
  answered_at: string;
  citation_urls: string[];
  claims: ExtractedClaim[];
};

type ExtractedClaim = {
  claim_id: string;
  text: string;
  claim_type: ClaimType;
  importance: "critical" | "high" | "medium" | "low";
  cited_urls: string[];
  requires_human_review: boolean;
};

type SourceObservation = {
  source_id: string;
  source_url: string;
  final_url?: string;
  status_code?: number;
  target: GeoDeviceTarget;
  fetched_at: string;
  render_state: "ok" | "captcha" | "cookie_wall" | "login" | "paywall" | "timeout" | "blocked" | "empty" | "error";
  metadata: SourceMetadata;
  authority: SourceAuthority;
  extracted_text?: string;
  screenshot_ref?: string;
  html_ref?: string;
};

type SourceMetadata = {
  title?: string;
  canonical_url?: string;
  meta_description?: string;
  language?: string;
  published_date?: string;
  modified_date?: string;
  version_label?: string;
  headings: string[];
};

type SourceAuthority = {
  domain: string;
  source_type: "official" | "docs" | "pricing" | "changelog" | "news" | "review" | "forum" | "academic" | "unknown";
  is_allowed_domain: boolean;
  is_disallowed_domain: boolean;
};

type ClaimJudgment = {
  claim_id: string;
  judgment: "supported" | "partially_supported" | "contradicted" | "not_found" | "not_checkable";
  confidence: "high" | "medium" | "low";
  supporting_sources: EvidenceRef[];
  contradicting_sources: EvidenceRef[];
  missing_from_sources: string[];
  reasoning: string;
};

type EvidenceRef = {
  source_id: string;
  source_url: string;
  excerpt: string;
  fetched_at: string;
};

type VerificationIssue = {
  issue_id: string;
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "contradicted_claim"
    | "unsupported_claim"
    | "partial_support"
    | "not_checkable"
    | "inaccessible_source"
    | "stale_source"
    | "weak_authority"
    | "missing_citation"
    | "overbroad_citation"
    | "human_review_required";
  title: string;
  claim_id?: string;
  source_id?: string;
  evidence?: EvidenceRef;
  recommendation: string;
  confidence: "high" | "medium" | "low";
};

type VerificationReport = {
  project: string;
  generated_at: string;
  overall_score: number;
  hallucination_risk: "low" | "medium" | "high" | "critical";
  summary: string;
  answer_observation: AnswerObservation;
  source_observations: SourceObservation[];
  claim_judgments: ClaimJudgment[];
  issues: VerificationIssue[];
};
```

## Pipeline

```ts
async function runHallucinationVerifier(brief: VerificationBrief): Promise<VerificationReport> {
  const estimatedCredits = estimateCredits(brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for hallucination verification");
  }

  const answer = await collectAnswer(brief);
  const sourceUrls = await resolveSourceUrls(brief, answer);
  const sources = await fetchSources(sourceUrls, brief.targets);
  const claims = await extractClaims(answer, brief.verification_rules);
  const judgments = await judgeClaimsAgainstSources(claims, sources, brief.verification_rules);
  const deterministicIssues = runDeterministicChecks(answer, claims, sources, brief);
  const judgmentIssues = buildJudgmentIssues(claims, judgments, sources, brief);

  return synthesizeReport(brief, { ...answer, claims }, sources, judgments, [
    ...deterministicIssues,
    ...judgmentIssues
  ]);
}
```

## Collection

```ts
async function collectAnswer(brief: VerificationBrief): Promise<AnswerObservation> {
  if (brief.mode === "verify_supplied_answer" && brief.answer) {
    return normalizeSuppliedAnswer(brief.answer);
  }

  const target = brief.targets[0];
  const completion = await massive.ai_chat_completion({
    model: brief.model ?? "default_answer_engine",
    prompt: brief.prompt,
    country: target.country,
    city: target.city,
    device: target.device,
    include_sources: true
  });

  return {
    answer_id: stableId("answer", completion.answer_text),
    prompt: brief.prompt,
    answer_text: completion.answer_text,
    model: brief.model,
    target,
    answered_at: new Date().toISOString(),
    citation_urls: extractCitationUrls(completion),
    claims: []
  };
}

async function resolveSourceUrls(
  brief: VerificationBrief,
  answer: AnswerObservation
): Promise<string[]> {
  const directUrls = new Set([
    ...(brief.source_urls ?? []),
    ...answer.citation_urls
  ]);

  if (directUrls.size > 0 || !brief.verification_rules?.allow_search_for_alternatives) {
    return [...directUrls];
  }

  const searchQueries = brief.search_queries ?? [answer.prompt ?? answer.answer_text.slice(0, 180)];
  for (const query of searchQueries) {
    const results = await massive.web_search({
      query,
      parse_google_serp: true,
      country: brief.targets[0].country,
      city: brief.targets[0].city,
      device: brief.targets[0].device
    });

    for (const result of results.organic_results.slice(0, 5)) {
      directUrls.add(result.url);
    }
  }

  return [...directUrls];
}

async function fetchSources(
  urls: string[],
  targets: GeoDeviceTarget[]
): Promise<SourceObservation[]> {
  const observations = [];

  for (const url of urls) {
    for (const target of targets) {
      const fetched = await massive.web_fetch({
        url,
        render_js: true,
        handle_captcha: true,
        country: target.country,
        city: target.city,
        device: target.device,
        include_screenshot: true,
        include_html: true
      });

      observations.push(normalizeFetchedSource(url, target, fetched));
    }
  }

  return observations;
}
```

## Claim Extraction And Judgment

Claim extraction should remove filler and keep only checkable propositions:

```ts
async function extractClaims(
  answer: AnswerObservation,
  rules?: VerificationRules
): Promise<ExtractedClaim[]> {
  const response = await massive.ai_chat_completion({
    model: "claim-extractor",
    prompt: buildClaimExtractionPrompt(answer.answer_text, rules),
    response_format: "json"
  });

  return response.claims.map((claim, index) => ({
    claim_id: `claim-${String(index + 1).padStart(3, "0")}`,
    text: claim.text,
    claim_type: claim.claim_type,
    importance: claim.importance,
    cited_urls: mapClaimToCitations(claim.text, answer.citation_urls),
    requires_human_review: rules?.high_stakes_claim_types?.includes(claim.claim_type) ?? false
  }));
}

async function judgeClaimsAgainstSources(
  claims: ExtractedClaim[],
  sources: SourceObservation[],
  rules?: VerificationRules
): Promise<ClaimJudgment[]> {
  const accessibleSources = sources.filter((source) => source.render_state === "ok");

  return massive.ai_chat_completion({
    model: "evidence-judge",
    prompt: buildEvidenceJudgmentPrompt(claims, accessibleSources, rules),
    response_format: "json"
  }).then((response) => normalizeJudgments(response.judgments, claims, sources));
}
```

Deterministic checks run before or alongside model judgment:

- No accessible source pages for a material claim produces `not_checkable`.
- A high-stakes claim always creates a `human_review_required` issue.
- A pricing, policy, or plan-limit claim without official sources creates `weak_authority`.
- A source with captcha, login, paywall, timeout, blocked, empty, or error state creates `inaccessible_source`.
- A source older than `max_source_age_days` creates `stale_source` for temporal claims.
- A claim with no mapped citation creates `missing_citation`.

## Scoring

Start from 100 and apply capped penalties:

- Critical contradicted claim: minus 35.
- High contradicted claim: minus 25.
- Unsupported high-importance claim: minus 18.
- Partial support for high-importance claim: minus 10.
- Not checkable because all sources are inaccessible: minus 8.
- Weak authority for regulated, pricing, security, or plan-limit claim: minus 8.
- Stale evidence for time-sensitive claim: minus 6.
- Missing or overbroad citation: minus 4.

Risk bands:

- 85-100: low
- 70-84: medium
- 45-69: high
- 0-44: critical

## Report Generation

The Markdown report should include:

- One-paragraph executive summary.
- Overall score and hallucination risk.
- Claim table with judgment, confidence, severity, and linked source.
- High and critical issues first.
- Source observation table with render state, canonical URL, status code, and timestamp.
- Suggested corrected answer when enough evidence exists.
- JSON artifact paths for answer, source, claim, and issue records.

Exports:

- `report.json` for structured ingestion.
- `issues.csv` for review queues.
- `report.md` for human review.
- Screenshot and HTML references from `web_fetch`.
