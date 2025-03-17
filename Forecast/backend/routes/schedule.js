const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { checkRole } = require('../middleware/roleCheck');

// Get all schedules with filtering
router.get('/', scheduleController.getSchedules);

// Get single schedule
router.get('/:id', scheduleController.getScheduleById);

// Create new schedule (admin and operator only)
router.post('/', 
    checkRole(['admin', 'operator']), 
    scheduleController.createSchedule
);

// Update schedule
router.put('/:id', 
    checkRole(['admin', 'operator']), 
    scheduleController.updateSchedule
);

// Delete schedule (admin only)
router.delete('/:id', 
    checkRole(['admin']), 
    scheduleController.deleteSchedule
);

// Bulk update schedules
router.post('/bulk-update',
    checkRole(['admin']),
    scheduleController.bulkUpdateSchedules
);

module.exports = router; 