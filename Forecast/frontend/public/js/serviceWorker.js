const CACHE_NAME = 'coal-transport-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/css/dashboard.css',
    '/css/responsive.css',
    '/css/components.css',
    '/js/dashboard.js',
    '/js/responsive.js',
    '/js/charts.js',
    '/assets/icons/*',
    '/assets/images/*'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
});

// Fetch Strategy: Network First, falling back to cache
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// Handle Push Notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'View Details'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Coal Transport Update', options)
    );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/dashboard')
        );
    }
});

// Background Sync for Offline Support
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-updates') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    try {
        const offlineData = await getOfflineData();
        await sendToServer(offlineData);
        await clearOfflineData();
    } catch (error) {
        console.error('Sync failed:', error);
    }
} 