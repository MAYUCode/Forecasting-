const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { checkRole } = require('../middleware/roleCheck');

// Get dashboard analytics
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Get performance metrics
router.get('/performance', analyticsController.getPerformanceMetrics);

// Get route analytics
router.get('/routes', analyticsController.getRouteAnalytics);

// Get comparison data
router.post('/compare', analyticsController.getComparisonData);

// Get forecast data
router.get('/forecast', analyticsController.getForecastData);

// Export analytics data
router.post('/export', analyticsController.exportAnalytics);

// Get custom report
router.post('/custom-report', 
    checkRole(['admin', 'operator']), 
    analyticsController.generateCustomReport
);

module.exports = router; 