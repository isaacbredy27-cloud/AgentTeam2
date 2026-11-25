import { describe, expect, it } from "vitest";
import { answerCurrent, buildChoice, isLast, newRound, next, shuffle, summary } from "../../src/quiz/game.ts";
import { bestByCategory, loadHistory, saveRound } from "../../src/quiz/storage.ts";

const mq = (correct: string, difficulty: "easy" | "medium" | "hard" = "easy") =>
  ({ type: "multiple" as const, difficulty, category: "c", text: "q", correct, incorrect: ["b", "c", "d"] });

describe("shuffle", () => {
  it("keeps every item, no duplicates", () => {
    const s = shuffle([1, 2, 3, 4, 5]);
    expect([...s].sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it("is roughly uniform", () => {
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 40000; i++) counts[shuffle(["a", "b", "c", "d"]).indexOf("a")]++;
    for (const c of counts) expect(Math.abs(c - 10000)).toBeLessThan(600);
  });
});

describe("buildChoice", () => {
  it("keeps True then False for boolean", () => {
    expect(buildChoice({ type: "boolean", correct: "False", incorrect: ["True"] })).toEqual({ options: ["True", "False"], correctIndex: 1 });
    expect(buildChoice({ type: "boolean", correct: "True", incorrect: ["False"] }, () => 0)).toEqual({ options: ["True", "False"], correctIndex: 0 });
  });
  it("tracks the correct index after shuffling", () => {
    const c = buildChoice(mq("a"));
    expect(c.options[c.correctIndex]).toBe("a");
    expect(c.options).toHaveLength(4);
  });
});

describe("round", () => {
  it("scores, streaks and summarises", () => {
    let r = newRound(9, "GK", [mq("a"), mq("a", "medium"), mq("a", "hard"), mq("a")]);
    const right = () => r.choices[r.index].correctIndex;
    const wrong = () => (right() + 1) % 4;
    r = answerCurrent(r, right()); r = next(r);
    r = answerCurrent(r, right()); r = answerCurrent(r, wrong()); // second answer ignored
    expect(r.streak).toBe(2);
    r = next(r); r = answerCurrent(r, wrong());
    expect(r.streak).toBe(0);
    r = next(r); r = answerCurrent(r, right());
    expect(isLast(r)).toBe(true);
    const s = summary(r);
    expect(s).toMatchObject({ correct: 3, total: 4, percent: 75, bestStreak: 2 });
    expect(s.byDifficulty.hard).toEqual({ correct: 0, total: 1 });
  });
  it("does not advance before an answer", () => {
    const r = newRound(9, "GK", [mq("a"), mq("a")]);
    expect(next(r).index).toBe(0);
  });
});

describe("history", () => {
  it("survives blocked storage", () => {
    const blocked = { getItem: () => { throw new Error("SecurityError"); }, setItem: () => { throw new Error("QuotaExceededError"); } };
    expect(loadHistory(blocked)).toEqual([]);
    expect(saveRound(blocked, { categoryId: 9, categoryName: "GK", score: 1, total: 2, date: "d" })).toBe(false);
    expect(saveRound(undefined, { categoryId: 9, categoryName: "GK", score: 1, total: 2, date: "d" })).toBe(false);
  });
  it("saves, filters bad rows and finds the best per topic", () => {
    const m = new Map<string, string>();
    const s = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    saveRound(s, { categoryId: 9, categoryName: "GK", score: 10, total: 50, date: "d1" });
    saveRound(s, { categoryId: 9, categoryName: "GK", score: 30, total: 40, date: "d2" });
    saveRound(s, { categoryId: null, categoryName: "Any topic", score: 5, total: 50, date: "d3" });
    m.set("trivia.history.v1", JSON.stringify([...JSON.parse(m.get("trivia.history.v1")!), { bad: true }]));
    const h = loadHistory(s);
    expect(h).toHaveLength(3);
    expect(bestByCategory(h).get("9")).toEqual({ score: 30, total: 40 });
    expect(bestByCategory(h).get("any")).toEqual({ score: 5, total: 50 });
  });
});
