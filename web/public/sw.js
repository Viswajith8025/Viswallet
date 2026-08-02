const CACHE = "viswallet-v11";
const ASSETS = [
  "/offline.html",
  "/brand/logo-mark.svg",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png",
];

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

function shouldBypassServiceWorker(request, url) {
  if (url.pathname.startsWith("/api")) return true;
  // Next.js chunks + flight data — must not be blocked by SW offline fallbacks.
  if (url.pathname.startsWith("/_next/")) return true;
  if (url.searchParams.has("_rsc")) return true;
  if (request.headers.get("RSC") === "1") return true;
  if (request.headers.get("Next-Router-Prefetch")) return true;
  if (request.headers.get("Next-Action")) return true;
  return false;
}

async function offlinePageResponse() {
  const cached = await caches.match("/offline.html");
  if (cached) return cached;
  return new Response("Viswallet is offline. Reconnect and reload.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);

  try {
    const response = await fetch(request);
    if (response?.ok) {
      await cache.put(request, response.clone());
      return response;
    }
    if (response) return response;
  } catch {
    // network failed
  }

  const cached = await caches.match(request);
  if (cached) return cached;

  if (request.mode === "navigate") return offlinePageResponse();

  // Don't synthesize 408 — let the browser surface the real network error.
  try {
    return await fetch(request);
  } catch {
    return new Response("", { status: 503, statusText: "Network error" });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response?.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
      return response;
    }
    if (response) return response;
  } catch {
    // network failed
  }

  return new Response("", { status: 503, statusText: "Network error" });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (!url.origin.startsWith(self.location.origin)) return;
  if (shouldBypassServiceWorker(event.request, url)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (
    ASSETS.some((a) => url.pathname === a) ||
    url.pathname === "/offline.html" ||
    url.pathname.match(/\.(png|ico|woff2?|svg)$/)
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
