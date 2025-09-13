const express = require('express');
const router = express.Router();
const {
    loginEmployee,
    forgotPassword,
    resetPassword,
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
} = require('../controllers/employeeController');
const { protectEmployee } = require('../middleware/employeeAuthMiddleware');
const {
    validateLogin,
    validateForgotPassword,
    validateResetPassword
} = require('../middleware/validationMiddleware');

// Public routes
router.post('/login', validateLogin, loginEmployee);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.put('/reset-password/:resettoken', validateResetPassword, resetPassword);

// --- Protected Employee Routes ---
router.route('/')
    .post(protectEmployee, createEmployee)
    .get(protectEmployee, getEmployees);

router.route('/:id')
    .get(protectEmployee, getEmployeeById)
    .put(protectEmployee, updateEmployee)
    .delete(protectEmployee, deleteEmployee);


module.exports = router;
