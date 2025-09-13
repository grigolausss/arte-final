const nodemailer = require('nodemailer');

// Function to generate the HTML for the OTP email
const generateOtpEmailHtml = (name, otp) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
      <h2 style="color: #0d47a1; text-align: center;">Arte di Abitare</h2>
      <p>Ciao ${name},</p>
      <p>Grazie per il tuo interesse.</p>
      <p>Ecco il tuo codice di verifica monouso (OTP) per accedere ai dettagli dell'immobile. Il codice scade tra 10 minuti.</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f4f4f4; padding: 10px 20px; border-radius: 5px;">
          ${otp}
        </span>
      </div>
      <p>Se non hai richiesto tu questo codice, per favore ignora questa email.</p>
      <p>Grazie,<br>Il team di Arte di Abitare</p>
    </div>
  `;
};

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    // For port 587, secure should be false because the connection starts in plain text and is upgraded to TLS using STARTTLS
    secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"Arte di Abitare" <' + (process.env.EMAIL_USER) + '>',
    to: options.email,
    subject: options.subject,
    text: options.message, // Fallback for clients that don't support HTML
    html: options.htmlContent || options.message, // Use provided HTML or fallback to text
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);
};

module.exports = { sendEmail, generateOtpEmailHtml };
