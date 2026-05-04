import test from "node:test";
import assert from "node:assert/strict";
import { listIdeas, readIdea } from "../src/ideas.js";
import { MockMassiveClient } from "../src/massive-client.js";
import { runIdea } from "../src/runner.js";

test("loads all 100 idea folders", async () => {
  const ideas = await listIdeas();
  assert.equal(ideas.length, 100);
  assert.equal(ideas[0].id, "001");
  assert.equal(ideas.at(-1).id, "100");
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
