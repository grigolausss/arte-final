const Property = require('../models/propertyModel');
const Lead = require('../models/leadModel');
const logActivity = require('../utils/logger');
const sharp = require('sharp');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const heicConvert = require('heic-convert');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

const removeFile = async (filename) => {
    if (!filename) return;
    try {
        await fsp.unlink(path.join(UPLOADS_DIR, filename));
    } catch (err) {
        if (err.code !== 'ENOENT') console.error(`Failed to delete old file: ${filename}`, err);
    }
};

const processImage = async (file) => {
    if (!file) return null;

    const originalPath = file.path;
    let inputBuffer;

    // Convert HEIC/HEIF to a buffer that sharp can process
    if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
        inputBuffer = await heicConvert({
            buffer: await fsp.readFile(originalPath),
            format: 'JPEG',
            quality: 1.0
        });
    } else {
        inputBuffer = await fsp.readFile(originalPath);
    }

    // Create a new filename with a .jpeg extension for consistency
    const newFilename = `${path.parse(file.filename).name}.jpeg`;
    const newPath = path.join(UPLOADS_DIR, newFilename);

    // Use sharp to resize and compress the image
    await sharp(inputBuffer)
        .resize({ width: 1920, withoutEnlargement: true }) // Max width 1920px
        .jpeg({ quality: 85 }) // Compress to 85% quality
        .toFile(newPath);

    // Clean up the original temporary file uploaded by multer
    if (fs.existsSync(originalPath)) {
        await fsp.unlink(originalPath);
    }

    return newFilename;
};

const searchProperty = async (req, res) => {
    const { rif } = req.body;
    if (!rif) { return res.status(400).json({ message: 'Per favore, fornisci un codice RIF.' }); }
    try {
        const normalizedRif = rif.replace(/\s/g, '').toUpperCase();
        const property = await Property.findOne({ rif: normalizedRif });
        if (!property || !property.isActive) {
            return res.status(404).json({ message: 'Immobile non trovato o non attivo.' });
        }
        const userId = req.user._id;
        await Lead.findOneAndUpdate(
            { user: userId, property: property._id },
            { $setOnInsert: { user: userId, property: property._id } },
            { upsert: true, new: true, runValidators: true }
        );
        const anyLeadWithQuestionnaires = await Lead.findOne({
            user: userId,
            questionnaire1: { $exists: true, $ne: null },
            questionnaire2: { $exists: true, $ne: null },
        });
        res.status(200).json({
            _id: property._id,
            rif: property.rif,
            title: property.title,
            dossierImage: property.dossierImage,
            questionnairesCompleted: !!anyLeadWithQuestionnaires,
        });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

const getWatermarkedFloorPlan = async (req, res) => {
    try {
        const normalizedRif = req.params.rif.replace(/\s/g, '').toUpperCase();
        const property = await Property.findOne({ rif: normalizedRif });
        if (!property || !property.planimetryImage) {
            return res.status(404).json({ message: 'Planimetria non trovata.' });
        }
        const imagePath = path.join(UPLOADS_DIR, property.planimetryImage);
        const imageBuffer = await fsp.readFile(imagePath);
        const userEmail = req.user.email;
        const currentDate = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
        const watermarkText = `${userEmail}   ${currentDate}`;
        // FINAL FIX: Significantly increased font size and adjusted SVG to ensure visibility
        const svgWatermark = `<svg width="950" height="150"><text x="30" y="90" font-family="Arial, sans-serif" font-weight="bold" font-size="48" fill="rgba(0, 0, 0, 0.25)" transform="rotate(-30)">${watermarkText}</text></svg>`;
        const svgBuffer = Buffer.from(svgWatermark);
        const watermarkedImageBuffer = await sharp(imageBuffer)
            .composite([{ input: svgBuffer, tile: true, blend: 'over' }])
            .png().toBuffer();
        res.set('Content-Type', 'image/png');
        res.send(watermarkedImageBuffer);
    } catch (error) {
        console.error('Watermark service error:', error);
        res.status(500).json({ message: 'Errore durante la creazione del watermark.' });
    }
};

const createProperty = async (req, res) => {
    try {
        if (!req.files || !req.files.dossierImage || !req.files.planimetryImage || !req.files.zoneImage) {
            return res.status(400).json({ message: 'Tutte e tre le immagini sono obbligatorie.' });
        }
        const dossierImageFilename = await processImage(req.files.dossierImage[0]);
        const planimetryImageFilename = await processImage(req.files.planimetryImage[0]);
        const zoneImageFilename = await processImage(req.files.zoneImage[0]);
        const propertyData = {
            ...req.body,
            dossierImage: dossierImageFilename,
            planimetryImage: planimetryImageFilename,
            zoneImage: zoneImageFilename,
            isActive: req.body.isActive === 'true',
        };
        const property = new Property(propertyData);
        const createdProperty = await property.save();
        res.status(201).json(createdProperty);
    } catch (error) {
        res.status(400).json({ message: 'Dati immobile non validi.', error: error.message });
    }
};

const updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Immobile non trovato.' });
        Object.assign(property, req.body);
        property.isActive = req.body.isActive === 'true';
        if (req.files) {
            if (req.files.dossierImage) {
                await removeFile(property.dossierImage);
                property.dossierImage = await processImage(req.files.dossierImage[0]);
            }
            if (req.files.planimetryImage) {
                await removeFile(property.planimetryImage);
                property.planimetryImage = await processImage(req.files.planimetryImage[0]);
            }
            if (req.files.zoneImage) {
                await removeFile(property.zoneImage);
                property.zoneImage = await processImage(req.files.zoneImage[0]);
            }
        }
        const updatedProperty = await property.save();
        res.json(updatedProperty);
    } catch (error) {
        res.status(400).json({ message: 'Dati immobile non validi.', error: error.message });
    }
};

