// Decode one Open Trivia DB question fetched with encode=url3986.
// Returns null when any field is malformed, so the caller can drop it.

export type RawQuestion = {
  type: string;
  difficulty: string;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

export type Question = {
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  category: string;
  text: string;
  correct: string;
  incorrect: string[];
};

const d = (s: string) => decodeURIComponent(s);

export function decodeQuestion(raw: RawQuestion): Question | null {
  try {
    const type = d(raw.type);
    const difficulty = d(raw.difficulty);
    if (type !== "multiple" && type !== "boolean") return null;
    if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard") return null;
    return {
      type,
      difficulty,
      category: d(raw.category),
      text: d(raw.question),
      correct: d(raw.correct_answer),
      incorrect: raw.incorrect_answers.map(d),
    };
  } catch {
    return null; // URIError from malformed percent-encoding
  }
}
