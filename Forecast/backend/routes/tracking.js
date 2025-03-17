const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { checkRole } = require('../middleware/roleCheck');

// Get real-time tracking data
router.get('/real-time', trackingController.getRealTimeTracking);

// Update tracking location
router.post('/update-location/:scheduleId',
    checkRole(['admin', 'operator']),
    trackingController.updateLocation
);

// Get tracking history
router.get('/history/:scheduleId', trackingController.getTrackingHistory);

// Get alerts
router.get('/alerts', trackingController.getAlerts);

// Update tracking status
router.post('/status/:scheduleId',
    checkRole(['admin', 'operator']),
    trackingController.updateStatus
);

module.exports = router; 