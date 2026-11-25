// Trivia 50 service worker. Owner: Rowan. Agents cannot edit this file (deny-list).
// scripts/build-sw.mjs replaces the two placeholders below at build time.
const VERSION = "__SW_VERSION__";
const PRECACHE = self.__PRECACHE || [];
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = "data-v1";
const OFFLINE_URL = "/offline.html";
const CATEGORY_URL = "https://opentdb.com/api_category.php";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("shell-") && k !== SHELL_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// The page asks before switching versions. It posts this after the user taps Reload.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const neverCache = (url) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/agents");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Topic list: stale-while-revalidate.
  if (url.href === CATEGORY_URL) {
    event.respondWith((async () => {
      const cache = await caches.open(DATA_CACHE);
      const hit = await cache.match(req);
      const fresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; });
      if (hit) { event.waitUntil(fresh.catch(() => {})); return hit; }
      return fresh;
    })());
    return;
  }
  if (url.origin !== self.location.origin) return; // questions and Supabase: network only

  if (req.mode === "navigate") {
    if (neverCache(url)) {
      // The console is never cached. Offline, show the offline page.
      event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
      return;
    }
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(url.pathname, { ignoreSearch: true }))
          || (await cache.match(url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname + "/", { ignoreSearch: true }))
          || (await cache.match(OFFLINE_URL));
      }
    })());
    return;
  }
  if (neverCache(url)) return;

  // Hashed assets, icons and the manifest: cache first.
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
