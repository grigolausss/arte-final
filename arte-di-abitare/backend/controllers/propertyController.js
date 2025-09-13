const Property = require('../models/propertyModel');
const Lead = require('../models/leadModel');
const cloudinary = require('../config/cloudinaryConfig');
const sharp = require('sharp');
const axios = require('axios'); // Per scaricare l'immagine da Cloudinary

// Funzione helper per gestire gli errori in modo asincrono
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Cerca una proprietà tramite RIF
const searchProperty = asyncHandler(async (req, res, next) => {
    const { rif } = req.body;
    if (!rif) {
        res.status(400);
        throw new Error('Per favore, fornisci un codice RIF.');
    }

    const normalizedRif = rif.replace(/\s/g, '').toUpperCase();
    const property = await Property.findOne({ rif: normalizedRif });

    if (!property || !property.isActive) {
        res.status(404);
        throw new Error('Immobile non trovato o non attivo.');
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
});

// Aggiunge un watermark alla planimetria
const getWatermarkedFloorPlan = asyncHandler(async (req, res, next) => {
    const normalizedRif = req.params.rif.replace(/\s/g, '').toUpperCase();
    const property = await Property.findOne({ rif: normalizedRif });

    if (!property || !property.planimetryImage) {
        res.status(404);
        throw new Error('Planimetria non trovata.');
    }

    // Scarica l'immagine da Cloudinary
    const response = await axios({ url: property.planimetryImage, responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');

    const userEmail = req.user.email;
    const currentDate = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
    const watermarkText = `${userEmail}   ${currentDate}`;
    const svgWatermark = `<svg width="950" height="150"><text x="30" y="90" font-family="Arial, sans-serif" font-weight="bold" font-size="48" fill="rgba(0, 0, 0, 0.25)" transform="rotate(-30)">${watermarkText}</text></svg>`;
    const svgBuffer = Buffer.from(svgWatermark);

    const watermarkedImageBuffer = await sharp(imageBuffer)
        .composite([{ input: svgBuffer, tile: true, blend: 'over' }])
        .png()
        .toBuffer();

    res.set('Content-Type', 'image/png');
    res.send(watermarkedImageBuffer);
});

// Crea una nuova proprietà
const createProperty = asyncHandler(async (req, res, next) => {
    if (!req.files || !req.files.dossierImage || !req.files.planimetryImage || !req.files.zoneImage) {
        res.status(400);
        throw new Error('Tutte e tre le immagini sono obbligatorie.');
    }

    const propertyData = {
        ...req.body,
        dossierImage: req.files.dossierImage[0].path,
        planimetryImage: req.files.planimetryImage[0].path,
        zoneImage: req.files.zoneImage[0].path,
        isActive: req.body.isActive === 'true',
    };

    const property = new Property(propertyData);
    const createdProperty = await property.save();
    res.status(201).json(createdProperty);
});

// Aggiorna una proprietà esistente
const updateProperty = asyncHandler(async (req, res, next) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
        res.status(404);
        throw new Error('Immobile non trovato.');
    }

    // Funzione helper per eliminare la vecchia immagine da Cloudinary
    const deleteOldImage = async (imageUrl) => {
        if (!imageUrl) return;
        try {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error('Failed to delete old image from Cloudinary:', err);
            // Non bloccare l'aggiornamento se la cancellazione fallisce
        }
    };

    if (req.files) {
        if (req.files.dossierImage) {
            await deleteOldImage(property.dossierImage);
            property.dossierImage = req.files.dossierImage[0].path;
        }
        if (req.files.planimetryImage) {
            await deleteOldImage(property.planimetryImage);
            property.planimetryImage = req.files.planimetryImage[0].path;
        }
        if (req.files.zoneImage) {
            await deleteOldImage(property.zoneImage);
            property.zoneImage = req.files.zoneImage[0].path;
        }
    }

    // Aggiorna gli altri campi
    Object.assign(property, req.body);
    property.isActive = req.body.isActive === 'true';

    const updatedProperty = await property.save();
    res.json(updatedProperty);
});

// Elimina una proprietà
const deleteProperty = asyncHandler(async (req, res, next) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
        res.status(404);
        throw new Error('Immobile non trovato.');
    }

    const deleteImage = async (imageUrl) => {
        if (!imageUrl) return;
        try {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error('Failed to delete image from Cloudinary:', err);
        }
    };

    await deleteImage(property.dossierImage);
    await deleteImage(property.planimetryImage);
    await deleteImage(property.zoneImage);

    await property.deleteOne();
    res.json({ message: 'Immobile rimosso.' });
});

// Ottiene tutte le proprietà
const getProperties = asyncHandler(async (req, res, next) => {
    const properties = await Property.find({}).sort({ createdAt: -1 });
    res.json(properties);
});

// Ottiene una proprietà per ID
const getPropertyById = asyncHandler(async (req, res, next) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
        res.status(404);
        throw new Error('Immobile non trovato.');
    }
    res.json(property);
});

// Ottiene l'immagine della zona di una proprietà
const getPropertyZone = asyncHandler(async (req, res, next) => {
    const property = await Property.findOne({ rif: req.params.rif.toUpperCase() }, 'title zoneImage');
    if (!property || !property.zoneImage) {
        res.status(404);
        throw new Error('Dati della zona non trovati.');
    }
    res.json({ zoneImage: property.zoneImage, title: property.title });
});

// Ottiene proprietà alternative
const getAlternatives = asyncHandler(async (req, res, next) => {
    const { rif } = req.params;
    const userId = req.user._id;
    const originalProperty = await Property.findOne({ rif: rif.toUpperCase() });

    if (!originalProperty) {
        res.status(404);
        throw new Error('Immobile originale non trovato.');
    }

    const lead = await Lead.findOne({ user: userId, property: originalProperty._id });
    if (!lead || !lead.questionnaire1 || !lead.questionnaire2) {
        return res.json([]);
    }

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
});

module.exports = {
    searchProperty, getWatermarkedFloorPlan, getProperties, getPropertyById,
    createProperty, updateProperty, deleteProperty, getPropertyZone, getAlternatives,
};
