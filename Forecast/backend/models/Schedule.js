const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['scheduled', 'in-transit', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    rakes: {
        type: Number,
        required: true,
        min: 1
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tracking: {
        currentLocation: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        lastUpdated: Date,
        estimatedArrival: Date
    }
}, {
    timestamps: true
});

scheduleSchema.index({ "tracking.currentLocation": "2dsphere" });

module.exports = mongoose.model('Schedule', scheduleSchema); 