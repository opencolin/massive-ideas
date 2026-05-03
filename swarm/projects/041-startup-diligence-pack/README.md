# Startup Diligence Pack Generator

Startup Diligence Pack Generator turns a company URL, deck notes, or short investment memo into a sourced first-pass diligence packet. It gathers public evidence about the startup, market, customers, competitors, product claims, pricing, hiring, funding signals, and risk areas, then produces an investor-ready brief with citations and confidence levels.

The first version is designed for pre-meeting and post-intro diligence, where speed matters but every claim still needs a source trail. It is not a replacement for legal, financial, technical, or customer diligence.

## Target User

Primary users:

- Angel investors and seed funds screening inbound opportunities.
- Accelerators preparing partner meeting notes.
- Corporate development teams doing early market scans.
- Founders benchmarking competitors before fundraising.
- Operators asked to produce quick diligence memos on unfamiliar categories.

## Core Workflow

1. User enters a startup brief:
   - Company name and URL
   - Optional deck notes or memo text
   - Target geography
   - Product category
   - Known competitors
   - Diligence focus areas
2. App estimates run cost with `account_status`.
3. App builds query plans for company background, founder/team signals, product pages, pricing, customers, competitors, market language, hiring, funding mentions, reviews, and risk queries.
4. Massive MCP runs:
   - `web_search` with Google SERP parsing for broad discovery and ranked result evidence
   - country, city, and device targeting for localized startup, competitor, customer, and regulatory signals
   - `web_fetch` with JS rendering for company sites, docs, pricing pages, directories, review sites, and job pages
   - captcha handling for pages that block simple fetches
   - `ai_chat_completion` to classify claims, extract evidence, compare competitors, and synthesize a memo with sourced caveats
5. App deduplicates domains, organizations, people, job posts, reviews, and source claims.
6. App scores each diligence section by evidence quality, freshness, and coverage.
7. User receives a diligence pack with source-backed findings, open questions, risks, and next diligence steps.

## MVP Inputs

```json
{
  "company": {
    "name": "Acme Voice AI",
    "url": "https://example.com",
    "category": "AI voice agents for home services",
    "geo": {
      "country": "us",
      "city": "San Francisco",
      "device": "desktop"
    }
  },
  "known_competitors": ["Competitor One", "Competitor Two"],
  "memo_notes": "Claims 40% lower missed-call rate and early traction with HVAC contractors.",
  "focus_areas": ["market", "competition", "traction", "pricing", "hiring", "risks"],
  "exclude": ["consumer voice assistants", "generic call center outsourcing"]
}
```

## MVP Output

```json
{
  "company": "Acme Voice AI",
  "summary": "Acme Voice AI appears to sell AI phone agents to home-service businesses. Public evidence supports a clear category and competitor set, but traction claims require direct validation because customer references are thin.",
  "confidence": "medium",
  "sections": [
    {
      "name": "Company snapshot",
      "confidence": "high",
      "findings": [
        {
          "claim": "The company positions around AI phone agents for home-service operators.",
          "evidence": [
            {
              "source_url": "https://example.com",
              "source_type": "fetched_page",
              "query": "Acme Voice AI home services",
              "rank": 1
            }
          ]
        }
      ]
    },
    {
      "name": "Competition",
      "confidence": "medium",
      "findings": [
        {
          "claim": "SERP and category pages indicate several adjacent AI receptionist and answering-service competitors.",
          "evidence": [
            {
              "source_url": "https://example.com/competitors",
              "source_type": "serp_result",
              "query": "AI phone agent HVAC contractors",
              "rank": 3
            }
          ]
        }
      ]
    }
  ],
  "risks": [
    {
      "risk": "Traction claims are not publicly verifiable.",
      "severity": "high",
      "next_step": "Ask for customer cohort data, churn, activation rate, and reference calls."
    }
  ],
  "open_questions": [
    "Which customer segment has the strongest retention?",
    "How much of the product is proprietary AI workflow versus telephony integration?"
  ]
}
```

## Diligence Sections

The MVP pack includes:

- Company snapshot: positioning, category, website claims, launch/funding mentions, and public contact signals.
- Product and customer: use cases, target users, named customers, testimonials, case studies, reviews, and product documentation.
- Market: category language, demand signals, buyer pain, geography, and search-intent evidence.
- Competition: direct competitors, substitutes, pricing pages, feature comparisons, and positioning differences.
- Traction proxies: customer logos, review volume, job posts, community mentions, search visibility, founder announcements, and public integrations.
- Team and hiring: founder bios, hiring velocity, role mix, seniority, and functional gaps.
- Business model: pricing evidence, packaging, likely ACV, implementation burden, and sales motion.
- Risks and diligence questions: unsupported claims, market ambiguity, regulatory exposure, customer concentration, technical risk, and source gaps.

## Massive MCP Usage

- `account_status`: estimate available credits before each diligence run.
- `web_search`: discover public sources, competitors, customers, funding mentions, reviews, and risk queries with Google SERP parsing.
- Google SERP parsing: preserve query, rank, title, snippet, URL, result type, and visible dates for every evidence item.
- `web_fetch`: fetch company sites, docs, pricing, blogs, job pages, directories, review pages, investor announcements, and competitor pages with JS rendering.
- Captcha handling: recover pages from directories, review sites, and job boards when normal fetches fail.
- Country, city, and device targeting: compare local market exposure, mobile search surfaces, and geo-specific competitors.
- `ai_chat_completion`: classify diligence evidence, extract structured claims, generate risk questions, and synthesize the final pack with citations.

## Guardrails

- Label every section by confidence and evidence coverage.
- Do not present unverified traction, revenue, funding, or customer claims as facts.
- Preserve raw query, rank, URL, fetch timestamp, and source type for every material claim.
- Separate evidence from inference and make inference language explicit.
- Never scrape gated private data, personal contact data, or sites disallowed by policy.
- Treat chatbot answers as leads unless they include sources that are fetched or independently confirmed.
- Surface gaps and next diligence questions instead of hiding weak evidence.
