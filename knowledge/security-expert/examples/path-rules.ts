// Validate a path an agent proposes to change. Deny wins over allow.
import { posix } from "node:path";

const ALLOW = [/^src\//, /^public\//, /^docs\//, /^tests\//, /^index\.html$/];
const DENY = [
  /^netlify\/functions\//, /^netlify\.toml$/, /^\.claude\//, /^\.github\//,
  /^package(-lock)?\.json$/, /(^|\/)\.env/, /\.(pem|key)$/, /^public\/sw\.js$/,
];

export type PathCheck = { ok: true } | { ok: false; reason: string };

export function checkPath(p: string): PathCheck {
  if (typeof p !== "string" || p.length === 0 || p.length > 300) return { ok: false, reason: "bad length" };
  if (/[\u0000-\u001f\u007f\\%]/.test(p)) return { ok: false, reason: "forbidden character" };
  if (p.startsWith("/") || p.includes("//")) return { ok: false, reason: "not a clean relative path" };
  if (posix.normalize(p) !== p || p.split("/").includes("..")) return { ok: false, reason: "not normalized" };
  if (p.split("/").some((seg) => seg.startsWith(".") && seg !== ".")) {
    return { ok: false, reason: "hidden segment" };
  }
  if (DENY.some((r) => r.test(p))) return { ok: false, reason: "denied path" };
  if (!ALLOW.some((r) => r.test(p))) return { ok: false, reason: "not in allow-list" };
  return { ok: true };
}
