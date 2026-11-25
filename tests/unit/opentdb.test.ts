import { describe, expect, it } from "vitest";
import { decodeQuestion, fetchRound, getCategories, warmToken, FALLBACK_CATEGORIES, MIN_GAP_MS, type Deps } from "../../src/api/opentdb.ts";

const enc = encodeURIComponent;
const q = (i: number, type = "multiple") => ({
  type, difficulty: "easy", category: enc("General Knowledge"), question: enc(`Q${i} "quoted" & π 🎉?`),
  correct_answer: enc(type === "boolean" ? "True" : `A${i}`), incorrect_answers: type === "boolean" ? ["False"] : ["x", "y", "z"].map(enc),
});

function memory(): Deps["storage"] & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

/** Scripted fetch with a fake clock. Records URLs and the time of each call. */
function fake(responses: Record<string, any[]>, storage = memory()) {
  let t = 1_000_000;
  const calls: { url: string; at: number }[] = [];
  const deps: Deps = {
    now: () => t,
    sleep: async (ms) => { t += ms; },
    storage,
    fetch: async (url) => {
      calls.push({ url, at: t });
      const key = Object.keys(responses).find((k) => url.includes(k));
      if (!key) throw new TypeError("network down");
      const list = responses[key];
      const body = list.length > 1 ? list.shift() : list[0];
      if (body instanceof Error) throw body;
      return { ok: true, json: async () => body };
    },
  };
  return { deps, calls, storage, tick: (ms: number) => { t += ms; } };
}

const token = { "command=request": [{ response_code: 0, token: "TOK" }] };

describe("decodeQuestion", () => {
  it("decodes url3986 text, quotes, symbols and emoji", () => {
    expect(decodeQuestion(q(1) as any)?.text).toBe('Q1 "quoted" & π 🎉?');
  });
  it("drops malformed items", () => {
    expect(decodeQuestion({ ...q(1), question: "%E0%A4%A" } as any)).toBeNull();
    expect(decodeQuestion({ ...q(1), type: "essay" } as any)).toBeNull();
  });
});

describe("getCategories", () => {
  it("uses the live list and caches it", async () => {
    const f = fake({ api_category: [{ trivia_categories: [{ id: 22, name: "Geography" }, { id: 9, name: "General Knowledge" }] }] });
    expect(await getCategories(f.deps)).toEqual({ source: "live", categories: [{ id: 9, name: "General Knowledge" }, { id: 22, name: "Geography" }] });
    expect((await getCategories(f.deps)).source).toBe("cache");
    expect(f.calls).toHaveLength(1);
  });
  it("falls back to the built-in list offline", async () => {
    const f = fake({});
    const r = await getCategories(f.deps);
    expect(r.source).toBe("fallback");
    expect(r.categories).toHaveLength(24);
    expect(r.categories).toBe(FALLBACK_CATEGORIES);
  });
  it("uses an old cache when the network fails", async () => {
    const f = fake({ api_category: [{ trivia_categories: [{ id: 9, name: "General Knowledge" }] }, new TypeError("down")] });
    await getCategories(f.deps);
    f.tick(25 * 3600 * 1000);
    expect((await getCategories(f.deps)).source).toBe("cache");
  });
});

