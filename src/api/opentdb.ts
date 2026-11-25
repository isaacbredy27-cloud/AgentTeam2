// Open Trivia DB client (doc 01, docs/plans/opentdb-client.md). Owner: Pip.
// fetch, sleep, now and storage are injected so tests need no network.
export const BASE = "https://opentdb.com";
export const MIN_GAP_MS = 5000;
export const MAX_AMOUNT = 50;
const CATEGORY_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_IDLE_MS = 6 * 60 * 60 * 1000;
const CAT_KEY = "trivia.categories.v1";
const TOKEN_KEY = "trivia.token.v1";

export type Category = { id: number; name: string };
export type Question = {
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  category: string;
  text: string;
  correct: string;
  incorrect: string[];
};
export type RawQuestion = {
  type: string; difficulty: string; category: string; question: string;
  correct_answer: string; incorrect_answers: string[];
};

export type Deps = {
  fetch: (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; json(): Promise<any> }>;
  sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
  now: () => number;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
};

export type RoundResult =
  | { ok: true; questions: Question[]; requested: number; available: number | null }
  | { ok: false; reason: "invalid-parameter" | "no-questions" | "rate-limited" | "network" | "aborted" | "failed" };

/** The live list on 2026-11-25. Used when the network and the cache both fail. */
export const FALLBACK_CATEGORIES: Category[] = [
  [9, "General Knowledge"], [10, "Entertainment: Books"], [11, "Entertainment: Film"], [12, "Entertainment: Music"],
  [13, "Entertainment: Musicals & Theatres"], [14, "Entertainment: Television"], [15, "Entertainment: Video Games"],
  [16, "Entertainment: Board Games"], [17, "Science & Nature"], [18, "Science: Computers"], [19, "Science: Mathematics"],
  [20, "Mythology"], [21, "Sports"], [22, "Geography"], [23, "History"], [24, "Politics"], [25, "Art"],
  [26, "Celebrities"], [27, "Animals"], [28, "Vehicles"], [29, "Entertainment: Comics"], [30, "Science: Gadgets"],
  [31, "Entertainment: Japanese Anime & Manga"], [32, "Entertainment: Cartoon & Animations"],
].map(([id, name]) => ({ id: id as number, name: name as string }));

export const browserDeps = (): Deps => ({
  fetch: (url, init) => fetch(url, init),
  sleep: (ms, signal) => new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  }),
  now: () => Date.now(),
  storage: safeStorage(),
});

function safeStorage(): Deps["storage"] {
  try { return globalThis.localStorage; } catch { return undefined; }
}

