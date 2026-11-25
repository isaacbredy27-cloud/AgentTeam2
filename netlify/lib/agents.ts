// Read agent files from .claude/agents and their knowledge folders.
// Agents are looked up by name only, never by a path from the client.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveModel } from "./models.ts";

export type AgentInfo = {
  name: string;          // slug, e.g. "security-expert"
  firstName: string;     // e.g. "Hollis"
  description: string;
  model: string;         // value in the file, e.g. "opus"
  modelId: string;       // API ID, e.g. "claude-opus-5-5"
  personality: string;   // text of the "## Personality" section
  knowledgeFiles: string[]; // paths relative to knowledge/<name>/
};
export type Agent = AgentInfo & { systemPrompt: string };

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function parseAgentFile(text: string): { fields: Record<string, string>; body: string } | null {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return null;
  const fields: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"') && v.endsWith('"') && v.length >= 2) {
      try { v = JSON.parse(v); } catch { v = v.slice(1, -1); }
    } else if (v.startsWith("'") && v.endsWith("'") && v.length >= 2) v = v.slice(1, -1).replace(/''/g, "'");
    fields[kv[1]] = v;
  }
  return { fields, body: m[2].trim() };
}

function section(body: string, heading: string): string {
  const re = new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m");
  return (re.exec(body)?.[1] ?? "").trim();
}

async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return []; }
  const out: string[] = [];
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listFiles(join(dir, e.name), rel)));
    else if (e.isFile()) out.push(rel);
  }
  return out;
}

export async function knowledgeFiles(root: string, name: string): Promise<string[]> {
  const base = join(root, "knowledge", name);
  return [
    ...(await listFiles(join(base, "docs"), "docs")),
    ...(await listFiles(join(base, "examples"), "examples")),
  ];
}

export async function loadAgents(root: string): Promise<Agent[]> {
  const dir = join(root, ".claude", "agents");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  const agents: Agent[] = [];
  for (const f of files) {
    const parsed = parseAgentFile(await readFile(join(dir, f), "utf8"));
    if (!parsed) continue;
    const { fields, body } = parsed;
    const name = fields.name ?? "";
    if (!NAME_RE.test(name)) continue;
    const modelId = resolveModel(fields.model);
    if (!modelId) continue; // unknown full model ID: not on the allow-list
    const description = fields.description ?? "";
    agents.push({
      name,
      firstName: /^([A-Z][a-z]+),/.exec(description)?.[1] ?? name,
      description,
      model: fields.model ?? "inherit",
      modelId,
      personality: section(body, "Personality"),
      knowledgeFiles: await knowledgeFiles(root, name),
      systemPrompt: body,
    });
  }
  return agents;
}

export async function findAgent(root: string, name: string): Promise<Agent | null> {
  if (!NAME_RE.test(name)) return null;
  return (await loadAgents(root)).find((a) => a.name === name) ?? null;
}

export const publicInfo = ({ systemPrompt: _s, ...info }: Agent): AgentInfo => info;

const MAX_KNOWLEDGE_BYTES = 160 * 1024;

/** The agent's knowledge files as one text block for the system prompt. */
export async function knowledgeContext(root: string, agent: AgentInfo): Promise<string> {
  const parts: string[] = [];
  let used = 0;
  for (const rel of agent.knowledgeFiles) {
    let text: string;
    try { text = await readFile(join(root, "knowledge", agent.name, rel), "utf8"); } catch { continue; }
    if (text.includes("\u0000")) continue;
    const block = `<file path="knowledge/${agent.name}/${rel}">\n${text}\n</file>`;
    if (used + block.length > MAX_KNOWLEDGE_BYTES) { parts.push(`<!-- more files omitted: size cap -->`); break; }
    parts.push(block);
    used += block.length;
  }
  return parts.join("\n\n");
}
