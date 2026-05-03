# Prototype

This is a lightweight implementation sketch for a Node or Python MVP. It assumes a Massive MCP client wrapper exposes `account_status`, `web_search`, `web_fetch`, and `ai_chat_completion`.

## Data Model

```ts
type ReviewMiningBrief = {
  workspace?: string;
  product: {
    name: string;
    domain?: string;
    known_urls?: string[];
  };
  competitors?: string[];
  sources: ReviewSource[];
  geo?: {
    country?: string;
    city?: string;
    device?: "desktop" | "mobile";
  };
  topics?: string[];
  date_range?: {
    from?: string;
    to?: string;
  };
  languages?: string[];
};

type ReviewSource =
  | "g2"
  | "capterra"
  | "apple_app_store"
  | "google_play"
  | "chrome_web_store"
  | "firefox_addons"
  | "shopify_app_store"
  | "wordpress_plugin_directory";

type SourcePage = {
  product_name: string;
  source: ReviewSource | "publisher" | "serp";
  url: string;
  query?: string;
  rank?: number;
  title?: string;
  snippet?: string;
  fetched_at?: string;
  fetch_status?: "ok" | "blocked" | "partial" | "failed";
};

type ReviewEvidence = {
  product_name: string;
  source: ReviewSource | "serp";
  source_url: string;
  source_page_title?: string;
  review_id?: string;
  rating?: number;
  rating_scale?: number;
  review_date?: string;
  locale?: string;
  excerpt: string;
  topics: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  query?: string;
  rank?: number;
  fetched_at: string;
};

type ReviewTheme = {
  theme: string;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  frequency: number;
  score: number;
  affected_sources: ReviewSource[];
  representative_evidence: ReviewEvidence[];
  confidence: "high" | "medium" | "low";
  recommended_action?: string;
};

type ReviewMiningReport = {
  product: string;
  generated_at: string;
  source_summary: {
    reviews_found: number;
    reviews_used: number;
    sources: ReviewSource[];
  };
  insight_summary: string;
  themes: ReviewTheme[];
  competitor_comparison: {
    competitor: string;
    relative_strength?: string;
    relative_weakness?: string;
    evidence_count: number;
  }[];
  alerts: string[];
};
```

## Pipeline

```ts
async function mineReviews(brief: ReviewMiningBrief): Promise<ReviewMiningReport> {
  const queryPlan = createQueryPlan(brief);
  const estimatedCredits = estimateCredits(queryPlan, brief);
  const status = await massive.account_status();

  if (!status.ok || status.remaining_credits < estimatedCredits) {
    throw new Error("Insufficient Massive MCP credits for review mining run");
  }

  const discoveredPages = await discoverReviewPages(brief, queryPlan);
  const fetchedPages = await fetchReviewPages(brief, discoveredPages);
  const reviewEvidence = await extractReviews(brief, discoveredPages, fetchedPages);

  return synthesizeReviewReport(brief, reviewEvidence);
}
```

## Query Planning

```ts
function createQueryPlan(brief: ReviewMiningBrief) {
  const product = brief.product.name;
  const competitors = brief.competitors || [];
  const sourceTerms = {
    g2: "G2 reviews",
    capterra: "Capterra reviews",
    apple_app_store: "Apple App Store reviews",
    google_play: "Google Play reviews",
    chrome_web_store: "Chrome Web Store reviews",
    firefox_addons: "Firefox add-ons reviews",
    shopify_app_store: "Shopify App Store reviews",
    wordpress_plugin_directory: "WordPress plugin reviews"
  };

  const productQueries = brief.sources.map(source => ({
    product_name: product,
    source,
    query: `${product} ${sourceTerms[source]}`,
    intent: "source_discovery"
  }));

  const competitorQueries = competitors.flatMap(competitor =>
    brief.sources.map(source => ({
      product_name: competitor,
      source,
      query: `${competitor} ${sourceTerms[source]}`,
      intent: "competitor_source_discovery"
    }))
  );

  const topicQueries = (brief.topics || []).map(topic => ({
    product_name: product,
    source: "serp",
    query: `${product} reviews ${topic} complaints praise`,
    intent: "topic_discovery"
  }));

  return [...productQueries, ...competitorQueries, ...topicQueries];
}
```

## Source Discovery

