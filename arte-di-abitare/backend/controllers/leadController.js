const Lead = require('../models/leadModel');
const Property = require('../models/propertyModel');
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const logActivity = require('../utils/logger');

// ... (existing functions like submitQuestionnaire1, submitQuestionnaire2)

const submitQuestionnaire1 = async (req, res) => {
    const { propertyRif, answers } = req.body;
    const userId = req.user._id;
    try {
        const property = await Property.findOne({ rif: propertyRif.toUpperCase() });
        if (!property) return res.status(404).json({ message: 'Immobile non trovato.' });
        const lead = await Lead.findOneAndUpdate(
            { user: userId, property: property._id },
            { $set: { user: userId, property: property._id, questionnaire1: answers, status: 'Nuovo' } },
            { new: true, upsert: true, runValidators: true }
        );
        res.status(201).json({ message: 'Questionario inviato con successo.', lead });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

const submitQuestionnaire2 = async (req, res) => {
    const { propertyRif, answers } = req.body;
    const userId = req.user._id;
    try {
        const property = await Property.findOne({ rif: propertyRif.toUpperCase() });
        if (!property) return res.status(404).json({ message: 'Immobile non trovato.' });
        const lead = await Lead.findOne({ user: userId, property: property._id });
        if (!lead) return res.status(404).json({ message: 'Lead non trovato. Completa prima il questionario 1.' });
        lead.questionnaire2 = answers;
        const updatedLead = await lead.save();
        res.status(200).json({ message: 'Questionario 2 inviato con successo.', lead: updatedLead });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

// --- New User Decision Tracking Functions ---

const savePropertyDecision = async (req, res) => {
    const { choice } = req.body; // 'interessato' or 'non interessato'
    const { rif } = req.params;
    const userId = req.user._id;
    try {
        const property = await Property.findOne({ rif: rif.toUpperCase() });
        if (!property) return res.status(404).json({ message: 'Immobile non trovato.' });
        const lead = await Lead.findOne({ user: userId, property: property._id });
        if (!lead) return res.status(404).json({ message: 'Lead non trovato.' });

        lead.decisionPropertyInterest = choice;
        await lead.save();
        res.status(200).json({ message: 'Decisione salvata.' });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const saveZoneDecision = async (req, res) => {
    const { choice } = req.body; // 'zona va bene' or 'zona non va bene'
    const { rif } = req.params;
    const userId = req.user._id;
    try {
        const property = await Property.findOne({ rif: rif.toUpperCase() });
        if (!property) return res.status(404).json({ message: 'Immobile non trovato.' });
        const lead = await Lead.findOne({ user: userId, property: property._id });
        if (!lead) return res.status(404).json({ message: 'Lead non trovato.' });

        lead.decisionZoneInterest = choice;
        await lead.save();
        res.status(200).json({ message: 'Decisione sulla zona salvata.' });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};


// ... (rest of the existing controller functions: getHotLeads, getWarmLeads, etc.)

const getHotLeads = async (req, res) => {
    try {
        const leads = await Lead.find({
            status: 'Da richiamare',
            callbackDate: { $lt: new Date() }
        }).populate('user', 'name surname email phone').populate('property', 'title rif').sort({ callbackDate: 1 });
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const getWarmLeads = async (req, res) => {
    try {
        const leads = await Lead.find({
            status: 'Da richiamare',
            $or: [{ callbackDate: { $gte: new Date() } }, { callbackDate: { $exists: false } }]
        }).populate('user', 'name surname email phone').populate('property', 'title rif').sort({ callbackDate: 1 });
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const getIncompleteLeads = async (req, res) => {
    try {
        const leads = await Lead.find({
            status: { $nin: ['Da richiamare', 'Cliente', 'Archiviato'] }
        }).populate('user', 'name surname email phone').populate('property', 'title rif').sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const getTodaysReminders = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const reminders = await Lead.find({
            needsCallback: true,
            callbackDate: { $gte: today, $lt: tomorrow }
        }).populate('user', 'name surname');
        res.status(200).json(reminders);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero dei promemoria.' });
    }
};

const getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id)
            .populate('user', 'name surname email phone')
            .populate('property', '_id title rif')
            .populate('calledBy', 'email')
            .populate({ path: 'notes', populate: { path: 'employee', select: 'email' } });
        if (lead) { res.status(200).json(lead); }
        else { res.status(404).json({ message: 'Lead non trovato.' }); }
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const updateLeadCallDetails = async (req, res) => {
    const { id } = req.params;
    const { isContacted, calledByEmail, callDate, noteText, needsCallback, callbackDate } = req.body;
    const currentEmployeeId = req.employee._id;
    try {
        const lead = await Lead.findById(id);
        if (!lead) { return res.status(404).json({ message: 'Lead non trovato.' }); }
        if (noteText && noteText.trim() !== '') {
            lead.notes.push({ text: noteText, employee: currentEmployeeId });
        }
        lead.isContacted = isContacted;
        lead.needsCallback = needsCallback;
        lead.callDate = isContacted && callDate ? callDate : null;
        lead.callbackDate = needsCallback && callbackDate ? callbackDate : null;
        if (isContacted && calledByEmail) {
            const calledByEmployee = await Employee.findOne({ email: calledByEmail });
            lead.calledBy = calledByEmployee ? calledByEmployee._id : null;
        } else if (!isContacted) {
            lead.calledBy = null;
        }
        // Update status based on the new logic
        if (isContacted && !needsCallback) {
            lead.status = 'Archiviato';
        } else if (needsCallback) {
            lead.status = 'Da richiamare';
        } else if (isContacted) {
            lead.status = 'Contattato';
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
    } catch (error) {
        res.status(500).json({ message: 'Errore del server durante l\'aggiornamento.', error: error.message });
    }
};


const getArchivedLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ status: 'Archiviato' })
            .populate('user', 'name surname email phone')
            .populate('property', 'title rif')
            .sort({ updatedAt: -1 }); // Sort by when they were last updated (archived)
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

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
