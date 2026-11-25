import { test } from "node:test";
import assert from "node:assert/strict";
import { makeHandler, config } from "./agents-function.mts";

const agents = [{ name: "qa-engineer", model: "sonnet", description: "Tests things." }];
const ctx = {} as any;

test("401 without a session, with security headers", async () => {
  const handler = makeHandler(async () => agents, async () => false);
  const res = await handler(new Request("https://x.test/api/agents"), ctx);
  assert.equal(res.status, 401);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
});

test("200 lists agents and never leaks env vars", async () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-should-never-leak";
  const handler = makeHandler(async () => agents, async () => true);
  const res = await handler(new Request("https://x.test/api/agents"), ctx);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(text).agents, agents);
  assert.doesNotMatch(text, /sk-ant-/);
  assert.deepEqual(config, { path: "/api/agents", method: "GET" });
});
