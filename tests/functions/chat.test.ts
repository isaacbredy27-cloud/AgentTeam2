import { describe, expect, it } from "vitest";
import { makeHandler } from "../../netlify/functions/chat.mts";
import { ADMIN, assertNoSecrets, PLAYER, readSse, req, setup } from "./helpers.ts";

const body = (text: string, agent = "security-expert") => ({ agent, messages: [{ role: "user", content: text }] });

describe("/api/chat", () => {
  it("streams a reply with the agent's prompt, knowledge and model", async () => {
    const { deps, anthropic, env } = setup();
    const r = await makeHandler(deps)(req("/api/chat", { method: "POST", token: ADMIN, body: body("hello") }));
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("text/event-stream");
    const events = await readSse(r);
    const text = events.filter((e) => e.event === "text").map((e) => e.data.text).join("");
    expect(text).toContain("I'm Hollis");
    expect(events.at(-1)?.event).toBe("done");
    const call = anthropic.calls[0];
    expect(call.model).toBe("claude-opus-5-5");
    expect(call.system[0].text).toContain("You are Hollis, the security expert.");
    expect(call.system[0].text).toContain("Agent Console rules");
    expect(call.system[1].text).toContain('knowledge/security-expert/examples/path-rules.ts');
    expect(call.tools.map((t: any) => t.name)).toEqual(["propose_change"]);
    expect(call.tool_choice.type).toBe("auto");
    assertNoSecrets(JSON.stringify(events), env);
  });

  it("uses each agent's own model", async () => {
    const { deps, anthropic } = setup();
    await (await makeHandler(deps)(req("/api/chat", { method: "POST", token: ADMIN, body: body("hi", "opentdb-integration-expert") }))).text();
    await (await makeHandler(deps)(req("/api/chat", { method: "POST", token: ADMIN, body: body("hi", "qa-engineer") }))).text();
    expect(anthropic.calls.map((c) => c.model)).toEqual(["claude-haiku-5-5", "claude-sonnet-5-5"]);
  });

  it("turns propose_change into a pending proposal with a diff", async () => {
    const { deps, proposals } = setup();
    const events = await readSse(await makeHandler(deps)(req("/api/chat", { method: "POST", token: ADMIN, body: body("please propose a change") })));
    const done = events.find((e) => e.event === "done")!.data;
    expect(done.stopReason).toBe("tool_use");
    expect(done.proposal.status).toBe("pending");
    expect(done.proposal.files.map((f: any) => f.path)).toEqual([expect.stringMatching(/^docs\/console-demo-\d+\.md$/), "docs/plans/README.md"]);
    expect(done.proposal.files[0].baseSha).toBeNull();
    expect(done.proposal.files[1].baseSha).toMatch(/^[0-9a-f]{40}$/);
    expect(done.proposal.files[1].diff).toContain("+Updated from the console.");
    expect(done.toolResult).toMatchObject({ type: "tool_result", content: expect.stringContaining("Waiting for human approval") });
    expect(done.toolResult.tool_use_id).toBe(done.assistantContent[1].id);
    expect((await proposals.getWithMetadata(done.proposal.id, { type: "json" }))?.data.status).toBe("pending");
  });

  it("blocks a proposal to a denied path and tells the model", async () => {
    const { deps, proposals } = setup();
    const events = await readSse(await makeHandler(deps)(req("/api/chat", { method: "POST", token: ADMIN, body: body("bad path please") })));
    const done = events.find((e) => e.event === "done")!.data;
    expect(done.proposal).toBeNull();
    expect(done.toolResult.is_error).toBe(true);
    expect(done.toolResult.content).toContain("denied path");
    expect(proposals.dump().size).toBe(0);
  });

  it("maps Claude errors to a friendly message", async () => {
    const { deps } = setup();
    const events = await readSse(await makeHandler(deps)(req("/api/chat", { method: "POST", token: ADMIN, body: body("fail now") })));
    expect(events.at(-1)).toEqual({ event: "error", data: { message: "The Claude service is busy. Try again soon." } });
  });

  it("checks auth, origin, content type and input", async () => {
    const { deps } = setup();
    const h = makeHandler(deps);
    expect((await h(req("/api/chat", { method: "POST", body: body("x") }))).status).toBe(401);
    expect((await h(req("/api/chat", { method: "POST", token: PLAYER, body: body("x") }))).status).toBe(403);
    expect((await h(req("/api/chat", { method: "POST", token: ADMIN, body: body("x"), origin: "https://evil.example" }))).status).toBe(403);
    expect((await h(req("/api/chat", { method: "POST", token: ADMIN, body: "agent=x", contentType: "text/plain" }))).status).toBe(415);
    expect((await h(req("/api/chat", { method: "POST", token: ADMIN, body: body("x", "../../etc/passwd") }))).status).toBe(404);
    expect((await h(req("/api/chat", { method: "POST", token: ADMIN, body: { agent: "qa-engineer", messages: [{ role: "assistant", content: "x" }] } }))).status).toBe(400);
    expect((await h(req("/api/chat", { method: "POST", token: ADMIN, body: { agent: "qa-engineer", messages: [{ role: "user", content: "x".repeat(210 * 1024) }] } }))).status).toBe(413);
  });

  it("explains when the Claude key is missing", async () => {
    const { deps } = setup({ env: { ANTHROPIC_API_KEY: undefined } });
    const events = await readSse(await makeHandler(deps)(req("/api/chat", { method: "POST", token: ADMIN, body: body("hi") })));
    expect(events[0].event).toBe("error");
  });
});
