// Fake GitHub REST API for the Git Data and Contents calls the console makes.
// Records every call. Starts from the files on disk, so diffs look real.
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const blobSha = (content: string) => {
  const buf = Buffer.from(content, "utf8");
  return createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
};

export function fakeGitHub(opts: { root: string; owner: string; repo: string; branch?: string }) {
  const branch = opts.branch ?? "main";
  const files = new Map<string, string | null>(); // null = deleted
  const calls: { method: string; path: string; body?: any }[] = [];
  const trees = new Map<string, { base: string; entries: any[] }>();
  const commits = new Map<string, { tree: string; parents: string[]; message: string }>();
  let head = "c0".padEnd(40, "0");
  commits.set(head, { tree: "t0".padEnd(40, "0"), parents: [], message: "initial" });
  let n = 0;
  const id = (p: string) => (p + (++n).toString(16)).padEnd(40, "0");
  let failNextRefUpdate = 0;

  const read = (path: string): string | null => {
    if (files.has(path)) return files.get(path)!;
    const disk = join(opts.root, path);
    return existsSync(disk) ? readFileSync(disk, "utf8") : null;
  };
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const prefix = `/repos/${opts.owner}/${opts.repo}`;

  return {
    calls,
    commitsMade: () => calls.filter((c) => c.method === "POST" && c.path === `${prefix}/git/commits`),
    refUpdates: () => calls.filter((c) => c.method === "PATCH"),
    read,
    /** Simulate someone else pushing a change to a file. */
    touch(path: string, content: string) {
      files.set(path, content);
      const c = id("x");
      commits.set(c, { tree: id("t"), parents: [head], message: `outside change to ${path}` });
      head = c;
    },
    failRefUpdates(times: number) { failNextRefUpdate = times; },
    async handle(url: string, init: RequestInit = {}): Promise<Response> {
      const u = new URL(url);
      const method = (init.method ?? "GET").toUpperCase();
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, path: u.pathname, body });
      const auth = new Headers(init.headers).get("authorization");
      if (!auth?.startsWith("Bearer ")) return json(401, { message: "Requires authentication" });
      if (!u.pathname.startsWith(prefix)) return json(404, { message: "Not Found" });
      const p = u.pathname.slice(prefix.length);

      if (method === "GET" && p.startsWith("/contents/")) {
        const path = decodeURIComponent(p.slice("/contents/".length));
        const content = read(path);
        if (content === null) return json(404, { message: "Not Found" });
        return json(200, { type: "file", path, sha: blobSha(content), encoding: "base64", content: Buffer.from(content).toString("base64") });
      }
      if (method === "GET" && p === `/git/ref/heads/${branch}`) return json(200, { ref: `refs/heads/${branch}`, object: { sha: head, type: "commit" } });
      if (method === "GET" && p.startsWith("/git/commits/")) {
        const c = commits.get(p.slice("/git/commits/".length));
        return c ? json(200, { sha: p.slice(13), tree: { sha: c.tree }, parents: c.parents.map((s) => ({ sha: s })) }) : json(404, { message: "Not Found" });
      }
      if (method === "POST" && p === "/git/trees") {
        const t = id("t");
        trees.set(t, { base: body.base_tree, entries: body.tree });
        return json(201, { sha: t });
      }
      if (method === "POST" && p === "/git/commits") {
        const c = id("c");
        commits.set(c, { tree: body.tree, parents: body.parents, message: body.message });
        return json(201, { sha: c });
      }
      if (method === "PATCH" && p === `/git/refs/heads/${branch}`) {
        if (body.force !== false) return json(422, { message: "force must be false in this fake" });
        if (failNextRefUpdate > 0) { failNextRefUpdate--; return json(422, { message: "Update is not a fast forward" }); }
        const c = commits.get(body.sha);
        if (!c || c.parents[0] !== head) return json(422, { message: "Update is not a fast forward" });
        for (const e of trees.get(c.tree)?.entries ?? []) files.set(e.path, e.sha === null ? null : e.content);
        head = body.sha;
        return json(200, { ref: `refs/heads/${branch}`, object: { sha: head } });
      }
      return json(404, { message: "Not handled by fake" });
    },
  };
}
