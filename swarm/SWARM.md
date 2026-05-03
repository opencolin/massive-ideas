# Massive MCP Build Swarm

Goal: produce 100 small buildable experiments around the Massive MCP server.

Each project owns one folder under `swarm/projects/NN-slug`. Workers must not edit outside their assigned folder. Each MVP should assume the Massive MCP exposes:

- `web_fetch`: fetch URL as markdown, rendered HTML, or raw HTML; supports country, city, device.
- `web_search`: structured Google results with organic results, AI overview, and People Also Ask.
- `ai_chat_completion`: ChatGPT/Gemini/Perplexity/Copilot answer with sources.
- `account_status`: remaining credits.

Minimum useful artifact per project:

- `README.md`: what it does, user workflow, Massive tools used, and next implementation steps.
- `prototype.md` or lightweight code: concrete data model, prompts, UI/API sketch, or script skeleton.
- `evaluation.md`: how to test it with 3 realistic examples and what “good” looks like.

## Assignments

1. YC/company lead enricher with fit score, buying trigger, and intro angle.
2. Newly funded companies monitor that finds hiring, stack, and pain signals.
3. Account research bot that builds a pre-call brief from site, news, and search.
4. ICP drift detector comparing target accounts against best customers.
5. Territory planner that finds companies by city, industry, and hiring intent.
6. Conference attendee enricher from sponsor, speaker, and exhibitor pages.
7. Website intent classifier for “are they likely to need us?”
8. Founder email personalization generator with cited public facts.
9. Competitor customer finder from case studies, review pages, and integrations.
10. “Why now?” sales trigger feed from launches, hiring, funding, outages, or regulation.
11. Competitor pricing tracker across countries and devices.
12. Category landscape builder from Google SERPs plus AI answers.
13. Feature comparison table generator from public docs and pricing pages.
14. Review mining bot for G2, Capterra, app stores, and extension stores.
15. Persona pain-point extractor from forums, reviews, and support pages.
16. Market map generator for “all tools like X in vertical Y.”
17. “What changed this week?” category digest.
18. Regional demand analyzer using localized search results.
19. TAM proxy builder from company counts, job posts, and search-volume signals.
20. AI overview tracker for how Google summarizes a category over time.
21. SERP gap analyzer for a keyword cluster.
22. AI Overview inclusion tracker for a brand and competitors.
23. People Also Ask content brief generator.
24. Programmatic landing page research assistant.
25. Local SEO rank checker by city.
26. Search intent classifier for thousands of keywords.
27. Blog refresh recommender based on current SERP changes.
28. Competitor content velocity tracker.
29. “Sources cited by AI answers” database for outreach.
30. Content originality checker against top-ranking pages.
31. Website screenshot/HTML QA bot by device and country.
32. Signup flow auditor for competitors.
33. Pricing page change detector.
34. Onboarding teardown generator for SaaS products.
35. Mobile rendering regression checker via `web_fetch` device emulation.
36. Checkout/localization tester across 195+ countries.
37. Public docs quality scorer.
38. API docs comparison assistant.
39. Product changelog summarizer across competitors.
40. Broken public page detector for JS-heavy sites.
41. Startup diligence pack generator.
42. Public company product momentum tracker.
43. Earnings-call prep bot that fetches recent product and news context.
44. Alternative data feed from job posts, pricing pages, and public pages.
45. M&A target scanner by niche.
46. Investor CRM enricher for founders, sectors, and recent activity.
47. Portfolio company competitive alerts.
48. “Who is entering this market?” monitor.
49. Regulatory exposure scanner from public websites.
50. Analyst brief generator with cited sources.
51. Candidate company research assistant.
52. Hiring signal tracker for target accounts.
53. “Companies hiring for X skill in Y city” finder.
54. Job post analyzer that extracts stack, seniority, and urgency.
55. Talent market map by geography.
56. Competitor hiring trend dashboard.
57. Recruiting personalization writer using public company context.
58. Startup role quality scorer from job pages.
59. Layoff/reorg signal monitor from news and company pages.
60. Founder/operator background brief generator.
61. Vendor risk monitor for status pages, docs, pricing, and news.
62. Public status-page incident summarizer.
63. SLA evidence collector from vendor docs.
64. Terms/privacy policy change detector.
65. Security page monitor for SOC2, HIPAA, GDPR claims.
66. Support article freshness checker.
67. Vendor comparison matrix builder.
68. Procurement research assistant.
69. “Can this vendor serve country X?” compliance checker.
70. Public API availability and docs monitor.
71. Geo-targeted SERP checker for local businesses.
72. Travel price comparison by country and city.
73. Local competitor finder for agencies, clinics, restaurants, gyms, etc.
74. Regional ecommerce availability checker.
75. City-by-city landing page QA.
76. Local regulation summary bot with source links.
77. International pricing arbitrage tracker.
78. Localized ad landing page verifier.
79. Franchise territory research assistant.
80. “Best vendor near me” SERP trend tracker.
81. Multi-model answer comparison across ChatGPT, Gemini, Perplexity, and Copilot.
82. Source citation quality scorer for chatbot answers.
83. AI brand visibility tracker.
84. Prompt-to-research-report agent with cited web evidence.
85. “Ask the internet twice” consensus checker.
86. AI hallucination verifier against fetched source pages.
87. Agentic browsing benchmark for JS-heavy websites.
88. MCP demo app comparing fetch, search, and chat outputs side by side.
89. Automated research notebook storing sources, snippets, and confidence.
90. “What would different AI assistants recommend?” product research tool.
91. Deal finder that searches, fetches, and verifies coupon pages.
92. Restaurant menu/pricing tracker by city.
93. Apartment listing enrichment and scam-risk scorer.
94. Event discovery bot from venue calendars and local SERPs.
95. Scholarship/grant finder with eligibility extraction.
96. Used car listing verifier and market-price explainer.
97. Travel itinerary freshness checker for closures, hours, and local rules.
98. Personal buying research assistant for any product category.
99. Internet change journal tracking how a page/category/brand evolves weekly.
100. Massive MCP playground showing exact tool calls and returned sources.
