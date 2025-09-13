const mongoose = require('mongoose');

const questionnaire1Schema = new mongoose.Schema({
    sellToBuy: { type: String, enum: ['sì', 'no'] },
    maxBudget: { type: String }, // Storing as string to accommodate various user inputs
    needsMortgage: { type: String, enum: ['sì', 'no'] },
    mortgagePercentage: { type: Number },
    mortgagePreApproval: { type: String, enum: ['sì', 'no, ma ho già parlato con la mia banca...', 'no, desidero una consulenza gratuita'] },
    purchaseTimeline: { type: String, enum: ['entro 3 mesi', 'entro 6 mesi', 'entro 1 anno', 'non ho fretta'] }
}, { _id: false });

const questionnaire2Schema = new mongoose.Schema({
    searchZone: { type: String },
    minBedrooms: { type: Number, enum: [1, 2, 3] },
    mustHaveFeatures: { type: String },
    searchDuration: { type: String } // e.g., 'da meno di un mese', '1-3 mesi', etc.
}, { _id: false });

const leadSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Property',
    },
    questionnaire1: questionnaire1Schema,
    questionnaire2: questionnaire2Schema,
    // User choices from the decision funnels
    decisionPropertyInterest: {
      type: String,
      enum: ['interessato', 'non interessato'],
    },
    decisionZoneInterest: {
      type: String,
      enum: ['zona va bene', 'zona non va bene'],
    },
    status: {
        type: String,
        enum: ['Nuovo', 'Contattato', 'Da richiamare', 'Non interessato', 'Cliente', 'Archiviato'],
        default: 'Nuovo',
        index: true,
    },
    // Call Management
    isContacted: { type: Boolean, default: false },
    calledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    callDate: { type: Date },
    needsCallback: { type: Boolean, default: false },
    callbackDate: { type: Date },
    // Notes History
    notes: [
      {
        text: { type: String, required: true },
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
        date: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

// To avoid creating duplicate leads for the same user and property
leadSchema.index({ user: 1, property: 1 }, { unique: true });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
