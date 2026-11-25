import { test } from "node:test";
import assert from "node:assert/strict";
import { shuffle, buildChoice, newScore, answer, percent } from "./game.ts";

test("shuffle keeps every item and is close to uniform", () => {
  const counts = [0, 0, 0, 0];
  for (let i = 0; i < 40000; i++) counts[shuffle(["a", "b", "c", "d"]).indexOf("a")]++;
  for (const c of counts) assert.ok(Math.abs(c - 10000) < 600, `position count ${c}`);
  assert.deepEqual(shuffle([1, 2, 3]).sort(), [1, 2, 3]);
});

test("boolean questions keep True, False order", () => {
  assert.deepEqual(buildChoice({ type: "boolean", correct: "False", incorrect: ["True"] }), { options: ["True", "False"], correctIndex: 1 });
});

test("correctIndex points at the right answer after shuffling", () => {
  const c = buildChoice({ type: "multiple", correct: "Mars", incorrect: ["Venus", "Jupiter", "Saturn"] });
  assert.equal(c.options[c.correctIndex], "Mars");
  assert.equal(c.options.length, 4);
});

test("scoring, streak and percentage", () => {
  const c = { options: ["A", "B"], correctIndex: 0 };
  let s = newScore();
  for (const pick of [0, 0, 1, 0, 0, 0]) s = answer(s, c, pick);
  assert.deepEqual(s, { correct: 5, answered: 6, streak: 3, bestStreak: 3 });
  assert.equal(percent(s), 83);
  assert.equal(percent(newScore()), 0);
});
