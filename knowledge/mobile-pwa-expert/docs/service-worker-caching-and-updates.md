# Service worker caching and updates

Sources (read 2026-11-25):
- https://web.dev/learn/pwa/serving
- https://web.dev/learn/pwa/update
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

## Strategies (web.dev)
- **Cache first**: "prioritizes performance over freshness."
- **Network first**: "prioritizes updated content instead of performance."
- **Stale while revalidate**: serve from cache, refresh the cache in the background.
- **Network only**: for "online-only API requests". The cache is never consulted.
- **Cache only**: assets must be cached before they are requested.

## Our mapping
App shell → cache first (precached on install). `api_category.php` → stale while revalidate.
Questions (`api.php`) and `/api/*` → network only.

## Updates (web.dev)
- "The browser detects updates using a byte-by-byte comparison" of the service worker and its dependencies.
- A new worker installs, then waits. "The wait prevents the new service worker from taking over old clients that might not be compatible."
- `skipWaiting()` "forces a service worker to activate immediately". `clients.claim()` takes control of open clients.
- Tell users with on-page UI. We show "New version available. Reload?" and call `skipWaiting()` only after they agree.
- Manifest updates: on iOS, iPadOS and most Android browsers "the only way to get the new manifest metadata is to re-install the app".
  Chrome WebAPK updates on its own schedule; a 404 manifest stops checks for at least 30 days.

## Background features (MDN)
Background Sync and Periodic Background Sync exist but are not needed here. Push requires the `push` permission
and every push must show a notification.
