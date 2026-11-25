// Commit several approved files to main in ONE commit via the Git data API.
type GhFetch = (url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) => Promise<Response>;

export type FileChange = { path: string; action: "create" | "update" | "delete"; content: string };

export async function commitToMain(gh: GhFetch, repo: { owner: string; name: string; token: string },
  message: string, files: FileChange[]): Promise<string> {
  const base = `https://api.github.com/repos/${repo.owner}/${repo.name}`;
  const headers = {
    Authorization: `Bearer ${repo.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
  };
  const call = async (path: string, method = "GET", body?: object) => {
    const res = await gh(base + path, { method, headers, body: body && JSON.stringify(body) });
    if (!res.ok) throw new Error(`GitHub ${method} ${path} failed: ${res.status}`);
    return res.json();
  };

  const ref = await call("/git/ref/heads/main");
  const parentSha: string = ref.object.sha;
  const parent = await call(`/git/commits/${parentSha}`);
  const tree = await call("/git/trees", "POST", {
    base_tree: parent.tree.sha,
    tree: files.map((f) =>
      f.action === "delete"
        ? { path: f.path, mode: "100644", type: "blob", sha: null }
        : { path: f.path, mode: "100644", type: "blob", content: f.content }),
  });
  const commit = await call("/git/commits", "POST", { message, tree: tree.sha, parents: [parentSha] });
  await call("/git/refs/heads/main", "PATCH", { sha: commit.sha, force: false });
  return commit.sha;
}
