// Cache-first app shell, network-only for questions and /api/*.
const SHELL_CACHE = "shell-v1";
const SHELL = ["/", "/index.html", "/app.css", "/app.js", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))),
  );
});

// The page asks before switching versions; it posts this message after the user agrees.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/api.php") return; // network only
  if (url.origin !== self.location.origin) return; // opentdb.com etc.: browser default
  event.respondWith(
    caches.match(event.request, { ignoreSearch: url.pathname === "/" }).then((hit) => hit || fetch(event.request)),
  );
});
