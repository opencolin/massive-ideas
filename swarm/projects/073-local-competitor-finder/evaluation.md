# Evaluation

## Success Criteria

Local Competitor Finder is useful when it discovers real public businesses in the requested category and city, extracts source-backed facts, avoids unsupported claims, and produces a directory that saves human research time. Evaluation should measure discovery quality, entity normalization, service extraction, location accuracy, positioning usefulness, and citation coverage.

## Test Corpus

Use a mixed corpus of 120 public local business records across several categories and cities:

- 40 active businesses with official websites and clear city/category matches.
- 20 businesses visible mainly through public directories or review pages.
- 20 seeded duplicates across official sites, directories, articles, and SERP results.
- 15 businesses outside the requested city or service area that should be suppressed or downgraded.
- 10 businesses in adjacent categories that should not be counted as direct competitors.
- 10 stale, closed, moved, or rebranded businesses.
- 5 JavaScript-heavy business websites or directory pages that require rendering.

Keep expected facts in a gold file with public source URLs for business name, website, city, category, services, neighborhood, and any visible review or rating snippet.

## Metrics

| Metric | Target | Notes |
| --- | --- | --- |
| Competitor precision | 85%+ | Included businesses should match the requested category and city. |
| Competitor recall | 70%+ | Known public competitors in the gold set should be discovered. |
| De-duplication accuracy | 90%+ | Duplicate profiles should merge into one business record. |
| City/location accuracy | 90%+ | City, neighborhood, and service-area claims should match source evidence. |
| Service extraction precision | 85%+ | Services listed should be visible in public sources. |
| Citation coverage | 95%+ | Business identity, service, location, and positioning claims should include source URLs. |
| Unsupported claim rate | < 5% | Claims without public evidence should be rejected or marked review-needed. |
| Reviewer usefulness | 75%+ | Human reviewers rate the directory as saving meaningful research time. |

## Gold Labels

Each labeled business should include:

```json
{
  "business_id": "example-mechanical-cleveland",
  "expected_name": "Example Mechanical",
  "expected_website_url": "https://www.examplemechanical.com",
  "expected_category_match": true,
  "expected_city": "Cleveland, Ohio",
  "expected_neighborhood": "Downtown Cleveland",
  "expected_services": ["commercial HVAC", "maintenance contracts", "emergency repair"],
  "expected_public_review_signal": {
    "rating": "4.7",
    "source_url": "https://www.google.com/search?q=example+mechanical+cleveland"
  },
  "source_urls": [
    "https://www.examplemechanical.com",
    "https://www.examplemechanical.com/services",
    "https://www.examplemechanical.com/contact"
  ],
  "should_include": true
}
```

## Evaluation Runs

1. SERP-only discovery: use `web_search` and Google SERP parsing to identify candidates from localized public results.
2. Rendered verification: add `web_fetch` with JavaScript rendering for official sites and public profiles.
3. Service extraction: add AI extraction of services, location, neighborhood, and business category.
4. Source-backed summarization: add claim-level citation checks and reject unsupported positioning or review claims.
5. Geo/device comparison: rerun selected categories with city targeting and desktop/mobile profiles to measure local result drift.

Compare each run against the gold labels and record improvements in competitor precision, recall, duplicate handling, and reviewer usefulness.

## Human Review Rubric

Reviewers score each business record from 1 to 5:

- 5: Clear direct competitor, source-backed, useful for immediate market research.
- 4: Likely competitor with minor facts to verify.
- 3: Useful lead or adjacent competitor, but evidence is incomplete.
- 2: Weak match, ambiguous location, stale profile, or low usefulness.
- 1: Incorrect, duplicate, unsupported, or outside scope.

A business is accepted when it scores 4 or 5. A review-needed record is accepted when it scores 3 or higher and is clearly labeled.

## Failure Modes To Track

- SERP result points to a directory page but the AI treats the directory as the official business website.
- Multiple locations of a chain are merged incorrectly or split unnecessarily.
- A nearby suburb, metro area, or service area is overstated as the target city.
- Adjacent categories are counted as direct competitors because they share a service term.
- Review snippets are treated as complete review analysis instead of partial public signals.
- Positioning summaries invent differentiators not supported by visible website copy.
- Closed, moved, rebranded, or inactive businesses remain in the ranked competitor list.
- JavaScript-heavy sites render incomplete pages, causing missing service or location evidence.

## Acceptance Gate

The prototype is ready for pilot use when:

- Competitor precision reaches at least 85% on the test corpus.
- De-duplication accuracy reaches at least 90% for seeded duplicates.
- At least 95% of included records have source URLs for identity, location, and service claims.
- Unsupported claim rate is below 5%.
- Closed, stale, out-of-city, and adjacent-category businesses are clearly separated or suppressed.
- Markdown and CSV reports are useful without raw logs.
- At least three reviewers agree that the output saves time compared with manual local search and spreadsheet work.

## Pilot Plan

Run the tool for five categories across five cities, then have reviewers compare the output against manual research. Track discovered competitors, accepted records, false positives, missed businesses, duplicate errors, unsupported claims, quota use, runtime, and reviewer comments. Use the pilot to tune query generation, entity normalization, city matching, service extraction, and citation requirements.
