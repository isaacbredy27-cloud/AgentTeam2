// Pure game logic: answer choices, scoring, streaks, results. Owner: Kit.
import type { Question } from "../api/opentdb.ts";

export type Choice = { options: string[]; correctIndex: number };
export type Answer = { picked: number; correct: boolean };
export type Round = {
  categoryId: number | null;
  categoryName: string;
  questions: Question[];
  choices: Choice[];
  answers: Answer[];
  index: number;
  streak: number;
  bestStreak: number;
};

export function shuffle<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)); // Fisher–Yates
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** True/False keeps a fixed order. Multiple choice is shuffled. */
export function buildChoice(q: Pick<Question, "type" | "correct" | "incorrect">, rand?: () => number): Choice {
  if (q.type === "boolean") return { options: ["True", "False"], correctIndex: q.correct === "True" ? 0 : 1 };
  const options = shuffle([q.correct, ...q.incorrect], rand);
  return { options, correctIndex: options.indexOf(q.correct) };
}

export function newRound(categoryId: number | null, categoryName: string, questions: Question[], rand?: () => number): Round {
  return {
    categoryId, categoryName, questions,
    choices: questions.map((q) => buildChoice(q, rand)),
    answers: [], index: 0, streak: 0, bestStreak: 0,
  };
}

export function answerCurrent(r: Round, picked: number): Round {
  if (r.answers.length > r.index) return r; // already answered
  const choice = r.choices[r.index];
  if (!choice || !Number.isInteger(picked) || picked < 0 || picked >= choice.options.length) return r;
  const correct = picked === choice.correctIndex;
  const streak = correct ? r.streak + 1 : 0;
  return { ...r, answers: [...r.answers, { picked, correct }], streak, bestStreak: Math.max(r.bestStreak, streak) };
}

export const isAnswered = (r: Round) => r.answers.length > r.index;
export const isLast = (r: Round) => r.index >= r.questions.length - 1;
export const next = (r: Round): Round => (isAnswered(r) && !isLast(r) ? { ...r, index: r.index + 1 } : r);

export type Summary = {
  correct: number; total: number; percent: number; bestStreak: number;
  byDifficulty: Record<"easy" | "medium" | "hard", { correct: number; total: number }>;
};

export function summary(r: Round): Summary {
  const byDifficulty = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
  let correct = 0;
  r.answers.forEach((a, i) => {
    const d = byDifficulty[r.questions[i].difficulty];
    d.total++;
    if (a.correct) { d.correct++; correct++; }
  });
  const total = r.questions.length;
  return { correct, total, percent: total ? Math.round((100 * correct) / total) : 0, bestStreak: r.bestStreak, byDifficulty };
}
