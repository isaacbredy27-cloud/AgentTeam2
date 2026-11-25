import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { makeHandler as agentsHandler } from "../../netlify/functions/agents.mts";
import { makeHandler as meHandler } from "../../netlify/functions/me.mts";
import { makeHandler as configHandler } from "../../netlify/functions/config.mts";
import { ADMIN, assertNoSecrets, PLAYER, ROOT, req, setup, SNEAKY } from "./helpers.ts";

describe("auth gate", () => {
  it("returns 401 with no token or a bad token", async () => {
    const { deps } = setup();
    expect((await agentsHandler(deps)(req("/api/agents"))).status).toBe(401);
    expect((await agentsHandler(deps)(req("/api/agents", { token: "not-a-real-token.x.y" }))).status).toBe(401);
  });
  it("returns 403 for a signed-in user without super_admin", async () => {
    const { deps } = setup();
    const r = await agentsHandler(deps)(req("/api/agents", { token: PLAYER }));
    expect(r.status).toBe(403);
    expect((await meHandler(deps)(req("/api/me", { token: PLAYER }))).status).toBe(403);
  });
  it("ignores super_admin in user_metadata", async () => {
    const { deps } = setup();
    expect((await agentsHandler(deps)(req("/api/agents", { token: SNEAKY }))).status).toBe(403);
  });
  it("returns 401 after sign-out (token revoked at Supabase)", async () => {
    const { deps, supabase } = setup();
    supabase.revoked.add(ADMIN);
    expect((await agentsHandler(deps)(req("/api/agents", { token: ADMIN }))).status).toBe(401);
  });
  it("returns 503 when Supabase is unreachable or not configured", async () => {
    const s = setup();
    s.setSupabaseDown(true);
    expect((await agentsHandler(s.deps)(req("/api/agents", { token: ADMIN }))).status).toBe(503);
    const t = setup({ env: { SUPABASE_URL: undefined } });
    expect((await agentsHandler(t.deps)(req("/api/agents", { token: ADMIN }))).status).toBe(503);
  });
  it("sets security headers on function responses", async () => {
    const { deps } = setup();
    const r = await agentsHandler(deps)(req("/api/agents"));
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

describe("/api/config", () => {
  it("returns only public values", async () => {
    const { deps, env } = setup();
    const r = await configHandler(deps)();
    const text = await r.text();
    expect(JSON.parse(text)).toEqual({ supabaseUrl: "https://proj.supabase.co", supabaseAnonKey: "anon-key-test", authReady: true });
    assertNoSecrets(text, env);
  });
});

describe("/api/agents", () => {
  it("lists every agent with model, personality and knowledge files", async () => {
    const { deps, env } = setup();
    const r = await agentsHandler(deps)(req("/api/agents", { token: ADMIN }));
    expect(r.status).toBe(200);
    const text = await r.text();
    assertNoSecrets(text, env);
    const { agents } = JSON.parse(text);
    const files = readdirSync(join(ROOT, ".claude/agents")).filter((f) => f.endsWith(".md"));
    expect(agents).toHaveLength(files.length);
    const hollis = agents.find((a: any) => a.name === "security-expert");
    expect(hollis).toMatchObject({ firstName: "Hollis", model: "opus", modelId: "claude-opus-5-5" });
    expect(hollis.personality).toMatch(/sceptical/);
    expect(hollis.knowledgeFiles).toContain("examples/path-rules.ts");
    expect(agents.find((a: any) => a.name === "opentdb-integration-expert").modelId).toBe("claude-haiku-5-5");
    expect(agents.find((a: any) => a.name === "frontend-engineer").modelId).toBe("claude-sonnet-5-5");
    expect(JSON.stringify(agents)).not.toContain("systemPrompt");
  });
});
