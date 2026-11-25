---
name: netlify-blobs
description: "Netlify Blobs stores, consistency and conditional writes for console state. Use when reading or writing sessions, proposals, jobs or audit records."
---

# Netlify Blobs

```ts
import { getStore } from "@netlify/blobs";
const store = getStore({ name: "proposals", consistency: "strong" });
await store.setJSON(id, value, { onlyIfNew: true });
const v = await store.get(id, { type: "json" });
```

- Default consistency is eventual: up to 60 s to propagate. Use `strong` for console state.
- `onlyIfNew` and `onlyIfMatch` give safe create and compare-and-set.
- Stores: `sessions`, `proposals`, `jobs`, `audit`, `ratelimit`.
- Store names: no `/` or `:`, max 64 bytes. Keys: max 600 bytes, no leading `/`.
- Object max 5 GB. Metadata max 2 KB.
- Never store secrets or passwords in Blobs.

---
Shared by: netlify-engineer, agent-console-engineer. Lead: netlify-engineer.
