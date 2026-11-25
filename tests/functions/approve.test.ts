import { describe, expect, it } from "vitest";
import { makeHandler as chat } from "../../netlify/functions/chat.mts";
import { makeHandler as approve } from "../../netlify/functions/proposal-approve.mts";
import { makeHandler as reject } from "../../netlify/functions/proposal-reject.mts";
import { makeHandler as getOne } from "../../netlify/functions/proposal.mts";
import { ADMIN, assertNoSecrets, PLAYER, readSse, req, setup } from "./helpers.ts";

async function propose(s: ReturnType<typeof setup>) {
  const events = await readSse(await chat(s.deps)(req("/api/chat", { method: "POST", token: ADMIN, body: { agent: "orchestrator", messages: [{ role: "user", content: "propose" }] } })));
  return events.find((e) => e.event === "done")!.data.proposal.id as string;
}
const ctx = (id: string) => ({ params: { id } }) as any;
const approveReq = (id: string, token = ADMIN, body: unknown = { confirm: true }) =>
  req(`/api/proposals/${id}/approve`, { method: "POST", token, body });

describe("approve", () => {
  it("makes exactly one commit with force: false, then blocks a second approve", async () => {
    const s = setup();
    const id = await propose(s);
    const r1 = await approve(s.deps)(approveReq(id), ctx(id));
    const text = await r1.text();
    expect(r1.status).toBe(200);
    assertNoSecrets(text, s.env);
    const p = JSON.parse(text).proposal;
    expect(p.status).toBe("approved");
    expect(p.commitUrl).toBe(`https://github.com/owner/repo/commit/${p.commitSha}`);
    expect(s.github.commitsMade()).toHaveLength(1);
    expect(s.github.refUpdates()).toHaveLength(1);
    expect(s.github.refUpdates()[0].body.force).toBe(false);
    const tree = s.github.calls.find((c) => c.path.endsWith("/git/trees"))!.body.tree;
    expect(tree.map((t: any) => t.path)).toEqual([expect.stringMatching(/^docs\/console-demo-\d+\.md$/), "docs/plans/README.md"]);

    const r2 = await approve(s.deps)(approveReq(id), ctx(id));
    expect(r2.status).toBe(409);
    expect((await r2.json()).error).toMatch(/already approved/);
    expect(s.github.commitsMade()).toHaveLength(1);
    const audit = [...s.audit.dump().values()].map((a: any) => a.event);
    expect(audit).toEqual(expect.arrayContaining(["proposal", "approve"]));
  });

  it("lets only one of two simultaneous approvals commit", async () => {
    const s = setup();
    const id = await propose(s);
    const [a, b] = await Promise.all([approve(s.deps)(approveReq(id), ctx(id)), approve(s.deps)(approveReq(id), ctx(id))]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(s.github.commitsMade()).toHaveLength(1);
  });

  it("marks a proposal stale when a file changed, and commits nothing", async () => {
    const s = setup();
    const id = await propose(s);
    s.github.touch("docs/plans/README.md", "someone else changed this\n");
    const r = await approve(s.deps)(approveReq(id), ctx(id));
    expect(r.status).toBe(409);
    const body = await r.json();
    expect(body.proposal.status).toBe("stale");
    expect(body.proposal.staleFiles).toEqual(["docs/plans/README.md"]);
    expect(s.github.commitsMade()).toHaveLength(0);
    // A fresh proposal after the outside change commits fine.
    const id2 = await propose(s);
    expect((await approve(s.deps)(approveReq(id2), ctx(id2))).status).toBe(200);
  });

  it("retries once when main moves during the ref update", async () => {
    const s = setup();
    const id = await propose(s);
    s.github.failRefUpdates(1);
    const r = await approve(s.deps)(approveReq(id), ctx(id));
    expect(r.status).toBe(200);
    expect(s.github.refUpdates()).toHaveLength(2);
  });

  it("returns the proposal to pending when GitHub keeps failing", async () => {
    const s = setup();
    const id = await propose(s);
    s.github.failRefUpdates(5);
    expect((await approve(s.deps)(approveReq(id), ctx(id))).status).toBe(502);
    expect((await s.proposals.getWithMetadata(id, { type: "json" }))?.data.status).toBe("pending");
  });

  it("re-validates paths stored in the proposal", async () => {
    const s = setup();
    const id = await propose(s);
    const got = await s.proposals.getWithMetadata(id, { type: "json" });
    got!.data.files[0].path = "netlify/functions/chat.mts"; // tampered storage
    await s.proposals.setJSON(id, got!.data);
    const r = await approve(s.deps)(approveReq(id), ctx(id));
    expect(r.status).toBe(422);
    expect(s.github.commitsMade()).toHaveLength(0);
  });

  it("needs super_admin, a confirm flag, same origin and a valid ID", async () => {
    const s = setup();
    const id = await propose(s);
    expect((await approve(s.deps)(req(`/api/proposals/${id}/approve`, { method: "POST", body: { confirm: true } }), ctx(id))).status).toBe(401);
    expect((await approve(s.deps)(approveReq(id, PLAYER), ctx(id))).status).toBe(403);
    expect((await approve(s.deps)(approveReq(id, ADMIN, {}), ctx(id))).status).toBe(400);
    expect((await approve(s.deps)(req(`/api/proposals/${id}/approve`, { method: "POST", token: ADMIN, body: { confirm: true }, origin: "https://evil.example" }), ctx(id))).status).toBe(403);
    expect((await approve(s.deps)(approveReq("P-nope12"), ctx("P-nope12"))).status).toBe(404);
    expect((await approve(s.deps)(approveReq("../x"), ctx("../x"))).status).toBe(404);
    expect(s.github.commitsMade()).toHaveLength(0);
  });
});

describe("reject and read", () => {
  it("rejects once and blocks a later approve", async () => {
    const s = setup();
    const id = await propose(s);
    const r = await reject(s.deps)(req(`/api/proposals/${id}/reject`, { method: "POST", token: ADMIN, body: {} }), ctx(id));
    expect(r.status).toBe(200);
    expect((await approve(s.deps)(approveReq(id), ctx(id))).status).toBe(409);
    expect(s.github.commitsMade()).toHaveLength(0);
    const g = await getOne(s.deps)(req(`/api/proposals/${id}`, { token: ADMIN }), ctx(id));
    expect((await g.json()).proposal.status).toBe("rejected");
  });
});
