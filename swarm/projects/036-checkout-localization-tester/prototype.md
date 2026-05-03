# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_fetch`, `web_search`, and `ai_chat_completion`.

## Data Model

```ts
type CheckoutBrief = {
  store: StoreTarget;
  products: ProductTarget[];
  targets: MarketTarget[];
  expectations: CheckoutExpectations;
  address_fixtures: Record<string, AddressFixture>;
};

type StoreTarget = {
  name: string;
  domain: string;
  homepage_url: string;
};

type ProductTarget = {
  url: string;
  sku?: string;
  quantity: number;
  variant_options?: Record<string, string>;
};

type MarketTarget = {
  country: string;
  city?: string;
  language?: string;
  device: "desktop" | "mobile";
  expected_currency?: string;
  address_fixture_id: string;
};

type CheckoutExpectations = {
  stop_before_payment_submission: true;
  required_payment_methods?: string[];
  optional_payment_methods?: string[];
  require_localized_language?: boolean;
  require_local_currency?: boolean;
  require_shipping_quote?: boolean;
  require_tax_or_duty_disclosure?: boolean;
};

type AddressFixture = {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
  phone?: string;
};

type CheckoutStep =
  | "homepage"
  | "product"
  | "cart"
  | "checkout_contact"
  | "checkout_shipping"
  | "checkout_payment_boundary"
  | "policy_page"
  | "blocked";

type CheckoutObservation = {
  id: string;
  market_key: string;
  country: string;
  city?: string;
  language?: string;
  device: "desktop" | "mobile";
  step: CheckoutStep;
  url: string;
  title?: string;
  rendered_text_excerpt?: string;
  screenshot_url?: string;
  observed_currency?: string;
  observed_language?: string;
  prices?: PriceObservation[];
  address_fields?: AddressFieldObservation[];
  validation_errors?: string[];
  shipping_options?: ShippingOption[];
  tax_or_duty_lines?: ChargeLine[];
  payment_methods?: string[];
  legal_notices?: string[];
  captcha_detected: boolean;
  fetched_at: string;
};

type PriceObservation = {
  label: string;
  amount?: number;
  currency?: string;
  raw_text: string;
};

type AddressFieldObservation = {
  name: string;
  label?: string;
  required: boolean;
  accepted_fixture_value?: boolean;
};

type ShippingOption = {
  name: string;
  amount?: number;
  currency?: string;
  estimated_delivery?: string;
  raw_text: string;
};

type ChargeLine = {
  label: string;
  amount?: number;
  currency?: string;
  raw_text: string;
};

type CheckoutIssue = {
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "rendering"
    | "currency"
    | "language"
    | "address_validation"
    | "shipping"
    | "tax_duty"
    | "payment_methods"
    | "legal_consent"
    | "captcha_or_block"
    | "evidence_gap";
  title: string;
  country: string;
  city?: string;
  device: "desktop" | "mobile";
  evidence_id: string;
  repro_steps: string[];
  recommendation: string;
  confidence: "high" | "medium" | "low";
};

type MarketCheckoutSummary = {
  country: string;
  city?: string;
  language?: string;
  device: "desktop" | "mobile";
  readiness_score: number;
  status: "ready" | "warning" | "blocked";
  observed_currency?: string;
  observed_language?: string;
  shipping_quote_available: boolean;
  tax_or_duty_disclosure: "present" | "absent" | "not_applicable" | "unclear";
  payment_methods: string[];
  issues: CheckoutIssue[];
};

type CheckoutLocalizationReport = {
  store: StoreTarget;
  summary: string;
  overall_readiness_score: number;
  markets: MarketCheckoutSummary[];
  defects: CheckoutIssue[];
};
```

## Pipeline

```ts
async function runCheckoutLocalizationTest(
  brief: CheckoutBrief
): Promise<CheckoutLocalizationReport> {
  const plan = buildMarketRunPlan(brief);
  const estimatedCredits = estimateCredits(plan);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for checkout localization test");
  }

  const observations = await collectCheckoutObservations(brief, plan);
  const policies = await collectSupportingPolicyEvidence(brief, observations);
  const classifiedIssues = await classifyCheckoutIssues(brief, observations, policies);

  return synthesizeCheckoutLocalizationReport(brief, observations, classifiedIssues);
}
```

## Run Planning

Create one run per country-city-device-language target:

```ts
function buildMarketRunPlan(brief: CheckoutBrief) {
  return brief.targets.map(target => {
    const fixture = brief.address_fixtures[target.address_fixture_id];

    if (!fixture) {
      throw new Error(`Missing address fixture: ${target.address_fixture_id}`);
    }

    return {
      market_key: [
        target.country,
        target.city || "national",
        target.language || "default",
        target.device
      ].join(":"),
      target,
      fixture,
      products: brief.products,
      stop_point: "checkout_payment_boundary"
    };
  });
}
```

Before launch, seed standard address fixtures for all supported countries. Keep them intentionally non-sensitive and suitable for QA.

## Checkout Collection

```ts
async function collectCheckoutObservations(brief: CheckoutBrief, plan: MarketRun[]) {
  const observations: CheckoutObservation[] = [];

  for (const run of plan) {
    for (const product of run.products) {
      const productPage = await massive.web_fetch({
        url: product.url,
        render_js: true,
        country: run.target.country,
        city: run.target.city,
        device: run.target.device,
        language: run.target.language,
        captcha_handling: true
      });

      observations.push(normalizeProductPage(productPage, brief, run, product));

      const cartPage = await addProductAndOpenCart(productPage, product, run);
      observations.push(normalizeCartPage(cartPage, brief, run));

      const checkoutPages = await progressCheckoutUntilPaymentBoundary(cartPage, run);
      observations.push(...checkoutPages.map(page => normalizeCheckoutPage(page, brief, run)));
    }
  }

  return observations;
}
```

