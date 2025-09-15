/**
 * AimHelper Pro - Service Worker
 * Performance optimization and caching strategies
 */

const CACHE_NAME = 'aimhelper-pro-v1.0.0';
const DYNAMIC_CACHE = 'aimhelper-dynamic-v1';

// Critical resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/grid-shot-enhanced.html',
    '/styles.css',
    '/ui-system.js',
    '/advanced-aim-trainer.js',
    '/performance-optimizer.js',
    '/accessibility.js',
    '/onboarding.js',
    '/help-system.js',
    '/performance-utils.css',
    '/accessibility.css',
    '/onboarding.css'
];

// Network-first resources (frequently updated)
const NETWORK_FIRST = [
    '/api/',
    '/analytics',
    '/leaderboard'
];

// Cache-first resources (rarely updated)
const CACHE_FIRST = [
    '/converter.html',
    '/education.html',
    '/pricing.html',
    '/fonts/',
    '/images/'
];

// Stale-while-revalidate resources
const STALE_WHILE_REVALIDATE = [
    '/profile.html',
    '/community.html',
    '/analytics.html'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static assets', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and browser-specific URLs
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
        return;
    }

    // Route different types of requests
    if (isNetworkFirst(url.pathname)) {
        event.respondWith(networkFirst(event.request));
    } else if (isCacheFirst(url.pathname)) {
        event.respondWith(cacheFirst(event.request));
    } else if (isStaleWhileRevalidate(url.pathname)) {
        event.respondWith(staleWhileRevalidate(event.request));
    } else {
        event.respondWith(defaultStrategy(event.request));
    }
});

// Network-first strategy (for frequently updated content)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache...', error);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline fallback
        return createOfflineResponse(request);
    }
}

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Update cache in background if resource is older than 1 hour
        const cacheDate = new Date(cachedResponse.headers.get('date'));
        const now = new Date();
        const oneHour = 60 * 60 * 1000;

        if (now - cacheDate > oneHour) {
            fetch(request).then(response => {
                if (response.ok) {
                    const cache = caches.open(CACHE_NAME);
                    cache.then(c => c.put(request, response));
                }
            }).catch(() => {
                // Ignore network errors for background updates
            });
        }

        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        return createOfflineResponse(request);
    }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);

    // Start network request immediately
    const networkPromise = fetch(request).then(response => {
        if (response.ok) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    }).catch(() => {
        // Ignore network errors
    });

    // Return cached response immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }

    // Wait for network if no cache
    try {
        return await networkPromise;
    } catch (error) {
        return createOfflineResponse(request);
    }
}

// Default strategy (cache first with network fallback)
async function defaultStrategy(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        return createOfflineResponse(request);
    }
}

// Helper functions
function isNetworkFirst(pathname) {
    return NETWORK_FIRST.some(path => pathname.startsWith(path));
}

function isCacheFirst(pathname) {
    return CACHE_FIRST.some(path => pathname.startsWith(path));
}

function isStaleWhileRevalidate(pathname) {
    return STALE_WHILE_REVALIDATE.some(path => pathname.startsWith(path));
}

function createOfflineResponse(request) {
    const url = new URL(request.url);

    // Return appropriate offline response based on request type
    if (request.headers.get('accept').includes('text/html')) {
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>AimHelper Pro - Offline</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 40px 20px;
                        background: #0a0a0a;
                        color: #ffffff;
                        text-align: center;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .offline-container {
                        max-width: 500px;
                        padding: 40px;
                        background: #1a1a1a;
                        border-radius: 12px;
                        border: 1px solid #333;
                    }
                    .offline-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #1a73e8;
                        margin-bottom: 16px;
                    }
                    p {
                        color: #aaa;
                        line-height: 1.6;
                        margin-bottom: 24px;
                    }
                    .retry-btn {
                        background: #1a73e8;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                    }
                    .retry-btn:hover {
                        background: #1557b0;
                    }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">🎯</div>
                    <h1>You're Offline</h1>
                    <p>AimHelper Pro requires an internet connection. Please check your connection and try again.</p>
                    <button class="retry-btn" onclick="window.location.reload()">Retry</button>
                </div>
            </body>
            </html>
        `, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
            }
        });
    }

    // Return JSON error for API requests
    if (request.headers.get('accept').includes('application/json')) {
        return new Response(JSON.stringify({
            error: 'Network unavailable',
            message: 'This feature requires an internet connection',
            offline: true
        }), {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }

    // Return generic offline response
    return new Response('Offline', {
        status: 503,
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache'
        }
    });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Performing background sync');
        event.waitUntil(performBackgroundSync());
    }
});

async function performBackgroundSync() {
    // Retry failed requests when connection is restored
    const cache = await caches.open('failed-requests');
    const requests = await cache.keys();

    for (const request of requests) {
        try {
            const response = await fetch(request);
            if (response.ok) {
                await cache.delete(request);
                console.log('Successfully synced:', request.url);
            }
        } catch (error) {
            console.log('Sync failed for:', request.url);
        }
    }
}

// Push notifications for updates
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'AimHelper Pro has been updated',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
                title: 'Open App',
                icon: '/icon-open.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icon-dismiss.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('AimHelper Pro', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Performance monitoring
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PERFORMANCE_METRIC') {
        console.log('Performance metric received:', event.data.metric);
        // Store or send performance metrics
    }

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(performCacheCleanup());
    }
});

async function performCacheCleanup() {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
        if (cacheName === DYNAMIC_CACHE) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();

            // Remove old entries (keep last 50)
            if (requests.length > 50) {
                const toDelete = requests.slice(0, requests.length - 50);
                await Promise.all(toDelete.map(request => cache.delete(request)));
                console.log(`Cleaned up ${toDelete.length} cache entries`);
            }
        }
    }
}

// Cache size management
async function manageCacheSize(cacheName, maxSize) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxSize) {
        const toDelete = keys.slice(0, keys.length - maxSize);
        await Promise.all(toDelete.map(key => cache.delete(key)));
    }
}

// Network information handling
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NETWORK_CHANGE') {
        const networkInfo = event.data.networkInfo;

        // Adjust caching strategy based on network conditions
        if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
            // Use more aggressive caching for slow connections
            console.log('Slow network detected, enabling aggressive caching');
        }
    }
});

console.log('Service Worker: Registered successfully');