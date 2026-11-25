import { test } from "node:test";
import assert from "node:assert/strict";
import { loadHistory, saveRound, bestByCategory } from "./history.ts";

function memory() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}
const blocked = {
  getItem: () => { throw new DOMException("blocked", "SecurityError"); },
  setItem: () => { throw new DOMException("blocked", "SecurityError"); },
};

test("saves and reads rounds, best score per category", () => {
  const s = memory();
  saveRound(s, { categoryId: 9, score: 30, total: 50, date: "2026-11-25" });
  saveRound(s, { categoryId: 9, score: 41, total: 50, date: "2026-11-25" });
  saveRound(s, { categoryId: 30, score: 22, total: 40, date: "2026-11-25" });
  assert.equal(loadHistory(s).length, 3);
  assert.deepEqual([...bestByCategory(loadHistory(s))], [[9, 41], [30, 22]]);
});

test("blocked storage never throws", () => {
  assert.deepEqual(loadHistory(blocked), []);
  assert.equal(saveRound(blocked, { categoryId: 9, score: 1, total: 50, date: "x" }), false);
  assert.deepEqual(loadHistory(undefined), []);
});

test("corrupt data is ignored", () => {
  const s = memory();
  s.setItem("trivia.history.v1", "{not json");
  assert.deepEqual(loadHistory(s), []);
  s.setItem("trivia.history.v1", JSON.stringify([{ categoryId: "9" }, { categoryId: 9, score: 3, total: 50, date: "d" }]));
  assert.equal(loadHistory(s).length, 1);
});
