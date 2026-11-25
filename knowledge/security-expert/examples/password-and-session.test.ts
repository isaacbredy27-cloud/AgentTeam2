import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, newSessionId, signSession, verifySession, sessionCookie, csrfOk } from "./password-and-session.ts";

test("scrypt hash verifies the right password only", async () => {
  const stored = await hashPassword("correct horse battery staple");
  assert.match(stored, /^scrypt\$/);
  assert.equal(await verifyPassword("correct horse battery staple", stored), true);
  assert.equal(await verifyPassword("wrong", stored), false);
  assert.equal(await verifyPassword("x", "garbage"), false);
});

test("signed session round-trips and rejects tampering", () => {
  const id = newSessionId();
  const v = signSession(id, "s3cret");
  assert.equal(verifySession(v, "s3cret"), id);
  assert.equal(verifySession(v, "other-secret"), null);
  assert.equal(verifySession(v.slice(0, -2) + "xx", "s3cret"), null);
  assert.match(sessionCookie(v), /HttpOnly; Secure; SameSite=Strict; Path=\/api; Max-Age=28800$/);
});

test("CSRF gate needs header, origin and no cross-site fetch", () => {
  const site = "https://trivia.example";
  const mk = (h: Record<string, string>) => new Request(site + "/api/x", { method: "POST", headers: h });
  assert.equal(csrfOk(mk({ "x-console": "1", origin: site, "sec-fetch-site": "same-origin" }), site), true);
  assert.equal(csrfOk(mk({ origin: site }), site), false);
  assert.equal(csrfOk(mk({ "x-console": "1", origin: "https://evil.example" }), site), false);
  assert.equal(csrfOk(mk({ "x-console": "1", origin: site, "sec-fetch-site": "cross-site" }), site), false);
});
