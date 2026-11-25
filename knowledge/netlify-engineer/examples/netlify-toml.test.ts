import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "smol-toml";

const cfg: any = parse(readFileSync(new URL("./netlify.toml", import.meta.url), "utf8"));
const header = (path: string, name: string) => cfg.headers.find((h: any) => h.for === path)?.values?.[name];

test("build and functions settings", () => {
  assert.equal(cfg.build.publish, "dist");
  assert.equal(cfg.functions.directory, "netlify/functions");
  assert.deepEqual(cfg.functions.included_files, [".claude/agents/**"]);
});

test("service worker is never cached and manifest has the right type", () => {
  assert.equal(header("/sw.js", "Cache-Control"), "no-cache");
  assert.equal(header("/manifest.webmanifest", "Content-Type"), "application/manifest+json");
});

test("CSP allows only self plus opentdb.com for fetches", () => {
  const csp: string = header("/*", "Content-Security-Policy");
  assert.match(csp, /connect-src 'self' https:\/\/opentdb\.com;/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
});

test("no secrets in netlify.toml (they would not reach functions anyway)", () => {
  assert.equal(cfg.build.environment, undefined);
});
