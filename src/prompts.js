function compact(text, maxChars) {
  return String(text).replace(/\s+/g, " ").trim().slice(0, maxChars);
}

export function buildSearchQueries(idea, input = {}) {
  const topic = input.query ?? input.topic ?? input.company ?? idea.title;
  const location = input.city ? ` ${input.city}` : "";
  const category = input.category ? ` ${input.category}` : "";

  return [
    `${topic}${category}${location}`,
    `${topic} public sources evidence`,
    `${idea.title} examples tools vendors`
  ]
    .map((query) => query.replace(/\s+/g, " ").trim().slice(0, 255))
    .filter(Boolean);
}

export function buildSynthesisPrompt({ idea, input, evidence }) {
  const brief = compact(idea.documents.readme, 3000);
  const prototype = compact(idea.documents.prototype, 2200);
  const evaluation = compact(idea.documents.evaluation, 1600);
  const searchEvidence = compact(JSON.stringify(evidence.searches, null, 2), 1800);
  const fetchEvidence = compact(
    JSON.stringify(
      evidence.fetches.map((fetch) => ({ url: fetch.url, excerpt: fetch.text.slice(0, 600) })),
      null,
      2
    ),
    1800
  );

  return `
Idea: ${idea.title}
Slug: ${idea.id}-${idea.slug}

User input:
${JSON.stringify(input, null, 2)}

Product brief:
${brief}

Prototype notes:
${prototype}

Evaluation notes:
${evaluation}

Search evidence:
${searchEvidence}

Fetched evidence:
${fetchEvidence}

Write a concise, source-aware MVP run report with:
- summary
- observed evidence
- inferred opportunities
- confidence
- risks and guardrails
- next implementation steps
Do not invent facts that are not supported by the evidence. Mark missing data explicitly.
`.trim();
}
