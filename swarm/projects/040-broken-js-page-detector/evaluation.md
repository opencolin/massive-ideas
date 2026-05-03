# Evaluation

## Success Criteria

The detector is useful if it reliably catches pages that a plain HTTP check would miss while avoiding noisy false alarms from intentionally sparse pages.

## Test Set

Build a labeled set of at least 100 public URLs:

- 25 healthy static or server-rendered pages.
- 25 healthy JS-heavy pages.
- 20 pages with known or induced blank-render behavior.
- 10 pages with mobile-only rendering problems.
- 10 pages with geo, consent, captcha, or access-wall behavior.
- 10 pages with search snippet or title mismatch.

Labels should include `healthy`, `degraded`, `broken`, `blocked`, or `inconclusive`, plus a short human note explaining the label.

## Metrics

- Precision on `broken`: how often a broken label is actually a user-visible problem.
- Recall on `broken`: how many known broken JS pages are caught.
- Block classification accuracy: whether bot/captcha/access issues are separated from true page defects.
- Profile sensitivity: whether device or country-specific failures are localized to the correct profile.
- Explanation usefulness: human reviewer rating of diagnosis and recommended next step.
- Cost and latency per URL/profile combination.

## Baselines

Compare against:

- HTTP-only uptime check.
- Raw HTML text-length check.
- Single-profile JS rendering check.
- SERP-only title/snippet comparison.

The prototype should beat HTTP-only and raw HTML baselines on recall for JS failures without collapsing precision.

## Acceptance Targets

For the first prototype:

- At least 80% precision on `broken`.
- At least 70% recall on known JS-render failures.
- At least 85% correct separation of `blocked` from `broken`.
- Median runtime under 45 seconds per URL across three render profiles.
- Markdown reports judged actionable by 4 of 5 reviewers on a small sample.

## Failure Modes To Watch

- False positives on intentionally minimal pages, login pages, or campaign pages with little text.
- Treating captchas as site defects instead of access conditions.
- Overweighting SERP mismatch when Google has stale snippets.
- Missing failures hidden below the fold if only top-viewport signals are used.
- Region and device labels that are too broad to reproduce the issue.

## Evaluation Procedure

1. Run all URLs through every configured profile.
2. Save raw and rendered extracted signals for auditability.
3. Generate deterministic labels and AI-written explanations.
4. Have reviewers label the same pages from rendered evidence.
5. Compute metrics by page, by profile, and by failure category.
6. Review false positives and false negatives, then tune thresholds before expanding the dataset.

## Production Readiness Gates

- Stable schema for machine-readable reports.
- Reproducible profile configuration for country, city, and device.
- Clear handling for captcha and access-wall outcomes.
- Evidence retention policy for screenshots, extracted text, and SERP data.
- Alert routing rules that avoid paging teams for inconclusive or blocked results.

