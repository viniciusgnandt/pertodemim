const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  price: { type: Number, min: 0 },
  priceType: {
    type: String,
    enum: ['fixed', 'from', 'free', 'on_request'],
    default: 'fixed',
  },
  duration: { type: String }, // ex: "30 min", "1h"
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
  establishmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Establishment',
    required: true,
  },
}, { timestamps: true });

serviceSchema.index({ establishmentId: 1 });

module.exports = mongoose.model('Service', serviceSchema);
