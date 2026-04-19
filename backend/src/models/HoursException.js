const mongoose = require('mongoose');

const hoursExceptionSchema = new mongoose.Schema({
  establishmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Establishment',
    required: true,
  },
  date: { type: String, required: true }, // YYYY-MM-DD
  closed: { type: Boolean, default: false },
  open: { type: String }, // HH:MM — ignored if closed
  close: { type: String }, // HH:MM — ignored if closed
  reason: { type: String, maxlength: 100 }, // ex: "Natal", "Feriado municipal"
}, { timestamps: true });

hoursExceptionSchema.index({ establishmentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HoursException', hoursExceptionSchema);
