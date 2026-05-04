import { listIdeas } from "./ideas.js";
import { createMassiveClient } from "./massive-client.js";
import { buildSearchQueries, buildSynthesisPrompt } from "./prompts.js";
import { normalizeSource, uniqueSources } from "./report.js";

const DEFAULT_FETCH_LIMIT = Number.parseInt(process.env.MASSIVE_IDEAS_FETCH_LIMIT ?? "3", 10);

function targetFromInput(input) {
  return {
    country: input.country ?? input.target?.country ?? "US",
    city: input.city ?? input.target?.city ?? "San Francisco",
    device: input.device ?? input.target?.device ?? "desktop"
  };
}

function configuredUrls(input) {
  if (Array.isArray(input.urls)) return input.urls;
  if (input.url) return [input.url];
  if (input.domain) return [`https://${String(input.domain).replace(/^https?:\/\//, "")}`];
  return [];
}

function searchSources(search) {
  const organic = search.organic ?? [];
  const aioSources = search.ai_overview?.sources ?? [];
  return [
    ...organic.map((result) =>
      normalizeSource(result.url, {
        title: result.title,
        snippet: result.snippet,
        kind: "serp_result",
        rank: result.position
      })
    ),
    ...aioSources.map((source) =>
      normalizeSource(source.url, {
        title: source.domain,
        kind: "ai_overview_source"
      })
    )
  ];
}

function fetchSources(fetch) {
  return (fetch.sources ?? []).map((source) =>
    normalizeSource(source.url, {
      title: source.title,
      kind: source.kind ?? "fetched_page"
    })
  );
}

function chatSources(chat) {
  return (chat.sources ?? []).map((source, index) =>
    normalizeSource(source.url, {
      title: source.title,
      kind: "chat_citation",
      rank: index + 1
    })
  );
}

export async function runIdea(idea, input = {}, options = {}) {
  const mode = options.mode ?? "mock";
  const client = options.client ?? createMassiveClient({ mode });
  const target = targetFromInput(input);
  const generatedAt = new Date().toISOString();
  const fetchLimit = options.fetchLimit ?? DEFAULT_FETCH_LIMIT;

  const account = await client.accountStatus();
  const queries = buildSearchQueries(idea, input);
  const searches = [];
  for (const query of queries) {
    searches.push(await client.webSearch({ query, ...target, maxResults: input.max_results ?? 5 }));
  }

  const candidateUrls = [
    ...configuredUrls(input),
    ...searches.flatMap((search) => (search.organic ?? []).map((result) => result.url))
  ];
  const uniqueUrls = [...new Set(candidateUrls)].filter(Boolean).slice(0, fetchLimit);

  const fetches = [];
  for (const url of uniqueUrls) {
    const fetched = await client.webFetch({ url, format: input.format ?? "markdown", ...target });
    fetches.push({ url, text: fetched.text, structuredContent: fetched.structuredContent, sources: fetched.sources ?? [] });
  }

  const evidence = { searches, fetches };
  const prompt = buildSynthesisPrompt({ idea, input, evidence });
  const synthesis = await client.aiChatCompletion({
    prompt,
    model: input.model ?? "chatgpt",
    country: target.country,
    city: target.city
  });

  const sources = uniqueSources([
    ...searches.flatMap(searchSources),
    ...fetches.flatMap(fetchSources),
    ...chatSources(synthesis)
  ]);

  return {
    idea: {
      id: idea.id,
      slug: idea.slug,
      title: idea.title,
      path: idea.path
    },
    mode,
    status: "complete",
    generated_at: generatedAt,
    input,
    target,
    tool_calls: {
      account_status: account,
      web_search: searches.map((search) => ({ query: search.query, result_count: search.organic?.length ?? 0 })),
      web_fetch: fetches.map((fetch) => ({ url: fetch.url, bytes: fetch.structuredContent?.bytes ?? fetch.text.length })),
      ai_chat_completion: {
        model: synthesis.model ?? input.model ?? "chatgpt",
        source_count: synthesis.sources?.length ?? 0
      }
    },
    evidence,
    synthesis,
    sources,
    next_steps: [
      "Review the generated evidence and mark unsupported claims.",
      "Replace mock mode with live Massive calls once MASSIVE_TOKEN is configured.",
      "Promote stable prompts and schemas into a dedicated product implementation."
    ]
  };
}

export async function runAllIdeas(input = {}, options = {}) {
  const ideas = await listIdeas();
  const results = [];
  for (const idea of ideas) {
    results.push(await runIdea(idea, input, options));
  }
  return results;
}
