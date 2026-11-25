// Validates .claude/agents and .claude/skills against the rules in docs/.
// Usage: node validate-team.mjs <repo-root>
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const root = process.argv[2] ?? ".";
const problems = [];
const front = (file) => {
  const text = readFileSync(file, "utf8");
  if (!text.startsWith("---\n")) { problems.push(`${file}: frontmatter must start on line 1`); return [{}, text]; }
  const end = text.indexOf("\n---", 4);
  return [parse(text.slice(4, end)) ?? {}, text.slice(end + 4)];
};

const AGENT_FIELDS = new Set(["name", "description", "tools", "disallowedTools", "model", "permissionMode", "maxTurns",
  "autoCompactWindow", "skills", "mcpServers", "hooks", "memory", "background", "omitClaudeMd", "effort", "isolation",
  "color", "initialPrompt", "experimental"]);

const skillsDir = join(root, ".claude/skills");
const skills = new Map();
for (const dir of readdirSync(skillsDir)) {
  const f = join(skillsDir, dir, "SKILL.md");
  if (!existsSync(f)) { problems.push(`${dir}: missing SKILL.md`); continue; }
  const [fm, body] = front(f);
  if (fm.name && fm.name !== dir) problems.push(`${dir}: name "${fm.name}" differs from folder`);
  if (!fm.description) problems.push(`${dir}: no description`);
  if (String(fm.description ?? "").length > 1536) problems.push(`${dir}: description over 1536 chars`);
  if (body.split("\n").length > 500) problems.push(`${dir}: SKILL.md over 500 lines`);
  skills.set(dir, fm);
}

const agentsDir = join(root, ".claude/agents");
const names = new Set();
for (const file of readdirSync(agentsDir).filter((f) => f.endsWith(".md"))) {
  const path = join(agentsDir, file);
  const [fm, body] = front(path);
  const tag = `agents/${file}`;
  for (const k of Object.keys(fm)) if (!AGENT_FIELDS.has(k)) problems.push(`${tag}: unknown field "${k}" (ignored silently)`);
  if (!fm.name || !fm.description) problems.push(`${tag}: needs name and description`);
  if (/[:]/.test(fm.name ?? "") || String(fm.name ?? "").startsWith("-")) problems.push(`${tag}: invalid name`);
  if (names.has(fm.name)) problems.push(`${tag}: duplicate name ${fm.name}`);
  names.add(fm.name);
  const list = fm.skills ?? [];
  if (list.length > 32) problems.push(`${tag}: more than 32 preloaded skills`);
  for (const s of list) {
    if (!skills.has(s)) problems.push(`${tag}: skill "${s}" does not exist`);
    else if (skills.get(s)["disable-model-invocation"]) problems.push(`${tag}: cannot preload "${s}" (disable-model-invocation)`);
  }
  const denied = String(fm.disallowedTools ?? "");
  if (fm.name !== "orchestrator" && !/\bAgent\b/.test(denied)) problems.push(`${tag}: experts must deny Agent`);
  if (fm.name !== "orchestrator" && !/\bSendMessage\b/.test(denied)) problems.push(`${tag}: experts must deny SendMessage`);
  if (!body.includes("## Before you answer") || !body.includes(`knowledge/${fm.name}/`)) problems.push(`${tag}: missing "Before you answer" section`);
  if (!existsSync(join(root, "knowledge", fm.name, "docs")) || !existsSync(join(root, "knowledge", fm.name, "examples"))) {
    problems.push(`${tag}: knowledge/${fm.name}/docs and /examples must exist`);
  }
}

console.log(`${names.size} agents, ${skills.size} skills checked.`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log("All checks passed.");
