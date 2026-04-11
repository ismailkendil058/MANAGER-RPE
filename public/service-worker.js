// ============================================================
// Service Worker — Offline-First PWA
// Fixes:
//  1. iOS Safari "can't open" when offline → Cache-first for app shell
//  2. Runtime caching of all JS/CSS/image assets after first load
//  3. IndexedDB queue for offline mutations, flushed on reconnect
// ============================================================

const CACHE_VERSION = 'v5'; // bump this to force SW update
const SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const DATA_CACHE = `api-data-${CACHE_VERSION}`;

// Core app shell — these MUST be pre-cached so the app loads offline
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/Blue app icon design.jpg?v=5',
];

// ─── IndexedDB helpers (for offline mutation queue) ─────────────────────────
const DB_NAME = 'sw-sync-queue-db';
const DB_VERSION = 1;
const STORE_NAME = 'queue';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function dbGetAll() {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }));
}

function dbAdd(data) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).add(data);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }));
}

function dbDelete(id) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    }));
}

// ─── INSTALL — Pre-cache app shell ──────────────────────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Installing, caching app shell...');
    // Activate immediately without waiting for old tabs to close
    self.skipWaiting();

    event.waitUntil(
        caches.open(SHELL_CACHE).then(cache => {
            // addAll will throw if ANY resource fails — use individual adds so
            // one missing file doesn't break the whole install.
            return Promise.allSettled(
                APP_SHELL_URLS.map(url =>
                    cache.add(new Request(url, { cache: 'reload' }))
                        .catch(err => console.warn('[SW] Could not pre-cache:', url, err))
                )
            );
        })
    );
});

// ─── ACTIVATE — Clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(keys =>
                Promise.all(
                    keys
                        .filter(k => k !== SHELL_CACHE && k !== RUNTIME_CACHE && k !== DATA_CACHE)
                        .map(k => {
                            console.log('[SW] Deleting stale cache:', k);
                            return caches.delete(k);
                        })
                )
            )
        ])
    );
});

// ─── FETCH — Smart routing ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignore non-HTTP and chrome-extension requests
    if (!request.url.startsWith('http')) return;

    // ── Supabase API mutations (POST/PATCH/DELETE/PUT) ──
    // Queue them offline, replay when back online
    const isSupabaseApi = request.url.includes('supabase.co/rest/v1');
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);

    if (isSupabaseApi && isMutation) {
        event.respondWith(handleMutation(request));
        return;
    }

    // ── Supabase API GET → Network first, cache fallback ──
    if (isSupabaseApi && request.method === 'GET') {
        event.respondWith(networkFirstWithCache(request, DATA_CACHE));
        return;
    }

    // ── HTML navigations → Cache first, network fallback, offline.html ──
    // This is the critical fix for iOS "Safari can't open page"
    const isNavigation = request.mode === 'navigate' ||
        (request.method === 'GET' && request.headers.get('accept') &&
            request.headers.get('accept').includes('text/html'));

    if (isNavigation) {
        event.respondWith(handleNavigation(request));
        return;
    }

    // ── Static assets (JS, CSS, fonts, images) → Cache first, then network ──
    event.respondWith(cacheFirstWithNetworkFallback(request));
});

