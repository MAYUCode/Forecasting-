const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const DailyRotateFile = require('winston-daily-rotate-file');
const SlackTransport = require('./transports/SlackTransport');

class LoggingService {
    constructor() {
        this.logger = this.createLogger();
        this.httpLogger = this.createHttpLogger();
    }

    createLogger() {
        const logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.metadata(),
                winston.format.json()
            ),
            defaultMeta: { service: 'coal-transport' },
            transports: [
                // Console transport for development
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    ),
                    silent: process.env.NODE_ENV === 'production'
                }),

                // File transport with daily rotation
                new DailyRotateFile({
                    filename: 'logs/application-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d'
                }),

                // Error-specific file transport
                new DailyRotateFile({
                    filename: 'logs/error-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '30d'
                }),

                // Elasticsearch transport for production
                ...(process.env.NODE_ENV === 'production' ? [
                    new ElasticsearchTransport({
                        level: 'info',
                        clientOpts: {
                            node: process.env.ELASTICSEARCH_URL,
                            auth: {
                                username: process.env.ELASTICSEARCH_USER,
                                password: process.env.ELASTICSEARCH_PASSWORD
                            }
                        },
                        indexPrefix: 'logs-coal-transport'
                    })
                ] : []),

                // Slack transport for critical errors
                new SlackTransport({
                    level: 'error',
                    webhookUrl: process.env.SLACK_WEBHOOK_URL,
                    channel: '#alerts',
                    username: 'ErrorBot'
                })
            ]
        });

        return logger;
    }

    createHttpLogger() {
        return winston.createLogger({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new DailyRotateFile({
                    filename: 'logs/http-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxFiles: '14d'
                })
            ]
        });
    }

    log(level, message, meta = {}) {
        this.logger.log(level, message, meta);
    }

    logHttp(req, res, responseTime) {
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            responseTime,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id
        };

        this.httpLogger.info('HTTP Request', logData);
    }

    error(message, error, meta = {}) {
        this.logger.error(message, {
            error: {
                message: error.message,
                stack: error.stack,
                ...error
            },
            ...meta
        });
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    async queryLogs(options) {
        // Implement log querying logic
        const {
            startDate,
            endDate,
            level,
            search,
            limit = 100,
            offset = 0
        } = options;

        // Query implementation depends on your storage solution
        // This is a placeholder for Elasticsearch query
        const query = {
            bool: {
                must: [
                    { range: { timestamp: { gte: startDate, lte: endDate } } },
                    level && { match: { level } },
                    search && { query_string: { query: search } }
                ].filter(Boolean)
            }
        };

        return query;
    }
}

module.exports = new LoggingService(); 