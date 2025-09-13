const mongoose = require('mongoose');

const activityLogSchema = mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Employee',
    },
    action: {
      type: String,
      required: true,
      enum: [ // A list of possible actions for consistency
        'EMPLOYEE_LOGIN',
        'CREATE_PROPERTY',
        'UPDATE_PROPERTY',
        'DELETE_PROPERTY',
        'CREATE_EMPLOYEE',
        'UPDATE_EMPLOYEE',
        'DELETE_EMPLOYEE',
        'UPDATE_LEAD_STATUS',
        // Add more actions as needed
      ],
    },
    details: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
