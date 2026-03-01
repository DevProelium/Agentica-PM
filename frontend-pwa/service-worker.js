const CACHE_NAME = 'crisalida-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/core/app.js',
  '/src/core/router.js',
  '/src/core/api.js',
  '/src/core/ws-client.js',
  '/src/core/store.js',
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and API calls
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/ws'))  return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-care') {
    event.waitUntil(syncCareActions());
  }
});

async function syncCareActions() {
  const cache = await caches.open('offline-actions');
  const keys  = await cache.keys();
  for (const key of keys) {
    const req  = await cache.match(key);
    const body = await req.json();
    try {
      await fetch(body.url, { method: 'POST', headers: body.headers, body: JSON.stringify(body.payload) });
      await cache.delete(key);
    } catch { /* retry later */ }
  }
}
