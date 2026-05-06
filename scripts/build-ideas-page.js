import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { listIdeas, REPO_ROOT } from "../src/ideas.js";

const DOCS_DIR = path.join(REPO_ROOT, "docs");
const GITHUB_ROOT = "https://github.com/opencolin/massive-ideas/tree/main";

const CATEGORIES = [
  { min: 1, max: 10, name: "Sales", accent: "jade" },
  { min: 11, max: 20, name: "Market", accent: "blue" },
  { min: 21, max: 30, name: "SEO", accent: "amber" },
  { min: 31, max: 40, name: "Product", accent: "rose" },
  { min: 41, max: 50, name: "Finance", accent: "violet" },
  { min: 51, max: 60, name: "Recruiting", accent: "green" },
  { min: 61, max: 70, name: "Ops", accent: "slate" },
  { min: 71, max: 80, name: "Local", accent: "cyan" },
  { min: 81, max: 90, name: "AI", accent: "indigo" },
  { min: 91, max: 100, name: "Personal", accent: "orange" },
  { min: 101, max: 110, name: "Existing Builds", accent: "graphite" }
];

const TAG_RULES = [
  ["sales", /\b(sales|lead|crm|prospect|outreach|account)\b/i],
  ["search", /\b(serp|seo|search|google|overview|people also ask)\b/i],
  ["geo", /\b(country|city|local|geo|regional|near me|territory)\b/i],
  ["pricing", /\b(pricing|price|cost|deal|coupon|arbitrage)\b/i],
  ["ai", /\b(ai|chatbot|chatgpt|gemini|perplexity|copilot|hallucination)\b/i],
  ["monitoring", /\b(monitor|tracker|change|digest|alert|freshness)\b/i],
  ["docs", /\b(docs|api|support|terms|privacy|sla|security)\b/i],
  ["hiring", /\b(hiring|job|recruit|talent|candidate|role)\b/i],
  ["research", /\b(research|brief|diligence|analyst|market|map)\b/i],
  ["travel", /\b(travel|restaurant|event|apartment|car|scholarship|grant)\b/i]
];

function categoryFor(id) {
  const number = Number(id);
  return CATEGORIES.find((category) => number >= category.min && number <= category.max);
}

function markdownLinkFor(idea, file) {
  return `${GITHUB_ROOT}/swarm/projects/${idea.id}-${idea.slug}/${file}`;
}

function tagsFor(idea) {
  const haystack = [
    idea.title,
    idea.slug,
    idea.summary,
    idea.documents.readme.slice(0, 2500),
    idea.documents.prototype.slice(0, 1800)
  ].join(" ");

  return TAG_RULES.filter(([, rule]) => rule.test(haystack))
    .map(([tag]) => tag)
    .slice(0, 5);
}

function compact(text) {
  const normalized = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/`/g, "")
    .trim();

  if (normalized.length <= 280) return normalized;

  const cutoff = normalized.lastIndexOf(" ", 279);
  const end = cutoff > 210 ? cutoff : 279;
  return `${normalized.slice(0, end).replace(/[,:;.]$/, "")}...`;
}

function createIdeaRecord(idea) {
  const category = categoryFor(idea.id);
  if (!category) {
    throw new Error(`No idea category configured for ${idea.id}-${idea.slug}`);
  }
  const folder = `${idea.id}-${idea.slug}`;
  return {
    id: idea.id,
    slug: idea.slug,
    folder,
    title: idea.title,
    summary: compact(idea.summary),
    category: category.name,
    accent: category.accent,
    tags: tagsFor(idea),
    links: {
      readme: markdownLinkFor(idea, "README.md"),
      prototype: markdownLinkFor(idea, "prototype.md"),
      evaluation: markdownLinkFor(idea, "evaluation.md"),
      folder: `${GITHUB_ROOT}/swarm/projects/${folder}`
    }
  };
}

function buildDataJs(ideas) {
  const payload = {
    generated_at: new Date().toISOString(),
    categories: CATEGORIES.map(({ name, accent }) => ({ name, accent })),
    ideas
  };

  return `window.MASSIVE_IDEAS_DATA = ${JSON.stringify(payload, null, 2)};\n`;
}

function buildHtml(ideaCount) {
  const docCount = ideaCount * 3;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Massive MCP Idea Atlas</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Massive MCP</p>
        <h1>Idea Atlas</h1>
      </div>
      <div class="stats" aria-label="Idea stats">
        <span><strong id="visibleCount">${ideaCount}</strong> shown</span>
        <span><strong>${ideaCount}</strong> ideas</span>
        <span><strong>${docCount}</strong> docs</span>
      </div>
    </header>

    <section class="controls" aria-label="Idea filters">
      <label class="search">
        <span>Search</span>
        <input id="searchInput" type="search" placeholder="lead enrichment, pricing, AI citations...">
      </label>
      <div class="filters" id="categoryFilters"></div>
      <select id="tagSelect" aria-label="Filter by tag">
        <option value="all">All tags</option>
      </select>
      <select id="sortSelect" aria-label="Sort ideas">
        <option value="id">Sort by id</option>
        <option value="title">Sort by title</option>
        <option value="category">Sort by category</option>
      </select>
    </section>

    <section class="idea-grid" id="ideaGrid" aria-label="Massive MCP ideas"></section>
  </main>

  <script src="./ideas-data.js"></script>
  <script src="./app.js"></script>
</body>
</html>
`;
}

