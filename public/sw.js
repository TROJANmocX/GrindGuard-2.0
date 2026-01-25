/// <reference lib="webworker" />

const CACHE_NAME = 'grindguard-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/data/striver_sheet_fixed.csv',
    '/data/leetcode_metadata.csv'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching core assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Stale-while-Revalidate Strategy for Data
    if (event.request.url.includes('/data/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    // Fetch from network regardless to update cache
                    const fetchPromise = fetch(event.request)
                        .then((networkResponse) => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        })
                        .catch(() => cachedResponse); // If network fails, return cached

                    // Return cached if available, else wait for network
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Cache First Strategy for Static Assets (Images, JS, CSS)
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((networkResponse) => {
                // Cache new static assets dynamically
                if (
                    !networkResponse ||
                    networkResponse.status !== 200 ||
                    networkResponse.type !== 'basic'
                ) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            });
        })
    );
});
