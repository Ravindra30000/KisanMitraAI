const CACHE_NAME = 'kisanmitra-cache-v2';

const STATIC_ASSETS = [
  '/favicon.svg',
  '/manifest.json',
  '/icons.svg',
];

// On install: only pre-cache truly static files — NOT index.html or JS bundles
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// On activate: delete ALL old/stale caches so a rolled-back or updated
// deployment never serves wrong asset hashes from a previous build
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Network-first for all requests: always fetch fresh from Vercel so that
// new hashed JS/CSS bundles are never blocked by a cached old index.html.
// Falls back to cache only when the network is genuinely unavailable (offline).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const url = new URL(event.request.url);
          const isAsset =
            url.pathname.startsWith('/assets/') ||
            STATIC_ASSETS.includes(url.pathname);
          if (isAsset) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, response.clone()));
          }
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