function buildCss() {
  return `:root {
  color-scheme: light;
  --bg: #f7f4ee;
  --ink: #171a1c;
  --muted: #5e646b;
  --line: #d9d2c7;
  --panel: #fffdf8;
  --jade: #0f8f71;
  --blue: #2c6cc7;
  --amber: #b26a00;
  --rose: #b13d5b;
  --violet: #714fb3;
  --green: #4c7f18;
  --slate: #57616f;
  --cyan: #0d7f92;
  --indigo: #4458c9;
  --orange: #c04f15;
  --graphite: #283039;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

a {
  color: inherit;
}

.shell {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 24px;
}

.topbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding: 8px 0 18px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 40px;
  line-height: 1;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  color: var(--muted);
  font-size: 14px;
}

.stats span {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 8px 10px;
  border-radius: 8px;
}

.stats strong {
  color: var(--ink);
}

.controls {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(280px, 2fr) 160px 150px;
  gap: 12px;
  align-items: end;
  padding: 18px 0;
}

.search {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

input,
select,
button {
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  color: var(--ink);
  font: inherit;
}

input,
select {
  width: 100%;
  padding: 0 12px;
}

.filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 1px;
}

.filter-button {
  flex: 0 0 auto;
  padding: 0 12px;
  cursor: pointer;
}

.filter-button[aria-pressed="true"] {
  color: #fff;
  border-color: var(--ink);
  background: var(--ink);
}

.idea-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.idea-card {
  display: grid;
  grid-template-rows: auto auto 1fr auto auto;
  min-height: 260px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}

.idea-card[data-accent="jade"] { border-top: 4px solid var(--jade); }
.idea-card[data-accent="blue"] { border-top: 4px solid var(--blue); }
.idea-card[data-accent="amber"] { border-top: 4px solid var(--amber); }
.idea-card[data-accent="rose"] { border-top: 4px solid var(--rose); }
.idea-card[data-accent="violet"] { border-top: 4px solid var(--violet); }
.idea-card[data-accent="green"] { border-top: 4px solid var(--green); }
.idea-card[data-accent="slate"] { border-top: 4px solid var(--slate); }
.idea-card[data-accent="cyan"] { border-top: 4px solid var(--cyan); }
.idea-card[data-accent="indigo"] { border-top: 4px solid var(--indigo); }
.idea-card[data-accent="orange"] { border-top: 4px solid var(--orange); }
.idea-card[data-accent="graphite"] { border-top: 4px solid var(--graphite); }

.meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.idea-card h3 {
  margin: 12px 0 8px;
  font-size: 20px;
  line-height: 1.2;
}

.idea-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.tag {
  padding: 4px 7px;
  border-radius: 6px;
  background: #ece6dc;
  color: #3d4146;
  font-size: 12px;
  font-weight: 700;
}

.links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 14px;
}

.links a {
  display: grid;
  place-items: center;
  min-height: 34px;
  border: 1px solid var(--line);
  border-radius: 6px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 800;
}

.empty {
  grid-column: 1 / -1;
  padding: 36px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 920px) {
  .controls {
    grid-template-columns: 1fr;
  }

  .topbar {
    align-items: start;
    flex-direction: column;
  }

  .stats {
    justify-content: flex-start;
  }
}

@media (max-width: 560px) {
  .shell {
    padding: 14px;
  }

  h1 {
    font-size: 34px;
  }

  .idea-grid {
    grid-template-columns: 1fr;
  }
}
`;
}

