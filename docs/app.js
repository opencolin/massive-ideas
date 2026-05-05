const data = window.MASSIVE_IDEAS_DATA;
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
const spotlight = document.querySelector("#spotlight");
const visibleCount = document.querySelector("#visibleCount");

const accentVar = (accent) => "var(--" + accent + ")";

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

function renderSpotlight(ideas) {
  const counts = data.categories.map((category) => ({
    ...category,
    count: ideas.filter((idea) => idea.category === category.name).length
  }));
  const top = ideas[0] ?? data.ideas[0];

  spotlight.innerHTML = [
    '<div>',
    '<h2>' + top.id + ' ' + top.title + '</h2>',
    '<p>' + top.summary + '</p>',
    '</div>',
    '<div class="sparkline">',
    counts.map((category) => (
      '<button title="' + category.name + ': ' + category.count + '" style="height:' + Math.max(18, category.count * 6) + 'px;background:' + accentVar(category.accent) + '" data-category="' + category.name + '">' + category.count + '</button>'
    )).join(""),
    '</div>'
  ].join("");
}

function renderIdeas() {
  const ideas = filteredIdeas();
  visibleCount.textContent = ideas.length;
  renderSpotlight(ideas);

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

spotlight.addEventListener("click", (event) => {
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
