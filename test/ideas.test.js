import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { listIdeas, readIdea, REPO_ROOT } from "../src/ideas.js";
import { MockMassiveClient } from "../src/massive-client.js";
import { runIdea } from "../src/runner.js";
import path from "node:path";

test("loads all 103 idea folders", async () => {
  const ideas = await listIdeas();
  assert.equal(ideas.length, 103);
  assert.equal(ideas[0].id, "001");
  assert.equal(ideas.at(-1).id, "103");
});

test("each idea has the required documents", async () => {
  const ideas = await listIdeas();
  for (const idea of ideas) {
    assert.match(idea.documents.readme, /^# /m, `${idea.id} missing README heading`);
    assert.match(idea.documents.prototype, /^# /m, `${idea.id} missing prototype heading`);
    assert.match(idea.documents.evaluation, /^# /m, `${idea.id} missing evaluation heading`);
  }
});

test("can resolve ideas by id and slug", async () => {
  const byId = await readIdea("001");
  const byNumber = await readIdea("1");
  const bySlug = await readIdea("massive-mcp-playground");
  assert.equal(byId.slug, "yc-lead-enricher");
  assert.equal(byNumber.id, "001");
  assert.equal(bySlug.id, "100");
});

test("runs an idea in mock mode", async () => {
  const idea = await readIdea("088");
  const result = await runIdea(
    idea,
    {
      query: "Massive MCP demo",
      urls: ["https://docs.joinmassive.com/web-render/ai"],
      max_results: 2
    },
    { mode: "mock", client: new MockMassiveClient() }
  );

  assert.equal(result.status, "complete");
  assert.equal(result.idea.id, "088");
  assert.ok(result.tool_calls.web_search.length >= 1);
  assert.ok(result.tool_calls.web_fetch.length >= 1);
  assert.ok(result.sources.length >= 1);
  assert.match(result.synthesis.completion, /Mock chatgpt synthesis/);
});

test("generated idea atlas includes all 103 ideas", async () => {
  const dataFile = await readFile(path.join(REPO_ROOT, "docs", "ideas-data.js"), "utf8");
  const jsonText = dataFile
    .replace(/^window\.MASSIVE_IDEAS_DATA = /, "")
    .replace(/;\s*$/, "");
  const data = JSON.parse(jsonText);
  assert.equal(data.ideas.length, 103);
  assert.equal(data.categories.length, 11);
});
