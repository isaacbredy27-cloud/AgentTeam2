# Netlify Blobs

Source: https://docs.netlify.com/build/data-and-storage/netlify-blobs/ (read 2026-11-25)

- `getStore(name)` or `getStore({ name, consistency: "strong" })`. `getDeployStore` scopes data to one deploy.
- Eventual consistency (default): new blobs are visible at once; "Updates and deletions are guaranteed to be propagated to all edge locations within 60 seconds."
- Strong consistency: "Updates and deletions become immediately available to all readers", with slower reads. Can be set per `get`.
- `set(key, value, { metadata, onlyIfMatch, onlyIfNew })` returns `{ modified }`. `setJSON` is the JSON form.
- `get(key, { consistency, type })` with `type` of `arrayBuffer`, `blob`, `json`, `stream` or `text` (default). Returns `null` if missing.
- `getWithMetadata`, `getMetadata`, `delete(key)`, `list({ directories, paginate, prefix })`.
- Limits: store name ≤ 64 bytes, no `/` or `:`; key ≤ 600 bytes, no leading `/`; object ≤ 5 GB; metadata ≤ 2 KB.
- Works in background functions to persist long-running results.

Verified 2026-11-25 against the `@netlify/blobs` 11.1.11 type definitions: `getWithMetadata(key, { type: "json", consistency })` returns `{ data, etag, metadata } | null`, and `set`/`setJSON` accept `onlyIfMatch` or `onlyIfNew` and return `{ modified, etag }`.
