const ActivityLog = require('../models/activityLogModel');

// @desc    Get all activity logs
// @route   GET /api/logs
// @access  Private/Employee
const getLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find({})
            .populate('employee', 'email') // Populate the employee's email
            .sort({ createdAt: -1 }); // Show most recent first
        res.json(logs);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ message: 'Errore del server.' });
    }
};

module.exports = { getLogs };
