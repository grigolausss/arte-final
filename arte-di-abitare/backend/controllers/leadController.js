const Lead = require('../models/leadModel');
const Property = require('../models/propertyModel');
const Employee = require('../models/employeeModel');
const logActivity = require('../utils/logger');

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const submitQuestionnaire1 = asyncHandler(async (req, res, next) => {
    const { propertyRif, answers } = req.body;
    const userId = req.user._id;

    const property = await Property.findOne({ rif: propertyRif.toUpperCase() });
    if (!property) {
        res.status(404);
        throw new Error('Immobile non trovato.');
    }

    const lead = await Lead.findOneAndUpdate(
        { user: userId, property: property._id },
        { $set: { user: userId, property: property._id, questionnaire1: answers, status: 'Incompleto' } },
        { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ message: 'Questionario 1 inviato con successo.', lead });
});

const submitQuestionnaire2 = asyncHandler(async (req, res, next) => {
    const { propertyRif, answers } = req.body;
    const userId = req.user._id;

    const property = await Property.findOne({ rif: propertyRif.toUpperCase() });
    if (!property) {
        res.status(404);
        throw new Error('Immobile non trovato.');
    }

    const lead = await Lead.findOne({ user: userId, property: property._id });
    if (!lead) {
        res.status(404);
        throw new Error('Lead non trovato. Completa prima il questionario 1.');
    }

    lead.questionnaire2 = answers;

    // Logica di categorizzazione lead (Punto G)
    const q1 = lead.questionnaire1 || {};
    const q2 = answers || {};

    const isImmobileOk = q1.propertyInterest === 'si';
    const isPlanimetryOk = q1.planimetryInterest === 'si';
    const isZoneOk = q1.zoneInterest === 'si';
    const isUserInterested = q2.finalInterest === 'si';
    const purchaseTimeframe = q2.purchaseTimeframe; // es. 'Entro 3 mesi'

    const allPositive = isImmobileOk && isPlanimetryOk && isZoneOk && isUserInterested;
    const isUrgent = purchaseTimeframe === 'Entro 3 mesi' || purchaseTimeframe === 'Entro 1 mese';

    if (allPositive && isUrgent) {
        lead.status = 'Da richiamare subito';
    } else {
        lead.status = 'Da richiamare';
    }

    const updatedLead = await lead.save();
    res.status(200).json({ message: 'Questionario 2 inviato con successo.', lead: updatedLead });
});

const getLeadsByStatus = (status, sort = { createdAt: -1 }) => asyncHandler(async (req, res, next) => {
    const leads = await Lead.find({ status })
        .populate('user', 'name surname email phone')
        .populate('property', 'title rif')
        .sort(sort);
    res.status(200).json(leads);
});

const getHotLeads = getLeadsByStatus('Da richiamare subito', { updatedAt: -1 });
const getWarmLeads = getLeadsByStatus('Da richiamare', { updatedAt: -1 });
const getIncompleteLeads = getLeadsByStatus('Incompleto', { createdAt: -1 });
const getArchivedLeads = getLeadsByStatus('Archiviato', { updatedAt: -1 });


const getTodaysReminders = asyncHandler(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reminders = await Lead.find({
        needsCallback: true,
        callbackDate: { $gte: today, $lt: tomorrow }
    }).populate('user', 'name surname');
    res.status(200).json(reminders);
});

const getLeadById = asyncHandler(async (req, res, next) => {
    const lead = await Lead.findById(req.params.id)
        .populate('user', 'name surname email phone')
        .populate('property', '_id title rif')
        .populate('calledBy', 'email')
        .populate({ path: 'notes', populate: { path: 'employee', select: 'email' } });

    if (!lead) {
        res.status(404);
        throw new Error('Lead non trovato.');
    }
    res.status(200).json(lead);
});

const updateLeadCallDetails = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { isContacted, noteText, needsCallback, callbackDate, status } = req.body;
    const currentEmployeeId = req.employee._id;

    const lead = await Lead.findById(id);
    if (!lead) {
        res.status(404);
        throw new Error('Lead non trovato.');
    }

    if (noteText && noteText.trim() !== '') {
        lead.notes.push({ text: noteText, employee: currentEmployeeId });
    }

    lead.isContacted = isContacted;
    lead.needsCallback = needsCallback;
    lead.callDate = isContacted ? (lead.callDate || Date.now()) : null;
    lead.callbackDate = needsCallback ? callbackDate : null;

    // Lo status viene gestito separatamente o aggiornato qui
    if (status) {
        lead.status = status;
    } else if (isContacted && !needsCallback) {
        lead.status = 'Archiviato';
    }

    const updatedLead = await lead.save();

    await updatedLead.populate([
        { path: 'user', select: 'name surname email phone' },
        { path: 'property', select: '_id title rif' },
        { path: 'calledBy', select: 'email' },
        { path: 'notes', populate: { path: 'employee', select: 'email' } }
    ]);

    logActivity(currentEmployeeId, 'UPDATE_LEAD_DETAILS', `Aggiornati dettagli chiamata per lead ID: ${lead._id}`);
    res.status(200).json(updatedLead);
});


const savePropertyDecision = asyncHandler(async (req, res, next) => {
    const { rif } = req.params;
    const { choice } = req.body;
    const userId = req.user._id;

    if (!choice || !['interessato', 'non interessato'].includes(choice)) {
        res.status(400);
        throw new Error('Scelta non valida.');
    }

    const property = await Property.findOne({ rif: rif.toUpperCase() });
    if (!property) {
        res.status(404);
        throw new Error('Immobile non trovato.');
    }

    const lead = await Lead.findOne({ user: userId, property: property._id });
    if (!lead) {
        res.status(404);
        throw new Error('Lead non trovato per questo utente e immobile.');
    }

    lead.decisionPropertyInterest = choice;
    await lead.save();

    logActivity(userId, 'PROPERTY_DECISION', `L'utente ha espresso interesse ('${choice}') per l'immobile RIF: ${rif}`);

    res.status(200).json({ message: 'Decisione salvata con successo.' });
});

const saveZoneDecision = asyncHandler(async (req, res, next) => {
    const { rif } = req.params;
    const { choice } = req.body;
    const userId = req.user._id;

    if (!choice || !['zona va bene', 'zona non va bene'].includes(choice)) {
        res.status(400);
        throw new Error('Scelta non valida.');
    }

    const property = await Property.findOne({ rif: rif.toUpperCase() });
    if (!property) {
        res.status(404);
        throw new Error('Immobile non trovato.');
    }

    const lead = await Lead.findOne({ user: userId, property: property._id });
    if (!lead) {
        res.status(404);
        throw new Error('Lead non trovato per questo utente e immobile.');
    }

    lead.decisionZoneInterest = choice;

    // After this final decision, the lead is considered "Warm" and ready for an agent.
    if (lead.status === 'Incompleto') {
        lead.status = 'Da richiamare';
    }

    await lead.save();

    logActivity(userId, 'ZONE_DECISION', `L'utente ha espresso un'opinione sulla zona ('${choice}') per l'immobile RIF: ${rif}`);

    res.status(200).json({ message: 'Decisione sulla zona salvata con successo.' });
});


module.exports = {
    submitQuestionnaire1,
    submitQuestionnaire2,
    savePropertyDecision,
    saveZoneDecision,
    getHotLeads,
    getWarmLeads,
    getIncompleteLeads,
    getArchivedLeads,
    getTodaysReminders,
    getLeadById,
    updateLeadCallDetails,
};