function buildAppJs() {
  return `const data = window.MASSIVE_IDEAS_DATA;
const state = {
  category: "All",
  tag: "all",
  query: "",
  sort: "id"
};

const categoryFilters = document.querySelector("#categoryFilters");
const tagSelect = document.querySelector("#tagSelect");
const sortSelect = document.querySelector("#sortSelect");
const searchInput = document.querySelector("#searchInput");
const ideaGrid = document.querySelector("#ideaGrid");
const visibleCount = document.querySelector("#visibleCount");

function allTags() {
  return [...new Set(data.ideas.flatMap((idea) => idea.tags))].sort();
}

function renderFilters() {
  const categories = ["All", ...data.categories.map((category) => category.name)];
  categoryFilters.innerHTML = categories
    .map((category) => {
      const pressed = category === state.category ? "true" : "false";
      return '<button class="filter-button" data-category="' + category + '" aria-pressed="' + pressed + '">' + category + '</button>';
    })
    .join("");

  tagSelect.innerHTML = '<option value="all">All tags</option>' + allTags()
    .map((tag) => '<option value="' + tag + '">' + tag + '</option>')
    .join("");
}

function filteredIdeas() {
  const query = state.query.trim().toLowerCase();
  let ideas = data.ideas.filter((idea) => {
    const matchesCategory = state.category === "All" || idea.category === state.category;
    const matchesTag = state.tag === "all" || idea.tags.includes(state.tag);
    const haystack = [idea.id, idea.title, idea.slug, idea.summary, idea.category, ...idea.tags].join(" ").toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCategory && matchesTag && matchesQuery;
  });

  ideas = [...ideas].sort((a, b) => {
    if (state.sort === "title") return a.title.localeCompare(b.title);
    if (state.sort === "category") return a.category.localeCompare(b.category) || a.id.localeCompare(b.id);
    return a.id.localeCompare(b.id);
  });

  return ideas;
}

function renderIdeas() {
  const ideas = filteredIdeas();
  visibleCount.textContent = ideas.length;

  if (ideas.length === 0) {
    ideaGrid.innerHTML = '<div class="empty">No ideas match the current filters.</div>';
    return;
  }

  ideaGrid.innerHTML = ideas.map((idea) => [
    '<article class="idea-card" data-accent="' + idea.accent + '">',
    '<div class="meta"><span>#' + idea.id + '</span><span>' + idea.category + '</span></div>',
    '<h3>' + idea.title + '</h3>',
    '<p>' + idea.summary + '</p>',
    '<div class="tags">' + idea.tags.map((tag) => '<span class="tag">' + tag + '</span>').join("") + '</div>',
    '<div class="links">',
    '<a href="' + idea.links.folder + '">Folder</a>',
    '<a href="' + idea.links.readme + '">Brief</a>',
    '<a href="' + idea.links.prototype + '">Proto</a>',
    '<a href="' + idea.links.evaluation + '">Eval</a>',
    '</div>',
    '</article>'
  ].join("")).join("");
}

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderFilters();
  tagSelect.value = state.tag;
  renderIdeas();
});

tagSelect.addEventListener("change", () => {
  state.tag = tagSelect.value;
  renderIdeas();
});

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  renderIdeas();
});

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  renderIdeas();
});

renderFilters();
renderIdeas();
`;
}

async function main() {
  const ideas = (await listIdeas()).map(createIdeaRecord);
  await mkdir(DOCS_DIR, { recursive: true });
  await Promise.all([
    writeFile(path.join(DOCS_DIR, "index.html"), buildHtml(ideas.length), "utf8"),
    writeFile(path.join(DOCS_DIR, "styles.css"), buildCss(), "utf8"),
    writeFile(path.join(DOCS_DIR, "app.js"), buildAppJs(), "utf8"),
    writeFile(path.join(DOCS_DIR, "ideas-data.js"), buildDataJs(ideas), "utf8")
  ]);

  process.stdout.write(`Built idea atlas for ${ideas.length} ideas in ${DOCS_DIR}\n`);
}

main().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
});
