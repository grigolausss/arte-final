const crypto = require('crypto');
const Employee = require('../models/employeeModel');
const { sendEmail } = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/logger');

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- Helper Functions ---
const generateEmployeeToken = (id) => {
  return jwt.sign({ id, type: 'employee' }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateResetPasswordEmailHtml = (name, resetUrl) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
      <h2 style="color: #0d47a1; text-align: center;">Reset della Password</h2>
      <p>Ciao ${name},</p>
      <p>Abbiamo ricevuto una richiesta di reset della password per il tuo account.</p>
      <p>Per favore, clicca sul link qui sotto per impostare una nuova password. Il link è valido per 10 minuti.</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #0d47a1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Resetta Password
        </a>
      </div>
      <p>Se non hai richiesto tu questo reset, puoi tranquillamente ignorare questa email.</p>
      <p>Grazie,<br>Il team di Arte di Abitare</p>
    </div>
  `;
};

// --- Controller Functions ---

const loginEmployee = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });

    if (employee && (await employee.matchPassword(password))) {
        logActivity(employee._id, 'EMPLOYEE_LOGIN', `L'impiegato ${employee.email} ha effettuato il login.`);

        res.status(200).json({
            message: 'Login effettuato con successo.',
            token: generateEmployeeToken(employee._id),
            employee: { _id: employee._id, email: employee.email },
        });
    } else {
        res.status(401);
        throw new Error('Email o password non valide.');
    }
});

const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const employee = await Employee.findOne({ email });

    // Rispondiamo sempre positivamente per non rivelare se un'email esiste
    if (employee) {
        const resetToken = employee.getResetPasswordToken();
        await employee.save({ validateBeforeSave: false });

        // NOTA: L'URL del frontend dovrebbe provenire da una variabile d'ambiente
        const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password/${resetToken}`;
        const textContent = `Hai richiesto un reset della password...`;
        const htmlContent = generateResetPasswordEmailHtml(employee.email, resetUrl);

        try {
            await sendEmail({
                email: employee.email,
                subject: 'Reset della Password - Arte di Abitare',
                message: textContent,
                htmlContent: htmlContent,
            });
        } catch (error) {
            console.error("Failed to send password reset email:", error);
            // Non lanciare un errore al client per motivi di sicurezza
        }
    }

    res.status(200).json({ message: 'Se l\'email è registrata, riceverai un link per il reset.' });
});

const resetPassword = asyncHandler(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const employee = await Employee.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!employee) {
        res.status(400);
        throw new Error('Token non valido o scaduto.');
    }

    employee.password = req.body.password;
    employee.resetPasswordToken = undefined;
    employee.resetPasswordExpire = undefined;
    await employee.save();

    res.status(200).json({ message: 'Password resettata con successo.' });
});

const createEmployee = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
        res.status(400);
        throw new Error('Un dipendente con questa email esiste già.');
    }

    const employee = await Employee.create({ email, password });
    logActivity(req.employee._id, 'CREATE_EMPLOYEE', `Creato nuovo impiegato: ${employee.email}`);
    res.status(201).json({ _id: employee._id, email: employee.email });
});

const getEmployees = asyncHandler(async (req, res, next) => {
    const employees = await Employee.find({}).select('-password');
    res.json(employees);
});

const getEmployeeById = asyncHandler(async (req, res, next) => {
    const employee = await Employee.findById(req.params.id).select('-password');
    if (!employee) {
        res.status(404);
        throw new Error('Dipendente non trovato.');
    }
    res.json(employee);
});

const updateEmployee = asyncHandler(async (req, res, next) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
        res.status(404);
        throw new Error('Dipendente non trovato.');
    }

    employee.email = req.body.email || employee.email;
    if (req.body.password) {
        employee.password = req.body.password;
    }

    const updatedEmployee = await employee.save();
    logActivity(req.employee._id, 'UPDATE_EMPLOYEE', `Aggiornato impiegato: ${updatedEmployee.email}`);
    res.json({ _id: updatedEmployee._id, email: updatedEmployee.email });
});

const deleteEmployee = asyncHandler(async (req, res, next) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
        res.status(404);
        throw new Error('Dipendente non trovato.');
    }

    if (req.employee._id.equals(employee._id)) {
        res.status(400);
        throw new Error('Non puoi eliminare il tuo account.');
    }

    await employee.deleteOne();
    logActivity(req.employee._id, 'DELETE_EMPLOYEE', `Rimosso impiegato: ${employee.email}`);
    res.json({ message: 'Dipendente rimosso.' });
});

module.exports = {
    loginEmployee,
    forgotPassword,
    resetPassword,
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
};
