const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true }, // 'bling', 'tiny', etc.
  credentials: { type: Object, required: true }, // { apiKey, ... }
  lastSync: { type: Date },
}, { timestamps: true });

integrationSchema.index({ ownerId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Integration', integrationSchema);
