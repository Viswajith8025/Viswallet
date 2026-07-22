const CACHE = "viswallet-v4";
const ASSETS = ["/manifest.json", "/icon", "/apple-icon", "/icon-192", "/icon-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache API, auth, or cross-origin requests
  if (!url.origin.startsWith(self.location.origin)) return;
  if (url.pathname.startsWith("/api")) return;

  // Navigation: network-first (avoid stale app shell with sensitive UI)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(
          "<!DOCTYPE html><html><head><meta charset=utf-8><title>Offline</title></head><body><p>Viswallet is offline. Open the app from a tab you already visited, or reconnect and reload.</p></body></html>",
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }),
    );
    return;
  }

  // Static assets: cache-first
  if (ASSETS.some((a) => url.pathname === a) || url.pathname.match(/\.(png|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request)),
    );
    return;
  }

  // Default: network-first for JS/CSS chunks
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});
