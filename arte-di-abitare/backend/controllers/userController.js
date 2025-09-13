const User = require('../models/userModel');
const Lead = require('../models/leadModel'); // <-- Import Lead model
const Property = require('../models/propertyModel'); // <-- Import Property model
const { sendEmail, generateOtpEmailHtml } = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

// Function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// @desc    Request an OTP for a user
// @route   POST /api/users/request-otp
const requestOtp = async (req, res) => {
  const { name, surname, email } = req.body;
  if (!name || !surname || !email) {
    return res.status(400).json({ message: 'Per favore, fornisci nome, cognome ed email.' });
  }
  try {
    let user = await User.findOne({ email });
    if (user) {
      user.name = name;
      user.surname = surname;
    } else {
      user = new User({ name, surname, email });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(new Date().getTime() + 10 * 60 * 1000);
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
  } catch (error) {
    res.status(500).json({ message: 'Errore del server.' });
  }
};

// @desc    Verify an OTP for a user
// @route   POST /api/users/verify-otp
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Per favore, fornisci email e OTP.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP non valido o scaduto.' });
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
  } catch (error) {
    res.status(500).json({ message: 'Errore del server.' });
  }
};

// @desc    Update user's phone and finalize the lead
// @route   POST /api/users/update-phone
const updateUserPhone = async (req, res) => {
    const { phone, rif } = req.body;
    const userId = req.user._id;

    if (!phone || !rif) {
        return res.status(400).json({ message: 'Il numero di telefono e il RIF sono obbligatori.' });
    }

    try {
        // 1. Update User's phone
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato.' });
        }
        user.phone = phone;
        await user.save();

        // 2. Find the corresponding Lead and update its status
        const property = await Property.findOne({ rif: rif.toUpperCase() });
        if (!property) {
            return res.status(404).json({ message: 'Immobile non trovato.' });
        }

        const lead = await Lead.findOne({ user: userId, property: property._id });
        if (lead) {
            // Logic to determine if the lead is "hot"
            const isHotLead = lead.questionnaire1 && lead.questionnaire1.purchaseTimeline === 'entro 3 mesi';

            lead.status = 'Da richiamare';
            if (isHotLead) {
                // Set callback date to now to put them in the "Da richiamare subito" list
                lead.callbackDate = new Date();
            }
            await lead.save();
        }

        res.status(200).json({ message: 'Numero di telefono aggiornato e lead finalizzato con successo.' });

    } catch (error) {
        console.error('Error updating phone and lead:', error);
        res.status(500).json({ message: 'Errore del server durante l\'aggiornamento.' });
    }
};

module.exports = {
  requestOtp,
  verifyOtp,
  updateUserPhone,
};
