/* FC27 Career service worker: cache-first so the app opens instantly and works offline.
   A new build ships a new VERSION; the old cache is dropped once the new one is ready. */
const VERSION = "390083d59572";
const CACHE = "fc27-career-" + VERSION;
const CORE = ["./", "index.html", "manifest.webmanifest", "data/model.json", "data/fm.json", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  // cache: "reload" skips the HTTP cache, so a fresh deploy never caches files the host still serves stale
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith("fc27-career-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
      return res;
    } catch (err) {
      const shell = await cache.match("index.html");
      if (req.mode === "navigate" && shell) return shell;
      throw err;
    }
  })());
});
