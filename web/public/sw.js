const CACHE = "viswallet-v10";
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

async function offlinePageResponse() {
  const cached = await caches.match("/offline.html");
  if (cached) return cached;
  return new Response("Viswallet is offline. Reconnect and reload.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response) return response;
  } catch {
    // network failed
  }
  const cached = await caches.match(request);
  if (cached) return cached;
  if (request.mode === "navigate") return offlinePageResponse();
  return new Response("", { status: 408, statusText: "Network unavailable" });
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response) return response;
  } catch {
    // network failed
  }
  return new Response("", { status: 408, statusText: "Network unavailable" });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (!url.origin.startsWith(self.location.origin)) return;
  if (url.pathname.startsWith("/api")) return;

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
