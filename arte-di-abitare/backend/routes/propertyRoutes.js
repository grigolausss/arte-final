const express = require('express');
const router = express.Router();
const {
    searchProperty,
    getWatermarkedFloorPlan,
    getProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    getPropertyZone,
    getAlternatives // Added new function
} = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const { protectEmployee } = require('../middleware/employeeAuthMiddleware');
const upload = require('../middleware/uploadMiddleware');

// === Public User Routes ===

router.post('/search', protect, searchProperty);
router.get('/:rif/planimetria', protect, getWatermarkedFloorPlan);
router.get('/:rif/zone', protect, getPropertyZone);

// @desc    Get alternative properties based on user's lead data
// @route   GET /api/properties/:rif/alternatives
// @access  Private
router.get('/:rif/alternatives', protect, getAlternatives);


// === Employee CRUD Routes ===
router.route('/')
    .get(protectEmployee, getProperties)
    .post(protectEmployee, upload, createProperty);

router.route('/:id')
    .get(protectEmployee, getPropertyById)
    .put(protectEmployee, upload, updateProperty)
    .delete(protectEmployee, deleteProperty);

module.exports = router;
