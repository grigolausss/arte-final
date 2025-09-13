const ActivityLog = require('../models/activityLogModel');

/**
 * Logs an activity performed by an employee.
 * @param {string} employeeId - The ID of the employee performing the action.
 * @param {string} action - The type of action performed (e.g., 'CREATE_PROPERTY').
 * @param {string} details - A description of the action (e.g., 'Created property RIF: R123').
 */
const logActivity = async (employeeId, action, details) => {
    try {
        await ActivityLog.create({
            employee: employeeId,
            action,
            details,
        });
    } catch (error) {
        // We log the error to the console, but don't throw it,
        // as a logging failure should not interrupt the main operation.
        console.error('Failed to log activity:', error);
    }
};

module.exports = logActivity;
