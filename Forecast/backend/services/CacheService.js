const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.initialize();
    }

    initialize() {
        this.client = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            logger.info('Redis connected');
        });

        this.client.on('error', (error) => {
            logger.error('Redis error:', error);
            this.isConnected = false;
        });
    }

    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, value, expireSeconds = 3600) {
        try {
            await this.client.set(
                key,
                JSON.stringify(value),
                'EX',
                expireSeconds
            );
            return true;
        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    }

    async delete(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    }

    async clearPattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
            return true;
        } catch (error) {
            logger.error('Cache clear pattern error:', error);
            return false;
        }
    }

    async getOrSet(key, callback, expireSeconds = 3600) {
        try {
            const cachedValue = await this.get(key);
            if (cachedValue) return cachedValue;

            const freshValue = await callback();
            await this.set(key, freshValue, expireSeconds);
            return freshValue;
        } catch (error) {
            logger.error('Cache getOrSet error:', error);
            return null;
        }
    }
}

module.exports = new CacheService(); 