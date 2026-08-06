const CACHE_NAME = 'gbms-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/manifest.json',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Clear old caches to break loops
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Exclude API routes and Next.js internal data from caching to prevent loops
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return; // Let browser handle it normally
  }

  // Network-First strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});
