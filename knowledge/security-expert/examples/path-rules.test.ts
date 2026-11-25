import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPath } from "./path-rules.ts";

const allowed = ["src/ui/topic.ts", "docs/notes.md", "tests/quiz.test.ts", "index.html", "public/icons/icon-192.png"];
const denied = [
  "../x", "/etc/passwd", "src/../netlify.toml", "netlify/functions/chat.mts", "netlify.toml",
  ".github/workflows/ci.yml", ".claude/agents/orchestrator.md", "package.json", "package-lock.json",
  ".env", "src/.env.local", "public/sw.js", "src\\x.ts", "src/%2e%2e/x", "src//x.ts", "src/./x.ts",
  "src/a\u0000.ts", "README.md", "secrets/key.pem", "",
];

for (const p of allowed) test(`allows ${p}`, () => assert.deepEqual(checkPath(p), { ok: true }));
for (const p of denied) test(`denies ${JSON.stringify(p)}`, () => assert.equal(checkPath(p).ok, false));
