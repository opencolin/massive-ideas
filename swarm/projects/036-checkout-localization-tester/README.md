# Checkout Localization Tester

Checkout Localization Tester audits ecommerce checkout flows across 195+ countries to catch broken currency, tax, shipping, language, payment, consent, and address-format behavior before international shoppers find it.

The first version is intentionally narrow: given a storefront, product URL, and country matrix, it walks the cart and checkout until the payment boundary, records localized behavior, and produces an evidence-backed issue report.

## Target User

Primary users:

- Ecommerce growth teams launching into new international markets.
- QA teams responsible for multi-country checkout reliability.
- Localization managers validating language, currency, and regional content.
- Payments teams checking payment method availability by country and device.
- Agencies auditing cross-border storefront readiness for Shopify, WooCommerce, Magento, and custom stores.

## Core Workflow

1. User defines a checkout test brief:
   - Storefront URL and one or more product URLs
   - Countries, cities, languages, and devices to test
   - Expected currencies, tax behavior, shipping destinations, and payment methods
   - Address fixtures for each country or region
   - Stop point, such as payment page, payment-provider redirect, or order-review page
2. App checks `account_status` and estimates credits for the country-device matrix.
3. Massive MCP runs:
   - `web_fetch` with JS rendering for storefront, product, cart, checkout, and payment-boundary pages
   - Country, city, and device targeting to simulate local checkout sessions
   - Captcha handling when storefront protections or payment-provider interstitials appear
   - `web_search` to verify country-specific shipping, returns, tax, or payment policy pages when the checkout contradicts expectations
   - `ai_chat_completion` to classify localization defects and produce source-backed recommendations
4. App normalizes visible prices, currencies, language, address fields, shipping options, tax lines, payment methods, legal notices, and consent controls.
5. App scores each market on checkout readiness and issue severity.
6. User receives a country-by-country report with screenshots or fetch evidence, structured defects, reproducible steps, and JSON/CSV/Markdown exports.

## MVP Inputs

```json
{
  "store": {
    "name": "Northstar Gear",
    "domain": "northstargear.example",
    "homepage_url": "https://northstargear.example"
  },
  "products": [
    {
      "url": "https://northstargear.example/products/travel-pack",
      "sku": "TRAVEL-PACK-BLACK",
      "quantity": 1
    }
  ],
  "targets": [
    {
      "country": "de",
      "city": "Berlin",
      "language": "de-DE",
      "device": "desktop",
      "expected_currency": "EUR",
      "address_fixture_id": "de_berlin_standard"
    },
    {
      "country": "br",
      "city": "Sao Paulo",
      "language": "pt-BR",
      "device": "mobile",
      "expected_currency": "BRL",
      "address_fixture_id": "br_sp_standard"
    }
  ],
  "expectations": {
    "stop_before_payment_submission": true,
    "required_payment_methods": ["card"],
    "optional_payment_methods": ["paypal", "apple_pay", "klarna", "pix"],
    "require_localized_language": true,
    "require_local_currency": true,
    "require_shipping_quote": true,
    "require_tax_or_duty_disclosure": true
  },
  "address_fixtures": {
    "de_berlin_standard": {
      "first_name": "Alex",
      "last_name": "Tester",
      "address1": "Invalidenstrasse 117",
      "city": "Berlin",
      "postal_code": "10115",
      "country": "Germany",
      "phone": "+493012345678"
    },
    "br_sp_standard": {
      "first_name": "Alex",
      "last_name": "Tester",
      "address1": "Avenida Paulista 1000",
      "city": "Sao Paulo",
      "region": "SP",
      "postal_code": "01310-100",
      "country": "Brazil",
      "phone": "+5511999999999"
    }
  }
}
```

## MVP Output

