const CACHE_NAME = 'shelter-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/about.html',
    '/services.html',
    '/success-stories.html',
    '/contact.html',
    '/styles.css',
    '/script.js',
    '/data.js',
    '/Grazioso-Salvare-Logo.png',
    'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Handle static assets
    if (STATIC_ASSETS.includes(new URL(event.request.url).pathname)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetchAndCache(event.request))
        );
        return;
    }

    // Network-first strategy for dynamic content
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone the response before caching
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, responseToCache));
                return response;
            })
            .catch(() => {
                // Fallback to cache if network fails
                return caches.match(event.request);
            })
    );
});

// Helper function to fetch and cache
async function fetchAndCache(request) {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
}

// Handle sync events for offline operations
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-animals') {
        event.waitUntil(syncAnimals());
    }
});

// Sync animals data when back online
async function syncAnimals() {
    const db = await indexedDB.open('shelter_db');
    const tx = db.transaction('animals', 'readonly');
    const store = tx.objectStore('animals');
    
    const pendingChanges = await store.getAll();
    
    // Process any pending changes
    for (const change of pendingChanges) {
        try {
            // Implement your sync logic here
            console.log('Syncing:', change);
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
}
