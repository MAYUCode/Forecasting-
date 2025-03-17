const Schedule = require('../models/Schedule');
const Route = require('../models/Route');
const TrackingHistory = require('../models/TrackingHistory');
const { createError } = require('../utils/errorUtils');
const { generateReport } = require('../utils/reportGenerator');
const { calculateForecast } = require('../utils/forecastUtils');

exports.getDashboardAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const dateRange = {
            $gte: new Date(startDate || new Date().setDate(new Date().getDate() - 30)),
            $lte: new Date(endDate || new Date())
        };

        // Get total deliveries
        const totalDeliveries = await Schedule.countDocuments({
            status: 'completed',
            date: dateRange
        });

        // Get total volume
        const volumeStats = await Schedule.aggregate([
            { $match: { status: 'completed', date: dateRange } },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        // Get on-time delivery rate
        const onTimeDeliveries = await Schedule.countDocuments({
            status: 'completed',
            date: dateRange,
            'tracking.delay': { $lte: 30 } // 30 minutes threshold
        });

        // Get route performance
        const routePerformance = await Schedule.aggregate([
            { $match: { status: 'completed', date: dateRange } },
            { $group: {
                _id: '$route',
                totalDeliveries: { $sum: 1 },
                avgDelay: { $avg: '$tracking.delay' },
                totalVolume: { $sum: '$quantity' }
            }},
            { $lookup: {
                from: 'routes',
                localField: '_id',
                foreignField: '_id',
                as: 'routeInfo'
            }},
            { $unwind: '$routeInfo' }
        ]);

        res.json({
            totalDeliveries,
            totalVolume: volumeStats[0]?.total || 0,
            onTimeDeliveryRate: (onTimeDeliveries / totalDeliveries) * 100,
            routePerformance
        });
    } catch (error) {
        next(error);
    }
};

exports.getPerformanceMetrics = async (req, res, next) => {
    try {
        const { startDate, endDate, groupBy } = req.query;
        
        const dateRange = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };

        const groupByFormat = {
            'day': { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            'week': { $week: '$date' },
            'month': { $dateToString: { format: '%Y-%m', date: '$date' } }
        };

        const metrics = await Schedule.aggregate([
            { $match: { date: dateRange } },
            { $group: {
                _id: groupByFormat[groupBy],
                deliveries: { $sum: 1 },
                volume: { $sum: '$quantity' },
                onTime: {
                    $sum: { $cond: [{ $lte: ['$tracking.delay', 30] }, 1, 0] }
                },
                avgDelay: { $avg: '$tracking.delay' }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.json(metrics);
    } catch (error) {
        next(error);
    }
};

exports.getRouteAnalytics = async (req, res, next) => {
    try {
        const { period } = req.query;

        const routeStats = await Schedule.aggregate([
            { $match: { status: 'completed' } },
            { $group: {
                _id: '$route',
                deliveries: { $sum: 1 },
                totalVolume: { $sum: '$quantity' },
                avgDelay: { $avg: '$tracking.delay' },
                reliability: {
                    $avg: { $cond: [{ $lte: ['$tracking.delay', 30] }, 1, 0] }
                }
            }},
            { $lookup: {
                from: 'routes',
                localField: '_id',
                foreignField: '_id',
                as: 'routeInfo'
            }},
            { $unwind: '$routeInfo' }
        ]);

        res.json(routeStats);
    } catch (error) {
        next(error);
    }
};

exports.getComparisonData = async (req, res, next) => {
    try {
        const { type, params } = req.body;

        let comparisonData;
        switch (type) {
            case 'time':
                comparisonData = await this.getTimeComparison(params);
                break;
            case 'route':
                comparisonData = await this.getRouteComparison(params);
                break;
            default:
                throw createError(400, 'Invalid comparison type');
        }

        res.json(comparisonData);
    } catch (error) {
        next(error);
    }
};

exports.getForecastData = async (req, res, next) => {
    try {
        const { period, confidenceLevel } = req.query;

        const historicalData = await Schedule.find({
            status: 'completed',
            date: { $gte: new Date(new Date().setDate(new Date().getDate() - 90)) }
        }).sort({ date: 1 });

        const forecast = calculateForecast(historicalData, period, confidenceLevel);

        res.json(forecast);
    } catch (error) {
        next(error);
    }
};

exports.exportAnalytics = async (req, res, next) => {
    try {
        const { format, filters, type } = req.body;

        const data = await this.getAnalyticsData(type, filters);
        const report = await generateReport(data, format);

        res.json({
            downloadUrl: report.url,
            expiresAt: report.expiresAt
        });
    } catch (error) {
        next(error);
    }
};

exports.generateCustomReport = async (req, res, next) => {
    try {
        const { metrics, filters, grouping } = req.body;

        const reportData = await Schedule.aggregate([
            { $match: this.buildFilterQuery(filters) },
            { $group: this.buildGroupingStage(grouping, metrics) },
            { $sort: { _id: 1 } }
        ]);

        res.json(reportData);
    } catch (error) {
        next(error);
    }
}; 