const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property) {
            await removeFile(property.dossierImage);
            await removeFile(property.planimetryImage);
            await removeFile(property.zoneImage);
            await property.deleteOne();
            res.json({ message: 'Immobile rimosso.' });
        } else {
            res.status(404).json({ message: 'Immobile non trovato.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

// ... (rest of the functions like getProperties, getPropertyById, getPropertyZone, getAlternatives)
const getProperties = async (req, res) => {
    try {
        const properties = await Property.find({}).sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) { res.status(500).json({ message: 'Errore del server.' }); }
};
const getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property) { res.json(property); }
        else { res.status(404).json({ message: 'Immobile non trovato.' }); }
    } catch (error) { res.status(500).json({ message: 'Errore del server.' }); }
};
const getPropertyZone = async (req, res) => {
    try {
        const property = await Property.findOne({ rif: req.params.rif.toUpperCase() }, 'title zoneImage');
        if (property && property.zoneImage) {
            res.json({ zoneImage: property.zoneImage, title: property.title });
        } else {
            res.status(404).json({ message: 'Dati della zona non trovati.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};
const getAlternatives = async (req, res) => {
    try {
        const { rif } = req.params;
        const userId = req.user._id;
        const originalProperty = await Property.findOne({ rif: rif.toUpperCase() });
        if (!originalProperty) return res.status(404).json({ message: 'Immobile originale non trovato.' });
        const lead = await Lead.findOne({ user: userId, property: originalProperty._id });
        if (!lead || !lead.questionnaire1 || !lead.questionnaire2) return res.json([]);
        const { maxBudget } = lead.questionnaire1;
        const { searchZone, minBedrooms } = lead.questionnaire2;
        const budget = parseInt(String(maxBudget).replace(/[€\.\s]/g, ''), 10) || null;
        const priceMargin = 0.20;
        const query = { _id: { $ne: originalProperty._id }, isActive: true };
        if (searchZone) { query.zone = { $regex: searchZone, $options: 'i' }; }
        if (minBedrooms) { query.bedrooms = { $gte: minBedrooms }; }
        if (budget) { query.price = { $gte: budget * (1 - priceMargin), $lte: budget * (1 + priceMargin) }; }
        const alternatives = await Property.find(query).limit(3).select('_id title rif').sort({ createdAt: -1 });
        res.json(alternatives);
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

module.exports = {
    searchProperty, getWatermarkedFloorPlan, getProperties, getPropertyById,
    createProperty, updateProperty, deleteProperty, getPropertyZone, getAlternatives,
};
