const Schedule = require('../models/Schedule');
const Route = require('../models/Route');
const { createError } = require('../utils/errorUtils');

exports.getSchedules = async (req, res, next) => {
    try {
        const {
            startDate,
            endDate,
            status,
            route,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (status) {
            query.status = status;
        }

        if (route) {
            query.route = route;
        }

        const schedules = await Schedule.find(query)
            .populate('route')
            .populate('assignedTo', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ date: 1 });

        const total = await Schedule.countDocuments(query);

        res.json({
            schedules,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getScheduleById = async (req, res, next) => {
    try {
        const schedule = await Schedule.findById(req.params.id)
            .populate('route')
            .populate('assignedTo', 'name email');

        if (!schedule) {
            throw createError(404, 'Schedule not found');
        }

        res.json(schedule);
    } catch (error) {
        next(error);
    }
};

exports.createSchedule = async (req, res, next) => {
    try {
        const {
            routeId,
            date,
            quantity,
            rakes,
            assignedTo
        } = req.body;

        const route = await Route.findById(routeId);
        if (!route) {
            throw createError(404, 'Route not found');
        }

        const schedule = new Schedule({
            route: routeId,
            date,
            quantity,
            rakes,
            assignedTo,
            status: 'scheduled'
        });

        await schedule.save();
        await schedule.populate('route').populate('assignedTo', 'name email').execPopulate();

        res.status(201).json(schedule);
    } catch (error) {
        next(error);
    }
};

exports.updateSchedule = async (req, res, next) => {
    try {
        const schedule = await Schedule.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('route').populate('assignedTo', 'name email');

        if (!schedule) {
            throw createError(404, 'Schedule not found');
        }

        res.json(schedule);
    } catch (error) {
        next(error);
    }
};

exports.deleteSchedule = async (req, res, next) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);

        if (!schedule) {
            throw createError(404, 'Schedule not found');
        }

        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.bulkUpdateSchedules = async (req, res, next) => {
    try {
        const { schedules } = req.body;

        const updates = schedules.map(schedule => ({
            updateOne: {
                filter: { _id: schedule.id },
                update: { $set: schedule.updates }
            }
        }));

        await Schedule.bulkWrite(updates);

        res.json({ message: 'Schedules updated successfully' });
    } catch (error) {
        next(error);
    }
}; 