import { test } from "node:test";
import assert from "node:assert/strict";
import { commitToMain } from "./commit-files.ts";

function fakeGitHub(opts: { refConflict?: boolean } = {}) {
  const calls: { method: string; url: string; body: any; auth: string }[] = [];
  const gh = async (url: string, init: any = {}) => {
    const method = init.method ?? "GET";
    calls.push({ method, url, body: init.body && JSON.parse(init.body), auth: init.headers?.Authorization });
    const ok = (s: number, j: object) => new Response(JSON.stringify(j), { status: s });
    if (url.endsWith("/git/ref/heads/main")) return ok(200, { object: { sha: "parent1" } });
    if (url.endsWith("/git/commits/parent1")) return ok(200, { sha: "parent1", tree: { sha: "tree0" } });
    if (url.endsWith("/git/trees")) return ok(201, { sha: "tree1" });
    if (url.endsWith("/git/commits")) return ok(201, { sha: "commit1" });
    if (url.endsWith("/git/refs/heads/main")) return opts.refConflict ? ok(422, { message: "not fast forward" }) : ok(200, {});
    return ok(404, {});
  };
  return { gh, calls };
}

const repo = { owner: "acme", name: "trivia", token: "github_pat_TEST" };

test("one commit: ref → commit → tree → commit → fast-forward ref", async () => {
  const { gh, calls } = fakeGitHub();
  const sha = await commitToMain(gh, repo, "Agent change", [
    { path: "src/a.ts", action: "update", content: "a" },
    { path: "docs/old.md", action: "delete", content: "" },
  ]);
  assert.equal(sha, "commit1");
  assert.deepEqual(calls.map((c) => `${c.method} ${c.url.split("/trivia")[1]}`), [
    "GET /git/ref/heads/main", "GET /git/commits/parent1", "POST /git/trees", "POST /git/commits", "PATCH /git/refs/heads/main",
  ]);
  assert.equal(calls[2].body.base_tree, "tree0");
  assert.equal(calls[2].body.tree[1].sha, null); // delete
  assert.deepEqual(calls[3].body.parents, ["parent1"]);
  assert.equal(calls[4].body.force, false);
  assert.ok(calls.every((c) => c.auth === "Bearer github_pat_TEST"));
});

test("a moved branch fails loudly instead of force-pushing", async () => {
  const { gh } = fakeGitHub({ refConflict: true });
  await assert.rejects(commitToMain(gh, repo, "x", [{ path: "src/a.ts", action: "update", content: "a" }]), /422/);
});
