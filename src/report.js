export function normalizeSource(url, extra = {}) {
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = "";
  }

  return {
    url,
    domain,
    ...extra
  };
}

export function uniqueSources(sources) {
  const seen = new Set();
  const out = [];
  for (const source of sources) {
    if (!source.url || seen.has(source.url)) continue;
    seen.add(source.url);
    out.push(source);
  }
  return out;
}

export function renderMarkdownReport(result) {
  const lines = [
    `# ${result.idea.id} ${result.idea.title}`,
    "",
    `Status: ${result.status}`,
    `Mode: ${result.mode}`,
    `Generated: ${result.generated_at}`,
    "",
    "## Summary",
    "",
    result.synthesis.completion || "No synthesis was returned.",
    "",
    "## Tool Calls",
    "",
    "| Tool | Count |",
    "| --- | ---: |",
    `| account_status | ${result.tool_calls.account_status ? 1 : 0} |`,
    `| web_search | ${result.tool_calls.web_search.length} |`,
    `| web_fetch | ${result.tool_calls.web_fetch.length} |`,
    `| ai_chat_completion | ${result.tool_calls.ai_chat_completion ? 1 : 0} |`,
    "",
    "## Sources",
    ""
  ];

  if (result.sources.length === 0) {
    lines.push("No sources captured.");
  } else {
    for (const [index, source] of result.sources.entries()) {
      lines.push(`${index + 1}. [${source.title ?? source.domain ?? source.url}](${source.url}) - ${source.kind}`);
    }
  }

  lines.push("", "## Next Steps", "");
  for (const step of result.next_steps) lines.push(`- ${step}`);

  return lines.join("\n");
}
