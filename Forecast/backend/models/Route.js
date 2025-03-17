const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    source: {
        name: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        }
    },
    destination: {
        name: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        }
    },
    distance: Number,
    estimatedTime: Number,
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

routeSchema.index({ "source.location": "2dsphere" });
routeSchema.index({ "destination.location": "2dsphere" });

module.exports = mongoose.model('Route', routeSchema); 