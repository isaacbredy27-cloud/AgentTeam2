// Score history that never throws when storage is blocked or full. Owner: Kit.
export type RoundRecord = { categoryId: number | null; categoryName: string; score: number; total: number; date: string };
const KEY = "trivia.history.v1";
const MAX = 200;

type S = Pick<Storage, "getItem" | "setItem"> | undefined;

export function defaultStorage(): S {
  try { return globalThis.localStorage; } catch { return undefined; }
}

function isRecord(x: any): x is RoundRecord {
  return x && (x.categoryId === null || Number.isInteger(x.categoryId)) && typeof x.categoryName === "string"
    && Number.isInteger(x.score) && Number.isInteger(x.total) && typeof x.date === "string";
}

export function loadHistory(storage: S): RoundRecord[] {
  try {
    const raw = storage?.getItem(KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.filter(isRecord) : [];
  } catch {
    return [];
  }
}

export function saveRound(storage: S, r: RoundRecord): boolean {
  try {
    if (!storage) return false;
    storage.setItem(KEY, JSON.stringify([...loadHistory(storage), r].slice(-MAX)));
    return true;
  } catch {
    return false;
  }
}

/** Best score per category, as a percentage, keyed by category ID ("any" for no category). */
export function bestByCategory(history: RoundRecord[]): Map<string, { score: number; total: number }> {
  const best = new Map<string, { score: number; total: number }>();
  for (const r of history) {
    const k = r.categoryId === null ? "any" : String(r.categoryId);
    const cur = best.get(k);
    if (!cur || r.score / r.total > cur.score / cur.total) best.set(k, { score: r.score, total: r.total });
  }
  return best;
}