// ─── Navigation handler — serves index.html from cache for SPA routing ──────
async function handleNavigation(request) {
    // Try the cache first (this is the key iOS fix)
    const cachedShell = await caches.match('/index.html', { cacheName: SHELL_CACHE }) ||
        await caches.match('/', { cacheName: SHELL_CACHE });

    if (cachedShell) {
        // We have a cached shell — try network in background to keep it fresh
        updateCacheInBackground('/', SHELL_CACHE);
        return cachedShell;
    }

    // Not cached yet — try network
    try {
        const networkResponse = await fetch(request);
        // Cache it for next time
        const cache = await caches.open(SHELL_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (err) {
        // Truly offline and not cached — show offline page
        const offlinePage = await caches.match('/offline.html');
        return offlinePage || new Response('Offline', { status: 503 });
    }
}

// ─── Network first with cache fallback (for API GETs) ───────────────────────
async function networkFirstWithCache(request, cacheName) {
    try {
        const networkResponse = await fetch(request.clone());
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (err) {
        const cached = await caches.match(request, { cacheName });
        return cached || new Response(JSON.stringify({ error: 'Offline', data: [] }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
        });
    }
}

// ─── Cache first with network fallback (for static assets) ──────────────────
async function cacheFirstWithNetworkFallback(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const networkResponse = await fetch(request);
        // Only cache valid same-origin responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (err) {
        // Return nothing for non-critical missing assets
        return new Response('', { status: 408 });
    }
}

// ─── Background cache update (for shell freshness) ──────────────────────────
function updateCacheInBackground(url, cacheName) {
    fetch(url).then(response => {
        if (response.ok) {
            caches.open(cacheName).then(cache => cache.put(url, response));
        }
    }).catch(() => { }); // silent fail — we already served from cache
}

// ─── Offline mutation handler ────────────────────────────────────────────────
async function handleMutation(request) {
    try {
        // Try to send it directly
        const response = await fetch(request.clone());
        return response;
    } catch (err) {
        // Offline — serialize and queue the request
        console.log('[SW] Network unavailable, queuing mutation:', request.url);

        try {
            let bodyText = null;
            if (request.method !== 'GET' && request.method !== 'HEAD') {
                try { bodyText = await request.clone().text(); } catch (_) { }
            }

            const queuedItem = {
                url: request.url,
                method: request.method,
                headers: Array.from(request.headers.entries()),
                body: bodyText,
                timestamp: Date.now()
            };

            await dbAdd(queuedItem);
            console.log('[SW] Mutation queued successfully');
        } catch (queueErr) {
            console.error('[SW] Failed to queue mutation:', queueErr);
        }

        // Return a 202 so the optimistic UI doesn't crash
        return new Response(JSON.stringify({ offlineQueued: true, message: 'Queued for sync' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 202
        });
    }
}

// ─── Background Sync (Android Chrome) ───────────────────────────────────────
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-mutations') {
        console.log('[SW] Background sync event received');
        event.waitUntil(processSWQueue());
    }
});

// ─── Message handler (iOS manual sync trigger + SKIP_WAITING) ───────────────
self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // iOS workaround: main thread calls this when it detects online
    if (event.data.type === 'MANUAL_SYNC') {
        processSWQueue();
    }
});

// ─── Process SW-level mutation queue ────────────────────────────────────────
// Note: This queue is separate from the app-level local-first queue.
// This handles mutations that were intercepted by the SW fetch handler.
async function processSWQueue() {
    const queue = await dbGetAll();
    if (!queue || queue.length === 0) {
        console.log('[SW] No queued SW mutations to sync');
        return;
    }

    console.log(`[SW] Processing ${queue.length} queued mutations...`);

    for (const item of queue) {
        try {
            const init = {
                method: item.method,
                headers: item.headers ? Object.fromEntries(item.headers) : {}
            };
            if (item.body) {
                init.body = item.body;
            }

            const response = await fetch(item.url, init);

            if (response.ok || response.status === 409) {
                // 409 means conflict/already exists — still remove from queue
                await dbDelete(item.id);
                console.log(`[SW] ✅ Synced queued mutation id=${item.id}`);
            } else {
                console.warn(`[SW] Non-OK response for id=${item.id}: ${response.status}`);
            }
        } catch (err) {
            console.error(`[SW] Failed to sync queued mutation id=${item.id}:`, err);
            // Don't break — continue with remaining items
        }
    }

    // Notify all clients that sync completed
    const clients = await self.clients.matchAll();
    clients.forEach(client => client.postMessage({ type: 'SW_SYNC_COMPLETE' }));
}
