const mongoose = require('mongoose');

const propertySchema = mongoose.Schema(
  {
    rif: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    // New fields requested by user
    zone: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      index: true,
    },
    surface: { // mq
      type: Number,
      required: true,
    },
    bedrooms: { // numero camere
      type: Number,
      required: true,
    },
    bathrooms: { // numero bagni
      type: Number,
      required: true,
    },
    // Image paths
    dossierImage: {
      type: String,
      required: true,
    },
    planimetryImage: {
      type: String,
      required: true,
    },
    zoneImage: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
