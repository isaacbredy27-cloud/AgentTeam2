import { describe, expect, it } from "vitest";
import { checkChange, checkPath } from "../../netlify/lib/paths.ts";

describe("path rules", () => {
  it.each([
    "src/ui/topic.ts", "docs/notes.md", "public/icons/x.png", "tests/unit/a.test.ts", "index.html",
    "guide/index.html", "offline.html",
  ])("allows %s", (p) => expect(checkPath(p)).toEqual({ ok: true }));

  it.each([
    "../x", "/etc/passwd", "src/../netlify.toml", "netlify/functions/chat.mts", "netlify/lib/paths.ts",
    ".github/workflows/ci.yml", "package.json", "package-lock.json", ".env", "src/.env.local", "public/sw.js",
    "src\\x.ts", "src/%2e%2e/x", "src//x.ts", ".claude/agents/orchestrator.md", "src/key.pem", "scripts/build-sw.mjs",
    "vite.config.ts", "knowledge/orchestrator/docs/a.md", "README.md", "src/.hidden/x.ts", "src/x\u0000.ts", "", "a".repeat(301),
  ])("denies %j", (p) => expect(checkPath(p).ok).toBe(false));

  it("limits file count and size", () => {
    const files = Array.from({ length: 21 }, (_, i) => ({ path: `docs/f${i}.md`, action: "create", content: "x" }));
    expect(checkChange({ summary: "s", files }).ok).toBe(false);
    expect(checkChange({ summary: "s", files: [{ path: "docs/a.md", action: "create", content: "x".repeat(200 * 1024 + 1) }] }).ok).toBe(false);
    expect(checkChange({ summary: "s", files: [{ path: "docs/a.md", action: "create", content: "ok" }] }).ok).toBe(true);
  });

  it("rejects bad actions, duplicates and empty summaries", () => {
    expect(checkChange({ summary: "s", files: [{ path: "docs/a.md", action: "chmod", content: "" }] }).ok).toBe(false);
    expect(checkChange({ summary: "s", files: [{ path: "docs/a.md", action: "create", content: "" }, { path: "docs/a.md", action: "update", content: "" }] }).ok).toBe(false);
    expect(checkChange({ summary: " ", files: [{ path: "docs/a.md", action: "create", content: "" }] }).ok).toBe(false);
    expect(checkChange(null).ok).toBe(false);
  });
});
