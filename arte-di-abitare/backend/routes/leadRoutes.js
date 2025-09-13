const express = require('express');
const router = express.Router();
const {
    submitQuestionnaire1,
    submitQuestionnaire2,
    savePropertyDecision,
    saveZoneDecision,
    getHotLeads,
    getWarmLeads,
    getIncompleteLeads,
    getArchivedLeads, // new
    getTodaysReminders,
    getLeadById,
    updateLeadCallDetails
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { protectEmployee } = require('../middleware/employeeAuthMiddleware');

// === Public User Routes ===
router.post('/questionnaire1', protect, submitQuestionnaire1);
router.post('/questionnaire2', protect, submitQuestionnaire2);
router.post('/:rif/decision-property', protect, savePropertyDecision);
router.post('/:rif/decision-zone', protect, saveZoneDecision);

// === Employee Dashboard & Lead Routes ===
router.get('/hot', protectEmployee, getHotLeads);
router.get('/warm', protectEmployee, getWarmLeads);
router.get('/incomplete', protectEmployee, getIncompleteLeads);
router.get('/archived', protectEmployee, getArchivedLeads); // new
router.get('/reminders/today', protectEmployee, getTodaysReminders);
router.get('/:id', protectEmployee, getLeadById);
router.put('/:id/call-details', protectEmployee, updateLeadCallDetails);

module.exports = router;
