---
name: service-worker-caching
description: "Service worker caching strategies and update flow for this app. Use when changing sw.js or anything it caches."
---

# Service workers and caching

| Request | Strategy |
| --- | --- |
| App shell (HTML, JS, CSS, icons) | Precache on install, cache-first |
| `api_category.php` | Stale-while-revalidate |
| `api.php` questions | Network only |
| `/api/*` | Network only. Never cache. |

## Update flow
- Version the cache name, such as `shell-v3`. Bump it on every shell change.
- Delete old caches in `activate`.
- Show "New version available. Reload?" when a worker is waiting.
- Call `skipWaiting()` only after the user agrees.

## Rules
- Register `/sw.js` from the root so the scope is `/`.
- Serve `sw.js` with `Cache-Control: no-cache`.
- `public/sw.js` is on the console deny-list. Changes go through normal review.

---
Shared by: mobile-pwa-expert, netlify-engineer, qa-engineer. Lead: mobile-pwa-expert.
