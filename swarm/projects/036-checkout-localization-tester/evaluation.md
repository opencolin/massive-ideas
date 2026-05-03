# Evaluation

Goal: prove Checkout Localization Tester catches real country-specific checkout defects with reproducible evidence faster than manual VPN, browser, and device QA.

## Test Set

Use 40 benchmark checkout runs:

- 8 Shopify stores with international markets enabled.
- 6 WooCommerce or WordPress stores with mixed plugin behavior.
- 5 Magento or Adobe Commerce stores with complex tax and shipping logic.
- 5 custom headless checkouts with JavaScript-heavy flows.
- 5 stores that support local payment methods such as Pix, iDEAL, Bancontact, Klarna, or Konbini.
- 4 stores with known address-format edge cases.
- 4 stores with intentional unsupported-country or blocked-shipping behavior.
- 3 flows with captcha, bot protection, hosted payment redirects, or checkout iframes.

For each benchmark, create human labels:

- Store domain, product URL, and expected checkout stop point.
- Country, city, language, device, and address fixture.
- Expected currency and accepted local address behavior.
- Expected shipping availability or unsupported-country message.
- Expected tax, duty, VAT, GST, or import-fee disclosure behavior.
- Required and optional payment methods.
- Known defects and non-defects.
- Evidence examples that should be ignored, such as ads, upsells, or third-party review widgets.

## Metrics

Primary metrics:

- Critical defect recall: at least 95% of human-labeled checkout blockers should be found.
- Critical defect precision: at least 90% of critical or high issues should be valid after review.
- Address validation accuracy: at least 95% agreement with human review on accepted versus rejected local fixtures.
- Currency accuracy: at least 98% of observed currencies should match rendered checkout evidence.
- Payment method accuracy: at least 90% of required-method presence or absence claims should match human review.
- Evidence validity: 100% of reported issues should include market, step, URL, evidence ID, and reproducible steps.
- Time saved: reduce a 20-country desktop/mobile checkout audit from multiple days to under 90 minutes of review.

Secondary metrics:

- Correct separation of country, city, language, and device observations.
- Correct handling of unsupported countries versus broken checkouts.
- Tax and duty disclosure classification accuracy.
- Captcha and bot-protection detection rate.
- Checkout step completion rate before the payment boundary.
- Credit estimate accuracy versus actual run cost.
- Recommendation usefulness against reviewer scores.

## Manual Review Rubric

Score each report from 1-5:

- Market targeting: Are country, city, language, and device settings visible and kept separate?
- Flow coverage: Did the runner reach the expected safe stop point without placing an order?
- Localization accuracy: Are currency, language, and regional copy observations correct?
- Address handling: Are field requirements and validation errors classified correctly?
- Shipping and tax: Are quote availability and duty/tax disclosures reported with restraint?
- Payment coverage: Are payment methods identified without confusing badges, wallets, or provider logos?
- Evidence quality: Can every issue be traced to rendered checkout evidence?
- Actionability: Are repro steps specific enough for an engineer or QA tester to repeat?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- No real order is placed or payment submitted.
- Every critical issue has high-confidence evidence and repro steps.
- Every country-device pair has a status, score, timestamp, and final reached step.
- Unsupported-country states are reported as intentional or unclear rather than generic failures.

## Automated Checks

Run after every checkout localization report:

- JSON schema validation for the final report.
- All readiness scores must be integers from 0-100.
- Every issue must include severity, category, country, device, evidence ID, recommendation, and confidence.
- Every market must include country, device, status, readiness score, and checkout step coverage.
- Payment submission controls must never be clicked.
- Evidence IDs must resolve to stored observations.
- Currency claims must come from product, cart, checkout, or shipping/tax lines.
- Address validation issues must reference the fixture field that failed.
- Shipping quote claims must distinguish unavailable shipping from missing evidence.
- Policy-page evidence must never replace direct checkout evidence without being labeled as supporting context.
- CSV row counts must reconcile with JSON defects.
- Markdown tables must include enough context to audit market, step, issue, and evidence.

## Failure Modes To Track

- Accidentally proceeding past the safe payment boundary.
- Treating a bot-protection page as a localization defect.
- Counting payment provider logos as available payment methods.
- Confusing display currency with shopper settlement currency.
- Missing locale-specific address fields such as province, prefecture, CPF/CNPJ, county, emirate, or postal-code formats.
- Marking unsupported countries as broken when the message is clear and expected.
- Missing mobile-only checkout defects caused by drawers, sticky buttons, or wallet prompts.
- Combining desktop and mobile observations in one score.
- Letting AI summaries invent tax, duty, or payment claims without observation IDs.
- Overstating legal compliance from visible policy text.

## Golden Examples

Create fixture runs before implementation:

1. Fully localized checkout: local language, currency, shipping, tax disclosure, and payment method all pass.
2. Currency mismatch: product page localizes but checkout reverts to USD.
3. Address rejection: valid local postal code or region field fails validation.
4. Shipping unavailable: target country accepted in selector but no shipping methods appear.
5. Missing local payment method: expected market payment method absent before payment boundary.
6. Unsupported country: clear, localized no-shipping message should be classified as intentional.
7. Mobile divergence: mobile checkout hides required address field or payment method.
8. Captcha block: bot protection prevents reaching checkout and should be reported separately.

Each fixture should include:

- Input checkout brief.
- Address fixture.
- Raw rendered page observations.
- Screenshot or HTML evidence reference.
- Human labels for currency, language, address, shipping, tax, and payment methods.
- Expected issue list.
- Expected readiness score band.
- Disallowed claims.

## Launch Criteria

The MVP is ready for first users when:

- 40-run benchmark completes without unsafe checkout actions.
- Critical defect recall is at least 95%.
- Critical/high issue precision is at least 90%.
- Evidence validity is 100%.
- Currency detection accuracy is at least 98%.
- Address validation accuracy is at least 95%.
- Median review time is under 90 minutes for a 20-country desktop/mobile audit.
- Credit cost is estimated before every run and recorded after completion.
- JSON, CSV, and Markdown exports are readable without manual cleanup.
