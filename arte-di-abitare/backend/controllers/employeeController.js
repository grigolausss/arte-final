const crypto = require('crypto');
const Employee = require('../models/employeeModel');
const { sendEmail, generateOtpEmailHtml } = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/logger');

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

const loginEmployee = async (req, res) => {
    const { email, password } = req.body;
    try {
        const employee = await Employee.findOne({ email });
        if (employee && (await employee.matchPassword(password))) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            employee.otp = otp;
            employee.otpExpires = new Date(new Date().getTime() + 10 * 60 * 1000);
            await employee.save();
            const textContent = `Il tuo codice OTP per l'accesso all'area riservata è: ${otp}`;
            const htmlContent = generateOtpEmailHtml(employee.email, otp);
            await sendEmail({
                email: employee.email,
                subject: 'Codice di Accesso Area Riservata - Arte di Abitare',
                message: textContent,
                htmlContent: htmlContent,
            });
            return res.status(200).json({ message: `Accesso autorizzato. Ti abbiamo inviato un codice OTP via email.` });
        }
        res.status(401).json({ message: 'Email o password non valide.' });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const verifyEmployeeOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const employee = await Employee.findOne({ email });
        if (!employee || !employee.otp || employee.otp !== otp || employee.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP non valido o scaduto.' });
        }
        employee.otp = undefined;
        employee.otpExpires = undefined;
        await employee.save();
        logActivity(employee._id, 'EMPLOYEE_LOGIN', `L'impiegato ${employee.email} ha effettuato il login.`);
        res.status(200).json({
            message: 'Login effettuato con successo.',
            token: generateEmployeeToken(employee._id),
            employee: { _id: employee._id, email: employee.email },
        });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(200).json({ message: 'Se l\'email è registrata, riceverai un link per il reset.' });
        }
        const resetToken = employee.getResetPasswordToken();
        await employee.save({ validateBeforeSave: false });
        const resetUrl = `http://localhost:3000/admin/reset-password/${resetToken}`;
        const textContent = `Hai richiesto un reset della password...`;
        const htmlContent = generateResetPasswordEmailHtml(employee.email, resetUrl);
        await sendEmail({
            email: employee.email,
            subject: 'Reset della Password - Arte di Abitare',
            message: textContent,
            htmlContent: htmlContent,
        });
        res.status(200).json({ message: 'Email per il reset della password inviata.' });
    } catch (error) {
        res.status(500).json({ message: 'Errore durante l\'invio dell\'email.' });
    }
};

const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
    try {
        const employee = await Employee.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
        if (!employee) {
            return res.status(400).json({ message: 'Token non valido o scaduto.' });
        }
        employee.password = req.body.password;
        employee.resetPasswordToken = undefined;
        employee.resetPasswordExpire = undefined;
        await employee.save();
        res.status(200).json({ message: 'Password resettata con successo.' });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const createEmployee = async (req, res) => {
    const { email, password } = req.body;
    try {
        const employeeExists = await Employee.findOne({ email });
        if (employeeExists) {
            return res.status(400).json({ message: 'Un dipendente con questa email esiste già.' });
        }
        const employee = await Employee.create({ email, password });
        logActivity(req.employee._id, 'CREATE_EMPLOYEE', `Creato nuovo impiegato: ${employee.email}`);
        res.status(201).json({ _id: employee._id, email: employee.email });
    } catch (error) {
        res.status(400).json({ message: 'Dati non validi.', error: error.message });
    }
};

const getEmployees = async (req, res) => {
    const employees = await Employee.find({}).select('-password');
    res.json(employees);
};

const getEmployeeById = async (req, res) => {
    const employee = await Employee.findById(req.params.id).select('-password');
    if (employee) {
        res.json(employee);
    } else {
        res.status(404).json({ message: 'Dipendente non trovato.' });
    }
};

const updateEmployee = async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (employee) {
        employee.email = req.body.email || employee.email;
        if (req.body.password) {
            employee.password = req.body.password;
        }
        const updatedEmployee = await employee.save();
        logActivity(req.employee._id, 'UPDATE_EMPLOYEE', `Aggiornato impiegato: ${updatedEmployee.email}`);
        res.json({ _id: updatedEmployee._id, email: updatedEmployee.email });
    } else {
        res.status(404).json({ message: 'Dipendente non trovato.' });
    }
};

const deleteEmployee = async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (employee) {
        if (req.employee._id.equals(employee._id)) {
            return res.status(400).json({ message: 'Non puoi eliminare il tuo account.' });
        }
        await employee.deleteOne();
        logActivity(req.employee._id, 'DELETE_EMPLOYEE', `Rimosso impiegato: ${employee.email}`);
        res.json({ message: 'Dipendente rimosso.' });
    } else {
        res.status(404).json({ message: 'Dipendente non trovato.' });
    }
};

const updateMyPassword = async (req, res) => {
    const employee = await Employee.findById(req.employee._id);
    if (employee) {
        if (req.body.password) {
            employee.password = req.body.password;
            await employee.save();
            res.json({ message: 'Password aggiornata con successo.' });
        } else {
            res.status(400).json({ message: 'Per favore, fornisci una nuova password.' });
        }
    } else {
        res.status(404).json({ message: 'Dipendente non trovato.' });
    }
};

module.exports = {
    loginEmployee, verifyEmployeeOtp, forgotPassword, resetPassword, createEmployee,
    getEmployees, getEmployeeById, updateEmployee, deleteEmployee, updateMyPassword,
};
