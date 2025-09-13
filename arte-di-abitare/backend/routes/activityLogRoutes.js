const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/activityLogController');
const { protectEmployee } = require('../middleware/employeeAuthMiddleware');

// @desc    Get all activity logs
// @route   GET /api/logs
// @access  Private/Employee
router.route('/').get(protectEmployee, getLogs);

module.exports = router;
