// GitHub REST calls for proposals and Approve. Token stays server-side.
import type { FileChange } from "./paths.ts";

export type GitHubConfig = { fetch: typeof fetch; token?: string; owner?: string; repo?: string; branch?: string };
export class GitHubError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

const API = "https://api.github.com";

export function gitHubReady(cfg: GitHubConfig): boolean {
  return Boolean(cfg.token && cfg.owner && cfg.repo);
}

function client(cfg: GitHubConfig) {
  if (!gitHubReady(cfg)) throw new GitHubError(503, "GitHub is not set up.");
  const base = `${API}/repos/${encodeURIComponent(cfg.owner!)}/${encodeURIComponent(cfg.repo!)}`;
  const headers = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "trivia-agent-console",
  };
  return async (path: string, method = "GET", body?: unknown): Promise<{ status: number; data: any }> => {
    const res = await cfg.fetch(base + path, {
      method,
      headers: body ? { ...headers, "Content-Type": "application/json" } : headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    return { status: res.status, data };
  };
}

const branchOf = (cfg: GitHubConfig) => cfg.branch || "main";
const encPath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

/** Current text and blob SHA of a file on the branch, or null if it does not exist. */
export async function getFile(cfg: GitHubConfig, path: string): Promise<{ sha: string; content: string } | null> {
  const call = client(cfg);
  const r = await call(`/contents/${encPath(path)}?ref=${encodeURIComponent(branchOf(cfg))}`);
  if (r.status === 404) return null;
  if (r.status !== 200 || !r.data || Array.isArray(r.data) || typeof r.data.sha !== "string") {
    throw new GitHubError(r.status, "Could not read the file from GitHub.");
  }
  const bytes = Uint8Array.from(atob(String(r.data.content ?? "").replace(/\n/g, "")), (c) => c.charCodeAt(0));
  return { sha: r.data.sha, content: new TextDecoder().decode(bytes) };
}

/** One commit with every file, via the Git Data API. Never force. */
export async function commitFiles(cfg: GitHubConfig, message: string, files: FileChange[]): Promise<{ sha: string; url: string }> {
  const call = client(cfg);
  const branch = encodeURIComponent(branchOf(cfg));
  const ref = await call(`/git/ref/heads/${branch}`);
  if (ref.status !== 200) throw new GitHubError(ref.status, "Could not read the branch.");
  const parentSha: string = ref.data.object.sha;
  const parent = await call(`/git/commits/${parentSha}`);
  if (parent.status !== 200) throw new GitHubError(parent.status, "Could not read the last commit.");
  const tree = await call("/git/trees", "POST", {
    base_tree: parent.data.tree.sha,
    tree: files.map((f) =>
      f.action === "delete"
        ? { path: f.path, mode: "100644", type: "blob", sha: null }
        : { path: f.path, mode: "100644", type: "blob", content: f.content }),
  });
  if (tree.status !== 201) throw new GitHubError(tree.status, "Could not build the commit tree.");
  const commit = await call("/git/commits", "POST", { message, tree: tree.data.sha, parents: [parentSha] });
  if (commit.status !== 201) throw new GitHubError(commit.status, "Could not create the commit.");
  const upd = await call(`/git/refs/heads/${branch}`, "PATCH", { sha: commit.data.sha, force: false });
  if (upd.status !== 200) throw new GitHubError(upd.status, "The branch moved. Try again.");
  return { sha: commit.data.sha, url: `https://github.com/${cfg.owner}/${cfg.repo}/commit/${commit.data.sha}` };
}
