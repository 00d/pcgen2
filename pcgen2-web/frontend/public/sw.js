/**
 * Phase 4: Progressive Web App Service Worker
 * Handles offline support, caching, and background sync
 */

const CACHE_NAME = 'pcgen-v1';
const STATIC_CACHE_NAME = 'pcgen-static-v1';
const API_CACHE_NAME = 'pcgen-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

/**
 * Install event: Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Continue even if some assets fail to cache
        console.warn('[SW] Some static assets failed to cache');
      });
    })
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

/**
 * Activate event: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== API_CACHE_NAME &&
            cacheName !== CACHE_NAME
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

/**
 * Fetch event: Network-first strategy for APIs, Cache-first for static assets
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // API endpoints: Network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: Cache first, fall back to network
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2)$/) ||
    url.pathname === '/'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages: Network first for PWA
  event.respondWith(networkFirst(request));
});

/**
 * Network-first strategy: Try network, fall back to cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    // Cache successful API responses
    if (response.status === 200 && request.url.includes('/api/')) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed, using cache:', request.url);

    // Try to return cached response
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }

    // Return error response
    return new Response('Resource not available offline', { status: 503 });
  }
}

/**
 * Cache-first strategy: Try cache, fall back to network
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Cache and network failed:', request.url);

    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html') ||
        new Response('Offline', { status: 503 });
    }

    return new Response('Resource not available', { status: 404 });
  }
}

/**
 * Background sync: Queue character changes when offline
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-characters') {
    event.waitUntil(syncCharacters());
  }
});

/**
 * Sync characters when coming back online
 */
async function syncCharacters() {
  try {
    // This would sync any pending character changes
    // Implementation depends on client-side queuing system
    console.log('[SW] Syncing characters...');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Retry sync
  }
}

/**
 * Message handling: Support communication with clients
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});

console.log('[SW] Service worker loaded');
