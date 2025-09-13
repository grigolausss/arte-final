const cloudinary = require('cloudinary').v2;

// Configura Cloudinary con le tue credenziali
// Queste variabili d'ambiente dovrebbero essere nel tuo file .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
