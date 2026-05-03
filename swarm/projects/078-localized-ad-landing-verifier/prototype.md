# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type VerificationBrief = {
  brand: {
    name: string;
    domain: string;
  };
  campaign: {
    name: string;
    queries: string[];
    expected_landing_patterns?: string[];
  };
  targets: GeoDeviceTarget[];
  rules: VerificationRules;
  competitor_filters?: string[];
  max_searches?: number;
  max_fetches?: number;
};

type GeoDeviceTarget = {
  country: string;
  city?: string;
  region?: string;
  language?: string;
  device: "desktop" | "mobile";
  expected_currency?: string;
};

type VerificationRules = {
  required_claims?: string[];
  prohibited_claims?: string[];
  must_match?: MatchDimension[];
  excluded_actions?: string[];
};

type MatchDimension =
  | "city"
  | "region"
  | "country"
  | "language"
  | "currency"
  | "pricing"
  | "offer_terms"
  | "service_availability"
  | "phone_number_region"
  | "cta";

type SerpAdEvidence = {
  id: string;
  query: string;
  target: GeoDeviceTarget;
  rank: number;
  title: string;
  snippet?: string;
  display_url?: string;
  click_url: string;
  final_url?: string;
  sitelinks?: string[];
  observed_claims: string[];
  is_brand_match: boolean;
  fetched_at: string;
};

type LandingObservation = {
  ad_id: string;
  requested_url: string;
  final_url: string;
  redirect_chain: string[];
  target: GeoDeviceTarget;
  http_status?: number;
  rendered_title?: string;
  rendered_text: string;
  visible_ctas: string[];
  localized_terms: {
    cities: string[];
    regions: string[];
    countries: string[];
    currencies: string[];
    languages: string[];
    phone_regions: string[];
  };
  offers: string[];
  disclosures: string[];
  prohibited_claim_hits: string[];
  fetch_warnings: string[];
  fetched_at: string;
};

type VerificationIssue = {
  severity: "critical" | "high" | "medium" | "low";
  issue_type:
    | "ad_to_page_offer_mismatch"
    | "localized_claim_mismatch"
    | "currency_or_pricing_mismatch"
    | "language_mismatch"
    | "device_experience_failure"
    | "unapproved_claim"
    | "missing_required_disclosure"
    | "wrong_destination"
    | "availability_gap"
    | "tracking_or_redirect_risk";
  query: string;
  target: GeoDeviceTarget;
  ad_id?: string;
  landing_url?: string;
  ad_claim?: string;
  landing_observation: string;
  recommended_fix: string;
  evidence: EvidenceItem[];
  confidence: "high" | "medium" | "low";
};

type EvidenceItem = {
  source_type: "serp_ad" | "organic_result" | "rendered_landing_page" | "redirect_chain" | "ai_answer_source";
  url?: string;
  query?: string;
  rank?: number;
  observed_text?: string;
  target: GeoDeviceTarget;
  fetched_at: string;
};

type TargetVerificationResult = {
  target: GeoDeviceTarget;
  score: number;
  ads_found: number;
  landing_pages_checked: number;
  coverage_warnings: string[];
  issues: VerificationIssue[];
};

type VerificationReport = {
  brand: string;
  campaign: string;
  summary: string;
  verification_score: number;
  target_results: TargetVerificationResult[];
  global_warnings: string[];
};
```

## Pipeline

```ts
async function runLocalizedVerification(
  brief: VerificationBrief
): Promise<VerificationReport> {
  validateBrief(brief);

  const plan = createTargetQueryPlan(brief);
  const estimatedCredits = estimateCredits(plan, brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for localized ad verification");
  }

  const serpAds = await collectSerpAds(brief, plan);
  const landingObservations = await fetchLandingPages(brief, serpAds);
  const issues = await detectIssues(brief, serpAds, landingObservations);
  const targetResults = scoreTargets(brief, serpAds, landingObservations, issues);

  return assembleReport(brief, targetResults);
}
```

## Target Query Planning

```ts
type TargetQueryPlanItem = {
  query: string;
  target: GeoDeviceTarget;
  priority: "high" | "medium" | "low";
};

