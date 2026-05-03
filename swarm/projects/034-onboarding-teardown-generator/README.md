# Onboarding Teardown Generator

Onboarding Teardown Generator audits a SaaS product's public signup, activation, and first-session experience. It turns a target domain plus persona into a structured teardown covering friction, clarity, time-to-value, trust signals, competitive patterns, and prioritized experiments.

The first version is intentionally scoped to web-based SaaS onboarding paths that can be inspected from public pages, free trials, ungated product tours, documentation, help centers, and search results. It does not attempt to bypass private accounts, payment gates, or access controls.

## Target User

Primary users:

- Growth teams improving signup-to-activation conversion.
- Product marketers comparing onboarding promises against the in-product first impression.
- SaaS founders looking for fast teardown-style feedback before experiments.
- Agencies producing onboarding audits for clients.
- Customer success teams identifying expectation gaps between acquisition pages and first-use guidance.

## Core Workflow

1. User submits a teardown brief:
   - Target SaaS brand, domain, and optional signup URL
   - Persona, company size, use case, and job-to-be-done
   - Country, city, and device profile
   - Known competitors or category terms
   - Optional evaluation focus such as activation, trial conversion, or self-serve clarity
2. App checks run feasibility with `account_status`.
3. App uses `web_search` with Google SERP parsing to collect acquisition pages, category pages, competitor signup pages, help docs, reviews, and chatbot-visible source patterns.
4. App uses `web_fetch` with JS rendering and captcha handling to fetch signup pages, pricing pages, onboarding docs, product tours, template galleries, and relevant competitor flows.
5. App uses `ai_chat_completion` to extract onboarding promises, required steps, friction points, activation cues, trust signals, objections, and competitive norms.
6. App generates a teardown with scores, evidence, screenshots or fetched-source references, issue severity, and experiment recommendations.
7. User receives Markdown, JSON, and CSV exports for sharing with product, growth, and design teams.

## MVP Inputs

```json
{
  "target": {
    "brand": "ExampleCRM",
    "domain": "examplecrm.com",
    "signup_url": "https://www.examplecrm.com/signup"
  },
  "persona": {
    "role": "Head of Sales",
    "company_size": "25-100 employees",
    "use_case": "replace spreadsheet pipeline tracking",
    "experience_level": "non-technical buyer"
  },
  "geo": {
    "country": "us",
    "city": "Austin",
    "device": "desktop"
  },
  "category_queries": [
    "sales CRM free trial",
    "CRM for small sales teams",
    "pipeline management software"
  ],
  "competitors": [
    { "name": "HubSpot", "domain": "hubspot.com" },
    { "name": "Pipedrive", "domain": "pipedrive.com" }
  ],
  "focus_areas": ["signup_friction", "activation_clarity", "trust"],
  "max_serp_results_per_query": 8,
  "max_fetches": 35
}
```

## MVP Output

```json
{
  "target": {
    "brand": "ExampleCRM",
    "domain": "examplecrm.com",
    "signup_url": "https://www.examplecrm.com/signup"
  },
  "summary": "ExampleCRM makes the trial easy to start, but the path delays persona-specific value until after account creation. The strongest opportunity is replacing generic signup copy with a pipeline setup promise and reducing uncertainty around setup effort.",
  "overall_score": 71,
  "risk_level": "medium",
  "scores": {
    "message_match": 74,
    "signup_friction": 82,
    "activation_clarity": 58,
    "trust_and_risk_reversal": 69,
    "competitive_differentiation": 63
  },
  "teardown_findings": [
    {
      "finding_type": "activation_clarity_gap",
      "severity": "high",
      "stage": "signup_page",
      "what_happened": "The page explains CRM benefits but does not tell a sales leader what they will accomplish in the first 10 minutes.",
      "why_it_matters": "For a spreadsheet-replacement use case, uncertainty about setup effort is a major activation risk.",
      "evidence": [
        {
          "source_type": "fetched_page",
          "source_url": "https://www.examplecrm.com/signup",
          "observed_fact": "Signup page headline says 'Start your free trial' and the supporting copy lists broad CRM benefits without a first-session outcome."
        }
      ],
      "recommendation": "Add a first-session promise such as 'Import a pipeline and see stalled deals in 10 minutes' near the form."
    }
  ],
  "competitive_patterns": [
    {
      "pattern": "Competitors preview the first setup task before form submission.",
      "frequency": 3,
      "example_urls": ["https://example-competitor.com/signup"]
    }
  ],
  "experiment_backlog": [
    {
      "priority": 1,
      "hypothesis": "Showing a persona-specific setup outcome before signup will increase trial starts and first-session completion.",
      "change": "Replace generic trial copy with a role-specific activation promise and 3-step setup preview.",
      "metric": "signup_to_first_key_action_rate"
    }
  ]
}
```