function readJson<T>(s: Deps["storage"], key: string): T | null {
  try { const raw = s?.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
function writeJson(s: Deps["storage"], key: string, v: unknown): void {
  try { s?.setItem(key, JSON.stringify(v)); } catch { /* private mode or full: ignore */ }
}

const d = (s: string) => decodeURIComponent(s);

/** Decode one url3986 question. Returns null when any field is malformed. */
export function decodeQuestion(raw: RawQuestion): Question | null {
  try {
    const type = d(raw.type);
    const difficulty = d(raw.difficulty);
    if (type !== "multiple" && type !== "boolean") return null;
    if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard") return null;
    if (!Array.isArray(raw.incorrect_answers)) return null;
    return {
      type, difficulty,
      category: d(raw.category),
      text: d(raw.question),
      correct: d(raw.correct_answer),
      incorrect: raw.incorrect_answers.map(d),
    };
  } catch {
    return null; // URIError from bad percent-encoding
  }
}

function isCategoryList(x: unknown): x is Category[] {
  return Array.isArray(x) && x.length > 0 && x.every((c) => c && Number.isInteger(c.id) && typeof c.name === "string");
}

/** Live list first, then a 24-hour cache, then the built-in table. Never throws. */
export async function getCategories(deps: Deps): Promise<{ categories: Category[]; source: "live" | "cache" | "fallback" }> {
  const cached = readJson<{ at: number; categories: Category[] }>(deps.storage, CAT_KEY);
  if (cached && isCategoryList(cached.categories) && deps.now() - cached.at < CATEGORY_TTL_MS) {
    return { categories: cached.categories, source: "cache" };
  }
  try {
    const body = await gatedCall(deps)(`${BASE}/api_category.php`);
    const list = body?.trivia_categories;
    if (isCategoryList(list)) {
      const categories = list.map((c) => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));
      writeJson(deps.storage, CAT_KEY, { at: deps.now(), categories });
      return { categories, source: "live" };
    }
  } catch { /* fall through */ }
  if (cached && isCategoryList(cached.categories)) return { categories: cached.categories, source: "cache" };
  return { categories: FALLBACK_CATEGORIES, source: "fallback" };
}

/**
 * Fetch one round: up to 50 questions, any type, one category (or any).
 * Keeps at least 5 s between calls and handles response codes 0-5.
 */
// One 5-second gate per deps object, shared by every call the app makes.
// Calls queue up: one request in flight at a time, at least 5 s apart.
const gates = new WeakMap<Deps, { last: number; queue: Promise<unknown> }>();

function gatedCall(deps: Deps, signal?: AbortSignal, onWait?: (ms: number) => void) {
  let gate = gates.get(deps);
  if (!gate) { gate = { last: -Infinity, queue: Promise.resolve() }; gates.set(deps, gate); }
  const g = gate;
  return (url: string): Promise<any> => {
    const run = async () => {
      const gap = g.last + MIN_GAP_MS - deps.now();
      if (gap > 0) { onWait?.(gap); await deps.sleep(gap, signal); }
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const prev = g.last;
      g.last = deps.now();
      try {
        const res = await deps.fetch(url, { signal });
        return await res.json();
      } catch (e) {
        g.last = prev; // the request never reached the API, so it does not count toward the gap
        throw e;
      }
    };
    const result = g.queue.then(run, run);
    g.queue = result.catch(() => undefined);
    return result;
  };
}

/** Get a session token ahead of the first round, so Start does not wait for it. Never throws. */
export async function warmToken(deps: Deps): Promise<void> {
  try { await getToken(deps, gatedCall(deps)); } catch { /* ignore */ }
}

export async function fetchRound(
  categoryId: number | null, deps: Deps, opts: { signal?: AbortSignal; onWait?: (ms: number) => void } = {},
): Promise<RoundResult> {
  const { signal, onWait } = opts;
  const call = gatedCall(deps, signal, onWait);

  try {
    let token = await getToken(deps, call);
    let amount = MAX_AMOUNT;
    let available: number | null = null;
    let tokenRetried = false;
    const cat = categoryId === null ? "" : `&category=${categoryId}`;
    for (let attempt = 0; attempt < 6; attempt++) {
      const tok = token ? `&token=${encodeURIComponent(token)}` : "";
      const body = await call(`${BASE}/api.php?amount=${amount}${cat}&encode=url3986${tok}`);
      switch (body?.response_code) {
        case 0: {
          const questions = (Array.isArray(body.results) ? body.results : [])
            .map(decodeQuestion).filter((q: Question | null): q is Question => q !== null);
          if (questions.length === 0) return { ok: false, reason: "no-questions" };
          if (token) writeJson(deps.storage, TOKEN_KEY, { token, at: deps.now() });
          return { ok: true, questions, requested: amount, available };
        }
        case 1: {
          if (amount < MAX_AMOUNT || categoryId === null) {
            // A smaller round still came back empty: the token has used them up.
            if (token && !tokenRetried) { tokenRetried = true; await call(`${BASE}/api_token.php?command=reset&token=${encodeURIComponent(token)}`); break; }
            return { ok: false, reason: "no-questions" };
          }
          const count = await call(`${BASE}/api_count.php?category=${categoryId}`);
          const total = Number(count?.category_question_count?.total_question_count ?? 0);
          if (!Number.isFinite(total) || total <= 0) return { ok: false, reason: "no-questions" };
          available = total;
          amount = Math.min(MAX_AMOUNT, total);
          if (amount === MAX_AMOUNT) {
            // Enough exist, but not unused for this token. Reset it once.
            if (token && !tokenRetried) { tokenRetried = true; await call(`${BASE}/api_token.php?command=reset&token=${encodeURIComponent(token)}`); }
          }
          break;
        }
        case 2: return { ok: false, reason: "invalid-parameter" };
        case 3: {
          if (tokenRetried) return { ok: false, reason: "failed" };
          tokenRetried = true;
          clearToken(deps);
          token = await getToken(deps, call);
          break;
        }
        case 4: {
          if (tokenRetried || !token) return { ok: false, reason: "no-questions" };
          tokenRetried = true;
          await call(`${BASE}/api_token.php?command=reset&token=${encodeURIComponent(token)}`);
          break;
        }
        case 5: break; // rate limited: the next call waits MIN_GAP_MS
        default: return { ok: false, reason: "failed" };
      }
    }
    return { ok: false, reason: "rate-limited" };
  } catch (e) {
    if ((e as { name?: string })?.name === "AbortError") return { ok: false, reason: "aborted" };
    return { ok: false, reason: "network" };
  }
}

function clearToken(deps: Deps) {
  try { deps.storage?.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

// One token request at a time per deps: a warm-up and a round share it.
const tokenInFlight = new WeakMap<Deps, Promise<string | null>>();

function getToken(deps: Deps, call: (url: string) => Promise<any>): Promise<string | null> {
  const pending = tokenInFlight.get(deps);
  if (pending) return pending;
  const p = requestToken(deps, call).finally(() => tokenInFlight.delete(deps));
  tokenInFlight.set(deps, p);
  return p;
}

async function requestToken(deps: Deps, call: (url: string) => Promise<any>): Promise<string | null> {
  const saved = readJson<{ token: string; at: number }>(deps.storage, TOKEN_KEY);
  if (saved && typeof saved.token === "string" && deps.now() - saved.at < TOKEN_IDLE_MS) return saved.token;
  try {
    const body = await call(`${BASE}/api_token.php?command=request`);
    if (body?.response_code === 0 && typeof body.token === "string") {
      writeJson(deps.storage, TOKEN_KEY, { token: body.token, at: deps.now() });
      return body.token;
    }
  } catch (e) {
    if ((e as { name?: string })?.name === "AbortError") throw e;
  }
  return null; // play without a token: repeats are possible, but the round still works
}
