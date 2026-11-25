// Idempotent background-job claim. Netlify retries failed background runs after 1 and 2 minutes,
// so the worker must claim the job atomically. The store interface matches @netlify/blobs
// (getWithMetadata returns an etag; set accepts onlyIfMatch and returns { modified }).
export interface BlobStore {
  getWithMetadata(key: string, opts: { type: "json"; consistency: "strong" }): Promise<{ data: any; etag?: string } | null>;
  setJSON(key: string, value: unknown, opts?: { onlyIfMatch?: string; onlyIfNew?: boolean }): Promise<{ modified: boolean }>;
}

export async function claimJob(store: BlobStore, id: string): Promise<boolean> {
  const entry = await store.getWithMetadata(`jobs/${id}`, { type: "json", consistency: "strong" });
  if (!entry || entry.data.status !== "queued" || !entry.etag) return false;
  const { modified } = await store.setJSON(`jobs/${id}`, { ...entry.data, status: "running", startedAt: Date.now() },
    { onlyIfMatch: entry.etag });
  return modified;
}
