class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = new Set();
        this.initialize();
    }

    initialize() {
        this.setupPerformanceObservers();
        this.monitorNetworkRequests();
        this.monitorFrameRate();
        this.monitorMemoryUsage();
        this.setupErrorTracking();
    }

    setupPerformanceObservers() {
        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
            this.notifyObservers('lcp', this.metrics.lcp);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((entryList) => {
            const firstInput = entryList.getEntries()[0];
            this.metrics.fid = firstInput.processingStart - firstInput.startTime;
            this.notifyObservers('fid', this.metrics.fid);
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        new PerformanceObserver((entryList) => {
            let cumulativeScore = 0;
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    cumulativeScore += entry.value;
                }
            }
            this.metrics.cls = cumulativeScore;
            this.notifyObservers('cls', this.metrics.cls);
        }).observe({ entryTypes: ['layout-shift'] });

        // Long Tasks
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (entry.duration > 50) {
                    this.logLongTask(entry);
                }
            });
        }).observe({ entryTypes: ['longtask'] });
    }

    monitorNetworkRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch(...args);
                this.logNetworkRequest(args[0], 'success', performance.now() - startTime);
                return response;
            } catch (error) {
                this.logNetworkRequest(args[0], 'error', performance.now() - startTime);
                throw error;
            }
        };
    }

    monitorFrameRate() {
        let frameCount = 0;
        let lastTime = performance.now();

        const measureFrameRate = () => {
            const currentTime = performance.now();
            frameCount++;

            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                this.metrics.fps = fps;
                this.notifyObservers('fps', fps);
                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFrameRate);
        };

        requestAnimationFrame(measureFrameRate);
    }

    monitorMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.memory = {
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize
                };
                this.notifyObservers('memory', this.metrics.memory);
            }, 5000);
        }
    }

    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.logError('error', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('promise', event.reason);
        });
    }

    logLongTask(entry) {
        const taskData = {
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: entry.attribution
        };
        this.notifyObservers('longTask', taskData);
    }

    logNetworkRequest(url, status, duration) {
        const requestData = {
            url: typeof url === 'string' ? url : url.url,
            status,
            duration
        };
        this.notifyObservers('networkRequest', requestData);
    }

    logError(type, error) {
        const errorData = {
            type,
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        };
        this.notifyObservers('error', errorData);
    }

    subscribe(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    notifyObservers(type, data) {
        this.observers.forEach(callback => {
            callback(type, data);
        });
    }

    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now()
        };
    }

    async sendMetricsToServer() {
        try {
            const metrics = this.getMetrics();
            await fetch('/api/metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metrics)
            });
        } catch (error) {
            console.error('Failed to send metrics:', error);
        }
    }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor();

// Set up periodic metrics reporting
setInterval(() => {
    performanceMonitor.sendMetricsToServer();
}, 60000); // Send metrics every minute

// Example usage of performance monitoring
performanceMonitor.subscribe((type, data) => {
    switch (type) {
        case 'lcp':
            if (data > 2500) {
                console.warn('Large LCP detected:', data);
            }
            break;
        case 'fid':
            if (data > 100) {
                console.warn('High FID detected:', data);
            }
            break;
        case 'cls':
            if (data > 0.1) {
                console.warn('High CLS detected:', data);
            }
            break;
        case 'error':
            console.error('Application error:', data);
            break;
    }
}); 