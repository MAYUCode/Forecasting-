const promClient = require('prom-client');
const os = require('os');
const { EventEmitter } = require('events');

class MonitoringService extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.register = new promClient.Registry();
        this.initialize();
    }

    initialize() {
        // Enable default metrics
        promClient.collectDefaultMetrics({
            register: this.register,
            prefix: 'app_'
        });

        this.createCustomMetrics();
        this.startMetricsCollection();
    }

    createCustomMetrics() {
        // HTTP metrics
        this.metrics.set('httpRequestDuration', new promClient.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.5, 1, 2, 5]
        }));

        // Business metrics
        this.metrics.set('activeDeliveries', new promClient.Gauge({
            name: 'active_deliveries_total',
            help: 'Number of active deliveries'
        }));

        this.metrics.set('deliveryDelays', new promClient.Histogram({
            name: 'delivery_delays_minutes',
            help: 'Delivery delays in minutes',
            buckets: [15, 30, 60, 120, 240]
        }));

        // System metrics
        this.metrics.set('memoryUsage', new promClient.Gauge({
            name: 'memory_usage_bytes',
            help: 'Memory usage in bytes'
        }));

        this.metrics.set('cpuUsage', new promClient.Gauge({
            name: 'cpu_usage_percentage',
            help: 'CPU usage percentage'
        }));

        // Register all metrics
        for (const metric of this.metrics.values()) {
            this.register.registerMetric(metric);
        }
    }

    startMetricsCollection() {
        // Collect system metrics every 15 seconds
        setInterval(() => {
            this.collectSystemMetrics();
        }, 15000);

        // Collect business metrics every minute
        setInterval(() => {
            this.collectBusinessMetrics();
        }, 60000);
    }

    async collectSystemMetrics() {
        // Memory metrics
        const memoryUsage = process.memoryUsage();
        this.metrics.get('memoryUsage').set(memoryUsage.heapUsed);

        // CPU metrics
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
        this.metrics.get('cpuUsage').set(cpuUsage);

        this.emit('systemMetricsCollected', {
            memory: memoryUsage,
            cpu: cpuUsage
        });
    }

    async collectBusinessMetrics() {
        try {
            // Collect active deliveries
            const activeDeliveries = await this.getActiveDeliveries();
            this.metrics.get('activeDeliveries').set(activeDeliveries);

            this.emit('businessMetricsCollected', {
                activeDeliveries
            });
        } catch (error) {
            console.error('Error collecting business metrics:', error);
        }
    }

    recordHttpRequest(method, route, statusCode, duration) {
        this.metrics
            .get('httpRequestDuration')
            .labels(method, route, statusCode)
            .observe(duration);
    }

    recordDeliveryDelay(delayMinutes) {
        this.metrics.get('deliveryDelays').observe(delayMinutes);
    }

    async getMetrics() {
        return await this.register.metrics();
    }

    async getActiveDeliveries() {
        // Implementation depends on your database schema
        // This is a placeholder
        return 0;
    }

    async getHealthStatus() {
        const metrics = await this.collectHealthMetrics();
        const status = this.evaluateHealth(metrics);

        return {
            status,
            timestamp: new Date(),
            metrics
        };
    }

    async collectHealthMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = os.loadavg()[0];
        
        return {
            system: {
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    heapUsed: memoryUsage.heapUsed,
                    heapTotal: memoryUsage.heapTotal
                },
                cpu: {
                    load: cpuUsage,
                    cores: os.cpus().length
                },
                uptime: process.uptime()
            },
            process: {
                pid: process.pid,
                version: process.version,
                memory: memoryUsage
            }
        };
    }

    evaluateHealth(metrics) {
        // Define thresholds for health status
        const memoryThreshold = 0.9; // 90%
        const cpuThreshold = 0.8; // 80%

        const memoryUsage = 1 - (metrics.system.memory.free / metrics.system.memory.total);
        const cpuUsage = metrics.system.cpu.load / metrics.system.cpu.cores;

        if (memoryUsage > memoryThreshold || cpuUsage > cpuThreshold) {
            return 'unhealthy';
        }

        return 'healthy';
    }
}

module.exports = new MonitoringService(); 