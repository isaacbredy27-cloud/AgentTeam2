// Pure game logic: build answer choices, score answers, track streaks.
export type Q = { type: "multiple" | "boolean"; correct: string; incorrect: string[] };
export type Choice = { options: string[]; correctIndex: number };

export function shuffle<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)); // Fisher–Yates
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildChoice(q: Q, rand?: () => number): Choice {
  if (q.type === "boolean") return { options: ["True", "False"], correctIndex: q.correct === "True" ? 0 : 1 };
  const options = shuffle([q.correct, ...q.incorrect], rand);
  return { options, correctIndex: options.indexOf(q.correct) };
}

export type Score = { correct: number; answered: number; streak: number; bestStreak: number };
export const newScore = (): Score => ({ correct: 0, answered: 0, streak: 0, bestStreak: 0 });

export function answer(s: Score, choice: Choice, picked: number): Score {
  const right = picked === choice.correctIndex;
  const streak = right ? s.streak + 1 : 0;
  return { correct: s.correct + (right ? 1 : 0), answered: s.answered + 1, streak, bestStreak: Math.max(s.bestStreak, streak) };
}

export const percent = (s: Score) => (s.answered === 0 ? 0 : Math.round((100 * s.correct) / s.answered));
