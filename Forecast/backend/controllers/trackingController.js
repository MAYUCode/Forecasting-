const Schedule = require('../models/Schedule');
const TrackingHistory = require('../models/TrackingHistory');
const Alert = require('../models/Alert');
const { createError } = require('../utils/errorUtils');

exports.getRealTimeTracking = async (req, res, next) => {
    try {
        const { routes, status } = req.query;

        const query = {};
        if (routes) {
            query.route = { $in: routes.split(',') };
        }
        if (status) {
            query.status = status;
        }

        const activeSchedules = await Schedule.find({
            ...query,
            status: { $in: ['in-transit', 'loading', 'unloading'] }
        })
        .populate('route')
        .populate('assignedTo', 'name');

        res.json(activeSchedules);
    } catch (error) {
        next(error);
    }
};

exports.updateLocation = async (req, res, next) => {
    try {
        const { scheduleId } = req.params;
        const { latitude, longitude, speed, timestamp } = req.body;

        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            throw createError(404, 'Schedule not found');
        }

        // Update current location
        schedule.tracking.currentLocation = {
            type: 'Point',
            coordinates: [longitude, latitude]
        };
        schedule.tracking.lastUpdated = timestamp || new Date();

        // Save tracking history
        await new TrackingHistory({
            schedule: scheduleId,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            speed,
            timestamp: timestamp || new Date()
        }).save();

        await schedule.save();

        res.json(schedule);
    } catch (error) {
        next(error);
    }
};

exports.getTrackingHistory = async (req, res, next) => {
    try {
        const { scheduleId } = req.params;
        const { startTime, endTime } = req.query;

        const query = { schedule: scheduleId };
        if (startTime && endTime) {
            query.timestamp = {
                $gte: new Date(startTime),
                $lte: new Date(endTime)
            };
        }

        const history = await TrackingHistory.find(query)
            .sort({ timestamp: 1 });

        res.json(history);
    } catch (error) {
        next(error);
    }
};

exports.getAlerts = async (req, res, next) => {
    try {
        const { status, priority, startDate, endDate } = req.query;

        const query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const alerts = await Alert.find(query)
            .populate('schedule')
            .sort({ createdAt: -1 });

        res.json(alerts);
    } catch (error) {
        next(error);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const { scheduleId } = req.params;
        const { status, notes } = req.body;

        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            throw createError(404, 'Schedule not found');
        }

        schedule.status = status;
        if (notes) {
            schedule.statusNotes = notes;
        }

        await schedule.save();

        res.json(schedule);
    } catch (error) {
        next(error);
    }
}; 