The browser stepper should support common ecommerce patterns:

- Add-to-cart button by semantic text, ARIA label, or form action.
- Variant selection before add-to-cart.
- Cart drawer, cart page, or direct checkout button.
- Email/contact step using generated test email alias.
- Shipping address fields by autocomplete attributes and label matching.
- Country or region selectors.
- Continue-to-shipping and continue-to-payment buttons.
- Stop at hosted payment provider, payment iframe, or order-review page.

## Normalization

Normalize every page into observations before summarization:

```ts
function normalizeCheckoutPage(page: RenderedPage, brief: CheckoutBrief, run: MarketRun) {
  return {
    id: stableObservationId(run, page.url, page.step),
    market_key: run.market_key,
    country: run.target.country,
    city: run.target.city,
    language: run.target.language,
    device: run.target.device,
    step: inferCheckoutStep(page),
    url: page.url,
    title: page.title,
    rendered_text_excerpt: page.text.slice(0, 4000),
    screenshot_url: page.screenshot_url,
    observed_currency: detectCurrency(page.text),
    observed_language: detectLanguage(page.text),
    prices: extractPrices(page.text),
    address_fields: extractAddressFields(page.html),
    validation_errors: extractValidationErrors(page.text),
    shipping_options: extractShippingOptions(page.text),
    tax_or_duty_lines: extractTaxDutyLines(page.text),
    payment_methods: extractPaymentMethods(page.text, page.html),
    legal_notices: extractLegalNotices(page.text),
    captcha_detected: page.captcha_detected === true,
    fetched_at: new Date().toISOString()
  };
}
```

Use deterministic extractors first, then `ai_chat_completion` for ambiguous text such as mixed-language policy blocks or payment method names hidden in rendered checkout copy.

## Supporting Policy Evidence

When checkout behavior is unclear, gather official policy pages:

```ts
async function collectSupportingPolicyEvidence(
  brief: CheckoutBrief,
  observations: CheckoutObservation[]
) {
  const query = `site:${brief.store.domain} shipping tax duties returns payment countries`;

  const serp = await massive.web_search({
    query,
    parse_google_serp: true,
    max_results: 10
  });

  const officialUrls = serp.results
    .filter(result => sameDomain(result.url, brief.store.domain))
    .slice(0, 5)
    .map(result => result.url);

  return Promise.all(
    officialUrls.map(url =>
      massive.web_fetch({
        url,
        render_js: true,
        captcha_handling: true
      })
    )
  );
}
```

Policy evidence should explain contradictions, not override direct checkout observations.

## Issue Classification

```ts
async function classifyCheckoutIssues(
  brief: CheckoutBrief,
  observations: CheckoutObservation[],
  policies: RenderedPage[]
): Promise<CheckoutIssue[]> {
  const deterministic = runRuleChecks(brief, observations);

  const aiReview = await massive.ai_chat_completion({
    model: "fast-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: "Classify ecommerce checkout localization defects. Use only supplied observations and policy evidence. Return reproducible steps and cite evidence IDs."
      },
      {
        role: "user",
        content: JSON.stringify({
          expectations: brief.expectations,
          observations,
          policies: policies.map(page => ({
            url: page.url,
            text: page.text.slice(0, 4000)
          }))
        })
      }
    ]
  });

  return mergeAndDedupeIssues(deterministic, aiReview.issues);
}
```

Rule checks should detect:

- Expected currency missing or inconsistent across product, cart, and checkout.
- Required localized language absent when enabled.
- Valid address fixture rejected.
- Missing shipping quote after a valid address.
- Tax, VAT, GST, duty, or import-fee disclosure absent or unclear.
- Required payment method missing before payment boundary.
- Captcha or bot protection blocking an otherwise reachable flow.
- Country selector unavailable for a target market.

## Report Synthesis

```ts
function synthesizeCheckoutLocalizationReport(
  brief: CheckoutBrief,
  observations: CheckoutObservation[],
  issues: CheckoutIssue[]
): CheckoutLocalizationReport {
  const markets = brief.targets.map(target => {
    const marketObservations = observations.filter(obs =>
      obs.country === target.country &&
      obs.device === target.device &&
      obs.language === target.language
    );
    const marketIssues = issues.filter(issue =>
      issue.country === target.country && issue.device === target.device
    );

    return summarizeMarket(target, marketObservations, marketIssues);
  });

  return {
    store: brief.store,
    summary: summarizeFindings(markets, issues),
    overall_readiness_score: averageScore(markets.map(market => market.readiness_score)),
    markets,
    defects: issues.sort(bySeverityThenCountry)
  };
}
```

## Export Shape

CSV issue rows:

- store_domain
- country
- city
- language
- device
- severity
- category
- checkout_step
- title
- evidence_id
- evidence_url
- recommendation
- confidence

Markdown report sections:

- Executive summary
- Readiness matrix
- Critical and high issues
- Country-by-country findings
- Payment method coverage
- Address validation findings
- Tax, duty, and shipping disclosures
- Evidence appendix

## Implementation Notes

- Keep stepper actions idempotent where possible; checkout flows often rerender cart drawers and forms.
- Deduplicate observations by market, step, URL, and visible checkout state.
- Store raw rendered text excerpts and screenshots separately from normalized findings.
- Treat unsupported country messages as valid evidence, not crawl failures.
- Never click final submit, pay, place order, authorize, or complete purchase controls.
