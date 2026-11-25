import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchRound, MIN_GAP_MS } from "./fetch-round.ts";
import { readFileSync } from "node:fs";
import { decodeQuestion } from "./decode.ts";

function fakeApi(replies: Record<string, any[]>) {
  const urls: string[] = [];
  const sleeps: number[] = [];
  return {
    urls, sleeps,
    deps: {
      fetch: async (url: string) => {
        urls.push(url);
        const key = Object.keys(replies).find((k) => url.includes(k))!;
        const body = replies[key].shift();
        return { json: async () => body };
      },
      sleep: async (ms: number) => { sleeps.push(ms); },
    },
  };
}

const q = (n: number) => ({
  type: "multiple", difficulty: "easy", category: "General%20Knowledge",
  question: `Q${n}`, correct_answer: "A", incorrect_answers: ["B", "C", "D"],
});

test("happy path: token, then 50 questions, with a 5 s gap", async () => {
  const api = fakeApi({
    "api_token.php?command=request": [{ response_code: 0, token: "T1" }],
    "api.php": [{ response_code: 0, results: Array.from({ length: 50 }, (_, i) => q(i)) }],
  });
  const r = await fetchRound(9, api.deps);
  assert.ok(r.ok);
  assert.equal(r.questions.length, 50);
  assert.match(api.urls[1], /amount=50&category=9&encode=url3986&token=T1/);
  assert.deepEqual(api.sleeps, [MIN_GAP_MS]);
});

test("code 1 falls back to the category count", async () => {
  const api = fakeApi({
    "api.php": [{ response_code: 1, results: [] }, { response_code: 0, results: Array.from({ length: 20 }, (_, i) => q(i)) }],
    "api_count.php": [{ category_id: 30, category_question_count: { total_question_count: 20 } }],
  });
  const r = await fetchRound(30, api.deps, "T1");
  assert.ok(r.ok);
  assert.equal(r.requested, 20);
  assert.match(api.urls.at(-1)!, /amount=20/);
  assert.equal(api.sleeps.length, api.urls.length - 1); // every call after the first waited
});

test("code 4 resets the token, code 5 retries, code 2 stops", async () => {
  const api = fakeApi({
    "api.php": [{ response_code: 4 }, { response_code: 5 }, { response_code: 0, results: [q(1)] }],
    "command=reset": [{ response_code: 0 }],
  });
  const r = await fetchRound(9, api.deps, "T1");
  assert.ok(r.ok);
  assert.ok(api.urls.some((u) => u.includes("command=reset&token=T1")));

  const bad = fakeApi({ "api.php": [{ response_code: 2 }] });
  assert.deepEqual(await fetchRound(9, bad.deps, "T1"), { ok: false, reason: "invalid-parameter" });
});

test("decodes a real response captured from opentdb.com (category 30)", () => {
  const body = JSON.parse(readFileSync(new URL("./fixture-category-30.json", import.meta.url), "utf8"));
  const [a, b] = body.results.map(decodeQuestion);
  assert.equal(a.category, "Science: Gadgets");
  assert.equal(a.correct, "James Watt");
  assert.equal(b.type, "boolean");
  assert.deepEqual(b.incorrect, ["True"]);
});
