const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseService {
    constructor() {
        this.isConnected = false;
        this.retryAttempts = 0;
        this.maxRetries = 5;
    }

    async connect() {
        try {
            if (this.isConnected) return;

            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: 50,
                autoIndex: process.env.NODE_ENV !== 'production'
            };

            await mongoose.connect(process.env.MONGODB_URI, options);
            
            this.isConnected = true;
            this.retryAttempts = 0;
            logger.info('Successfully connected to MongoDB');

            mongoose.connection.on('error', this.handleConnectionError.bind(this));
            mongoose.connection.on('disconnected', this.handleDisconnection.bind(this));

        } catch (error) {
            logger.error('MongoDB connection error:', error);
            await this.handleConnectionFailure();
        }
    }

    async handleConnectionFailure() {
        if (this.retryAttempts < this.maxRetries) {
            this.retryAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.retryAttempts), 30000);
            
            logger.info(`Retrying connection in ${delay/1000} seconds... (Attempt ${this.retryAttempts})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            await this.connect();
        } else {
            logger.error('Max connection retry attempts reached');
            process.exit(1);
        }
    }

    handleConnectionError(error) {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
    }

    async handleDisconnection() {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
        await this.connect();
    }

    async healthCheck() {
        try {
            await mongoose.connection.db.admin().ping();
            return {
                status: 'healthy',
                latency: await this.measureLatency()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    async measureLatency() {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        return Date.now() - start;
    }
}

module.exports = new DatabaseService(); 