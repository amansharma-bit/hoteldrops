// rebuq Service Worker
const CACHE_NAME = "rebuq-v3";
const STATIC_ASSETS = [
  "/",
  "/search-hotels",
  "/manifest.json",
  "/dubai.jpg",
  "/bali.jpg",
  "/goa.jpg",
  "/mumbai.jpg",
  "/singapore.jpg",
  "/newdelhi.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = event.request.url;

  // Always fetch fresh from network for API calls — never cache
  if (
    url.includes("railway.app") ||
    url.includes("/api/") ||
    url.includes("hotelbeds") ||
    url.includes("liteapi") ||
    url.includes("supabase")
  ) {
    event.respondWith(fetch(event.request));  // ← THE FIX: was just "return"
    return;
  }

  // For everything else: network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
