const express = require('express');
const router = express.Router();

const { requestOtp, verifyOtp, updateUserPhone } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequestOtp } = require('../middleware/validationMiddleware');

// @desc    Request an OTP for a user
// @route   POST /api/users/request-otp
// @access  Public
router.post('/request-otp', validateRequestOtp, requestOtp);

// @desc    Verify an OTP for a user
// @route   POST /api/users/verify-otp
// @access  Public
router.post('/verify-otp', verifyOtp); // Could add validation for OTP format

// @desc    Update user's phone number
// @route   POST /api/users/update-phone
// @access  Private
router.post('/update-phone', protect, updateUserPhone); // Could add validation for phone format


module.exports = router;
