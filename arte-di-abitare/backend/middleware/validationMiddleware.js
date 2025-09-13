const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const validateRequestOtp = [
    body('email').isEmail().withMessage('Per favore, fornisci un\'email valida.').normalizeEmail(),
    body('name').trim().not().isEmpty().withMessage('Il nome è obbligatorio.'),
    body('surname').trim().not().isEmpty().withMessage('Il cognome è obbligatorio.'),
    handleValidationErrors,
];

const validateLogin = [
    body('email').isEmail().withMessage('Per favore, fornisci un\'email valida.').normalizeEmail(),
    body('password').not().isEmpty().withMessage('La password è obbligatoria.'),
    handleValidationErrors,
];

const validateForgotPassword = [
    body('email').isEmail().withMessage('Per favore, fornisci un\'email valida.').normalizeEmail(),
    handleValidationErrors,
];

const validateResetPassword = [
    body('password').isLength({ min: 6 }).withMessage('La password deve essere di almeno 6 caratteri.'),
    handleValidationErrors,
];

module.exports = {
    validateRequestOtp,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
};