```ts
async function discoverReviewPages(brief: ReviewMiningBrief, queryPlan) {
  const known = (brief.product.known_urls || []).map(url => ({
    product_name: brief.product.name,
    source: classifyReviewSource(url),
    url,
    fetch_status: "partial"
  }));

  const searched = [];
  for (const item of queryPlan) {
    const result = await massive.web_search({
      query: item.query,
      parse_google_serp: true,
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      max_results: 10
    });

    searched.push(...normalizeSerpReviewPages(item, result));
  }

  return dedupeSourcePages([...known, ...searched]).slice(0, 80);
}
```

Source classification should recognize:

- G2 product review pages
- Capterra product review pages
- Apple App Store listings
- Google Play listings
- Chrome Web Store listings
- Firefox Add-ons listings
- Shopify App Store listings
- WordPress plugin pages
- Publisher articles that quote or aggregate reviews

## Fetching Reviews

```ts
async function fetchReviewPages(brief: ReviewMiningBrief, pages: SourcePage[]) {
  const fetched = [];

  for (const page of pages) {
    fetched.push(await massive.web_fetch({
      url: page.url,
      render_js: true,
      captcha: "auto",
      country: brief.geo?.country,
      city: brief.geo?.city,
      device: brief.geo?.device || "desktop",
      timeout_ms: 20000,
      extract_main_content: true
    }));
  }

  return fetched.map((page, index) => ({
    ...pages[index],
    ...page,
    fetched_at: new Date().toISOString()
  }));
}
```

Extraction should retain:

- Source URL and final URL
- Platform/source type
- Product or competitor name
- Rating and rating scale
- Review date
- Locale or country, when visible
- Review title, body excerpt, and visible pros/cons fields
- Query and SERP rank lineage
- Fetch status, render setting, captcha result, and timestamp

## Review Extraction

```ts
async function extractReviews(brief, discoveredPages, fetchedPages): Promise<ReviewEvidence[]> {
  const extracted = [];

  for (const page of fetchedPages.filter(page => page.ok && page.text)) {
    const response = await massive.ai_chat_completion({
      model: "fast-grounded-json",
      response_format: "json",
      messages: [
        {
          role: "system",
          content: [
            "Extract only reviews or review-like snippets visible in the supplied page text.",
            "Do not invent quotes, dates, ratings, reviewers, or sources.",
            "Return compact JSON evidence items with topics and sentiment."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            brief,
            page: {
              url: page.url,
              source: page.source,
              product_name: page.product_name,
              title: page.title,
              text: page.text.slice(0, 50000),
              fetched_at: page.fetched_at
            }
          })
        }
      ]
    });

    extracted.push(...normalizeExtractedReviews(response, page));
  }

  return dedupeReviews(extracted);
}
```

## Synthesis Prompt

```ts
async function synthesizeReviewReport(brief, reviewEvidence) {
  const response = await massive.ai_chat_completion({
    model: "fast-grounded-json",
    response_format: "json",
    messages: [
      {
        role: "system",
        content: [
          "You are a product research analyst mining public reviews.",
          "Cluster evidence into specific themes with sentiment, frequency, confidence, and actions.",
          "Every theme must include representative evidence from supplied review items.",
          "Keep exact review excerpts separate from your summary."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          brief,
          reviewEvidence,
          required_output: "ReviewMiningReport"
        })
      }
    ]
  });

  return validateReport(JSON.parse(response.content));
}
```

## Normalization Rules

- Normalize source domains and listing URLs before deduplication.
- Treat ratings as numeric values with explicit `rating_scale`.
- Preserve short excerpts, not full review dumps, in reports.
- Use fuzzy matching to merge repeated review snippets across SERP snippets and fetched pages.
- Prefer fetched review pages over SERP snippets when both describe the same review.
- Keep product and competitor evidence separate until the comparison step.
- Filter out generic marketing claims that are not reviews.

## CLI Shape

```bash
review-miner run \
  --brief review-brief.json \
  --out insights.json \
  --evidence reviews.csv \
  --report review-report.md
```

Optional commands:

```bash
review-miner discover --brief review-brief.json --out sources.json
review-miner extract --sources sources.json --out reviews.json
review-miner compare --reviews reviews.json --out competitor-comparison.json
```

## Implementation Notes

- Start with 20-40 fetched pages per run and increase only after cost and quality are measured.
- Use platform-specific parsers where page structure is stable, then fall back to AI extraction.
- Store raw fetch metadata separately from concise evidence excerpts.
- Make the report reproducible by saving the query plan, discovery results, fetched page metadata, and synthesis prompt version.
- Treat app-store pagination and sort order as source metadata because recency and helpfulness sorting can materially change results.
