const mongoose = require('mongoose');

const boostSchema = new mongoose.Schema({
  establishmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Establishment',
    required: true,
  },
  stripeSessionId: { type: String },
  stripePaymentIntentId: { type: String },
  amount: { type: Number, required: true }, // in cents
  durationDays: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled'],
    default: 'pending',
  },
  startDate: { type: Date },
  endDate: { type: Date },
}, { timestamps: true });

boostSchema.index({ establishmentId: 1 });
boostSchema.index({ status: 1 });

module.exports = mongoose.model('Boost', boostSchema);
