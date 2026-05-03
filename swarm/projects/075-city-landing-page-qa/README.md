# City Landing Page QA

City Landing Page QA audits location-specific landing pages across city, country, and device targets to catch thin localization, mismatched SERP intent, broken dynamic content, inconsistent offers, and missing local proof before programmatic SEO pages go live.

The first version is intentionally narrow: given one site, one landing-page template, and a list of city URLs or slugs, it renders each page from the target location, compares on-page content to local search evidence, and produces a source-backed QA report.

## Target User

Primary users:

- Growth teams launching city-by-city service, marketplace, or SaaS landing pages.
- SEO leads validating that programmatic local pages are distinct enough to index.
- Content teams checking whether city copy, FAQs, proof, and schema match local intent.
- Agencies auditing large local landing-page portfolios for clients.
- Founders testing whether a city expansion page set is ready before publishing at scale.

## Core Workflow

1. User defines a city landing-page QA brief:
   - Site, template pattern, and city URLs or URL rules
   - Target countries, cities, languages, and devices
   - Expected local modules, offers, proof, service availability, and schema
   - Competitors, exclusions, and brand or claim rules
2. App checks `account_status` and estimates credits for the city-device matrix.
3. Massive MCP runs:
   - `web_fetch` with JavaScript rendering for each landing page from the requested city, country, and device
   - Captcha handling when programmatic pages, CDNs, or geo gates interrupt collection
   - `web_search` with Google SERP parsing for local intent, competitor city pages, maps/local-pack signals, and People Also Ask questions
   - `ai_chat_completion` to classify defects, compare page evidence with SERP intent, and write source-backed recommendations
4. App normalizes page text, headings, CTAs, local entities, offers, reviews, schema, canonical tags, internal links, and SERP evidence.
5. App scores each city page for localization quality, technical readiness, intent match, content distinctiveness, and evidence support.
6. User receives a city-by-city QA report with defects, recommended fixes, reproducible evidence, and JSON/CSV/Markdown exports.

## MVP Inputs

```json
{
  "site": {
    "name": "Atlas Home Services",
    "domain": "atlashomeservices.example",
    "template": "city service pages"
  },
  "pages": [
    {
      "city": "Austin",
      "region": "TX",
      "country": "us",
      "url": "https://atlashomeservices.example/tx/austin/plumbing"
    },
    {
      "city": "Denver",
      "region": "CO",
      "country": "us",
      "url": "https://atlashomeservices.example/co/denver/plumbing"
    }
  ],
  "targets": [
    {
      "country": "us",
      "city": "Austin",
      "device": "mobile",
      "language": "en-US"
    }
  ],
  "expectations": {
    "service": "emergency plumbing",
    "require_local_phone": true,
    "require_city_specific_copy": true,
    "require_local_schema": true,
    "require_unique_faqs": true,
    "require_service_availability": true
  },
  "competitors": ["Roto-Rooter", "Benjamin Franklin Plumbing"],
  "exclude_claims": ["guaranteed fastest", "#1 plumber"]
}
```

## MVP Output

```json
{
  "site": "Atlas Home Services",
  "summary": "Austin is publishable with minor FAQ and schema fixes. Denver should be held because the page renders Austin phone numbers, repeats identical neighborhood copy, and SERPs show emergency intent that the page does not answer.",
  "overall_readiness_score": 68,
  "pages": [
    {
      "city": "Denver",
      "region": "CO",
      "country": "us",
      "url": "https://atlashomeservices.example/co/denver/plumbing",
      "device": "mobile",
      "readiness_score": 42,
      "status": "hold",
      "intent_match_score": 51,
      "localization_score": 38,
      "technical_score": 74,
      "distinctiveness_score": 31,
      "issues": [
        {
          "severity": "critical",
          "category": "localization",
          "title": "Denver page displays Austin phone number",
          "evidence_id": "fetch_denver_mobile_001",
          "recommendation": "Render the Denver service number and validate phone replacement across mobile and desktop city targets."
        }
      ],
      "serp_patterns": [
        {
          "pattern": "Top local results emphasize 24/7 emergency plumbing and same-day availability.",
          "queries": ["emergency plumber Denver"],
          "source_urls": ["https://example.com/denver-emergency-plumber"]
        }
      ],
      "confidence": "high"
    }
  ]
}
```

## QA Dimensions

Each observation preserves:

- City, region, country, language, device, URL, and collection timestamp.
- Rendered title, meta description, H1, headings, primary CTA, phone number, form state, and visible local claims.
- Local proof such as reviews, case studies, neighborhoods, office addresses, service areas, availability, and certifications.
- Technical signals including status code, canonical, robots directives, hreflang, structured data, internal links, and duplicate-title patterns.
- SERP evidence with query, rank, result type, snippet, URL, domain, target geography, and device.
- AI-generated recommendations clearly separated from sourced facts.

## Scoring

City page readiness scores are 0-100:

- 20 points: page renders correctly from the target city and device.
- 20 points: city-specific content, phone, offer, availability, and proof are correct.
- 15 points: local SERP intent is reflected in headings, FAQs, CTA, and page modules.
- 15 points: copy is meaningfully distinct from sibling city pages.
- 10 points: local schema, canonical, internal links, metadata, and indexability are valid.
- 10 points: competitor and SERP evidence supports the recommended fixes.
- 10 points: source coverage, freshness, and reproducibility.

Automatic caps:

- Cap at 70 when SERP evidence is thin or only one unique source domain supports the finding.
- Cap at 60 when the city page is technically renderable but mostly template-identical.
- Cap at 50 when local proof, phone number, or service availability is missing.
- Cap at 45 when the page targets the wrong city or region in visible copy.
- Cap at 35 when the page is blocked, noindexed, canonicalized to another city, or unavailable from the target location.

## First Build

Ship as a CLI that writes JSON, CSV, and Markdown:

```bash
city-landing-qa run \
  --brief city-qa-brief.json \
  --out city-qa-report.json \
  --csv city-qa-issues.csv \
  --report-md city-qa-report.md
```

Minimum viable UI after CLI validation:

- Site and template setup form
- City URL import and validation
- Country, city, language, and device target matrix
- Credit estimate preview
- Run status by city and stage
- Readiness matrix by city
- Issue table by severity, category, and template component
- Evidence drawer with rendered page text, SERP result lineage, and extracted schema
- Export buttons for JSON, CSV, and Markdown

## Massive MCP Usage

- `account_status`: preflight credits before city and device batch runs.
- `web_fetch`: render city landing pages with JavaScript, capture visible content, schema, canonical tags, links, forms, and localized modules.
- Country, city, and device targeting: verify that location-aware content changes correctly for each city and mobile or desktop experience.
- Captcha handling: continue QA when CDN, WAF, or bot protection challenges appear.
- `web_search`: collect local SERPs, competitor city pages, local packs, directories, and FAQ questions.
- Google SERP parsing: preserve rank, snippet, result type, local-pack signals, query, geography, and device metadata.
- `ai_chat_completion`: classify defects, compare SERP intent with page content, detect template duplication, score readiness, and write recommendations with source lineage.

## Guardrails

- Treat SERP results as intent and competitive evidence, not search-volume estimates.
- Keep every issue tied to fetch evidence, SERP evidence, or explicit user expectations.
- Separate observed page facts from AI-generated recommendations.
- Do not invent local reviews, office addresses, certifications, rankings, or service availability.
- Flag duplicate or thin city pages instead of polishing them into publishable recommendations.
- Preserve city, country, language, and device on every observation.
- Avoid collecting personal data from forms, reviews, or local directories.
