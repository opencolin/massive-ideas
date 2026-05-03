# Signup Flow Auditor

Signup Flow Auditor compares competitor signup, trial, demo, and onboarding paths so product, growth, and sales teams can see where rival flows reduce friction, ask better qualifying questions, expose pricing, or route users into activation faster.

The first version is intentionally narrow: audit one target company against a short competitor set across one country, city, and device profile at a time.

## Target User

Primary users:

- PLG growth teams improving trial-to-activation conversion.
- Product marketers comparing competitor packaging and signup promises.
- Sales-led SaaS teams studying demo request, lead capture, and qualification flows.
- Founders validating whether their onboarding path feels heavier than category norms.
- Agencies producing source-backed conversion audits for SaaS clients.

## Core Workflow

1. User defines an audit brief:
   - Target brand, domain, and signup URLs
   - Competitor domains and suspected signup entry points
   - Country, city, device, and optional persona
   - Flow types to audit, such as free trial, freemium, demo request, quote request, or waitlist
   - Test identity constraints and excluded actions
   - Maximum search, fetch, and AI budget
2. App checks `account_status` to estimate whether the run fits available credits.
3. App discovers signup entry points with `web_search`, Google SERP parsing, and targeted site queries.
4. Massive MCP runs:
   - `web_fetch` with JS rendering for signup, pricing, product, demo, docs, and onboarding pages
   - country, city, and device targeting to capture localized forms, pricing, cookie banners, and mobile layouts
   - captcha handling for public signup pages that challenge automated access
   - `web_search` to find third-party references to trial limits, gated steps, and plan requirements
   - `ai_chat_completion` to classify page intent, extract required fields, summarize friction, and produce source-backed recommendations
5. App normalizes entry points, steps, required fields, account requirements, proof points, pricing visibility, and conversion blockers.
6. App scores each company and flow type against comparable competitors.
7. User receives a prioritized signup-flow audit with screenshots or source URLs where available, evidence-backed recommendations, and exportable JSON, Markdown, and CSV.

## MVP Inputs

```json
{
  "target": {
    "brand": "ExampleCRM",
    "domain": "examplecrm.com",
    "entry_points": ["https://www.examplecrm.com/signup", "https://www.examplecrm.com/demo"]
  },
  "geo": {
    "country": "us",
    "city": "San Francisco",
    "device": "desktop"
  },
  "persona": {
    "role": "VP Sales",
    "company_size": "51-200",
    "use_case": "pipeline management"
  },
  "flow_types": ["free_trial", "demo_request"],
  "competitors": [
    { "name": "HubSpot", "domain": "hubspot.com" },
    { "name": "Pipedrive", "domain": "pipedrive.com" },
    { "name": "Zoho CRM", "domain": "zoho.com" }
  ],
  "excluded_actions": [
    "submit forms with real personal data",
    "create paid accounts",
    "accept legal agreements on behalf of the user"
  ],
  "max_searches": 20,
  "max_fetches": 80
}
```

## MVP Output

```json
{
  "target": {
    "brand": "ExampleCRM",
    "domain": "examplecrm.com"
  },
  "summary": "ExampleCRM asks for more required fields than two direct competitors and hides plan constraints until after the signup CTA. Competitors expose trial duration and route low-friction users into product sooner.",
  "audit_score": 61,
  "flow_comparisons": [
    {
      "company": "ExampleCRM",
      "domain": "examplecrm.com",
      "flow_type": "free_trial",
      "entry_url": "https://www.examplecrm.com/signup",
      "estimated_steps": 4,
      "required_fields": ["email", "name", "company", "phone", "company_size"],
      "credit_card_required": false,
      "pricing_visible_before_signup": false,
      "trial_terms_visible": false,
      "sso_visible": true,
      "mobile_blockers": []
    }
  ],
  "gaps": [
    {
      "gap_type": "excessive_field_friction",
      "severity": "high",
      "why_it_matters": "The target asks for phone and company size before account creation while two competitors only require email to start.",
      "recommended_action": "Test an email-first signup path and defer firmographic qualification until activation or sales routing.",
      "evidence": [
        {
          "source_type": "fetched_page",
          "source_url": "https://www.examplecrm.com/signup",
          "observed_fact": "Signup form includes five required fields before account creation."
        },
        {
          "source_type": "fetched_page",
          "source_url": "https://www.pipedrive.com/en/register",
          "observed_fact": "Competitor signup asks for email first and displays trial length near the CTA."
        }
      ]
    }
  ],
  "competitor_advantages": [
    {
      "domain": "pipedrive.com",
      "advantage": "Email-first free trial with visible trial duration and no credit card message above the fold.",
      "source_urls": ["https://www.pipedrive.com/en/register"]
    }
  ],
  "recommended_experiments": [
    {
      "priority": 1,
      "experiment": "Email-first signup",
      "hypothesis": "Reducing pre-account required fields will increase trial starts without reducing qualified activation.",
      "metrics": ["signup_start_rate", "account_created_rate", "activated_trial_rate", "sales_qualified_trial_rate"]
    }
  ]
}
```

