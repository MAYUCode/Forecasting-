class DataCacheController {
    constructor() {
        this.cache = new Map();
        this.offlineData = new Map();
        this.syncQueue = [];
        this.initialize();
    }

    initialize() {
        this.setupIndexedDB();
        this.registerServiceWorker();
        this.setupSyncListener();
        this.initializeOfflineDetection();
    }

    async setupIndexedDB() {
        const request = indexedDB.open('dashboardCache', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create stores for different data types
            db.createObjectStore('shipments', { keyPath: 'id' });
            db.createObjectStore('vehicles', { keyPath: 'id' });
            db.createObjectStore('routes', { keyPath: 'id' });
            db.createObjectStore('metrics', { keyPath: 'timestamp' });
            db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
        };

        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.loadCachedData();
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
        };
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('ServiceWorker registered:', registration);
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }
    }

    setupSyncListener() {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('syncDashboardData').then(() => {
                console.log('Sync registered');
            });
        });
    }

    initializeOfflineDetection() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    async loadCachedData() {
        const stores = ['shipments', 'vehicles', 'routes', 'metrics'];
        
        for (const store of stores) {
            try {
                const data = await this.getAllFromStore(store);
                this.cache.set(store, data);
                this.updateUI(store, data);
            } catch (error) {
                console.error(`Error loading cached ${store}:`, error);
            }
        }
    }

    async getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async cacheData(type, data) {
        try {
            const transaction = this.db.transaction(type, 'readwrite');
            const store = transaction.objectStore(type);
            
            if (Array.isArray(data)) {
                for (const item of data) {
                    await store.put(item);
                }
            } else {
                await store.put(data);
            }

            this.cache.set(type, data);
            console.log(`${type} data cached successfully`);
        } catch (error) {
            console.error(`Error caching ${type} data:`, error);
        }
    }

    async handleOfflineAction(action) {
        try {
            const transaction = this.db.transaction('pendingActions', 'readwrite');
            const store = transaction.objectStore('pendingActions');
            
            await store.add({
                ...action,
                timestamp: Date.now()
            });

            this.syncQueue.push(action);
            console.log('Offline action queued:', action);
        } catch (error) {
            console.error('Error queuing offline action:', error);
        }
    }

    async handleOnline() {
        console.log('Connection restored. Syncing data...');
        
        try {
            // Process pending actions
            const pendingActions = await this.getAllFromStore('pendingActions');
            
            for (const action of pendingActions) {
                await this.processPendingAction(action);
            }

            // Clear pending actions
            const transaction = this.db.transaction('pendingActions', 'readwrite');
            const store = transaction.objectStore('pendingActions');
            await store.clear();

            // Refresh cached data
            await this.refreshCachedData();

            console.log('Data sync completed');
        } catch (error) {
            console.error('Error syncing data:', error);
        }
    }

    async processPendingAction(action) {
        try {
            const response = await fetch(action.url, {
                method: action.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(action.data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Processed pending action:', action);
        } catch (error) {
            console.error('Error processing pending action:', error);
            // Requeue failed actions
            await this.handleOfflineAction(action);
        }
    }

    async refreshCachedData() {
        const endpoints = {
            shipments: '/api/shipments',
            vehicles: '/api/vehicles',
            routes: '/api/routes',
            metrics: '/api/metrics'
        };

        for (const [type, endpoint] of Object.entries(endpoints)) {
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                await this.cacheData(type, data);
                this.updateUI(type, data);
            } catch (error) {
                console.error(`Error refreshing ${type} data:`, error);
            }
        }
    }

    updateUI(type, data) {
        // Emit event for UI updates
        const event = new CustomEvent('dataUpdate', {
            detail: { type, data }
        });
        window.dispatchEvent(event);
    }

    handleOffline() {
        console.log('Connection lost. Switching to offline mode...');
        document.body.classList.add('offline-mode');
        
        // Show offline notification
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.innerHTML = `
            <i class="icon-offline"></i>
            <span>You are currently offline. Some features may be limited.</span>
        `;
        document.body.appendChild(notification);
    }

    // Utility methods for data access
    getData(type, id = null) {
        const cachedData = this.cache.get(type);
        if (!cachedData) return null;
        
        if (id) {
            return Array.isArray(cachedData) 
                ? cachedData.find(item => item.id === id)
                : null;
        }
        
        return cachedData;
    }

    async clearCache() {
        const stores = ['shipments', 'vehicles', 'routes', 'metrics'];
        
        for (const store of stores) {
            try {
                const transaction = this.db.transaction(store, 'readwrite');
                const objectStore = transaction.objectStore(store);
                await objectStore.clear();
                this.cache.delete(store);
            } catch (error) {
                console.error(`Error clearing ${store} cache:`, error);
            }
        }

        console.log('Cache cleared successfully');
    }
}

// Initialize data cache controller
document.addEventListener('DOMContentLoaded', () => {
    window.dataCache = new DataCacheController();
}); 