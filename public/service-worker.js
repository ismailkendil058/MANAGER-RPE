const CACHE_NAME = 'recyclage-cache-v1';
const DATA_CACHE_NAME = 'recyclage-data-cache-v1';

// App shell assets to pre-cache on install
// Using specific root paths that represent our core shell
const APP_SHELL = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/Blue app icon design.jpg',
    '/favicon.ico'
];

// IndexedDB Helper implementation inside SW to avoid ES Modules in SW context cross-origin issues
// Since standard imported libraries aren't allowed in standard vanilla SWs easily without bundler setup
const DB_NAME = 'recyclage-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getAllSyncData() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function saveSyncData(data) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function deleteSyncData(id) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
}

// 1. Installation - Precache App Shell
self.addEventListener('install', (event) => {
    // Force immediate activation when installing
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching app shell');
            return cache.addAll(APP_SHELL);
        })
    );
});

// 2. Activation - Cleanup old caches
self.addEventListener('activate', (event) => {
    // Claim clients immediately
    event.waitUntil(self.clients.claim());

    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// 3. Fetch - Cache strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin or extension requests unless they are APIs we want
    if (!request.url.startsWith('http')) return;

    // Is it an API call? We use Network First, fallback to cache for API GETs.
    // Assuming API calls go to supabase or end in standard paths
    // You can customize this condition!
    const isApiCall = request.url.includes('supabase.co/rest/v1') || url.pathname.startsWith('/api/');

    // Handle POST/PUT/DELETE mutations specifically for background sync fallback
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        event.respondWith(
            fetch(request.clone()).catch(async (error) => {
                // If offline, save the request to IndexedDB Queue
                const serializedRequest = {
                    url: request.url,
                    method: request.method,
                    headers: Array.from(request.headers.entries()),
                    timestamp: Date.now()
                };

                // Read body if it exists
                if (request.method !== 'GET' && request.method !== 'HEAD') {
                    const clonedReq = request.clone();
                    try {
                        const bodyBlob = await clonedReq.blob();
                        serializedRequest.body = bodyBlob;
                    } catch (e) {
                        console.error('Could not clone body', e);
                    }
                }

                // Save to queue
                await saveSyncData(serializedRequest);

                // Try to trigger background sync if supported natively
                // iOS NOTE: Background sync API is not supported on iOS Safari.
                if ('sync' in registration) {
                    try {
                        await registration.sync.register('sync-offline-mutations');
                    } catch (e) { } // Ignore
                }

                // Return a fake successful response to keep the UI from blowing up
                // The UI should theoretically optimism update and we handle it later
                return new Response(JSON.stringify({ offlineQueued: true, message: 'Action queued for offline sync' }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 202 // Accepted
                });
            })
        );
        return;
    }

    if (isApiCall) {
        // Network-First for APIs
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone response to cache it
                    const responseClone = response.clone();
                    caches.open(DATA_CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Try cache if network fails
                    return caches.match(request);
                })
        );
    } else {
        // Cache-First for static assets (HTML, CSS, JS, Images, Fonts)
        // Helps load fast from disk, falling back to network
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then((networkResponse) => {
                        // Cache the newly fetched asset
                        // Don't cache opaque responses (type === 'opaque') to avoid polluting quota
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                        return networkResponse;
                    })
                    .catch(() => {
                        // If it's an HTML page and network fails, show offline.html
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                        // Optionally return a placeholder image for images
                    });
            })
        );
    }
});

// 4. Background Sync - Send queued mutations when back online
// iOS NOTE: This requires triggering manually on iOS since SyncEvent is Android Chrome only
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-mutations') {
        console.log('[SW] Syncing offline mutations...');
        event.waitUntil(processQueue());
    }
});

// Polyfill function to process queue for iOS (can be called via postMessage)
async function processQueue() {
    const queue = await getAllSyncData();
    if (!queue || queue.length === 0) return;

    console.log(`[SW] Found ${queue.length} queued tasks to sync`);

    for (const item of queue) {
        try {
            const initOptions = {
                method: item.method,
                headers: item.headers,
            };
            if (item.body) {
                initOptions.body = item.body;
            }

            // Re-fire the request
            await fetch(item.url, initOptions);

            // Delete from queue if successful
            await deleteSyncData(item.id);
            console.log(`[SW] Successfully synced task ${item.id}`);
        } catch (error) {
            console.error(`[SW] Sync failed for task ${item.id}`, error);
            // We stop processing to maintain order if something fails, 
            // relying on the next sync event to retry.
            break;
        }
    }
}

// 5. Message Event - Allow clients to communicate with SW
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Manual sync trigger for iOS workaround
    if (event.data && event.data.type === 'MANUAL_SYNC') {
        processQueue();
    }
});