## Gap Types

Gap cards use a fixed taxonomy:

- `missing_entry_point`: signup or demo path is hard to find from search, home, pricing, or product pages.
- `excessive_field_friction`: target requires more fields than comparable competitor flows.
- `unclear_commitment`: credit card, contract, trial length, cancellation, or sales-contact expectations are hidden.
- `pricing_visibility_gap`: competitors disclose plan or trial information earlier in the flow.
- `persona_mismatch`: form questions, copy, or routing do not match the configured persona.
- `mobile_friction`: mobile layout, overlays, field sizing, or page weight impairs completion.
- `localization_gap`: country or city targeting changes currency, compliance, language, or availability in a weaker way than competitors.
- `trust_gap`: competitors surface security, integrations, proof, or privacy assurances closer to conversion.
- `activation_delay`: competitors get users into a useful product state in fewer observed steps.
- `ai_answer_gap`: chatbot answers recommend competitor signup paths or cite third-party claims that make the target look harder to try.

## Scoring

Audit scores are 0-100:

- 20 points: signup entry point discoverability from search and public site pages.
- 20 points: form and step friction relative to competitor median.
- 15 points: clarity of commitment, pricing, trial limits, and credit card requirements.
- 15 points: persona fit and routing relevance.
- 10 points: mobile and localized experience quality.
- 10 points: trust signals near conversion.
- 5 points: activation speed after initial account creation or demo request.
- 5 points: evidence quality and fetch completeness.

Automatic caps:

- Cap at 70 when the flow cannot be observed beyond the first public form.
- Cap at 65 when fewer than two competitors have comparable public flows.
- Cap at 60 when JS-rendered form content is unavailable for most audited pages.
- Cap at 55 when captcha or bot challenges prevent reliable step counting.
- Cap at 45 when the target signup path cannot be discovered from public pages or search.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
signup-flow-auditor run \
  --brief signup-audit-brief.json \
  --out signup-audit-report.json \
  --report-md signup-audit-report.md \
  --flow-csv signup-flow-comparison.csv \
  --gap-csv signup-flow-gaps.csv
```

Minimum viable UI after CLI validation:

- Audit brief setup form
- Competitor and entry point editor
- Country, city, device, and persona controls
- Credit estimate preview
- Run status by company and flow type
- Flow comparison table
- Gap-prioritized recommendation view
- Evidence drawer for each claim
- Export buttons for JSON, Markdown, and CSV

## Massive MCP Usage

- `account_status`: estimate run cost before collecting public pages and search results.
- `web_search`: discover signup, demo, pricing, trial, and competitor comparison entry points.
- Google SERP parsing: preserve rank, URL, title, snippet, result type, query, country, city, and device for discoverability evidence.
- Country, city, and device targeting: compare localized signup, pricing, forms, compliance copy, and mobile behavior.
- `web_fetch`: fetch public signup, demo, pricing, product, onboarding, help, and comparison pages.
- JS rendering: inspect modern client-rendered forms, plan toggles, modals, cookie banners, and dynamic CTAs.
- Captcha handling: attempt public page access while avoiding private credentials, paid actions, or legal agreement acceptance.
- `ai_chat_completion`: classify flow type, extract required fields and blockers, summarize competitor patterns, generate recommendations, and collect chatbot answers with sources.
