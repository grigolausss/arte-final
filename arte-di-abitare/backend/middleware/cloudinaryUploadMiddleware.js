const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');
const path = require('path');

// Configura lo storage per Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Usa il fieldname (es. 'dossierImage') per creare sotto-cartelle
    const folderName = `arte_di_abitare/${file.fieldname}`;
    const fileBaseName = path.basename(file.originalname, path.extname(file.originalname));
    const fileName = `${file.fieldname}-${fileBaseName}-${Date.now()}`;

    return {
      folder: folderName,
      public_id: fileName,
      allowed_formats: ['jpeg', 'jpg', 'png'],
      transformation: [{ width: 1024, height: 1024, crop: 'limit' }]
    };
  }
});

// Crea l'istanza di multer con lo storage di Cloudinary e la gestione dei campi specifici
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Errore: sono permesse solo immagini (jpeg, jpg, png)!'));
  }
}).fields([
    { name: 'dossierImage', maxCount: 1 },
    { name: 'planimetryImage', maxCount: 1 },
    { name: 'zoneImage', maxCount: 1 }
]);

module.exports = upload;
