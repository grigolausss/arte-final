const express = require('express');
const router = express.Router();
const {
    loginEmployee,
    verifyEmployeeOtp,
    forgotPassword,
    resetPassword,
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    updateMyPassword
} = require('../controllers/employeeController');
const { protectEmployee } = require('../middleware/employeeAuthMiddleware');
const {
    validateLogin,
    validateForgotPassword,
    validateResetPassword
} = require('../middleware/validationMiddleware');

// Public routes
router.post('/login', validateLogin, loginEmployee);
router.post('/login/verify-otp', verifyEmployeeOtp); // OTP format could be validated here
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.put('/reset-password/:resettoken', validateResetPassword, resetPassword);

// --- Protected Employee Routes ---
router.route('/')
    .post(protectEmployee, createEmployee) // Could add validation for createEmployee
    .get(protectEmployee, getEmployees);

router.route('/profile/password')
    .put(protectEmployee, validateResetPassword, updateMyPassword); // Reuse reset password validation

router.route('/:id')
    .get(protectEmployee, getEmployeeById)
    .put(protectEmployee, updateEmployee) // Could add validation for updateEmployee
    .delete(protectEmployee, deleteEmployee);


module.exports = router;