```json
{
  "store": {
    "name": "Northstar Gear",
    "domain": "northstargear.example"
  },
  "summary": "Checkout is ready in Germany on desktop but blocked in Brazil on mobile because BRL pricing is not shown, postal-code validation rejects a valid Sao Paulo CEP, and Pix is absent despite being configured as expected.",
  "overall_readiness_score": 72,
  "markets": [
    {
      "country": "br",
      "city": "Sao Paulo",
      "language": "pt-BR",
      "device": "mobile",
      "readiness_score": 41,
      "status": "blocked",
      "observed_currency": "USD",
      "observed_language": "en-US",
      "shipping_quote_available": false,
      "tax_or_duty_disclosure": "absent",
      "payment_methods": ["card", "paypal"],
      "issues": [
        {
          "severity": "critical",
          "category": "address_validation",
          "title": "Valid Brazilian postal code rejected",
          "repro_steps": [
            "Open product page from Sao Paulo mobile target",
            "Add Travel Pack to cart",
            "Enter Sao Paulo shipping address with CEP 01310-100"
          ],
          "evidence_id": "obs_br_mobile_checkout_address_003",
          "recommendation": "Update Brazilian postal-code validation to accept 8-digit CEP with optional hyphen."
        }
      ]
    }
  ],
  "defects": [
    {
      "country": "br",
      "device": "mobile",
      "severity": "critical",
      "category": "address_validation",
      "evidence_url": "https://northstargear.example/checkouts/example",
      "confidence": "high"
    }
  ]
}
```

## Test Dimensions

Each observation preserves:

- Country, city, language, device, and collection timestamp.
- Product URL, cart contents, quantity, price, currency, discount, tax, duties, and shipping lines.
- Address fields shown, required fields, validation errors, and accepted fixture values.
- Checkout step reached, redirect destinations, captcha events, and payment boundary.
- Payment methods shown or missing, including wallet, bank-transfer, BNPL, and local methods.
- Legal notices, consent controls, privacy links, return policy links, and localized copy.
- Source URL, rendered-page text, screenshot or HTML evidence, and confidence label.

## Scoring

Readiness scores are 0-100:

- 20 points: product, cart, and checkout pages render successfully for the target country and device.
- 15 points: expected language and local currency are visible and consistent.
- 15 points: valid local address fixture is accepted with correct regional fields.
- 15 points: shipping quote is available and country restrictions are clearly disclosed.
- 10 points: taxes, duties, VAT, GST, or import fees are shown or explained.
- 10 points: expected payment methods are present before the payment boundary.
- 10 points: legal, consent, privacy, and returns content is localized or jurisdiction-aware.
- 5 points: evidence completeness and reproducibility.

Automatic caps:

- Cap at 70 when the checkout cannot reach a shipping quote.
- Cap at 60 when the country is not clearly supported but the site accepts the address.
- Cap at 50 when prices remain in a non-local currency despite a local target.
- Cap at 40 when a valid address fixture is rejected.
- Cap at 30 when the flow is blocked before cart or checkout.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
checkout-localization-tester run \
  --brief checkout-brief.json \
  --out checkout-localization-report.json \
  --csv checkout-localization-issues.csv \
  --report-md checkout-localization-report.md
```

Minimum viable UI after CLI validation:

- Store and product setup form
- Country, city, language, and device matrix editor
- Address fixture manager
- Expected currency, shipping, tax, and payment method controls
- Credit estimate preview
- Run status by market and checkout step
- Country readiness matrix
- Issue table by severity and category
- Evidence drawer with rendered page text and screenshots
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: estimate and confirm available credits before large country-device runs.
- `web_fetch`: render storefront, product, cart, checkout, policy, and payment-boundary pages with JavaScript enabled.
- Country, city, and device targeting: simulate localized checkout behavior across 195+ countries and mobile/desktop contexts.
- Captcha handling: keep test collection resilient when bot protection, login, or payment-provider interstitials appear.
- `web_search`: verify public shipping, tax, returns, payment, and country availability pages when checkout evidence is ambiguous.
- Google SERP parsing: discover official localized policy pages or help-center pages for the same store domain.
- `ai_chat_completion`: classify defects, compare observed behavior to expectations, generate reproducible steps, and summarize recommendations with sources.

## Guardrails

- Stop before payment submission and never place real orders.
- Use test addresses and fixture data only.
- Do not collect or store real personal payment details.
- Mark captcha, bot protection, account login, and unavailable-country blocks separately.
- Keep country, city, language, and device observations separate.
- Preserve source evidence for every defect claim.
- Do not infer legal compliance; report observed checkout and policy behavior only.
- Avoid bypassing access controls, gated accounts, or private customer data.
