const RateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const logger = require('../utils/logger');

class RateLimiterService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        });
    }

    createLimiter(options = {}) {
        const defaultOptions = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            standardHeaders: true,
            legacyHeaders: false,
            store: new RedisStore({
                client: this.redis,
                prefix: 'rate-limit:',
                sendCommand: (...args) => this.redis.call(...args)
            }),
            handler: (req, res) => {
                logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
                res.status(429).json({
                    error: 'Too many requests, please try again later.'
                });
            }
        };

        return RateLimit({
            ...defaultOptions,
            ...options
        });
    }

    // Different rate limiters for different routes
    getAuthLimiter() {
        return this.createLimiter({
            windowMs: 15 * 60 * 1000,
            max: 5,
            message: 'Too many login attempts, please try again later'
        });
    }

    getApiLimiter() {
        return this.createLimiter({
            windowMs: 60 * 1000, // 1 minute
            max: 60 // 60 requests per minute
        });
    }

    getUploadLimiter() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 10 // 10 uploads per hour
        });
    }
}

module.exports = new RateLimiterService(); 