describe("fetchRound", () => {
  it("code 0: returns 50 decoded questions with a token and no type filter", async () => {
    const f = fake({ ...token, "api.php": [{ response_code: 0, results: Array.from({ length: 50 }, (_, i) => q(i)) }] });
    const r = await fetchRound(9, f.deps);
    expect(r.ok && r.questions.length).toBe(50);
    const url = f.calls.find((c) => c.url.includes("api.php"))!.url;
    expect(url).toContain("amount=50");
    expect(url).toContain("category=9");
    expect(url).toContain("encode=url3986");
    expect(url).toContain("token=TOK");
    expect(url).not.toContain("type=");
  });

  it("keeps at least 5 seconds between calls", async () => {
    const f = fake({ ...token, "api.php": [{ response_code: 5 }, { response_code: 5 }, { response_code: 0, results: [q(1)] }] });
    const r = await fetchRound(9, f.deps);
    expect(r.ok).toBe(true);
    for (let i = 1; i < f.calls.length; i++) expect(f.calls[i].at - f.calls[i - 1].at).toBeGreaterThanOrEqual(MIN_GAP_MS);
  });

  it("code 1: asks the count endpoint and retries with fewer questions", async () => {
    const f = fake({
      ...token,
      "api.php?amount=50": [{ response_code: 1, results: [] }],
      api_count: [{ category_id: 30, category_question_count: { total_question_count: 40 } }],
      "api.php?amount=40": [{ response_code: 0, results: Array.from({ length: 40 }, (_, i) => q(i, i % 2 ? "boolean" : "multiple")) }],
    });
    const r = await fetchRound(30, f.deps);
    expect(r).toMatchObject({ ok: true, requested: 40, available: 40 });
    expect(r.ok && r.questions.length).toBe(40);
  });

  it("code 2: invalid parameter", async () => {
    const f = fake({ ...token, "api.php": [{ response_code: 2 }] });
    expect(await fetchRound(9, f.deps)).toEqual({ ok: false, reason: "invalid-parameter" });
  });

  it("code 3: gets a new token and retries once", async () => {
    const f = fake({ "command=request": [{ response_code: 0, token: "OLD" }, { response_code: 0, token: "NEW" }], "api.php": [{ response_code: 3 }, { response_code: 0, results: [q(1)] }] });
    const r = await fetchRound(9, f.deps);
    expect(r.ok).toBe(true);
    expect(f.calls.at(-1)!.url).toContain("token=NEW");
  });

  it("code 4: resets the token and retries once", async () => {
    const f = fake({ ...token, "command=reset": [{ response_code: 0 }], "api.php": [{ response_code: 4 }, { response_code: 0, results: [q(1)] }] });
    expect((await fetchRound(9, f.deps)).ok).toBe(true);
    expect(f.calls.some((c) => c.url.includes("command=reset&token=TOK"))).toBe(true);
  });

  it("code 5 forever: gives up with rate-limited", async () => {
    const f = fake({ ...token, "api.php": [{ response_code: 5 }] });
    expect(await fetchRound(9, f.deps)).toEqual({ ok: false, reason: "rate-limited" });
  });

  it("reports network errors and aborts", async () => {
    expect(await fetchRound(9, fake({}).deps)).toEqual({ ok: false, reason: "network" });
    const ctrl = new AbortController();
    ctrl.abort();
    const f = fake({ ...token, "api.php": [{ response_code: 0, results: [q(1)] }] });
    expect(await fetchRound(9, f.deps, { signal: ctrl.signal })).toEqual({ ok: false, reason: "aborted" });
  });

  it("reuses a saved token instead of requesting a new one", async () => {
    const f = fake({ ...token, "api.php": [{ response_code: 0, results: [q(1)] }] });
    await fetchRound(9, f.deps);
    await fetchRound(9, f.deps);
    expect(f.calls.filter((c) => c.url.includes("command=request"))).toHaveLength(1);
  });

  it("any topic omits the category", async () => {
    const f = fake({ ...token, "api.php": [{ response_code: 0, results: [q(1)] }] });
    await fetchRound(null, f.deps);
    expect(f.calls.at(-1)!.url).not.toContain("category=");
  });
});

describe("shared 5-second gate", () => {
  it("spaces categories, token warm-up and the round, and reuses the warm token", async () => {
    const f = fake({ api_category: [{ trivia_categories: [{ id: 9, name: "GK" }] }], ...token, "api.php": [{ response_code: 0, results: [q(1)] }] });
    await getCategories(f.deps);
    await warmToken(f.deps);
    await fetchRound(9, f.deps);
    expect(f.calls.map((c) => c.url.split("/").pop()!.split("?")[0])).toEqual(["api_category.php", "api_token.php", "api.php"]);
    for (let i = 1; i < f.calls.length; i++) expect(f.calls[i].at - f.calls[i - 1].at).toBeGreaterThanOrEqual(MIN_GAP_MS);
  });
  it("queues a warm-up and a round started at the same time", async () => {
    const f = fake({ ...token, "api.php": [{ response_code: 0, results: [q(1)] }] });
    const [, r] = await Promise.all([warmToken(f.deps), fetchRound(9, f.deps)]);
    expect(r.ok).toBe(true);
    expect(f.calls.filter((c) => c.url.includes("command=request"))).toHaveLength(1);
    for (let i = 1; i < f.calls.length; i++) expect(f.calls[i].at - f.calls[i - 1].at).toBeGreaterThanOrEqual(MIN_GAP_MS);
  });
  it("does not wait after a request that never reached the API", async () => {
    const f = fake({ "api.php": [{ response_code: 0, results: [q(1)] }] }); // token request fails: network
    const r = await fetchRound(9, f.deps);
    expect(r.ok).toBe(true);
    expect(f.calls[1].at - f.calls[0].at).toBe(0);
  });
});
