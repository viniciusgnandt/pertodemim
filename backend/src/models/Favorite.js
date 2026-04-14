const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  establishmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Establishment',
    required: true,
  },
}, { timestamps: true });

favoriteSchema.index({ userId: 1, establishmentId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
