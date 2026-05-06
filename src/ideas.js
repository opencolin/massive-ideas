import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROJECTS_DIR = path.join(REPO_ROOT, "swarm", "projects");
const PROJECT_DIR_RE = /^(\d{3})-(.+)$/;

function titleFromMarkdown(markdown, fallback) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : fallback;
}

function stripMarkdown(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function listItemsFromBlock(block) {
  return block
    .split("\n")
    .map((line) => line.trim().match(/^[-*]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(stripMarkdown)
    .map((item) => item.replace(/^([A-Z])(?=[a-z])/, (_, letter) => letter.toLowerCase()))
    .filter(Boolean);
}

function joinList(items) {
  if (items.length <= 2) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function summaryFromMarkdown(markdown) {
  const chunks = markdown
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk && !chunk.startsWith("#"));
  const first = chunks[0] ?? "";

  if (/:$/.test(first)) {
    const items = listItemsFromBlock(chunks[1] ?? "").slice(0, 5);
    if (items.length > 0) {
      return stripMarkdown(`${first.replace(/:\s*$/, "")} ${joinList(items)}.`);
    }
  }

  return stripMarkdown(first);
}

async function readProjectFiles(projectPath) {
  const files = {
    readme: path.join(projectPath, "README.md"),
    prototype: path.join(projectPath, "prototype.md"),
    evaluation: path.join(projectPath, "evaluation.md")
  };

  const [readme, prototype, evaluation] = await Promise.all([
    readFile(files.readme, "utf8"),
    readFile(files.prototype, "utf8"),
    readFile(files.evaluation, "utf8")
  ]);

  return { files, documents: { readme, prototype, evaluation } };
}

export async function listIdeas() {
  const entries = await readdir(PROJECTS_DIR, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory() && PROJECT_DIR_RE.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  const ideas = [];
  for (const dir of dirs) {
    const [, id, slug] = dir.match(PROJECT_DIR_RE);
    const projectPath = path.join(PROJECTS_DIR, dir);
    const { files, documents } = await readProjectFiles(projectPath);
    ideas.push({
      id,
      slug,
      title: titleFromMarkdown(documents.readme, slug.replaceAll("-", " ")),
      path: projectPath,
      files,
      summary: summaryFromMarkdown(documents.readme),
      documents
    });
  }

  return ideas;
}

export async function readIdea(idOrSlug) {
  const ideas = await listIdeas();
  const normalized = String(idOrSlug).toLowerCase();
  const padded = /^\d+$/.test(normalized) ? normalized.padStart(3, "0") : normalized;
  const idea = ideas.find(
    (candidate) =>
      candidate.id === padded ||
      candidate.slug === normalized ||
      `${candidate.id}-${candidate.slug}` === normalized
  );

  if (!idea) {
    throw new Error(`Unknown idea '${idOrSlug}'. Run 'massive-ideas list' to see valid ids.`);
  }

  return idea;
}

export { PROJECTS_DIR, REPO_ROOT };
