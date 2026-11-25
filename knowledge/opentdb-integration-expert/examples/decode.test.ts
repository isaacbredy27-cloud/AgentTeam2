import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeQuestion } from "./decode.ts";

test("decodes quotes, ampersands, pi and emoji", () => {
  const raw = {
    type: "multiple",
    difficulty: "easy",
    category: encodeURIComponent("Science & Nature"),
    question: encodeURIComponent(`Don't forget that π = 3.14 & "e" ≈ 2.72 🎉`),
    correct_answer: encodeURIComponent("<b>A</b>"),
    incorrect_answers: ["B", "C", "D"].map(encodeURIComponent),
  };
  const q = decodeQuestion(raw);
  assert.ok(q);
  assert.equal(q.text, `Don't forget that π = 3.14 & "e" ≈ 2.72 🎉`);
  assert.equal(q.category, "Science & Nature");
  // Markup stays as plain text. The UI must render it with textContent.
  assert.equal(q.correct, "<b>A</b>");
});

test("returns null for malformed encoding", () => {
  const q = decodeQuestion({
    type: "boolean", difficulty: "hard", category: "x",
    question: "%E0%A4%A", correct_answer: "True", incorrect_answers: ["False"],
  });
  assert.equal(q, null);
});
