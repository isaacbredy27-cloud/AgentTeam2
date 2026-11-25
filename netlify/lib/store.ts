// Minimal Blobs interface so functions can run on Netlify Blobs or in memory.
export type SetResult = { modified: boolean; etag?: string };
export interface JsonStore {
  getWithMetadata(key: string, opts: { type: "json" }): Promise<{ data: any; etag?: string } | null>;
  setJSON(key: string, value: unknown, opts?: { onlyIfMatch?: string; onlyIfNew?: boolean }): Promise<SetResult>;
}

/** In-memory store with the same conditional-write rules. Used by tests and the local harness. */
export function memoryStore(): JsonStore & { dump(): Map<string, unknown> } {
  const map = new Map<string, { json: string; etag: string }>();
  let n = 0;
  return {
    async getWithMetadata(key) {
      const v = map.get(key);
      return v ? { data: JSON.parse(v.json), etag: v.etag } : null;
    },
    async setJSON(key, value, opts = {}) {
      const cur = map.get(key);
      if (opts.onlyIfNew && cur) return { modified: false };
      if (opts.onlyIfMatch !== undefined && cur?.etag !== opts.onlyIfMatch) return { modified: false };
      const etag = `"e${++n}"`;
      map.set(key, { json: JSON.stringify(value), etag });
      return { modified: true, etag };
    },
    dump() { return new Map([...map].map(([k, v]) => [k, JSON.parse(v.json)])); },
  };
}
