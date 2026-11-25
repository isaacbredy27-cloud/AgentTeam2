// Module contracts: the typed seams between modules. Implementations live elsewhere.
// Type-checked with `tsc --noEmit` to prove the contracts are consistent.

/** src/api/opentdb.ts — owned by opentdb-integration-expert */
export interface TriviaApi {
  categories(): Promise<Category[]>;
  round(categoryId: number): Promise<RoundResult>;
}
export type Category = { id: number; name: string };
export type Question = { type: "multiple" | "boolean"; difficulty: "easy" | "medium" | "hard"; category: string; text: string; correct: string; incorrect: string[] };
export type RoundResult =
  | { ok: true; questions: Question[]; shortBy: number }
  | { ok: false; reason: "offline" | "no-questions" | "failed" };

/** src/quiz/state.ts — owned by frontend-engineer */
export interface Quiz {
  readonly current: Question | null;
  readonly position: { index: number; total: number };
  choose(optionIndex: number): { right: boolean; correctText: string };
  next(): void;
  result(): { correct: number; total: number; bestStreak: number };
}

/** src/quiz/storage.ts — owned by frontend-engineer */
export interface History {
  save(r: { categoryId: number; score: number; total: number; date: string }): boolean;
  best(categoryId: number): number | undefined;
}

/** netlify/functions — owned by agent-console-engineer. Browser never sees secrets. */
export type AgentSummary = { name: string; model: "opus" | "sonnet" | "haiku" | "inherit" | string; description: string };
export type Proposal = {
  id: string;
  agent: string;
  summary: string;
  files: { path: string; action: "create" | "update" | "delete"; baseSha: string | null }[];
  status: "pending" | "approved" | "rejected" | "stale";
};

// Compile-time check: a fake API satisfies the contract.
export const fakeApi: TriviaApi = {
  categories: async () => [{ id: 9, name: "General Knowledge" }],
  round: async () => ({ ok: false, reason: "offline" }),
};
