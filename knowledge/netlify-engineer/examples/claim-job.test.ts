import { test } from "node:test";
import assert from "node:assert/strict";
import { claimJob, type BlobStore } from "./claim-job.ts";

// In-memory stand-in with the same conditional-write semantics as Netlify Blobs.
function memoryStore(): BlobStore {
  const m = new Map<string, { data: any; etag: string }>();
  let n = 0;
  return {
    async getWithMetadata(key) { return m.get(key) ?? null; },
    async setJSON(key, value, opts = {}) {
      const cur = m.get(key);
      if (opts.onlyIfNew && cur) return { modified: false };
      if (opts.onlyIfMatch && cur?.etag !== opts.onlyIfMatch) return { modified: false };
      m.set(key, { data: value, etag: `"e${++n}"` });
      return { modified: true };
    },
  };
}

test("only one of two concurrent runs claims the job", async () => {
  const store = memoryStore();
  await store.setJSON("jobs/42", { status: "queued" }, { onlyIfNew: true });
  const [a, b] = await Promise.all([claimJob(store, "42"), claimJob(store, "42")]);
  assert.equal([a, b].filter(Boolean).length, 1);
});

test("a retry after the job finished does nothing", async () => {
  const store = memoryStore();
  await store.setJSON("jobs/7", { status: "done" });
  assert.equal(await claimJob(store, "7"), false);
  assert.equal(await claimJob(store, "missing"), false);
});
