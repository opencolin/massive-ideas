# Evaluation

Goal: prove Skill City Company Finder can find real companies hiring for a requested skill in a requested city, rank them usefully, and avoid false positives from stale jobs, training providers, staffing agencies, resumes, and generic content.

## Test Set

Use at least 30 benchmark runs:

- 6 runs with common engineering skills in large tech metros, such as Kubernetes in Austin or React in Seattle.
- 5 runs with niche technical skills, such as Rust, Snowflake, dbt, Salesforce CPQ, or Figma.
- 4 runs with non-engineering skills, such as demand generation, revops, clinical trial management, or payroll compliance.
- 4 runs where location is exact city, metro-area, remote-with-city, or hybrid only.
- 3 runs with JavaScript-rendered ATS pages, cookie gates, or captcha-protected job pages.
- 3 runs where job boards rank above original company or ATS pages.
- 3 runs with staffing agencies that should be included only when requested.
- 2 runs with noisy pages such as courses, resume examples, blogs, conferences, and stale reposts.

For each run, create a human-labeled benchmark:

- Skill name, aliases, exclusions, city, region, country, device, language, and fetch time
- Search queries and returned SERP positions
- Source URLs, source type, page title, observed date, posted date, and fetch status
- Expected companies, domains, role titles, and location match type
- Expected skill match: required, preferred, adjacent, absent, or ambiguous
- Expected suppressed sources with reasons
- Expected warnings for stale, blocked, duplicate, snippet-only, or location-ambiguous evidence
- Disallowed claims about hiring budget, headcount plans, growth rate, or internal urgency unless explicitly sourced

## Metrics

Primary metrics:

- Company precision: at least 90% of medium or high confidence companies should have a current fetched posting that matches the skill and city.
- Company recall: at least 85% of human-labeled high-importance companies should appear in the report.
- Evidence validity: at least 95% of retained companies should include company, URL, source type, observed time, excerpt, confidence, and fetch metadata.
- Location accuracy: at least 90% of retained companies should have the correct exact-city, metro, remote-with-city, hybrid, or mismatch label.
- Noise control: fewer than 10% of high-score companies should be staffing agencies, training providers, resume pages, stale jobs, or content-only pages unless explicitly allowed.

Secondary metrics:

- Skill-required versus skill-preferred classification accuracy.
- Company name, domain, and ATS alias resolution accuracy.
- Duplicate posting collapse rate.
- SERP parsing accuracy for title, URL, snippet, rank, and source domain.
- JavaScript-rendered evidence recovery rate.
- Posted-date and lookback-window accuracy.
- Credit estimate accuracy before execution.
- JSON, CSV, and Markdown export reconciliation.

## Manual Review Rubric

Score each report from 1-5:

- Relevance: Are the listed companies plausibly hiring for the requested skill?
- Location fit: Does the report distinguish exact city, metro, hybrid, remote, and mismatch cases?
- Evidence quality: Can every retained company be verified from source URLs, excerpts, and fetch metadata?
- Precision: Does it suppress training pages, resumes, stale posts, generic blogs, duplicates, and unrequested agencies?
- Ranking clarity: Are score drivers understandable and proportional to the evidence?
- Freshness: Are old or undated postings clearly capped or suppressed?
- Usefulness: Could a recruiter, seller, or job seeker act on the top companies without opening every source?

A report is MVP-acceptable when:

- Average reviewer score is at least 4.
- Every high-confidence company includes at least one fetched job, careers, or ATS page.
- Every high-score company has an exact or clearly explained metro/remote city match.
- Staffing agencies are either suppressed or clearly labeled depending on user preference.
- Stale, undated, duplicate, or snippet-only sources are capped and visibly marked.
- Recommendations are separated from observed facts.

## Automated Checks

Run after every report:

- JSON schema validation for search inputs, observations, company signals, and reports.
- Every observation must include URL, source type, observed time, geo, device, fetch status, and excerpt.
- Every retained company must include company, confidence, hiring score, city match, matched roles, evidence, and warnings.
- Medium and high confidence companies must have fetched page evidence, not SERP snippets alone.
- Companies outside the requested city must be labeled metro, remote-with-city, ambiguous, or mismatch.
- Duplicate job URLs and repeated syndicated job board posts must collapse into one company evidence group.
- Stale postings outside the lookback window must be suppressed or clearly marked historical.
- Skill mentions in blogs, ads, resumes, navigation, or training content must not count as job evidence.
- Render failures cannot produce high-confidence company matches.
- JSON, CSV, and Markdown outputs must reconcile on company, domain, score, confidence, role count, and source URL.
- No report may include fabricated headcount, budget, growth, or internal hiring strategy claims.

## Three Realistic Examples

1. Kubernetes in Austin, Texas:
   - Good result: direct employers with Austin-area platform, DevOps, or infrastructure roles requiring Kubernetes.
   - Bad result: Kubernetes training providers, national remote jobs with no Austin tie, or stale job-board reposts.
2. Salesforce CPQ in Chicago, Illinois:
   - Good result: employers with revenue operations, sales systems, or business applications roles mentioning Salesforce CPQ in Chicago or hybrid Chicago postings.
   - Bad result: Salesforce consultancies with no hiring page, generic Salesforce admin roles without CPQ, or recruiter-only listings when agencies are excluded.
3. Rust in Denver, Colorado:
   - Good result: companies with fetched engineering roles that require or prefer Rust and include Denver, Boulder/Denver metro, or explicit hybrid Denver language.
   - Bad result: Rust programming courses, developer meetup pages, remote global jobs with no Denver signal, or blog posts about Rust adoption.

## Launch Criteria

The MVP is ready for first users when:

- 30-run benchmark completes without crashes.
- Company precision is at least 90%.
- High-importance recall is at least 85%.
- Evidence validity is at least 95%.
- Location accuracy is at least 90%.
- High-score noise is below 10%.
- Snapshot-to-report reconciliation passes automatically.
- Markdown, JSON, and CSV exports are readable without manual cleanup.
