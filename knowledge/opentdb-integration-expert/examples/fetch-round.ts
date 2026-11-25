// Fetch one round (up to 50 questions) with token handling and the 5-second rule.
// fetch and sleep are injected so the logic is testable without the network.
// No type filter: api_count totals include multiple and boolean questions,
// so a type filter could keep returning code 1 after the fallback.

import { decodeQuestion, type Question, type RawQuestion } from "./decode.ts";

const BASE = "https://opentdb.com";
export const MIN_GAP_MS = 5000;

type Deps = {
  fetch: (url: string) => Promise<{ json(): Promise<any> }>;
  sleep: (ms: number) => Promise<void>;
};

export type RoundResult =
  | { ok: true; questions: Question[]; requested: number; token: string }
  | { ok: false; reason: "invalid-parameter" | "no-questions" | "failed" };

export async function fetchRound(categoryId: number, deps: Deps, token?: string): Promise<RoundResult> {
  let calls = 0;
  const call = async (url: string) => {
    if (calls++ > 0) await deps.sleep(MIN_GAP_MS); // one call per 5 s per IP
    return (await deps.fetch(url)).json();
  };

  let tok = token ?? (await call(`${BASE}/api_token.php?command=request`)).token;
  let amount = 50;

  for (let attempt = 0; attempt < 5; attempt++) {
    const url = `${BASE}/api.php?amount=${amount}&category=${categoryId}&encode=url3986&token=${tok}`;
    const body = await call(url);
    switch (body.response_code) {
      case 0: {
        const questions = (body.results as RawQuestion[]).map(decodeQuestion).filter((q): q is Question => q !== null);
        return { ok: true, questions, requested: amount, token: tok };
      }
      case 1: { // not enough questions: ask how many exist, then retry smaller
        const count = await call(`${BASE}/api_count.php?category=${categoryId}`);
        const total = count?.category_question_count?.total_question_count ?? 0;
        if (total <= 0) return { ok: false, reason: "no-questions" };
        amount = Math.min(50, total);
        break;
      }
      case 2: return { ok: false, reason: "invalid-parameter" };
      case 3: tok = (await call(`${BASE}/api_token.php?command=request`)).token; break;
      case 4: await call(`${BASE}/api_token.php?command=reset&token=${tok}`); break;
      case 5: break; // rate limited: the next call waits MIN_GAP_MS
      default: return { ok: false, reason: "failed" };
    }
  }
  return { ok: false, reason: "failed" };
}
