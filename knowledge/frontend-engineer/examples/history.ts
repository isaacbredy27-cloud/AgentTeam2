// Score history that never crashes when storage is blocked or full.
export type RoundRecord = { categoryId: number; score: number; total: number; date: string };
const KEY = "trivia.history.v1";

export function loadHistory(storage: Pick<Storage, "getItem"> | undefined): RoundRecord[] {
  try {
    const raw = storage?.getItem(KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.filter(isRecord) : [];
  } catch {
    return []; // SecurityError, bad JSON: behave as "no history"
  }
}

export function saveRound(storage: Pick<Storage, "getItem" | "setItem"> | undefined, r: RoundRecord): boolean {
  try {
    const all = [...loadHistory(storage), r].slice(-200); // keep it small
    storage?.setItem(KEY, JSON.stringify(all));
    return storage !== undefined;
  } catch {
    return false; // QuotaExceededError or blocked storage
  }
}

export function bestByCategory(history: RoundRecord[]): Map<number, number> {
  const best = new Map<number, number>();
  for (const r of history) best.set(r.categoryId, Math.max(best.get(r.categoryId) ?? 0, r.score));
  return best;
}

function isRecord(x: any): x is RoundRecord {
  return x && Number.isInteger(x.categoryId) && Number.isInteger(x.score) && Number.isInteger(x.total) && typeof x.date === "string";
}
