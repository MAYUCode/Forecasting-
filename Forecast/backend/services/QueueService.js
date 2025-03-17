const Bull = require('bull');
const logger = require('../utils/logger');

class QueueService {
    constructor() {
        this.queues = new Map();
        this.initialize();
    }

    initialize() {
        // Initialize default queues
        this.createQueue('alerts', this.processAlerts);
        this.createQueue('tracking', this.processTracking);
        this.createQueue('reports', this.processReports);
        this.createQueue('notifications', this.processNotifications);
    }

    createQueue(name, processor) {
        const queue = new Bull(name, {
            redis: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
                removeOnComplete: true
            }
        });

        queue.process(processor);

        queue.on('failed', (job, err) => {
            logger.error(`Job ${job.id} in queue ${name} failed:`, err);
        });

        queue.on('completed', (job) => {
            logger.info(`Job ${job.id} in queue ${name} completed`);
        });

        this.queues.set(name, queue);
        return queue;
    }

    async addJob(queueName, data, options = {}) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }

        return await queue.add(data, options);
    }

    async processAlerts(job) {
        try {
            const { type, data } = job.data;
            logger.info(`Processing alert: ${type}`);
            
            // Alert processing logic
            switch (type) {
                case 'delay':
                    await processDelayAlert(data);
                    break;
                case 'maintenance':
                    await processMaintenanceAlert(data);
                    break;
                // Add more alert types
            }
        } catch (error) {
            logger.error('Alert processing error:', error);
            throw error;
        }
    }

    async processTracking(job) {
        try {
            const { rakeId, location, timestamp } = job.data;
            logger.info(`Processing tracking update for rake: ${rakeId}`);
            
            // Tracking update logic
            await updateRakeLocation(rakeId, location, timestamp);
        } catch (error) {
            logger.error('Tracking processing error:', error);
            throw error;
        }
    }

    async processReports(job) {
        try {
            const { reportType, parameters } = job.data;
            logger.info(`Generating report: ${reportType}`);
            
            // Report generation logic
            const report = await generateReport(reportType, parameters);
            await storeReport(report);
        } catch (error) {
            logger.error('Report processing error:', error);
            throw error;
        }
    }

    async processNotifications(job) {
        try {
            const { type, recipients, data } = job.data;
            logger.info(`Processing notification: ${type}`);
            
            // Notification logic
            await sendNotifications(type, recipients, data);
        } catch (error) {
            logger.error('Notification processing error:', error);
            throw error;
        }
    }

    async getQueueStatus(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue) return null;

        return {
            waiting: await queue.getWaitingCount(),
            active: await queue.getActiveCount(),
            completed: await queue.getCompletedCount(),
            failed: await queue.getFailedCount(),
            delayed: await queue.getDelayedCount()
        };
    }

    async clearQueue(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue) return false;

        await queue.empty();
        return true;
    }
}

module.exports = new QueueService(); 