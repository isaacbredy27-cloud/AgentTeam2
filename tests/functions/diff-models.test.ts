import { describe, expect, it } from "vitest";
import { unifiedDiff } from "../../netlify/lib/diff.ts";
import { resolveModel } from "../../netlify/lib/models.ts";
import { parseAgentFile } from "../../netlify/lib/agents.ts";

describe("unifiedDiff", () => {
  it("shows added and removed lines", () => {
    const d = unifiedDiff("a.txt", "one\ntwo\nthree\n", "one\n2\nthree\nfour\n");
    expect(d).toContain("--- a/a.txt");
    expect(d).toContain("-two");
    expect(d).toContain("+2");
    expect(d).toContain("+four");
    expect(d).toContain(" one");
  });
  it("handles create and delete", () => {
    expect(unifiedDiff("n.md", null, "hi\n")).toContain("--- /dev/null");
    expect(unifiedDiff("n.md", "bye\n", null)).toContain("+++ /dev/null");
    expect(unifiedDiff("n.md", "bye\n", null)).toContain("-bye");
  });
  it("keeps every change in large files", () => {
    const a = Array.from({ length: 3000 }, (_, i) => `line ${i}`).join("\n");
    const b = a.replace("line 10\n", "line ten\n").replace("line 2990", "line end");
    const d = unifiedDiff("big.txt", a, b);
    expect(d).toContain("+line ten");
    expect(d).toContain("+line end");
    expect(d.split("\n").filter((l) => l.startsWith("@@")).length).toBe(2);
  });
});

describe("resolveModel", () => {
  it.each([
    ["opus", "claude-opus-5-5"], ["sonnet", "claude-sonnet-5-5"], ["haiku", "claude-haiku-5-5"],
    ["inherit", "claude-opus-5-5"], [undefined, "claude-opus-5-5"], ["claude-sonnet-5-5", "claude-sonnet-5-5"],
  ])("%s -> %s", (v, id) => expect(resolveModel(v as string | undefined)).toBe(id));
  it("rejects unknown full IDs", () => expect(resolveModel("gpt-9")).toBeNull());
});

describe("parseAgentFile", () => {
  it("reads quoted descriptions and the body", () => {
    const p = parseAgentFile('---\nname: x\ndescription: "Ada, the tester. Uses \\"quotes\\"."\nmodel: haiku\n---\n\nBody here.\n');
    expect(p?.fields).toMatchObject({ name: "x", model: "haiku", description: 'Ada, the tester. Uses "quotes".' });
    expect(p?.body).toBe("Body here.");
  });
});

describe("unifiedDiff invariants", () => {
  it("accounts for every line on random inputs", () => {
    let seed = 7;
    const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed % n; };
    for (let t = 0; t < 400; t++) {
      const a = Array.from({ length: rnd(12) }, () => "l" + rnd(4));
      const b = Array.from({ length: rnd(12) }, () => "l" + rnd(4));
      const d = unifiedDiff("f", a.length ? a.join("\n") + "\n" : "", b.length ? b.join("\n") + "\n" : "");
      const body = d.split("\n").slice(2).filter((l) => !l.startsWith("@@") && l !== "(no changes)");
      const plus = body.filter((l) => l.startsWith("+")).length;
      const minus = body.filter((l) => l.startsWith("-")).length;
      expect(a.length - minus).toBe(b.length - plus);
    }
  });
});
