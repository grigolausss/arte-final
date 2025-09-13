const multer = require('multer');
const path = require('path');
const fs = require('fs');

// FINAL FIX: Use an absolute path derived from __dirname to ensure the save location is always correct.
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

// Ensure the upload directory exists synchronously on startup
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb){
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

function checkFileType(file, cb){
  // Allow common image types, including heic/heif
  const filetypes = /jpeg|jpg|png|gif|webp|heic|heif/;
  const isMimeTypeAllowed = filetypes.test(file.mimetype);

  if (isMimeTypeAllowed) {
    return cb(null, true);
  } else {
    console.error(`[Upload Middleware] File rejected. Mimetype: ${file.mimetype}, Original Name: ${file.originalname}`);
    cb(new Error('Errore: Tipi di file ammessi: jpeg, png, gif, webp, heic.'), false);
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Increased to 20MB
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).fields([
    { name: 'dossierImage', maxCount: 1 },
    { name: 'planimetryImage', maxCount: 1 },
    { name: 'zoneImage', maxCount: 1 }
]);

module.exports = upload;
