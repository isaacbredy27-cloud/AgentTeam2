// Which repo paths agents may change through the console (doc 04 §6, docs/plans/security.md).
// Deny wins over allow. Agents cannot edit this file: netlify/** is denied.
import { posix } from "node:path";

const ALLOW: RegExp[] = [
  /^src\//, /^public\//, /^docs\//, /^tests\//,
  /^index\.html$/, /^offline\.html$/,
  /^(agents|how-it-works|resources|guide)\/index\.html$/,
];
const DENY: RegExp[] = [
  /^netlify\//, /^netlify\.toml$/, /^\.claude\//, /^\.github\//,
  /^package(-lock)?\.json$/, /(^|\/)\.env/, /\.(pem|key)$/i, /^public\/sw\.js$/,
  /^scripts\//, /^vite\.config\./, /^knowledge\//,
];

export const MAX_FILES = 20;
export const MAX_FILE_BYTES = 200 * 1024;

export type PathCheck = { ok: true } | { ok: false; reason: string };

export function checkPath(p: unknown): PathCheck {
  if (typeof p !== "string" || p.length === 0 || p.length > 300) return { ok: false, reason: "bad length" };
  if (/[\u0000-\u001f\u007f\\%]/.test(p)) return { ok: false, reason: "forbidden character" };
  if (p.startsWith("/") || p.includes("//")) return { ok: false, reason: "not a clean relative path" };
  if (posix.normalize(p) !== p || p.split("/").includes("..")) return { ok: false, reason: "not normalized" };
  if (p.split("/").some((seg) => seg.startsWith("."))) return { ok: false, reason: "hidden segment" };
  if (DENY.some((r) => r.test(p))) return { ok: false, reason: "denied path" };
  if (!ALLOW.some((r) => r.test(p))) return { ok: false, reason: "not in allow-list" };
  return { ok: true };
}

export type FileChange = { path: string; action: "create" | "update" | "delete"; content: string };
export type ChangeCheck = { ok: true; summary: string; files: FileChange[] } | { ok: false; reason: string };

/** Validate the whole propose_change input. Never trust the model's output. */
export function checkChange(input: unknown): ChangeCheck {
  if (!input || typeof input !== "object") return { ok: false, reason: "Input must be an object." };
  const { summary, files } = input as { summary?: unknown; files?: unknown };
  if (typeof summary !== "string" || summary.trim().length === 0 || summary.length > 200) {
    return { ok: false, reason: "summary must be 1-200 characters." };
  }
  if (!Array.isArray(files) || files.length === 0) return { ok: false, reason: "files must be a non-empty array." };
  if (files.length > MAX_FILES) return { ok: false, reason: `At most ${MAX_FILES} files per proposal.` };
  const seen = new Set<string>();
  const out: FileChange[] = [];
  for (const f of files) {
    if (!f || typeof f !== "object") return { ok: false, reason: "Each file must be an object." };
    const { path, action, content } = f as Record<string, unknown>;
    const pc = checkPath(path);
    if (!pc.ok) return { ok: false, reason: `${String(path).slice(0, 80)}: ${pc.reason}.` };
    if (action !== "create" && action !== "update" && action !== "delete") {
      return { ok: false, reason: `${path}: action must be create, update or delete.` };
    }
    if (typeof content !== "string") return { ok: false, reason: `${path}: content must be a string.` };
    if (new TextEncoder().encode(content).length > MAX_FILE_BYTES) return { ok: false, reason: `${path}: file is over 200 KB.` };
    if (/\u0000/.test(content)) return { ok: false, reason: `${path}: text files only.` };
    if (seen.has(path as string)) return { ok: false, reason: `${path}: listed twice.` };
    seen.add(path as string);
    out.push({ path: path as string, action, content: action === "delete" ? "" : content });
  }
  return { ok: true, summary: summary.trim(), files: out };
}
