# Prototype

## User Flow

1. User uploads `best_customers.csv` and `target_accounts.csv`.
2. App validates required fields and deduplicates by domain.
3. App enriches missing and uncertain attributes with Massive MCP.
4. App builds the ICP baseline from best customers.
5. App scores every target account.
6. User downloads a ranked drift report.

## Data Model

```ts
type AccountInput = {
  account_name: string;
  domain: string;
  country?: string;
  city?: string;
  employee_count?: number;
  industry?: string;
  source?: string;
};

type AccountEvidence = {
  url: string;
  title?: string;
  snippet: string;
  observed_at: string;
  trait_keys: string[];
};

type NormalizedAccount = AccountInput & {
  category?: string;
  buyer_persona?: string;
  size_bucket?: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
  maturity_signals: string[];
  growth_signals: string[];
  exclusions: string[];
  evidence: AccountEvidence[];
};

type DriftResult = {
  domain: string;
  fit_score: number;
  drift_flags: string[];
  recommended_action: "keep" | "review" | "remove";
  explanation: string;
  evidence: AccountEvidence[];
};
```

## Massive MCP Calls

### Enrichment Plan

For each domain:

1. `web_fetch`
   - Fetch homepage with JS rendering.
   - Fetch `/about`, `/pricing`, `/customers`, `/careers` if linked or predictable.
2. `web_search`
   - Query: `{company} company software customers`
   - Query: `site:{domain} pricing OR platform OR solution`
   - Query: `{company} hiring funding`
3. `ai_chat_completion`
   - Convert page text and SERP snippets into normalized traits.
   - Require citations from fetched URLs or search result URLs.

### Trait Extraction Prompt

```text
You are normalizing account traits for ICP scoring.
Return strict JSON with:
- category
- buyer_persona
- country
- city
- size_bucket
- maturity_signals
- growth_signals
- exclusions
- evidence: [{ url, snippet, trait_keys }]

Use only supplied sources. If a trait is unknown, return null or [].
```

## Scoring Algorithm

Build baseline distributions from best customers:

- geography distribution
- size bucket distribution
- category keyword centroid
- buyer persona frequency
- maturity signal frequency
- exclusion frequency

Initial scoring:

```text
score = 100
- 25 if category is outside baseline clusters
- 20 if size_bucket is rare among best customers
- 15 if country/city is outside accepted distribution
- 15 if buyer_persona differs from dominant baseline personas
- 10 if no growth or maturity signals are present
- 20 if exclusion terms match
Clamp to 0-100
```

Recommended action:

- `keep`: score >= 75 and no critical exclusions
- `review`: score 45-74 or insufficient evidence
- `remove`: score < 45 or critical exclusion found

## Example Output

```csv
domain,fit_score,recommended_action,drift_flags,explanation
acme-hr.example,82,keep,"","Matches mid-market HR SaaS baseline in US with growth signals."
local-cafe.example,18,remove,"category_mismatch;too_small","Appears to be a local services business, unlike best-customer SaaS profile."
```

## Lightweight Implementation Structure

```text
src/
  load_csv.ts
  massive_client.ts
  enrich_account.ts
  normalize_traits.ts
  build_baseline.ts
  score_drift.ts
  export_report.ts
```

## CLI Shape

```bash
icp-drift \
  --best best_customers.csv \
  --targets target_accounts.csv \
  --out drift_report.csv \
  --summary drift_summary.md
```

## MVP Guardrails

- Cache enrichment results by domain for 14 days.
- Never score missing data as bad data; add `insufficient_evidence` and route to `review`.
- Keep source-level summaries so users can see if one acquisition channel is drifting.
- Include raw citations in output for auditability.

