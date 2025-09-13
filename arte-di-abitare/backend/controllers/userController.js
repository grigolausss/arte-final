const User = require('../models/userModel');
const Lead = require('../models/leadModel');
const Property = require('../models/propertyModel');
const { sendEmail, generateOtpEmailHtml } = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

const requestOtp = asyncHandler(async (req, res, next) => {
  const { name, surname, email } = req.body;
  if (!name || !surname || !email) {
    res.status(400);
    throw new Error('Per favore, fornisci nome, cognome ed email.');
  }

  let user = await User.findOne({ email });
  if (user) {
    user.name = name;
    user.surname = surname;
  } else {
    user = new User({ name, surname, email });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 minutes
  user.isVerified = false;
  await user.save();

  const htmlContent = generateOtpEmailHtml(user.name, otp);
  const textContent = `Il tuo codice OTP è: ${otp}.`;

  await sendEmail({
    email: user.email,
    subject: 'Il tuo codice di verifica - Arte di Abitare',
    message: textContent,
    htmlContent: htmlContent,
  });

  res.status(200).json({ message: `OTP inviato a ${email}.` });
});

const verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400);
    throw new Error('Per favore, fornisci email e OTP.');
  }

  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpires < new Date()) {
    res.status(400);
    throw new Error('OTP non valido o scaduto.');
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.status(200).json({
    message: 'Email verificata con successo.',
    token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email },
  });
});

const updateUserPhone = asyncHandler(async (req, res, next) => {
    const { phone, rif } = req.body;
    const userId = req.user._id;

    if (!phone || !rif) {
        res.status(400);
        throw new Error('Il numero di telefono e il RIF sono obbligatori.');
    }

    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('Utente non trovato.');
    }
    user.phone = phone;
    await user.save();

    const property = await Property.findOne({ rif: rif.toUpperCase() });
    if (!property) {
        res.status(404);
        throw new Error('Immobile non trovato.');
    }

    // This logic is now handled in the leadController after questionnaire submission
    // We just ensure the lead exists.
    await Lead.findOneAndUpdate(
        { user: userId, property: property._id },
        { $setOnInsert: { user: userId, property: property._id, status: 'Incompleto' } },
        { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Numero di telefono aggiornato con successo.' });
});

module.exports = {
  requestOtp,
  verifyOtp,
  updateUserPhone,
};
