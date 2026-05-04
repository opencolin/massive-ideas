#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { listIdeas, readIdea } from "./ideas.js";
import { runAllIdeas, runIdea } from "./runner.js";
import { renderMarkdownReport } from "./report.js";

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const args = { _: [] };

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=");
    const key = rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    const next = rest[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }

  return { command, args };
}

async function readJsonFile(filePath) {
  if (!filePath) return {};
  const text = await readFile(path.resolve(filePath), "utf8");
  return JSON.parse(text);
}

async function writeOutput(filePath, content) {
  if (!filePath) {
    process.stdout.write(`${content}\n`);
    return;
  }

  const resolved = path.resolve(filePath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${content}\n`, "utf8");
  process.stdout.write(`Wrote ${resolved}\n`);
}

function printHelp() {
  process.stdout.write(`Massive Ideas CLI

Usage:
  massive-ideas list [--json]
  massive-ideas show --idea 001
  massive-ideas run --idea 001 [--input examples/sample-input.json] [--mode mock|live] [--format json|markdown] [--out runs/001.json]
  massive-ideas run-all [--mode mock|live] [--out runs/mock-all]

Environment for live mode:
  MASSIVE_TOKEN              Required for live Massive calls.
  MASSIVE_API_BASE_URL       Optional, defaults to https://render.joinmassive.com.
  MASSIVE_IDEAS_FETCH_LIMIT  Optional, default 3 fetched URLs per idea run.
`);
}

async function commandList(args) {
  const ideas = await listIdeas();
  if (args.json) {
    process.stdout.write(`${JSON.stringify(ideas.map(({ id, slug, title, path }) => ({ id, slug, title, path })), null, 2)}\n`);
    return;
  }

  for (const idea of ideas) {
    process.stdout.write(`${idea.id}  ${idea.title}  (${idea.slug})\n`);
  }
}

async function commandShow(args) {
  const id = args.idea ?? args._[0];
  if (!id) throw new Error("show requires --idea 001 or an idea id argument.");
  const idea = await readIdea(id);
  process.stdout.write(`# ${idea.id} ${idea.title}\n\n`);
  process.stdout.write(`Path: ${idea.path}\n\n`);
  process.stdout.write(`Files:\n`);
  for (const [name, filePath] of Object.entries(idea.files)) {
    process.stdout.write(`- ${name}: ${filePath}\n`);
  }
  process.stdout.write(`\nSummary:\n${idea.summary}\n`);
}

async function commandRun(args) {
  const id = args.idea ?? args._[0];
  if (!id) throw new Error("run requires --idea 001 or an idea id argument.");

  const idea = await readIdea(id);
  const input = await readJsonFile(args.input);
  const mode = args.mode ?? "mock";
  const result = await runIdea(idea, input, { mode });
  const format = args.format ?? (args.out?.endsWith(".md") ? "markdown" : "json");
  const content = format === "markdown" ? renderMarkdownReport(result) : JSON.stringify(result, null, 2);
  await writeOutput(args.out, content);
}

async function commandRunAll(args) {
  const input = await readJsonFile(args.input);
  const mode = args.mode ?? "mock";
  const outDir = args.out ?? "runs/mock-all";
  const results = await runAllIdeas(input, { mode });

  await mkdir(outDir, { recursive: true });
  for (const result of results) {
    const jsonPath = path.join(outDir, `${result.idea.id}-${result.idea.slug}.json`);
    const mdPath = path.join(outDir, `${result.idea.id}-${result.idea.slug}.md`);
    await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    await writeFile(mdPath, `${renderMarkdownReport(result)}\n`, "utf8");
  }

  const index = {
    mode,
    generated_at: new Date().toISOString(),
    count: results.length,
    output_directory: path.resolve(outDir),
    ideas: results.map((result) => ({
      id: result.idea.id,
      slug: result.idea.slug,
      title: result.idea.title,
      status: result.status,
      source_count: result.sources.length
    }))
  };

  await writeFile(path.join(outDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
  process.stdout.write(`Generated ${results.length} idea runs in ${path.resolve(outDir)}\n`);
}

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2));
  switch (command) {
    case "list":
      await commandList(args);
      break;
    case "show":
      await commandShow(args);
      break;
    case "run":
      await commandRun(args);
      break;
    case "run-all":
      await commandRunAll(args);
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      printHelp();
      process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
});
