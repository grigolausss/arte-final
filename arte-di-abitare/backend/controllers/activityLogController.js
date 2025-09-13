const ActivityLog = require('../models/activityLogModel');

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// @desc    Get all activity logs
// @route   GET /api/logs
// @access  Private/Employee
const getLogs = asyncHandler(async (req, res, next) => {
    const logs = await ActivityLog.find({})
        .populate('employee', 'email') // Populate the employee's email
        .sort({ createdAt: -1 }); // Show most recent first
    res.json(logs);
});

module.exports = { getLogs };