## Teardown Dimensions

- `message_match`: acquisition promise, signup copy, persona, and first-session expectations align.
- `signup_friction`: fields, social auth, password rules, SSO prompts, captcha, trial terms, and perceived commitment.
- `activation_clarity`: user understands what to do first and why it matters.
- `time_to_value`: path highlights a concrete first win before asking for heavy setup.
- `trust_and_risk_reversal`: pricing, data safety, cancellation, integrations, and support expectations are clear.
- `competitive_differentiation`: flow avoids category-generic language and explains why this product is different.
- `source_consistency`: SERP snippets, reviews, help docs, and chatbot answers reinforce rather than contradict onboarding promises.

## Scoring

Overall scores are 0-100:

- 20 points: persona and use-case fit.
- 15 points: low signup friction.
- 20 points: clear first-session action and time-to-value.
- 15 points: trust, pricing, data, and commitment clarity.
- 15 points: competitive differentiation against category norms.
- 10 points: evidence quality across fetched pages, SERPs, and chatbot-style source answers.
- 5 points: mobile or device-specific experience quality.

Automatic caps:

- Cap at 75 when no signup or onboarding entry page can be fetched.
- Cap at 70 when fewer than three relevant competitor flows are collected.
- Cap at 65 when JS-rendered signup content fails to load.
- Cap at 60 when the app cannot verify trial terms, pricing expectations, or account requirements.
- Cap at 55 when the teardown has low evidence and depends mostly on SERP snippets.

## First Build

Ship as a CLI that writes JSON, Markdown, and CSV:

```bash
onboarding-teardown-generator run \
  --brief teardown-brief.json \
  --out teardown-report.json \
  --report-md teardown-report.md \
  --findings-csv teardown-findings.csv \
  --sources-csv teardown-sources.csv
```

Minimum viable UI after CLI validation:

- Brief setup form
- Persona and use-case editor
- Target and competitor source preview
- Credit estimate before collection
- Scorecard by teardown dimension
- Stage-by-stage findings table
- Evidence drawer for each finding
- Competitive pattern summary
- Experiment backlog
- Export buttons for JSON, Markdown, and CSV

## Massive MCP Usage

- `account_status`: estimate credits before SERP, fetch, and AI analysis work.
- `web_search`: collect category SERPs, signup pages, reviews, docs, and competitor entry points.
- Google SERP parsing: preserve rank, URL, title, snippet, result type, query, country, city, and device.
- Country, city, and device targeting: audit the experience from the buyer context the team cares about.
- `web_fetch`: inspect target pages, competitor pages, help docs, pricing pages, product tours, and public onboarding resources.
- JS rendering: capture client-rendered signup forms, pricing widgets, product tours, and dynamic comparison modules.
- Captcha handling: record friction and public accessibility constraints without bypassing private areas.
- `ai_chat_completion`: extract onboarding stages, friction, messaging, trust signals, competitive patterns, chatbot answers with sources, and experiment recommendations.