function createTargetQueryPlan(brief: VerificationBrief): TargetQueryPlanItem[] {
  return brief.targets.flatMap(target =>
    brief.campaign.queries.map((query, index) => ({
      query,
      target,
      priority: index < 3 ? "high" : "medium"
    }))
  );
}
```

## SERP Collection

```ts
async function collectSerpAds(
  brief: VerificationBrief,
  plan: TargetQueryPlanItem[]
): Promise<SerpAdEvidence[]> {
  const results: SerpAdEvidence[] = [];

  for (const item of plan.slice(0, brief.max_searches || plan.length)) {
    const serp = await massive.web_search({
      query: item.query,
      country: item.target.country,
      city: item.target.city,
      language: item.target.language,
      device: item.target.device,
      parse_google_serp: true
    });

    const ads = extractAdsAndFallbacks(serp).filter(result =>
      isRelevantToBrandOrCompetitors(result, brief)
    );

    for (const ad of ads) {
      results.push({
        id: stableAdId(item, ad),
        query: item.query,
        target: item.target,
        rank: ad.rank,
        title: ad.title,
        snippet: ad.snippet,
        display_url: ad.display_url,
        click_url: ad.url,
        sitelinks: ad.sitelinks || [],
        observed_claims: extractClaims(ad.title, ad.snippet),
        is_brand_match: matchesDomain(ad.url, brief.brand.domain),
        fetched_at: new Date().toISOString()
      });
    }
  }

  return results;
}
```

## Landing Fetch

```ts
async function fetchLandingPages(
  brief: VerificationBrief,
  ads: SerpAdEvidence[]
): Promise<LandingObservation[]> {
  const observations: LandingObservation[] = [];
  const brandAds = ads
    .filter(ad => ad.is_brand_match || matchesExpectedPattern(ad.click_url, brief))
    .slice(0, brief.max_fetches || ads.length);

  for (const ad of brandAds) {
    const page = await massive.web_fetch({
      url: ad.click_url,
      country: ad.target.country,
      city: ad.target.city,
      language: ad.target.language,
      device: ad.target.device,
      render_js: true,
      handle_captcha: true,
      follow_redirects: true
    });

    observations.push({
      ad_id: ad.id,
      requested_url: ad.click_url,
      final_url: page.final_url,
      redirect_chain: page.redirect_chain || [],
      target: ad.target,
      http_status: page.status,
      rendered_title: page.title,
      rendered_text: page.text,
      visible_ctas: extractVisibleCtas(page),
      localized_terms: extractLocalizedTerms(page.text),
      offers: extractOffers(page.text),
      disclosures: extractDisclosures(page.text),
      prohibited_claim_hits: findProhibitedClaims(page.text, brief.rules.prohibited_claims || []),
      fetch_warnings: page.warnings || [],
      fetched_at: new Date().toISOString()
    });
  }

  return observations;
}
```

## Issue Detection

```ts
async function detectIssues(
  brief: VerificationBrief,
  ads: SerpAdEvidence[],
  pages: LandingObservation[]
): Promise<VerificationIssue[]> {
  const deterministicIssues = [
    ...checkWrongDestination(brief, ads, pages),
    ...checkProhibitedClaims(brief, ads, pages),
    ...checkRequiredClaims(brief, pages),
    ...checkCurrencyAndLanguage(brief, ads, pages),
    ...checkRedirectRisks(ads, pages)
  ];

  const aiReviewed = await massive.ai_chat_completion({
    model: "source-grounded-verifier",
    messages: [
      {
        role: "system",
        content:
          "Compare ad evidence and rendered landing observations. Return only mismatches supported by provided evidence."
      },
      {
        role: "user",
        content: JSON.stringify({ brief, ads, pages, deterministicIssues })
      }
    ],
    response_format: "json"
  });

  return normalizeIssues([...deterministicIssues, ...aiReviewed.issues]);
}
```

## Scoring

```ts
function scoreTarget(
  target: GeoDeviceTarget,
  ads: SerpAdEvidence[],
  pages: LandingObservation[],
  issues: VerificationIssue[]
): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.target !== target) continue;
    if (issue.severity === "critical") score -= 35;
    if (issue.severity === "high") score -= 20;
    if (issue.severity === "medium") score -= 10;
    if (issue.severity === "low") score -= 4;
  }

  if (ads.length === 0) score = Math.min(score, 70);
  if (pages.some(page => page.fetch_warnings.includes("render_failed"))) score = Math.min(score, 65);
  if (pages.some(page => page.redirect_chain.length > 4)) score = Math.min(score, 60);
  if (issues.some(issue => issue.issue_type === "unapproved_claim" && issue.severity === "high")) {
    score = Math.min(score, 45);
  }
  if (issues.some(issue => issue.issue_type === "wrong_destination")) score = Math.min(score, 40);

  return Math.max(0, Math.min(100, score));
}
```

## CLI Shape

```bash
localized-ad-verifier run \
  --brief examples/acme-solar.json \
  --out out/verification-report.json \
  --report-md out/verification-report.md \
  --csv out/issues.csv
```

Implementation notes:

- Use deterministic checks before AI synthesis so obvious policy and routing failures are reproducible.
- Store raw SERP and landing observations separately from final issue summaries.
- Deduplicate ads by final URL, query, target, and visible copy hash.
- Keep target metadata on every row in JSON and CSV exports.
- Treat captcha, render failure, and ambiguous redirects as warnings that can cap scores.
- Never run form submissions or checkout flows during the MVP.
